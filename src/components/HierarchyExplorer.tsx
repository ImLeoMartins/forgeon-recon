import React, { useState, useMemo } from 'react';
import { LeadSummary, HierarchyCountry } from '../types';

interface HierarchyExplorerProps {
  leads: LeadSummary[];
  hierarchy: HierarchyCountry[];
  stats: {
    classA: number;
    classB: number;
    classC: number;
    semSite: number;
    comSite: number;
  };
  isLoading: boolean;
  onRefresh: () => void;
  onSelectLead: (caminhoAbsoluto: string) => void;
  onExportZip: (caminho?: string) => void;
  onDeleteLead: (caminhoAbsoluto: string) => void;
  onOpenNewScrape: () => void;
}

export const HierarchyExplorer: React.FC<HierarchyExplorerProps> = ({
  leads,
  hierarchy,
  stats,
  isLoading,
  onRefresh,
  onSelectLead,
  onExportZip,
  onOpenNewScrape,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table' | 'tree'>('cards');

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => set.add(l.categoria));
    return Array.from(set).sort();
  }, [leads]);

  const allCountries = useMemo(() => {
    const set = new Set<string>();
    leads.forEach(l => set.add(l.pais));
    return Array.from(set).sort();
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(l => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = l.nome.toLowerCase().includes(q);
        const matchesPhone = (l.telefone || '').includes(q);
        const matchesCat = l.categoria.toLowerCase().includes(q);
        const matchesCountry = l.pais.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone && !matchesCat && !matchesCountry) return false;
      }
      if (selectedCountry !== 'all' && l.pais !== selectedCountry) return false;
      if (selectedCategory !== 'all' && l.categoria !== selectedCategory) return false;
      if (selectedClass !== 'all' && l.classe !== selectedClass) return false;
      if (selectedOpportunity !== 'all' && l.oportunidade !== selectedOpportunity) return false;
      return true;
    });
  }, [leads, searchTerm, selectedCountry, selectedCategory, selectedClass, selectedOpportunity]);

  return (
    <div className="space-y-6">
      {/* KPI Stats Strip — Forgeon V2 Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#101118] border border-[#292B38] p-5 rounded-2xl">
          <div className="flex items-center justify-between text-[#A3A6B5] text-xs font-sans">
            <span>Total de Leads</span>
            <span className="w-2 h-2 rounded-full bg-[#85A9FA]" />
          </div>
          <p className="text-3xl font-bold font-heading text-[#F4F4F7] mt-2 tabular-nums">
            {leads.length}
          </p>
          <span className="text-[12px] text-[#A3A6B5] font-sans">
            em {allCountries.length} {allCountries.length === 1 ? 'país' : 'países'}
          </span>
        </div>

        <div className="bg-[#101118] border border-[#292B38] p-5 rounded-2xl">
          <div className="flex items-center justify-between text-[#85A9FA] text-xs font-sans">
            <span className="font-semibold">Classe A (Top)</span>
            <span className="w-2 h-2 rounded-full bg-[#85A9FA] shadow-[0_0_8px_#85A9FA]" />
          </div>
          <p className="text-3xl font-bold font-heading text-[#85A9FA] mt-2 tabular-nums">
            {stats.classA}
          </p>
          <span className="text-[12px] text-[#A3A6B5] font-sans">Score 75+ (leads ideais)</span>
        </div>

        <div className="bg-[#101118] border border-[#292B38] p-5 rounded-2xl">
          <div className="flex items-center justify-between text-[#9070F7] text-xs font-sans">
            <span className="font-semibold">Classe B (Média)</span>
            <span className="w-2 h-2 rounded-full bg-[#9070F7]" />
          </div>
          <p className="text-3xl font-bold font-heading text-[#9070F7] mt-2 tabular-nums">
            {stats.classB}
          </p>
          <span className="text-[12px] text-[#A3A6B5] font-sans">Score 55 a 74</span>
        </div>

        <div className="bg-[#101118] border border-[#292B38] p-5 rounded-2xl">
          <div className="flex items-center justify-between text-[#454DFC] text-xs font-sans">
            <span className="font-semibold">Criar Site</span>
            <span className="text-xs font-mono text-[#85A9FA]">50 pts</span>
          </div>
          <p className="text-3xl font-bold font-heading text-[#F4F4F7] mt-2 tabular-nums">
            {stats.semSite}
          </p>
          <span className="text-[12px] text-[#A3A6B5] font-sans">Sem site no Maps</span>
        </div>

        <div className="bg-[#101118] border border-[#292B38] p-5 rounded-2xl">
          <div className="flex items-center justify-between text-[#A3A6B5] text-xs font-sans">
            <span>Redesign</span>
            <span className="text-xs font-mono text-[#85A9FA]">35 pts</span>
          </div>
          <p className="text-3xl font-bold font-heading text-[#F4F4F7] mt-2 tabular-nums">
            {leads.filter(l => l.oportunidade === 'redesign').length}
          </p>
          <span className="text-[12px] text-[#A3A6B5] font-sans">Sites fracos ou inseguros</span>
        </div>
      </div>

      {/* Control Bar: Filters, Search & View Switcher */}
      <div className="bg-[#101118] border border-[#292B38] p-5 rounded-2xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <svg
              className="w-4 h-4 text-[#A3A6B5] absolute left-3.5 top-1/2 -translate-y-1/2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por negócio, telefone, categoria ou cidade..."
              className="w-full bg-[#171923] border border-[#292B38] focus:border-[#85A9FA] focus:ring-1 focus:ring-[#85A9FA] rounded-xl pl-10 pr-4 py-2.5 text-[#F4F4F7] placeholder-[#A3A6B5] text-sm font-sans outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A3A6B5] hover:text-[#F4F4F7] text-xs"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#171923] p-1 rounded-xl border border-[#292B38]">
              <button
                onClick={() => setViewMode('cards')}
                title="Cards"
                className={`p-2 rounded-lg text-xs transition-colors ${
                  viewMode === 'cards' ? 'bg-[#1F2230] text-[#F4F4F7]' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>

              <button
                onClick={() => setViewMode('table')}
                title="Tabela de Dados"
                className={`p-2 rounded-lg text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-[#1F2230] text-[#F4F4F7]' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>

              <button
                onClick={() => setViewMode('tree')}
                title="Árvore de Pastas"
                className={`p-2 rounded-lg text-xs transition-colors ${
                  viewMode === 'tree' ? 'bg-[#1F2230] text-[#F4F4F7]' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Recarregar"
              className="p-2.5 bg-[#171923] hover:bg-[#1F2230] border border-[#292B38] rounded-xl text-[#A3A6B5] hover:text-[#F4F4F7] transition-colors"
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
            </button>

            {/* Export ZIP */}
            <button
              onClick={() => onExportZip()}
              className="btn-forgeon-secondary h-10 px-4 text-xs font-sans tracking-wide cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-[#85A9FA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Exportar ZIP
            </button>
          </div>
        </div>

        {/* Filter Dropdowns Row */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#292B38] text-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="text-[#A3A6B5]">País:</span>
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              className="bg-[#171923] border border-[#292B38] text-[#F4F4F7] rounded-lg px-3 py-1.5 outline-none focus:border-[#85A9FA]"
            >
              <option value="all">Todos os Países ({leads.length})</option>
              {allCountries.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#A3A6B5]">Categoria:</span>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-[#171923] border border-[#292B38] text-[#F4F4F7] rounded-lg px-3 py-1.5 outline-none focus:border-[#85A9FA]"
            >
              <option value="all">Todas as Categorias</option>
              {allCategories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#A3A6B5]">Classe:</span>
            <select
              value={selectedClass}
              onChange={e => setSelectedClass(e.target.value)}
              className="bg-[#171923] border border-[#292B38] text-[#F4F4F7] rounded-lg px-3 py-1.5 outline-none focus:border-[#85A9FA]"
            >
              <option value="all">Todas as Classes</option>
              <option value="A">Classe A (Score 75+)</option>
              <option value="B">Classe B (Score 55-74)</option>
              <option value="C">Classe C (Score &lt; 55)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#A3A6B5]">Oportunidade:</span>
            <select
              value={selectedOpportunity}
              onChange={e => setSelectedOpportunity(e.target.value)}
              className="bg-[#171923] border border-[#292B38] text-[#F4F4F7] rounded-lg px-3 py-1.5 outline-none focus:border-[#85A9FA]"
            >
              <option value="all">Todas</option>
              <option value="criar_site">Criar Site (Sem site)</option>
              <option value="redesign">Redesign (Site Fraco)</option>
              <option value="melhoria">Melhoria de Performance</option>
              <option value="baixa_prioridade">Baixa Prioridade</option>
            </select>
          </div>

          {(selectedCountry !== 'all' ||
            selectedCategory !== 'all' ||
            selectedClass !== 'all' ||
            selectedOpportunity !== 'all' ||
            searchTerm) && (
            <button
              onClick={() => {
                setSelectedCountry('all');
                setSelectedCategory('all');
                setSelectedClass('all');
                setSelectedOpportunity('all');
                setSearchTerm('');
              }}
              className="text-[#85A9FA] hover:underline ml-auto font-sans text-xs"
            >
              Resetar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {filteredLeads.length === 0 ? (
        <div className="bg-[#101118] border border-[#292B38] rounded-2xl p-12 text-center space-y-4">
          <p className="text-base font-heading font-bold text-[#F4F4F7]">Nenhum lead encontrado para estes filtros.</p>
          <p className="text-sm text-[#A3A6B5] max-w-md mx-auto">
            Inicie uma nova varredura de prospecção no Google Maps para extrair empresas automaticamente.
          </p>
          <button
            onClick={onOpenNewScrape}
            className="btn-forgeon-primary h-10 px-5 text-xs uppercase"
          >
            Fazer Nova Varredura
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* Cards Grid View — Forgeon V2 Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLeads.map(lead => {
            const opLabel =
              lead.oportunidade === 'criar_site'
                ? 'Criar Site'
                : lead.oportunidade === 'redesign'
                ? 'Redesign'
                : lead.oportunidade === 'melhoria'
                ? 'Melhoria'
                : 'Baixa Prioridade';

            return (
              <div
                key={lead.id}
                onClick={() => onSelectLead(lead.caminho_absoluto)}
                className="forgeon-card p-6 cursor-pointer flex flex-col justify-between group space-y-4"
              >
                {/* Header */}
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[12px] font-sans text-[#A3A6B5] tracking-wide">
                      {lead.pais} / {lead.categoria}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                        lead.classe === 'A'
                          ? 'bg-[#4128FB]/20 text-[#85A9FA] border border-[#454DFC]/50'
                          : lead.classe === 'B'
                          ? 'bg-[#1F2230] text-[#A3A6B5] border border-[#292B38]'
                          : 'bg-[#171923] text-[#A3A6B5]'
                      }`}
                    >
                      Classe {lead.classe} · {lead.score} pts
                    </span>
                  </div>

                  <h3 className="text-lg font-heading font-bold text-[#F4F4F7] group-hover:text-[#85A9FA] transition-colors line-clamp-1">
                    {lead.nome}
                  </h3>

                  {/* Clean unboxed metadata with · separators */}
                  <div className="flex items-center gap-2 text-xs text-[#A3A6B5] font-sans">
                    <span className="text-[#F4F4F7]">★ {lead.nota || 'S/ aval'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lead.avaliacoes || '0 avaliações'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{lead.qtd_fotos} fotos</span>
                  </div>
                </div>

                {/* Details Strip */}
                <div className="space-y-2 pt-3 border-t border-[#292B38] text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-[#A3A6B5]">Telefone:</span>
                    <span className="font-mono text-[#F4F4F7]">{lead.telefone || 'Não informado'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#A3A6B5]">Website:</span>
                    <span className="text-[#F4F4F7] truncate max-w-[190px]">
                      {lead.site_url ? (
                        <span className="underline underline-offset-2 hover:text-[#85A9FA]">
                          {lead.site_url.replace(/^https?:\/\/(www\.)?/, '')}
                        </span>
                      ) : (
                        <span className="text-[#A3A6B5] italic">Sem site no Maps</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#A3A6B5]">Oportunidade:</span>
                    <span className="text-xs font-semibold text-[#85A9FA]">
                      {opLabel}
                    </span>
                  </div>
                </div>

                {/* Footer folder path */}
                <div className="pt-3 border-t border-[#292B38] flex items-center justify-between text-[11px] font-sans text-[#A3A6B5]">
                  <span className="truncate max-w-[200px]" title={lead.caminho_relativo}>
                    📁 {lead.caminho_relativo}
                  </span>
                  <span className="text-[#85A9FA] font-semibold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Ver Dossiê
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : viewMode === 'table' ? (
        /* High-Density Data Table View */
        <div className="bg-[#101118] border border-[#292B38] rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#F4F4F7]">
              <thead className="bg-[#171923] text-[#A3A6B5] font-sans text-[11px] uppercase tracking-wider border-b border-[#292B38]">
                <tr>
                  <th className="px-5 py-3.5">Empresa</th>
                  <th className="px-5 py-3.5">País / Categoria</th>
                  <th className="px-5 py-3.5 text-right">Score</th>
                  <th className="px-5 py-3.5 text-center">Classe</th>
                  <th className="px-5 py-3.5">Oportunidade</th>
                  <th className="px-5 py-3.5">Telefone</th>
                  <th className="px-5 py-3.5">Website</th>
                  <th className="px-5 py-3.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#292B38]">
                {filteredLeads.map(lead => (
                  <tr
                    key={lead.id}
                    onClick={() => onSelectLead(lead.caminho_absoluto)}
                    className="hover:bg-[#171923] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3.5 font-heading font-semibold text-[#F4F4F7]">
                      {lead.nome}
                    </td>
                    <td className="px-5 py-3.5 text-[#A3A6B5]">
                      {lead.pais} / {lead.categoria}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-[#85A9FA] tabular-nums">
                      {lead.score}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                          lead.classe === 'A'
                            ? 'bg-[#4128FB]/20 text-[#85A9FA] border border-[#454DFC]/40'
                            : 'bg-[#171923] text-[#A3A6B5]'
                        }`}
                      >
                        {lead.classe}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[#85A9FA] font-medium">
                      {lead.oportunidade.replace('_', ' ').toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[#A3A6B5]">
                      {lead.telefone || '-'}
                    </td>
                    <td className="px-5 py-3.5 text-[#A3A6B5] truncate max-w-[160px]">
                      {lead.site_url ? lead.site_url.replace(/^https?:\/\//, '') : 'Sem site'}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onSelectLead(lead.caminho_absoluto);
                        }}
                        className="text-xs text-[#85A9FA] hover:underline font-semibold"
                      >
                        Auditar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tree Folder View (Hierarchical Directory Inspection) */
        <div className="bg-[#101118] border border-[#292B38] rounded-2xl p-6 font-sans text-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#292B38]">
            <div className="flex items-center gap-2 text-[#F4F4F7]">
              <span className="text-[#85A9FA]">📁</span>
              <span className="font-heading font-bold text-sm">leads/ (Estrutura de Pastas)</span>
            </div>
            <button
              onClick={() => onExportZip()}
              className="text-xs text-[#85A9FA] hover:underline"
            >
              Baixar Tudo (.ZIP)
            </button>
          </div>

          <div className="space-y-4">
            {hierarchy.map(hPais => (
              <div key={hPais.pais} className="pl-3 border-l-2 border-[#292B38] space-y-3">
                <div className="flex items-center justify-between font-bold text-[#F4F4F7]">
                  <div className="flex items-center gap-2">
                    <span className="text-[#85A9FA]">📁</span>
                    <span>{hPais.pais}</span>
                    <span className="text-[#A3A6B5] text-[12px]">({hPais.total} leads)</span>
                  </div>
                  <button
                    onClick={() => onExportZip(`leads/${hPais.pais}`)}
                    className="text-[11px] text-[#A3A6B5] hover:text-[#85A9FA]"
                  >
                    Exportar {hPais.pais}.zip
                  </button>
                </div>

                <div className="space-y-3 pl-4">
                  {hPais.categorias.map(hCat => (
                    <div key={hCat.categoria} className="pl-3 border-l border-[#292B38] space-y-2">
                      <div className="flex items-center gap-2 text-[#F4F4F7]">
                        <span>📂</span>
                        <span className="font-semibold">{hCat.categoria}</span>
                        <span className="text-[#A3A6B5] text-[11px]">({hCat.count})</span>
                      </div>

                      <div className="space-y-1 pl-4">
                        {hCat.leads.map(lead => (
                          <div
                            key={lead.id}
                            onClick={() => onSelectLead(lead.caminho_absoluto)}
                            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-[#171923] cursor-pointer text-[#A3A6B5] hover:text-[#F4F4F7] transition-colors group"
                          >
                            <div className="flex items-center gap-2">
                              <span>📄</span>
                              <span className="font-medium text-[#F4F4F7] group-hover:text-[#85A9FA]">
                                {lead.nome}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-[11px]">
                              <span className="text-[#A3A6B5]">dadosEmpresa.json · fotos/ · site/</span>
                              <span className="font-mono font-bold text-[#85A9FA]">Score {lead.score}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
