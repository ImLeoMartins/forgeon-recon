import React, { useState } from 'react';

interface ScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (config: {
    query: string;
    max_leads: number;
    max_fotos: number;
    pasta_saida: string;
    baixar: boolean;
    pular_site: boolean;
    pagespeed: boolean;
    organizar_hierarquia: boolean;
  }) => void;
  isLoading: boolean;
}

export const ScrapeModal: React.FC<ScrapeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [query, setQuery] = useState('Bares em Pinheiros, São Paulo');
  const [pastaSaida, setPastaSaida] = useState('leads');
  const [maxLeads, setMaxLeads] = useState(5);
  const [maxFotos, setMaxFotos] = useState(10);
  const [baixarFotos, setBaixarFotos] = useState(true);
  const [analisarSite, setAnalisarSite] = useState(true);
  const [pagespeed, setPagespeed] = useState(false);
  const [organizarHierarquia, setOrganizarHierarquia] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    onSubmit({
      query: query.trim(),
      max_leads: maxLeads,
      max_fotos: maxFotos,
      pasta_saida: pastaSaida.trim() || 'leads',
      baixar: baixarFotos,
      pular_site: !analisarSite,
      pagespeed,
      organizar_hierarquia: organizarHierarquia,
    });
  };

  const isDefaultLeads = pastaSaida.trim().toLowerCase() === 'leads' || pastaSaida.trim() === '/leads';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#101118] border border-[#292B38] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#292B38] flex items-center justify-between bg-[#171923]/60">
          <div className="flex items-center gap-3.5">
            <div className="w-8 h-8 rounded-full bg-[#4128FB]/20 border border-[#454DFC]/40 flex items-center justify-center text-[#85A9FA]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-[#F4F4F7]">Nova Varredura de Prospecção</h2>
              <p className="text-xs font-sans text-[#A3A6B5]">Configure a busca e as regras de gravação de arquivos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#A3A6B5] hover:text-[#F4F4F7] p-2 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-7 overflow-y-auto space-y-5 text-sm font-sans">
          {/* Query Input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A3A6B5] mb-2">
              Alvo de Busca (Segmento e Localização)
            </label>
            <input
              type="text"
              required
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ex: Bar Pinheiros São Paulo, Restaurante Lisboa, Dentista Curitiba"
              className="w-full bg-[#171923] border border-[#292B38] focus:border-[#85A9FA] focus:ring-1 focus:ring-[#85A9FA] rounded-xl px-4 py-3 text-[#F4F4F7] placeholder-[#6C6F82] font-medium text-sm transition-colors outline-none"
            />
            {/* Quick Suggestions */}
            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-[#A3A6B5]">
              <span className="text-[#6C6F82]">Sugestões:</span>
              <button
                type="button"
                onClick={() => setQuery('Bares em Pinheiros, São Paulo')}
                className="hover:text-[#85A9FA] underline decoration-[#292B38] underline-offset-4"
              >
                Bares em Pinheiros
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setQuery('Pizzarias no Centro de Curitiba')}
                className="hover:text-[#85A9FA] underline decoration-[#292B38] underline-offset-4"
              >
                Pizzarias em Curitiba
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setQuery('Dentistas em Lisboa, Portugal')}
                className="hover:text-[#85A9FA] underline decoration-[#292B38] underline-offset-4"
              >
                Dentistas em Lisboa
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setQuery('Academias em Belo Horizonte')}
                className="hover:text-[#85A9FA] underline decoration-[#292B38] underline-offset-4"
              >
                Academias em BH
              </button>
            </div>
          </div>

          {/* Destination Folder & Hierarchy Option */}
          <div className="bg-[#171923] p-5 rounded-2xl border border-[#292B38] space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F7]">
                Pasta de Destino para os Leads
              </label>
              <span className="text-xs font-mono text-[#85A9FA]">
                {isDefaultLeads ? 'Estrutura Automática Ativa' : 'Diretório Personalizado'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <span className="text-[#6C6F82] font-mono text-sm select-none">/</span>
              <input
                type="text"
                value={pastaSaida}
                onChange={e => setPastaSaida(e.target.value)}
                placeholder="leads (ou caminho customizado como projetos/outbound)"
                className="flex-1 bg-[#101118] border border-[#292B38] focus:border-[#85A9FA] focus:ring-1 focus:ring-[#85A9FA] rounded-xl px-3.5 py-2 text-[#F4F4F7] font-mono text-xs outline-none"
              />
              <button
                type="button"
                onClick={() => setPastaSaida('leads')}
                className="px-3 py-1.5 text-xs text-[#A3A6B5] hover:text-[#F4F4F7] bg-[#1F2230] border border-[#292B38] rounded-lg transition-colors cursor-pointer"
              >
                Resetar para /leads
              </button>
            </div>

            {/* Explanatory Box for the prompt rule */}
            <div className="p-3.5 bg-[#101118] rounded-xl border border-[#292B38] text-xs space-y-2">
              <div className="flex items-start gap-2.5 text-[#F4F4F7]">
                <svg className="w-4 h-4 text-[#85A9FA] shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
                <div>
                  <span className="font-semibold text-[#85A9FA]">
                    {isDefaultLeads ? 'Organização Hierárquica em /leads:' : 'Comportamento da Pasta:'}
                  </span>
                  <p className="text-[#A3A6B5] mt-1 leading-relaxed">
                    {isDefaultLeads
                      ? 'Como a pasta é "leads", o sistema cria automaticamente as subpastas separando por País / Categoria / Nome da Empresa, gerando fotos, site tokens e dadosEmpresa.json organizados.'
                      : `Os arquivos serão salvos diretamente em "${pastaSaida}". Marque a opção abaixo para manter a divisão por país e categoria.`}
                  </p>
                </div>
              </div>

              {!isDefaultLeads && (
                <label className="flex items-center gap-2 pt-2 border-t border-[#292B38] cursor-pointer text-[#F4F4F7]">
                  <input
                    type="checkbox"
                    checked={organizarHierarquia}
                    onChange={e => setOrganizarHierarquia(e.target.checked)}
                    className="rounded bg-[#171923] border-[#292B38] text-[#454DFC] focus:ring-[#85A9FA]"
                  />
                  <span>Separar em subpastas de País e Categoria dentro deste caminho</span>
                </label>
              )}
            </div>
          </div>

          {/* Knobs: Max Leads & Max Photos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#171923] p-4 rounded-2xl border border-[#292B38]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#F4F4F7]">Volume de Leads</span>
                <span className="font-mono text-xs font-bold text-[#85A9FA]">{maxLeads} empresas</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                value={maxLeads}
                onChange={e => setMaxLeads(Number(e.target.value))}
                className="w-full accent-[#454DFC] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-[#6C6F82] mt-1">
                <span>1 rápido</span>
                <span>10 padrão</span>
                <span>25 lote</span>
              </div>
            </div>

            <div className="bg-[#171923] p-4 rounded-2xl border border-[#292B38]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-[#F4F4F7]">Fotos por Empresa</span>
                <span className="font-mono text-xs font-bold text-[#85A9FA]">{maxFotos} fotos</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={maxFotos}
                onChange={e => setMaxFotos(Number(e.target.value))}
                className="w-full accent-[#454DFC] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] font-mono text-[#6C6F82] mt-1">
                <span>1 capa</span>
                <span>10 média</span>
                <span>20 galeria</span>
              </div>
            </div>
          </div>

          {/* Switches */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="flex items-center justify-between p-3.5 bg-[#171923] border border-[#292B38] rounded-xl cursor-pointer hover:border-[#85A9FA] transition-colors">
              <div>
                <div className="text-xs font-semibold text-[#F4F4F7]">Baixar Imagens</div>
                <div className="text-[11px] text-[#A3A6B5]">Salva em fotos/</div>
              </div>
              <input
                type="checkbox"
                checked={baixarFotos}
                onChange={e => setBaixarFotos(e.target.checked)}
                className="w-4 h-4 rounded bg-[#101118] border-[#292B38] text-[#454DFC] focus:ring-[#85A9FA]"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-[#171923] border border-[#292B38] rounded-xl cursor-pointer hover:border-[#85A9FA] transition-colors">
              <div>
                <div className="text-xs font-semibold text-[#F4F4F7]">Auditar Website</div>
                <div className="text-[11px] text-[#A3A6B5]">Extrai tokens e design</div>
              </div>
              <input
                type="checkbox"
                checked={analisarSite}
                onChange={e => setAnalisarSite(e.target.checked)}
                className="w-4 h-4 rounded bg-[#101118] border-[#292B38] text-[#454DFC] focus:ring-[#85A9FA]"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 bg-[#171923] border border-[#292B38] rounded-xl cursor-pointer hover:border-[#85A9FA] transition-colors">
              <div>
                <div className="text-xs font-semibold text-[#F4F4F7]">Google PageSpeed</div>
                <div className="text-[11px] text-[#A3A6B5]">FCP e LCP mobile</div>
              </div>
              <input
                type="checkbox"
                checked={pagespeed}
                onChange={e => setPagespeed(e.target.checked)}
                className="w-4 h-4 rounded bg-[#101118] border-[#292B38] text-[#454DFC] focus:ring-[#85A9FA]"
              />
            </label>
          </div>

          {/* Footer Action */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#292B38]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="btn-forgeon-secondary h-10 px-5 text-xs font-sans cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-forgeon-primary h-10 px-6 text-xs uppercase cursor-pointer"
            >
              {isLoading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                  </svg>
                  Disparando Varredura...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                  Iniciar Reconhecimento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
