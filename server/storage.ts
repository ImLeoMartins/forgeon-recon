import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { DadosEmpresa, LeadSummary, ScrapeConfig } from './types';

const ROOT_DIR = process.cwd();
const DEFAULT_LEADS_DIR = path.join(ROOT_DIR, 'leads');

export function sanitizarNome(nome: string): string {
  let limpo = (nome || '').replace(/[<>:"/\\|?*\x00-\x1f]/g, '').trim().replace(/\.+$/, '');
  limpo = limpo.replace(/\s+/g, ' ');
  return limpo || 'Empresa';
}

export function detectarPais(endereco: string = '', query: string = ''): string {
  const texto = `${endereco} ${query}`.toLowerCase();
  if (/\b(portugal|lisboa|porto|braga|coimbra|faro|aveiro|funchal)\b/.test(texto)) return 'Portugal';
  if (/\b(estados unidos|united states|usa|u\.s\.a|florida|california|new york|texas|miami|orlando)\b/.test(texto)) return 'Estados Unidos';
  if (/\b(espanha|españa|spain|madrid|barcelona|valencia|sevilha)\b/.test(texto)) return 'Espanha';
  if (/\b(itália|italia|italy|roma|milano|florença|napoli)\b/.test(texto)) return 'Itália';
  if (/\b(frança|france|paris|lyon|marseille)\b/.test(texto)) return 'França';
  if (/\b(reino unido|united kingdom|uk|london|manchester)\b/.test(texto)) return 'Reino Unido';
  if (/\b(alemanha|germany|deutschland|berlin|munich|hamburg)\b/.test(texto)) return 'Alemanha';
  if (/\b(argentina|buenos aires|cordoba|rosario)\b/.test(texto)) return 'Argentina';
  if (/\b(chile|santiago)\b/.test(texto)) return 'Chile';
  if (/\b(méxico|mexico|cancun|guadalajara)\b/.test(texto)) return 'México';
  if (/\b(colômbia|colombia|bogota|medellin)\b/.test(texto)) return 'Colômbia';
  if (/\b(canadá|canada|toronto|vancouver|montreal)\b/.test(texto)) return 'Canadá';
  return 'Brasil';
}

export function sanitizarCategoria(cat: string = ''): string {
  const c = cat.trim();
  if (!c) return 'Geral';
  return sanitizarNome(c)
    .split(' ')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ')
    .slice(0, 40);
}

export function resolverPastaEmpresa(
  nome: string,
  categoria: string,
  endereco: string,
  query: string,
  cfg: ScrapeConfig
): { pastaEmpresa: string; caminhoRelativo: string; pais: string; catSanitizada: string } {
  let baseSaida = cfg.pasta_saida ? path.resolve(ROOT_DIR, cfg.pasta_saida) : DEFAULT_LEADS_DIR;
  const nomeSanitizado = sanitizarNome(nome);
  const pais = detectarPais(endereco, query);
  const catSanitizada = sanitizarCategoria(categoria);

  const isLeadsRoot =
    path.basename(baseSaida).toLowerCase() === 'leads' ||
    cfg.pasta_saida.trim() === 'leads' ||
    cfg.pasta_saida.trim() === '/leads' ||
    cfg.organizar_hierarquia !== false;

  let pastaFinal: string;
  if (isLeadsRoot) {
    pastaFinal = path.join(baseSaida, pais, catSanitizada, nomeSanitizado);
  } else {
    pastaFinal = path.join(baseSaida, nomeSanitizado);
  }

  // Deduplicação (2), (3)... se já existir com dados diferentes
  let count = 2;
  let pastaAtual = pastaFinal;
  while (fs.existsSync(pastaAtual) && !fs.existsSync(path.join(pastaAtual, 'dadosEmpresa.json'))) {
    pastaAtual = `${pastaFinal} (${count})`;
    count++;
  }

  fs.mkdirSync(pastaAtual, { recursive: true });
  fs.mkdirSync(path.join(pastaAtual, 'fotos'), { recursive: true });
  fs.mkdirSync(path.join(pastaAtual, 'site'), { recursive: true });

  const caminhoRelativo = path.relative(ROOT_DIR, pastaAtual);
  return {
    pastaEmpresa: pastaAtual,
    caminhoRelativo,
    pais,
    catSanitizada,
  };
}

export function salvarDadosEmpresa(pastaEmpresa: string, dados: DadosEmpresa): void {
  fs.mkdirSync(pastaEmpresa, { recursive: true });
  fs.writeFileSync(
    path.join(pastaEmpresa, 'dadosEmpresa.json'),
    JSON.stringify(dados, null, 2),
    'utf-8'
  );
}

export function listarTodosLeads(pastaBase: string = DEFAULT_LEADS_DIR): LeadSummary[] {
  const leads: LeadSummary[] = [];
  if (!fs.existsSync(pastaBase)) return leads;

  function scan(dir: string) {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (!item.isDirectory()) continue;
        const subPath = path.join(dir, item.name);
        const dadosFile = path.join(subPath, 'dadosEmpresa.json');

        if (fs.existsSync(dadosFile)) {
          try {
            const raw = fs.readFileSync(dadosFile, 'utf-8');
            const dados: DadosEmpresa = JSON.parse(raw);
            const relPath = path.relative(ROOT_DIR, subPath);
            const parts = relPath.split(path.sep);

            // Tenta obter país e categoria pela estrutura de pastas ou pelo JSON
            let pais = dados.meta?.country || (parts.length >= 3 ? parts[1] : 'Brasil');
            let categoria = dados.meta?.category || (parts.length >= 4 ? parts[2] : 'Geral');

            let qtdFotos = 0;
            const fotosJson = path.join(subPath, 'fotos', 'fotos.json');
            if (fs.existsSync(fotosJson)) {
              try {
                const links = JSON.parse(fs.readFileSync(fotosJson, 'utf-8'));
                qtdFotos = Array.isArray(links) ? links.length : 0;
              } catch {}
            }

            const stat = fs.statSync(dadosFile);

            leads.push({
              id: Buffer.from(subPath).toString('base64'),
              nome: dados.contact?.nome || dados.meta?.project_name || item.name,
              pais,
              categoria,
              caminho_relativo: relPath,
              caminho_absoluto: subPath,
              score: dados.lead?.score ?? 50,
              classe: dados.lead?.classe ?? 'B',
              oportunidade: dados.site?.oportunidade ?? 'criar_site',
              tem_site: !!dados.site?.tem_site_proprio,
              site_url: dados.site?.url || null,
              telefone: dados.contact?.telefone || null,
              nota: dados.contact?.nota_google || null,
              avaliacoes: dados.contact?.total_avaliacoes || null,
              qtd_fotos: qtdFotos,
              atualizado_em: stat.mtime.toISOString(),
              outreach_status: dados.outreach_status || 'novo',
            });
          } catch (e) {
            console.error(`Erro ao ler dadosEmpresa em ${subPath}:`, e);
          }
        } else {
          // Continua navegando em subpastas
          scan(subPath);
        }
      }
    } catch (e) {
      console.error(`Erro ao escanear diretório ${dir}:`, e);
    }
  }

  scan(pastaBase);
  leads.sort((a, b) => b.score - a.score);
  return leads;
}

export function carregarDetalhesLead(caminhoAbsoluto: string): {
  dados: DadosEmpresa | null;
  fotosLinks: string[];
  fotosArquivos: string[];
  siteTokens: any | null;
  arquivos: string[];
} {
  const result = {
    dados: null as DadosEmpresa | null,
    fotosLinks: [] as string[],
    fotosArquivos: [] as string[],
    siteTokens: null as any | null,
    arquivos: [] as string[],
  };

  if (!fs.existsSync(caminhoAbsoluto)) return result;

  const dadosPath = path.join(caminhoAbsoluto, 'dadosEmpresa.json');
  if (fs.existsSync(dadosPath)) {
    try {
      result.dados = JSON.parse(fs.readFileSync(dadosPath, 'utf-8'));
    } catch {}
  }

  const fotosJsonPath = path.join(caminhoAbsoluto, 'fotos', 'fotos.json');
  if (fs.existsSync(fotosJsonPath)) {
    try {
      result.fotosLinks = JSON.parse(fs.readFileSync(fotosJsonPath, 'utf-8'));
    } catch {}
  }

  const fotosDir = path.join(caminhoAbsoluto, 'fotos');
  if (fs.existsSync(fotosDir)) {
    try {
      result.fotosArquivos = fs
        .readdirSync(fotosDir)
        .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    } catch {}
  }

  const tokensPath = path.join(caminhoAbsoluto, 'site', 'tokens.json');
  if (fs.existsSync(tokensPath)) {
    try {
      result.siteTokens = JSON.parse(fs.readFileSync(tokensPath, 'utf-8'));
    } catch {}
  }

  // Lista todos os arquivos da pasta da empresa
  function listAll(dir: string, base: string = '') {
    try {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const itemRel = base ? `${base}/${item.name}` : item.name;
        if (item.isDirectory()) {
          listAll(path.join(dir, item.name), itemRel);
        } else {
          result.arquivos.push(itemRel);
        }
      }
    } catch {}
  }
  listAll(caminhoAbsoluto);

  return result;
}

export async function gerarZipLeads(caminhoAlvo: string = DEFAULT_LEADS_DIR): Promise<Buffer> {
  const zip = new JSZip();

  function addDirToZip(currentDir: string, zipFolder: JSZip) {
    if (!fs.existsSync(currentDir)) return;
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      if (item.isDirectory()) {
        const nextFolder = zipFolder.folder(item.name);
        if (nextFolder) {
          addDirToZip(fullPath, nextFolder);
        }
      } else {
        const content = fs.readFileSync(fullPath);
        zipFolder.file(item.name, content);
      }
    }
  }

  addDirToZip(caminhoAlvo, zip);
  return await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}

export function seedInitialLeads(): void {
  const sample1 = path.join(DEFAULT_LEADS_DIR, 'Brasil', 'Restaurantes e Bares', 'Bar do Zé Pinheiros');
  const sample2 = path.join(DEFAULT_LEADS_DIR, 'Brasil', 'Saúde & Odontologia', 'Clínica Sorriso Nobre');
  const sample3 = path.join(DEFAULT_LEADS_DIR, 'Portugal', 'Tecnologia & Agências', 'Studio Web Lisboa');

  if (!fs.existsSync(sample1)) {
    fs.mkdirSync(path.join(sample1, 'fotos'), { recursive: true });
    fs.mkdirSync(path.join(sample1, 'site'), { recursive: true });

    const dados1: DadosEmpresa = {
      meta: {
        project_name: 'Bar do Zé Pinheiros',
        generated_at: new Date().toISOString().split('T')[0],
        language: 'pt-BR',
        country: 'Brasil',
        category: 'Restaurantes e Bares',
        niche: 'bar',
      },
      contact: {
        nome: 'Bar do Zé Pinheiros',
        telefone: '+55 11 98765-4321',
        endereco: 'Rua dos Pinheiros, 452 - Pinheiros, São Paulo - SP, Brasil',
        nota_google: '4.7',
        total_avaliacoes: '840 avaliações',
        horarios: [
          'terça-feira: 17:00–01:00',
          'quarta-feira: 17:00–01:00',
          'quinta-feira: 17:00–02:00',
          'sexta-feira: 17:00–03:00',
          'sábado: 12:00–03:00',
          'domingo: 12:00–22:00',
        ],
        maps_url: 'https://www.google.com/maps/search/?api=1&query=Bar+do+Ze+Pinheiros',
      },
      site: {
        tem_site_proprio: false,
        url: 'https://instagram.com/bardoze_pinheiros',
        tipo: 'rede_social',
        status: null,
        status_http: null,
        https: true,
        viewport_meta: null,
        mobile_ok: null,
        tempo_carga_s: null,
        tecnologia: [],
        ano_copyright: null,
        titulo: 'Bar do Zé (@bardoze_pinheiros) • Fotos e Vídeos no Instagram',
        descricao: 'O autêntico boteco de Pinheiros com petiscos artesanais e chopp artesanal trincando.',
        emails: ['contato@bardoze.com.br'],
        redes_sociais: {
          instagram: 'https://instagram.com/bardoze_pinheiros',
          whatsapp: 'https://wa.me/5511987654321',
        },
        whatsapp_no_site: true,
        json_ld: {},
        pagespeed: null,
        score_qualidade: 25,
        qualidade: 'ruim',
        problemas: ['sem site próprio (apenas link para rede social)', 'ausência de cardápio indexado no Google'],
        oportunidade: 'criar_site',
        motivo: 'só tem rede social/agregador como link no Google Maps',
      },
      lead: {
        score: 95,
        classe: 'A',
        detalhes: {
          oportunidade: 50,
          reputacao: 15,
          volume: 16,
          contato: 14,
        },
        motivos: [
          'sem site no Google Maps (oportunidade máxima)',
          'nota 4.7 com alta aprovação',
          '840 avaliações ativas',
          'celular e WhatsApp direto identificado',
        ],
      },
      design_system: {
        accent: '#454DFC',
        neutral_base: ['#08090D', '#101118', '#F4F4F7'],
        mode: 'dark',
        heading_font: 'Montserrat',
        body_font: 'Space Grotesk',
        radius_system: 'pill',
        cores: ['#454DFC', '#85A9FA', '#9070F7', '#4128FB'],
      },
      outreach_status: 'novo',
    };
    fs.writeFileSync(path.join(sample1, 'dadosEmpresa.json'), JSON.stringify(dados1, null, 2), 'utf-8');
    fs.writeFileSync(
      path.join(sample1, 'fotos', 'fotos.json'),
      JSON.stringify(
        [
          'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
          'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80',
          'https://images.unsplash.com/photo-1543007630-9710e4a00a20?w=800&q=80',
        ],
        null,
        2
      ),
      'utf-8'
    );
    fs.writeFileSync(
      path.join(sample1, 'site', 'tokens.json'),
      JSON.stringify(
        {
          derivado: dados1.design_system,
          paleta: ['#FF5500', '#18181B', '#F4F4F5'],
          vibe: 'industrial_pub_bohemian',
        },
        null,
        2
      ),
      'utf-8'
    );
  }

  if (!fs.existsSync(sample2)) {
    fs.mkdirSync(path.join(sample2, 'fotos'), { recursive: true });
    fs.mkdirSync(path.join(sample2, 'site'), { recursive: true });

    const dados2: DadosEmpresa = {
      meta: {
        project_name: 'Clínica Sorriso Nobre',
        generated_at: new Date().toISOString().split('T')[0],
        language: 'pt-BR',
        country: 'Brasil',
        category: 'Saúde & Odontologia',
        niche: 'dentist',
      },
      contact: {
        nome: 'Clínica Sorriso Nobre',
        telefone: '+55 11 3123-4567',
        endereco: 'Av. Paulista, 1800 - Bela Vista, São Paulo - SP, Brasil',
        nota_google: '4.9',
        total_avaliacoes: '320 avaliações',
        horarios: ['segunda a sexta: 08:00–19:00', 'sábado: 08:00–13:00'],
        maps_url: 'https://www.google.com/maps/search/?api=1&query=Clinica+Sorriso+Nobre',
      },
      site: {
        tem_site_proprio: true,
        url: 'https://sorrisonobre-antigo.com.br',
        tipo: 'site_proprio',
        status: 'no_ar',
        status_http: 200,
        https: false,
        viewport_meta: false,
        mobile_ok: false,
        tempo_carga_s: 7.4,
        tecnologia: ['wordpress', 'elementor'],
        ano_copyright: 2019,
        titulo: 'Home - Dr. Nobre Odontologia Estética',
        descricao: '',
        emails: ['atendimento@sorrisonobre.com.br'],
        redes_sociais: {},
        whatsapp_no_site: false,
        json_ld: {},
        pagespeed: {
          performance_mobile: 34,
          fcp: '3.8s',
          lcp: '6.2s',
        },
        score_qualidade: 42,
        qualidade: 'ruim',
        problemas: [
          'sem HTTPS (alerta de segurança no Chrome)',
          'sem meta viewport (layout quebrado no celular)',
          'carregamento lento (7.4s)',
          'copyright desatualizado (2019)',
        ],
        oportunidade: 'redesign',
        motivo: 'site fraco e inseguro: sem HTTPS, lento e não adaptado ao mobile',
      },
      lead: {
        score: 82,
        classe: 'A',
        detalhes: {
          oportunidade: 35,
          reputacao: 15,
          volume: 12,
          contato: 20,
        },
        motivos: [
          'site existente fraco precisando de redesign urgente',
          'nota 4.9 excelente na Paulista',
          'email corporativo e telefone fixo',
        ],
      },
      design_system: {
        accent: '#0284C7',
        neutral_base: ['#FFFFFF', '#F8FAFC', '#0F172A'],
        mode: 'light',
        heading_font: 'Plus Jakarta Sans',
        body_font: 'DM Sans',
        radius_system: 'soft',
        cores: ['#0284C7', '#0EA5E9', '#F1F5F9'],
      },
      outreach_status: 'novo',
    };
    fs.writeFileSync(path.join(sample2, 'dadosEmpresa.json'), JSON.stringify(dados2, null, 2), 'utf-8');
    fs.writeFileSync(path.join(sample2, 'fotos', 'fotos.json'), '[]', 'utf-8');
  }

  if (!fs.existsSync(sample3)) {
    fs.mkdirSync(path.join(sample3, 'fotos'), { recursive: true });
    fs.mkdirSync(path.join(sample3, 'site'), { recursive: true });

    const dados3: DadosEmpresa = {
      meta: {
        project_name: 'Studio Web Lisboa',
        generated_at: new Date().toISOString().split('T')[0],
        language: 'pt-BR',
        country: 'Portugal',
        category: 'Tecnologia & Agências',
        niche: 'design_agency',
      },
      contact: {
        nome: 'Studio Web Lisboa',
        telefone: '+351 912 345 678',
        endereco: 'Avenida da Liberdade 120, 1250-146 Lisboa, Portugal',
        nota_google: '4.8',
        total_avaliacoes: '145 avaliações',
        horarios: ['segunda a sexta: 09:00–18:00'],
        maps_url: 'https://www.google.com/maps/search/?api=1&query=Studio+Web+Lisboa',
      },
      site: {
        tem_site_proprio: false,
        url: null,
        tipo: 'sem_site',
        status: null,
        status_http: null,
        https: null,
        viewport_meta: null,
        mobile_ok: null,
        tempo_carga_s: null,
        tecnologia: [],
        ano_copyright: null,
        titulo: null,
        descricao: null,
        emails: [],
        redes_sociais: {},
        whatsapp_no_site: false,
        json_ld: {},
        pagespeed: null,
        score_qualidade: null,
        qualidade: null,
        problemas: ['sem site registrado no Google Maps'],
        oportunidade: 'criar_site',
        motivo: 'sem site no Google Maps',
      },
      lead: {
        score: 88,
        classe: 'A',
        detalhes: {
          oportunidade: 50,
          reputacao: 15,
          volume: 8,
          contato: 15,
        },
        motivos: ['sem site cadastrado no Maps', 'nota 4.8 em Lisboa', 'telefone móvel disponível'],
      },
      outreach_status: 'novo',
    };
    fs.writeFileSync(path.join(sample3, 'dadosEmpresa.json'), JSON.stringify(dados3, null, 2), 'utf-8');
    fs.writeFileSync(path.join(sample3, 'fotos', 'fotos.json'), '[]', 'utf-8');
  }
}
