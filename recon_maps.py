"""
Forgeon Recon — Google Maps Lead Intelligence & Site Audit Bot
Pesquisa negócios no Google Maps, analisa o site de cada um (se tiver),
extrai o design system do site atual e gera pontuação (score) para cada lead.

Organização de Pastas:
  Se a saída for a pasta padrão "leads" (ou contiver apenas /leads), o bot organiza
  automaticamente por País e Categoria:
    leads/
      [País]/
        [Categoria]/
          [NomeEmpresa]/
            dadosEmpresa.json
            fotos/
              fotos.json
              foto_01.jpg ...
            site/
              desktop.png, mobile.png, logo.*, tokens.json

Uso:
  python recon_maps.py "Bar" "São Paulo" --max-leads 5
  python recon_maps.py "Dentista Lisboa" --saida "leads" --max-leads 10
  python recon_maps.py "Restaurante" --saida "/custom/path" --sem-baixar
"""
from __future__ import annotations

import argparse
import colorsys
import json
import os
import re
import sys
import time
import urllib.request
from collections import Counter
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from urllib.parse import parse_qs, quote_plus, unquote_plus, urlparse

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None

# Força UTF-8 no Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")


@dataclass
class Config:
    max_leads: int = 1
    max_fotos: int = 20
    pasta_saida: str = "leads"
    baixar: bool = True
    pular_site: bool = False
    pagespeed: bool = False
    organizar_hierarquia: bool = True


def log(msg: str):
    print(f"[FORGEON LOG] {msg}", file=sys.stderr, flush=True)


DIAS_RE = re.compile(
    r"^(segunda|ter[çc]a|quarta|quinta|sexta|s[áa]bado|domingo|monday|tuesday|wednesday|"
    r"thursday|friday|saturday|sunday|lunes|martes|mi[ée]rcoles|jueves|viernes)", re.I)


def limpar_texto(t: str) -> str:
    """Remove os ícones do Maps (caracteres de fonte privada) e junta linhas com ', '."""
    t = re.sub(r"[\ue000-\uf8ff]", "", t or "").strip()
    return re.sub(r"\s*\n\s*", ", ", t).strip(" ,")


def sanitizar_nome(nome: str) -> str:
    limpo = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "", nome or "").strip().rstrip(".")
    limpo = re.sub(r"\s+", " ", limpo)
    return limpo or "Empresa"


def detectar_pais(endereco: str, query: str = "") -> str:
    """Detecta o país a partir do endereço formatado ou query da busca."""
    texto = f"{endereco} {query}".lower()
    if re.search(r"\b(portugal|lisboa|porto|braga|coimbra|faro)\b", texto):
        return "Portugal"
    if re.search(r"\b(estados unidos|united states|usa|u\.s\.a|florida|california|new york|texas)\b", texto):
        return "Estados Unidos"
    if re.search(r"\b(espanha|españa|spain|madrid|barcelona|valencia)\b", texto):
        return "Espanha"
    if re.search(r"\b(itália|italia|italy|roma|milano)\b", texto):
        return "Itália"
    if re.search(r"\b(frança|france|paris)\b", texto):
        return "França"
    if re.search(r"\b(reino unido|united kingdom|uk|london)\b", texto):
        return "Reino Unido"
    if re.search(r"\b(alemanha|germany|deutschland|berlin)\b", texto):
        return "Alemanha"
    if re.search(r"\b(argentina|buenos aires)\b", texto):
        return "Argentina"
    if re.search(r"\b(chile|santiago)\b", texto):
        return "Chile"
    if re.search(r"\b(méxico|mexico)\b", texto):
        return "México"
    # Padrão Brasil (CEP, estados brasileiros, ou padrão de busca em pt)
    return "Brasil"


def sanitizar_categoria(cat: str) -> str:
    cat = (cat or "").strip()
    if not cat:
        return "Geral"
    cat_limpa = sanitizar_nome(cat).title()
    return cat_limpa[:40]


def obter_pasta_empresa(nome: str, categoria: str, endereco: str, query: str, cfg: Config) -> Path:
    """Cria a pasta separadamente dividindo em país/categoria se a pasta for 'leads'."""
    saida = Path(cfg.pasta_saida)
    nome_sanitizado = sanitizar_nome(nome)

    # Se for a pasta leads (ou subpasta simples de leads), divide em país e categoria
    is_leads_root = (
        saida.name.lower() == "leads" or
        str(saida).strip("/\\").lower() == "leads" or
        cfg.organizar_hierarquia
    )

    if is_leads_root:
        pais = detectar_pais(endereco, query)
        cat = sanitizar_categoria(categoria)
        base = saida / pais / cat
    else:
        base = saida

    base.mkdir(parents=True, exist_ok=True)
    pasta = base / nome_sanitizado
    n = 2
    while pasta.exists():
        pasta = base / f"{nome_sanitizado} ({n})"
        n += 1
    return pasta


# ---------------------------------------------------------------------------
# Filtro de fotos
# ---------------------------------------------------------------------------
RE_AVATAR = re.compile(r"googleusercontent\.com/(a|a-)/|=s\d{1,3}-c|-mo(-|$)|/a-/|/a/")
CAMINHOS_LUGAR = ("/p/", "/gps-cs-s/", "/gps-proxy/", "/geougc-cs/", "/geougc/")


def foto_valida(url: str) -> bool:
    if not url.startswith("http"):
        return False
    if "googleusercontent.com" not in url and "ggpht.com" not in url:
        return False
    if "streetviewpixels" in url or "/maps/vt" in url:
        return False
    if RE_AVATAR.search(url):
        return False
    return any(c in url for c in CAMINHOS_LUGAR)


def foto_hq(url: str) -> str:
    base = url.split("=")[0] if "=" in url else url
    return f"{base}=w1600-h1200-k-no"


def chave_foto(url: str) -> str:
    return url.split("=")[0]


JS_EXTRAIR_URLS = r"""() => {
  const urls = new Set();
  document.querySelectorAll('img').forEach(i => { if (i.src) urls.add(i.src); });
  document.querySelectorAll('[style*="background-image"]').forEach(e => {
    const m = (e.style.backgroundImage || '').match(/url\(["']?(.*?)["']?\)/);
    if (m) urls.add(m[1]);
  });
  return [...urls];
}"""

JS_EXTRAIR_LINKS = r"""() => [...document.querySelectorAll('a[href*="/maps/place/"]')]
  .map(a => a.href)"""

JS_ROLAR_GALERIA = r"""(px) => {
  const tile = document.querySelector('a[data-photo-index]');
  if (!tile) return false;
  let el = tile.parentElement;
  while (el && el !== document.body) {
    const cs = getComputedStyle(el);
    if ((cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight + 10) {
      el.scrollBy(0, px); return true;
    }
    el = el.parentElement;
  }
  return false;
}"""

JS_ROLAR_FEED = r"""(px) => {
  const f = document.querySelector('div[role="feed"]');
  if (!f) return false;
  f.scrollBy(0, px); return true;
}"""


def rolar(page, js: str, px: int, hover_sel: str | None = None):
    try:
        if page.evaluate(js, px):
            return
    except Exception:
        pass
    if hover_sel:
        try:
            page.locator(hover_sel).first.hover(timeout=1500)
        except Exception:
            pass
    try:
        page.mouse.wheel(0, px)
    except Exception:
        pass


def aceitar_consentimento(page):
    try:
        page.locator(
            'button:has-text("Aceitar tudo"), button:has-text("Accept all"), button:has-text("Concordo")'
        ).first.click(timeout=1500)
    except Exception:
        pass


def abrir_galeria(page) -> bool:
    seletores = [
        'button[aria-label*="Fotos"]',
        'button[aria-label*="Foto de"]',
        'button[aria-label*="Photos"]',
        'button[aria-label*="Photo of"]',
        "button.aoRNLd",
        'button[jsaction*="heroHeaderImage"]',
        'button[jsaction*="pane.photoSection"]',
    ]
    for sel in seletores:
        try:
            loc = page.locator(sel).first
            if loc.count() and loc.is_visible():
                loc.click(timeout=3000)
                time.sleep(2.0)
                if page.locator("a[data-photo-index], div[role='tablist']").count():
                    log(f"Galeria aberta via: {sel}")
                    return True
        except Exception:
            continue
    return False


def coletar_fotos(page, max_fotos: int) -> list[str]:
    galeria = abrir_galeria(page)
    if not galeria:
        brutas = page.evaluate(JS_EXTRAIR_URLS)
        vistas, resultado = set(), []
        for u in brutas:
            if foto_valida(u) and chave_foto(u) not in vistas:
                vistas.add(chave_foto(u))
                resultado.append(foto_hq(u))
        return resultado[:max_fotos]

    vistas, resultado = set(), []
    sem_novas = 0
    try:
        page.mouse.move(700, 500)
    except Exception:
        pass

    for _ in range(25):
        antes = len(resultado)
        for u in page.evaluate(JS_EXTRAIR_URLS):
            if foto_valida(u) and chave_foto(u) not in vistas:
                vistas.add(chave_foto(u))
                resultado.append(foto_hq(u))
        if len(resultado) >= max_fotos:
            break
        sem_novas = sem_novas + 1 if len(resultado) == antes else 0
        if sem_novas >= 3:
            break
        rolar(page, JS_ROLAR_GALERIA, 2500, "a[data-photo-index]")
        time.sleep(1.0)

    return resultado[:max_fotos]


def baixar_fotos(page, urls: list[str], pasta: Path) -> int:
    pasta.mkdir(parents=True, exist_ok=True)
    salvas = 0
    for i, url in enumerate(urls, start=1):
        try:
            resp = page.context.request.get(url, timeout=20000)
            tipo = resp.headers.get("content-type", "")
            corpo = resp.body()
            if not resp.ok or not tipo.startswith("image/") or len(corpo) < 5000:
                continue
            ext = "png" if "png" in tipo else "webp" if "webp" in tipo else "jpg"
            (pasta / f"foto_{i:02d}.{ext}").write_bytes(corpo)
            salvas += 1
        except Exception as e:
            log(f"Falha ao baixar foto {i}: {e}")
    return salvas


# ---------------------------------------------------------------------------
# Busca de leads no Google Maps
# ---------------------------------------------------------------------------
def listar_leads(page, query: str, max_leads: int) -> list[str]:
    url = f"https://www.google.com/maps/search/{query.replace(' ', '+')}?hl=pt-BR"
    log(f"Iniciando busca no Google Maps: {query}")
    page.goto(url)
    aceitar_consentimento(page)

    try:
        page.wait_for_selector('div[role="feed"], a[href*="/maps/place/"], h1', timeout=12000)
    except Exception:
        return []
    time.sleep(2)

    if page.locator('div[role="feed"]').count() == 0:
        if "/maps/place/" in page.url:
            log("Busca retornou diretamente 1 empresa")
            return [page.url]
        return []

    links, vistos = [], set()
    sem_novos = 0
    page.mouse.move(200, 500)

    for _ in range(40):
        antes = len(links)
        for href in page.evaluate(JS_EXTRAIR_LINKS):
            chave = href.split("?")[0]
            if chave not in vistos:
                vistos.add(chave)
                links.append(href)
        if len(links) >= max_leads:
            break
        fim = page.locator(
            'text="Você chegou ao final da lista", text="You\'ve reached the end of the list"'
        ).count()
        sem_novos = sem_novos + 1 if len(links) == antes else 0
        if fim or sem_novos >= 3:
            break
        rolar(page, JS_ROLAR_FEED, 3000, 'div[role="feed"]')
        time.sleep(1.2)

    log(f"{len(links)} empresas detectadas no radar (meta: {max_leads})")
    return links[:max_leads]


# ---------------------------------------------------------------------------
# Análise de Site & Design System
# ---------------------------------------------------------------------------
NAO_SITE = (
    "instagram.com", "facebook.com", "fb.com", "fb.me", "linktr.ee", "linktree.com",
    "wa.me", "whatsapp.com", "ifood.com.br", "tripadvisor.com", "tripadvisor.com.br",
    "twitter.com", "x.com", "tiktok.com", "youtube.com", "youtu.be", "beacons.ai",
    "bio.site", "linkin.bio", "taplink.cc", "goo.gl", "business.site", "g.page",
    "booking.com", "rappi.com.br", "anota.ai", "menudino.com", "linkedin.com",
)

REDES_CHAVES = {
    "instagram.com": "instagram", "facebook.com": "facebook", "fb.com": "facebook",
    "tiktok.com": "tiktok", "youtube.com": "youtube", "linkedin.com": "linkedin",
    "twitter.com": "twitter", "x.com": "twitter", "wa.me": "whatsapp",
    "api.whatsapp.com": "whatsapp", "whatsapp.com": "whatsapp",
    "ifood.com.br": "ifood", "tripadvisor.com": "tripadvisor",
    "tripadvisor.com.br": "tripadvisor",
}

TECNOLOGIAS = {
    "wordpress": r"wp-content|wp-includes",
    "wix": r"wixstatic\.com|wix\.com",
    "squarespace": r"squarespace",
    "shopify": r"cdn\.shopify\.com",
    "webflow": r"webflow",
    "weebly": r"weebly",
    "jimdo": r"jimdo",
    "godaddy_builder": r"wsimg\.com|godaddy",
    "elementor": r"elementor",
    "framer": r"framerusercontent|framer\.com",
    "nextjs": r"/_next/",
    "google_sites": r"sites\.google\.com",
    "blogspot": r"blogspot\.com",
}
BUILDERS_BASICOS = {"weebly", "jimdo", "godaddy_builder", "google_sites", "blogspot"}

FONTES_GENERICAS = {
    "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui",
    "ui-sans-serif", "ui-serif", "ui-monospace", "-apple-system",
    "blinkmacsystemfont", "segoe ui",
}


def host_de(url: str) -> str:
    host = (urlparse(url).netloc or "").lower().split(":")[0]
    return host[4:] if host.startswith("www.") else host


def limpar_url_site(href: str) -> str:
    href = (href or "").strip()
    if "google.com/url" in href:
        q = parse_qs(urlparse(href).query).get("q")
        if q:
            href = q[0]
    return href


def classificar_url(url: str) -> str:
    if not url:
        return "sem_site"
    host = host_de(url)
    if "google.com/maps" in url or any(host == d or host.endswith("." + d) for d in NAO_SITE):
        return "rede_social"
    return "site_proprio"


def novo_info_site(url: str, tipo: str) -> dict:
    return {
        "tem_site_proprio": tipo == "site_proprio",
        "url": url or None,
        "tipo": tipo,
        "status": None,
        "status_http": None,
        "https": None,
        "viewport_meta": None,
        "mobile_ok": None,
        "tempo_carga_s": None,
        "tecnologia": [],
        "ano_copyright": None,
        "titulo": None,
        "descricao": None,
        "emails": [],
        "redes_sociais": {},
        "whatsapp_no_site": False,
        "json_ld": {},
        "pagespeed": None,
        "score_qualidade": None,
        "qualidade": None,
        "problemas": [],
        "oportunidade": None,
        "motivo": None,
    }


JS_TEXTO = r"""() => {
  const meta = n => (document.querySelector(`meta[name="${n}"]`) || {}).content || '';
  const og = p => (document.querySelector(`meta[property="${p}"]`) || {}).content || '';
  return {
    title: document.title || '',
    description: meta('description') || og('og:description'),
    generator: meta('generator'),
    viewport: !!document.querySelector('meta[name="viewport"]'),
    h1: [...document.querySelectorAll('h1')].map(h => h.innerText.trim()).filter(Boolean).slice(0, 3),
    h2: [...document.querySelectorAll('h2')].map(h => h.innerText.trim()).filter(Boolean).slice(0, 8),
    texto: (document.body.innerText || '').replace(/\s+\n/g, '\n').slice(0, 6000),
    ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => s.textContent).slice(0, 6),
    links: [...document.querySelectorAll('a[href]')].map(a => a.href).slice(0, 400)
  };
}"""

JS_DESIGN = r"""() => {
  const vis = e => {
    const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  };
  const first = sel => { for (const e of document.querySelectorAll(sel)) if (vis(e)) return e; return null; };
  const st = e => {
    if (!e) return null; const c = getComputedStyle(e);
    return {fontFamily: c.fontFamily, fontSize: c.fontSize, fontWeight: c.fontWeight,
            lineHeight: c.lineHeight, color: c.color, backgroundColor: c.backgroundColor,
            borderRadius: c.borderRadius, letterSpacing: c.letterSpacing};
  };
  const out = {};
  out.h1 = st(first('h1')); out.h2 = st(first('h2')); out.h3 = st(first('h3'));
  out.body = st(document.body); out.html = st(document.documentElement); out.p = st(first('p'));
  out.button = st(first('a.btn, a.button, .btn, .button, [class*="btn"], [class*="button"], input[type=submit], button'));
  out.link = st(first('nav a, header a'));
  const vars = {};
  try {
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules; } catch (e) { continue; }
      for (const r of rules) {
        if (r.style && r.selectorText && /(^|,)\s*(:root|html|body)\s*(,|$)/.test(r.selectorText)) {
          for (const p of r.style) if (p.startsWith('--') && !p.startsWith('--wp--preset') && !p.startsWith('--swiper') && Object.keys(vars).length < 60)
            vars[p] = r.style.getPropertyValue(p).trim();
        }
      }
    }
  } catch (e) {}
  out.cssVars = vars;
  const fam = new Set();
  try {
    for (const sh of document.styleSheets) {
      let rules; try { rules = sh.cssRules; } catch (e) { continue; }
      for (const r of rules) if (r.type === 5) {
        const f = r.style.getPropertyValue('font-family').replace(/["']/g, '').trim();
        if (f) fam.add(f);
      }
    }
  } catch (e) {}
  out.fontFaces = [...fam];
  out.googleFonts = [...document.querySelectorAll(
    'link[href*="fonts.googleapis.com"], link[href*="fonts.bunny.net"]')].map(l => l.href);
  const samples = [];
  const els = [...document.querySelectorAll('body *')].slice(0, 1500);
  for (const e of els) {
    if (!vis(e)) continue;
    const c = getComputedStyle(e); const r = e.getBoundingClientRect();
    const area = Math.min(r.width, innerWidth) * Math.min(r.height, 2000);
    const tag = e.tagName.toLowerCase();
    const cls = (typeof e.className === 'string') ? e.className : '';
    samples.push({
      bg: c.backgroundColor, color: c.color, area: Math.round(area), tag: tag,
      act: tag === 'button' || tag === 'a' || /btn|button|cta/i.test(cls),
      radius: c.borderRadius,
      hasText: e.childElementCount === 0 && (e.textContent || '').trim().length > 0
    });
  }
  out.samples = samples;
  return out;
}"""

JS_LOGO = r"""() => {
  const abs = u => { try { return new URL(u, location.href).href; } catch (e) { return null; } };
  const cands = [];
  const sel = 'header img, nav img, [class*="logo" i] img, img[class*="logo" i], img[alt*="logo" i], img[src*="logo" i]';
  for (const i of document.querySelectorAll(sel)) {
    const r = i.getBoundingClientRect();
    if (r.width > 20 && (i.currentSrc || i.src))
      cands.push({src: i.currentSrc || i.src, alt: i.alt || ''});
  }
  const meta = s => { const e = document.querySelector(s);
    return e ? abs(e.getAttribute('content') || e.getAttribute('href')) : null; };
  return {imgs: cands.slice(0, 8), appleTouch: meta('link[rel="apple-touch-icon"]'),
          icon: meta('link[rel~="icon"]'), ogImage: meta('meta[property="og:image"]')};
}"""


def link_de_perfil(link: str) -> bool:
    LIXO_LINK = ("privacy", "policy", "legal", "cookie", "terms", "sharer", "share",
                 "intent/", "plugins", "dialog", "/tr?", "help", "about/")
    u = urlparse(link)
    return len(u.path.strip("/")) > 0 and not any(x in link.lower() for x in LIXO_LINK)


def detectar_tecnologia(html: str, generator: str = "") -> list[str]:
    achadas = [n for n, pat in TECNOLOGIAS.items() if re.search(pat, html, re.I)]
    if generator and not achadas:
        achadas.append(generator.strip()[:40].lower())
    return achadas


def resumir_jsonld(blocos: list[str]) -> dict:
    resumo = {}
    itens = []
    for b in blocos:
        try:
            dado = json.loads(b)
        except Exception:
            continue
        if isinstance(dado, dict) and "@graph" in dado:
            itens += [x for x in dado["@graph"] if isinstance(x, dict)]
        elif isinstance(dado, list):
            itens += [x for x in dado if isinstance(x, dict)]
        elif isinstance(dado, dict):
            itens.append(dado)
    for it in itens:
        tipo = str(it.get("@type", ""))
        if not re.search(r"Restaurant|Bar|Cafe|LocalBusiness|FoodEstablishment|Bakery", tipo):
            continue
        for k_out, k_in in (("horarios", "openingHours"), ("culinaria", "servesCuisine"),
                            ("faixa_preco", "priceRange"), ("telefone", "telephone"),
                            ("email", "email")):
            if it.get(k_in) and k_out not in resumo:
                resumo[k_out] = it[k_in]
        break
    return resumo


def pontuar_site(info: dict, tam_texto: int) -> tuple[int, list[str]]:
    s, p = 100, []

    def pen(v, msg):
        nonlocal s
        s -= v
        p.append(msg)

    hoje = date.today().year
    if not info["https"]:
        pen(25, "sem HTTPS")
    if not info["viewport_meta"]:
        pen(20, "sem meta viewport (não adaptado ao celular)")
    if info["mobile_ok"] is False:
        pen(20, "rola para o lado no celular")
    t = info["tempo_carga_s"]
    if t and t > 6:
        pen(10, f"carregamento lento ({t}s)")
    elif t and t > 3:
        pen(5, f"carregamento médio ({t}s)")
    ano = info["ano_copyright"]
    if ano and ano <= hoje - 4:
        pen(15, f"rodapé com copyright {ano}")
    elif ano and ano <= hoje - 2:
        pen(6, f"rodapé com copyright {ano}")
    if BUILDERS_BASICOS & set(info["tecnologia"]):
        pen(10, "construtor de sites básico")
    if not info["descricao"]:
        pen(5, "sem meta description")
    if tam_texto < 300:
        pen(15, "pouquíssimo conteúdo")
    return max(s, 0), p


def avaliar_oportunidade(info: dict) -> tuple[str, str]:
    if info["tipo"] == "sem_site":
        return "criar_site", "sem site no Google Maps"
    if info["tipo"] == "rede_social":
        return "criar_site", "só tem rede social/agregador como link"
    if info["status"] != "no_ar":
        return "criar_site", "site fora do ar ou com erro"
    motivos = "; ".join(info["problemas"][:3]) or "sem problemas relevantes"
    q = info["qualidade"]
    if q == "ruim":
        return "redesign", f"site fraco (score {info['score_qualidade']}): {motivos}"
    if q == "media":
        return "melhoria", f"site mediano (score {info['score_qualidade']}): {motivos}"
    return "baixa_prioridade", f"site bom (score {info['score_qualidade']})"


def css_para_hex(css: str) -> str | None:
    m = re.match(r"rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+%?))?\s*\)", css or "")
    if not m:
        return None
    r, g, b = (int(x) for x in m.groups()[:3])
    a = m.group(4)
    if a is not None:
        a = float(a[:-1]) / 100 if a.endswith("%") else float(a)
        if a < 0.5:
            return None
    return "#%02X%02X%02X" % (r, g, b)


def sat_hsv(hexa: str) -> tuple[float, float]:
    r, g, b = (int(hexa[i:i + 2], 16) / 255 for i in (1, 3, 5))
    _, s, v = colorsys.rgb_to_hsv(r, g, b)
    return s, v


def derivar_design(bruto: dict) -> dict:
    acento, fundo = Counter(), Counter()
    for s in bruto.get("samples", []):
        bg, cor = css_para_hex(s["bg"]), css_para_hex(s["color"])
        peso = 3 if s["act"] else 1
        if bg:
            fundo[bg] += s["area"]
            if sat_hsv(bg)[0] > 0.35:
                acento[bg] += s["area"] * peso
        if cor and s["hasText"] and sat_hsv(cor)[0] > 0.35:
            acento[cor] += 3000 * peso

    top_acentos = [c for c, _ in acento.most_common(3)]
    neutros = [c for c, _ in fundo.most_common(2)] or ["#09090B"]

    return {
        "accent": top_acentos[0] if top_acentos else "#FF5500",
        "neutral_base": neutros[:3],
        "mode": "dark" if "#00" in str(neutros).lower() or "#1" in str(neutros).lower() else "light",
        "heading_font": (bruto.get("h1") or {}).get("fontFamily", "Plus Jakarta Sans"),
        "body_font": (bruto.get("p") or {}).get("fontFamily", "DM Sans"),
        "cores": top_acentos,
    }


def baixar_logo(page, logo: dict, pasta_site: Path) -> str | None:
    candidatos = []
    imgs = logo.get("imgs") or []
    imgs.sort(key=lambda i: 0 if "logo" in (i["src"] + i["alt"]).lower() else 1)
    candidatos += [i["src"] for i in imgs]
    candidatos += [u for u in (logo.get("appleTouch"), logo.get("icon")) if u]
    for url in candidatos[:6]:
        try:
            resp = page.context.request.get(url, timeout=15000)
            tipo = resp.headers.get("content-type", "")
            corpo = resp.body()
            if not resp.ok or len(corpo) < 200:
                continue
            ext = ("svg" if "svg" in tipo or url.lower().endswith(".svg")
                   else "png" if "png" in tipo else "webp" if "webp" in tipo else "jpg")
            (pasta_site / f"logo.{ext}").write_bytes(corpo)
            return f"site/logo.{ext}"
        except Exception:
            continue
    return None


def analisar_site(context, url: str, pasta_site: Path, usar_pagespeed: bool = False) -> dict:
    tipo = classificar_url(url)
    info = novo_info_site(url, tipo)
    extra = None

    if tipo == "site_proprio":
        page = context.new_page()
        try:
            t0 = time.time()
            resp = page.goto(url, wait_until="domcontentloaded", timeout=20000)
            info["tempo_carga_s"] = round(time.time() - t0, 1)
            info["status_http"] = resp.status if resp else None
            info["status"] = "no_ar"
            info["https"] = page.url.startswith("https://")
            pasta_site.mkdir(parents=True, exist_ok=True)

            html = page.content()
            txt = page.evaluate(JS_TEXTO)
            info["tecnologia"] = detectar_tecnologia(html, txt.get("generator", ""))
            info["viewport_meta"] = bool(txt.get("viewport"))
            info["titulo"] = txt.get("title") or None
            info["descricao"] = txt.get("description") or None

            bruto = page.evaluate(JS_DESIGN)
            derivado = derivar_design(bruto)
            logo_rel = baixar_logo(page, page.evaluate(JS_LOGO), pasta_site)

            desktop = pasta_site / "desktop.png"
            try:
                page.screenshot(path=str(desktop))
            except Exception:
                desktop = None

            score, problemas = pontuar_site(info, len(txt.get("texto", "")))
            info["score_qualidade"], info["problemas"] = score, problemas
            info["qualidade"] = "boa" if score >= 75 else "media" if score >= 50 else "ruim"

            tokens = {"derivado": derivado, "bruto": bruto}
            (pasta_site / "tokens.json").write_text(
                json.dumps(tokens, ensure_ascii=False, indent=2), encoding="utf-8")

            extra = {
                "tokens": tokens,
                "screenshot": str(desktop) if desktop else None,
                "logo": logo_rel,
                "texto": txt,
            }
        except Exception as e:
            info["status"] = "fora_do_ar"
            info["erro"] = str(e)[:150]
        finally:
            page.close()

    info["oportunidade"], info["motivo"] = avaliar_oportunidade(info)
    return {"info": info, "extra": extra}


# ---------------------------------------------------------------------------
# Pontuação de Leads (0 a 100)
# ---------------------------------------------------------------------------
PTS_OPORTUNIDADE = {"criar_site": 50, "redesign": 35, "melhoria": 15, "baixa_prioridade": 0}


def analisar_telefone(raw: str) -> tuple[str, bool, bool]:
    raw = (raw or "").strip()
    digitos = re.sub(r"\D", "", raw)
    if not digitos:
        return "", True, False
    if raw.startswith("+") and not raw.startswith("+55"):
        return digitos, False, False
    if digitos.startswith("55") and len(digitos) >= 12:
        digitos = digitos[2:]
    return digitos, True, len(digitos) == 11 and digitos[2] == "9"


def pontuar_lead(d: dict, site: dict | None) -> dict:
    det, motivos = {}, []
    op = (site or {}).get("oportunidade")
    det["oportunidade"] = PTS_OPORTUNIDADE.get(op, 0)
    motivos.append((site or {}).get("motivo") or "site não analisado")

    nota_raw = re.search(r"\d+(?:[.,]\d+)?", d.get("nota") or "")
    nota = float(nota_raw.group().replace(",", ".")) if nota_raw else None
    if nota is None:
        det["reputacao"] = 0
    else:
        det["reputacao"] = 15 if nota >= 4.5 else 11 if nota >= 4.2 else 7 if nota >= 4.0 else 3
        motivos.append(f"nota {d['nota']}")

    total = int(re.sub(r"\D", "", d.get("total_avaliacoes") or "") or 0)
    det["volume"] = 20 if total >= 1000 else 16 if total >= 500 else 12 if total >= 200 else 8 if total >= 100 else 4
    if total:
        motivos.append(f"{total} avaliações")

    digitos, _br, celular = analisar_telefone(d.get("telefone", ""))
    contato = 0
    if digitos:
        contato += 8
        if celular:
            contato += 4
            motivos.append("celular/WhatsApp verificado")
    det["contato"] = contato

    score = sum(det.values())
    return {
        "score": score,
        "classe": "A" if score >= 75 else "B" if score >= 55 else "C",
        "detalhes": det,
        "motivos": motivos,
    }


def montar_dados_empresa(d: dict, qtd_fotos: int, site: dict | None = None,
                         extra: dict | None = None, lead: dict | None = None,
                         pais: str = "Brasil") -> dict:
    consulta = quote_plus(f'{d["nome"]} {d["endereco"]}'.strip())
    maps_url = f"https://www.google.com/maps/search/?api=1&query={consulta}"

    return {
        "meta": {
            "project_name": d["nome"],
            "generated_at": date.today().isoformat(),
            "language": "pt-BR",
            "country": pais,
            "category": d.get("categoria") or "Geral",
        },
        "contact": {
            "nome": d["nome"],
            "telefone": d["telefone"] or None,
            "endereco": d["endereco"] or None,
            "nota_google": d["nota"] or None,
            "total_avaliacoes": d["total_avaliacoes"] or None,
            "horarios": d["horarios"] or None,
            "maps_url": maps_url,
        },
        "site": site,
        "lead": lead,
        "design_system": extra.get("tokens", {}).get("derivado") if extra else None,
    }


def extrair_ficha(page, url_ficha: str, cfg: Config, query: str = "") -> dict | None:
    dados = {
        "nome": "", "telefone": "", "endereco": "", "horarios": [],
        "nota": "", "total_avaliacoes": "", "categoria": "", "maps_url": "",
    }

    if page.url.split("?")[0] != url_ficha.split("?")[0]:
        page.goto(url_ficha)
        aceitar_consentimento(page)
    page.wait_for_selector("h1", timeout=10000)
    time.sleep(1.5)

    dados["maps_url"] = page.url

    try:
        dados["nome"] = limpar_texto(page.locator("h1").first.inner_text())
    except Exception:
        pass
    if not dados["nome"]:
        return None

    try:
        dados["nota"] = page.locator('div.F7nice span[aria-hidden="true"]').first.inner_text(timeout=2000)
    except Exception:
        pass

    try:
        m = re.search(r"(\d[\d.,]*)\s*avalia", page.content())
        if m:
            dados["total_avaliacoes"] = m.group(1)
    except Exception:
        pass

    try:
        dados["categoria"] = limpar_texto(page.locator('button[jsaction*="category"]').first.inner_text(timeout=2000))
    except Exception:
        pass

    try:
        dados["endereco"] = limpar_texto(page.locator('button[data-item-id="address"]').first.inner_text(timeout=2000))
    except Exception:
        pass

    try:
        dados["telefone"] = limpar_texto(page.locator('button[data-item-id*="phone"]').first.inner_text(timeout=2000))
    except Exception:
        pass

    # Endereço e determinação da pasta hierárquica (País / Categoria / Empresa)
    pais = detectar_pais(dados["endereco"], query)
    pasta_empresa = obter_pasta_empresa(dados["nome"], dados["categoria"], dados["endereco"], query, cfg)
    pasta_fotos = pasta_empresa / "fotos"
    pasta_fotos.mkdir(parents=True, exist_ok=True)

    urls, baixadas = [], 0
    try:
        urls = coletar_fotos(page, cfg.max_fotos)
        (pasta_fotos / "fotos.json").write_text(json.dumps(urls, ensure_ascii=False, indent=2), encoding="utf-8")
        if cfg.baixar:
            baixadas = baixar_fotos(page, urls, pasta_fotos)
    except Exception as e:
        log(f"Erro em fotos: {e}")

    site_href = ""
    for sel in ('a[data-item-id="authority"]', 'a[aria-label^="Site:"]', 'a[aria-label^="Website:"]'):
        try:
            h = page.locator(sel).first.get_attribute("href", timeout=1500)
            if h:
                site_href = limpar_url_site(h)
                break
        except Exception:
            continue

    site_info, extra = None, None
    if not cfg.pular_site:
        try:
            r = analisar_site(page.context, site_href, pasta_empresa / "site", cfg.pagespeed)
            site_info, extra = r["info"], r["extra"]
        except Exception as e:
            log(f"Erro ao analisar site: {e}")

    lead = pontuar_lead(dados, site_info)

    dados_salvos = montar_dados_empresa(dados, baixadas or len(urls), site_info, extra, lead, pais)
    (pasta_empresa / "dadosEmpresa.json").write_text(
        json.dumps(dados_salvos, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    log(f"Lead salvo com sucesso em: {pasta_empresa}")
    return {
        "nome": dados["nome"],
        "pasta": str(pasta_empresa),
        "pais": pais,
        "categoria": dados["categoria"] or "Geral",
        "lead_score": lead["score"],
        "classe": lead["classe"],
        "site_tipo": site_info["tipo"] if site_info else None,
        "oportunidade": site_info["oportunidade"] if site_info else None,
    }


def recon(query: str, cfg: Config) -> list[dict]:
    if sync_playwright is None:
        log("Playwright não está instalado neste ambiente. Execute: pip install playwright && playwright install chromium")
        return []

    resumo = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            locale="pt-BR",
            viewport={"width": 1400, "height": 900},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        )
        page = context.new_page()
        leads = listar_leads(page, query, cfg.max_leads)

        for i, url in enumerate(leads, start=1):
            log(f"Processando lead {i}/{len(leads)}...")
            try:
                item = extrair_ficha(page, url, cfg, query)
                if item:
                    resumo.append(item)
            except Exception as e:
                log(f"Erro ao extrair {url}: {e}")

        browser.close()

    resumo.sort(key=lambda x: x["lead_score"], reverse=True)
    return resumo


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description="Forgeon Recon — Maps Lead Scraper")
    ap.add_argument("query", nargs="+", help='Ex: "Bar" "Pinheiros, São Paulo"')
    ap.add_argument("--max-leads", type=int, default=1)
    ap.add_argument("--max-fotos", type=int, default=20)
    ap.add_argument("--saida", default="leads")
    ap.add_argument("--sem-baixar", action="store_true")
    ap.add_argument("--pular-site", action="store_true")
    ap.add_argument("--pagespeed", action="store_true")
    a = ap.parse_args()

    cfg = Config(
        max_leads=a.max_leads, max_fotos=a.max_fotos,
        pasta_saida=a.saida, baixar=not a.sem_baixar, pular_site=a.pular_site,
        pagespeed=a.pagespeed,
    )
    res = recon(" ".join(a.query), cfg)
    print(json.dumps(res, ensure_ascii=False, indent=2))
