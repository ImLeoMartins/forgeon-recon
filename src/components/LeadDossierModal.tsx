import React, { useState, useEffect } from 'react';
import { OutreachStatus } from '../types';
import { ForgeonLogo } from './ForgeonLogo';

interface LeadDossierModalProps {
  caminhoAbsoluto: string | null;
  onClose: () => void;
  onExportZip: (caminho: string) => void;
  onStatusUpdated?: () => void;
}

export const LeadDossierModal: React.FC<LeadDossierModalProps> = ({
  caminhoAbsoluto,
  onClose,
  onExportZip,
  onStatusUpdated,
}) => {
  const [loading, setLoading] = useState(true);
  const [leadData, setLeadData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'audit' | 'design' | 'photos' | 'files'>('overview');
  const [outreachStatus, setOutreachStatus] = useState<OutreachStatus>('novo');
  const [notes, setNotes] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    if (!caminhoAbsoluto) return;
    setLoading(true);

    fetch(`/api/leads/details?path=${encodeURIComponent(caminhoAbsoluto)}`)
      .then(res => res.json())
      .then(data => {
        setLeadData(data);
        if (data.dados?.outreach_status) {
          setOutreachStatus(data.dados.outreach_status);
        }
        if (data.dados?.notes) {
          setNotes(data.dados.notes);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Erro ao carregar detalhes do lead:', err);
        setLoading(false);
      });
  }, [caminhoAbsoluto]);

  if (!caminhoAbsoluto) return null;

  const handleSaveOutreach = async () => {
    setSavingStatus(true);
    try {
      await fetch('/api/leads/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: caminhoAbsoluto,
          status: outreachStatus,
          notes,
        }),
      });
      onStatusUpdated?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSavingStatus(false);
    }
  };

  const copyJson = () => {
    if (!leadData?.dados) return;
    navigator.clipboard.writeText(JSON.stringify(leadData.dados, null, 2));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const dados = leadData?.dados;
  const leadScore = dados?.lead;
  const site = dados?.site;
  const design = dados?.design_system || leadData?.siteTokens?.derivado;

  const phoneDigits = (dados?.contact?.telefone || '').replace(/\D/g, '');
  const isBrazil = !dados?.contact?.telefone?.startsWith('+') || dados?.contact?.telefone?.startsWith('+55');
  const whatsappUrl = phoneDigits
    ? `https://wa.me/${isBrazil && !phoneDigits.startsWith('55') ? '55' + phoneDigits : phoneDigits}`
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="w-full max-w-4xl bg-[#101118] border border-[#292B38] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-7 py-5 border-b border-[#292B38] flex items-center justify-between bg-[#171923]/70">
          <div className="flex items-center gap-3.5">
            <ForgeonLogo size={32} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-sans text-[#A3A6B5]">
                  {dados?.meta?.country || 'Brasil'} / {dados?.meta?.category || 'Geral'}
                </span>
                <span className="text-[#6C6F82]">·</span>
                <span className="text-[12px] font-mono text-[#85A9FA] font-bold">
                  Score {leadScore?.score ?? 50} (Classe {leadScore?.classe ?? 'B'})
                </span>
              </div>
              <h2 className="text-xl font-heading font-bold text-[#F4F4F7] line-clamp-1">
                {dados?.contact?.nome || dados?.meta?.project_name || 'Dossiê do Lead'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onExportZip(caminhoAbsoluto)}
              className="btn-forgeon-secondary h-9 px-4 text-xs font-sans cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-[#85A9FA]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Baixar (.ZIP)
            </button>

            <button
              onClick={onClose}
              className="p-2 text-[#A3A6B5] hover:text-[#F4F4F7] rounded-lg hover:bg-[#1F2230] transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-7 border-b border-[#292B38] bg-[#101118] flex items-center gap-7 text-xs font-sans font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 relative ${
              activeTab === 'overview' ? 'text-[#F4F4F7] font-semibold' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
            }`}
          >
            Visão Geral & Contato
            {activeTab === 'overview' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4128FB] via-[#454DFC] to-[#85A9FA] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3.5 relative ${
              activeTab === 'audit' ? 'text-[#F4F4F7] font-semibold' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
            }`}
          >
            Auditoria Web & Diagnóstico
            {activeTab === 'audit' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4128FB] via-[#454DFC] to-[#85A9FA] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('design')}
            className={`py-3.5 relative ${
              activeTab === 'design' ? 'text-[#F4F4F7] font-semibold' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
            }`}
          >
            Design System Extraído
            {activeTab === 'design' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4128FB] via-[#454DFC] to-[#85A9FA] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`py-3.5 relative flex items-center gap-1.5 ${
              activeTab === 'photos' ? 'text-[#F4F4F7] font-semibold' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
            }`}
          >
            Galeria de Fotos
            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#171923] rounded-full text-[#85A9FA]">
              {leadData?.fotosLinks?.length || 0}
            </span>
            {activeTab === 'photos' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4128FB] via-[#454DFC] to-[#85A9FA] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`py-3.5 relative ${
              activeTab === 'files' ? 'text-[#F4F4F7] font-semibold' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
            }`}
          >
            Arquivos em Disco (dadosEmpresa.json)
            {activeTab === 'files' && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#4128FB] via-[#454DFC] to-[#85A9FA] rounded-full" />
            )}
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-7 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <svg className="w-8 h-8 text-[#85A9FA] animate-spin mx-auto" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <p className="text-xs font-mono text-[#A3A6B5]">Carregando dossiê do lead...</p>
            </div>
          ) : !dados ? (
            <div className="py-20 text-center text-[#A3A6B5] text-sm font-sans">
              Não foi possível ler dadosEmpresa.json para este lead.
            </div>
          ) : (
            <>
              {/* TAB 1: Overview & Score */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Score Breakdown Bar */}
                  <div className="bg-[#171923] border border-[#292B38] rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A6B5]">
                          Pontuação de Lead (Score Comercial)
                        </span>
                        <div className="flex items-baseline gap-3 mt-1.5">
                          <span className="text-4xl font-extrabold font-heading text-[#F4F4F7] tabular-nums">
                            {leadScore?.score ?? 0}
                          </span>
                          <span className="text-xs font-mono text-[#A3A6B5]">/ 100 pontos</span>
                          <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                            leadScore?.classe === 'A' ? 'bg-[#4128FB]/20 text-[#85A9FA] border border-[#454DFC]/40' : 'bg-[#1F2230] text-[#A3A6B5]'
                          }`}>
                            Classe {leadScore?.classe}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-[#A3A6B5]">Oportunidade Principal:</span>
                        <p className="text-sm font-bold text-[#85A9FA]">
                          {site?.oportunidade === 'criar_site' ? 'Sem Site no Maps (Criar Novo Site)' :
                           site?.oportunidade === 'redesign' ? 'Site Legado/Fraco (Vender Redesign)' :
                           'Otimização de Performance'}
                        </p>
                      </div>
                    </div>

                    {/* Breakdown bars */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-3 border-t border-[#292B38]">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-sans">
                          <span className="text-[#A3A6B5]">Oportunidade (Site)</span>
                          <span className="text-[#F4F4F7] font-mono">{leadScore?.detalhes?.oportunidade ?? 0}/50</span>
                        </div>
                        <div className="h-2 bg-[#101118] rounded-full overflow-hidden border border-[#292B38]">
                          <div className="h-full bg-gradient-to-r from-[#4128FB] to-[#454DFC]" style={{ width: `${((leadScore?.detalhes?.oportunidade ?? 0) / 50) * 100}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-sans">
                          <span className="text-[#A3A6B5]">Reputação Google</span>
                          <span className="text-[#F4F4F7] font-mono">{leadScore?.detalhes?.reputacao ?? 0}/15</span>
                        </div>
                        <div className="h-2 bg-[#101118] rounded-full overflow-hidden border border-[#292B38]">
                          <div className="h-full bg-emerald-400" style={{ width: `${((leadScore?.detalhes?.reputacao ?? 0) / 15) * 100}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-sans">
                          <span className="text-[#A3A6B5]">Volume Avaliações</span>
                          <span className="text-[#F4F4F7] font-mono">{leadScore?.detalhes?.volume ?? 0}/20</span>
                        </div>
                        <div className="h-2 bg-[#101118] rounded-full overflow-hidden border border-[#292B38]">
                          <div className="h-full bg-[#85A9FA]" style={{ width: `${((leadScore?.detalhes?.volume ?? 0) / 20) * 100}%` }} />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-sans">
                          <span className="text-[#A3A6B5]">Canais de Contato</span>
                          <span className="text-[#F4F4F7] font-mono">{leadScore?.detalhes?.contato ?? 0}/15</span>
                        </div>
                        <div className="h-2 bg-[#101118] rounded-full overflow-hidden border border-[#292B38]">
                          <div className="h-full bg-[#9070F7]" style={{ width: `${((leadScore?.detalhes?.contato ?? 0) / 15) * 100}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Motives list */}
                    {leadScore?.motivos && leadScore.motivos.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="text-[#A3A6B5]">Fatores:</span>
                        {leadScore.motivos.map((m: string, idx: number) => (
                          <span key={idx} className="text-[#F4F4F7] font-sans text-[11px] bg-[#101118] px-2.5 py-1 rounded-lg border border-[#292B38]">
                            ✓ {m}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Contact & Location Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-[#171923] border border-[#292B38] rounded-2xl p-5 space-y-3.5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F7]">
                        Dados de Contato
                      </h4>
                      <div className="space-y-2.5 text-xs font-sans">
                        <div className="flex items-center justify-between">
                          <span className="text-[#A3A6B5]">Telefone:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[#F4F4F7] font-semibold">{dados.contact?.telefone || 'Não informado'}</span>
                            {whatsappUrl && (
                              <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 rounded-full transition-colors inline-flex items-center gap-1"
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start justify-between">
                          <span className="text-[#A3A6B5] shrink-0">Endereço:</span>
                          <span className="text-right text-[#F4F4F7]">{dados.contact?.endereco || 'Não informado'}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-[#A3A6B5]">Google Maps:</span>
                          <a
                            href={dados.contact?.maps_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#85A9FA] hover:underline flex items-center gap-1 font-semibold"
                          >
                            Ver no Maps
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                              <polyline points="15 3 21 3 21 9"></polyline>
                              <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Opening Hours */}
                    <div className="bg-[#171923] border border-[#292B38] rounded-2xl p-5 space-y-3.5">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F7]">
                        Horários de Funcionamento
                      </h4>
                      {dados.contact?.horarios && dados.contact.horarios.length > 0 ? (
                        <div className="space-y-1.5 font-sans text-xs text-[#F4F4F7] max-h-36 overflow-y-auto pr-1">
                          {dados.contact.horarios.map((h: string, idx: number) => (
                            <div key={idx} className="flex justify-between py-0.5 border-b border-[#292B38]/60">
                              <span>{h.split(':')[0]}</span>
                              <span className="text-[#A3A6B5]">{h.split(':').slice(1).join(':')}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-[#A3A6B5] italic">Horários não declarados na ficha.</p>
                      )}
                    </div>
                  </div>

                  {/* Outreach Status Pipeline */}
                  <div className="bg-[#171923] border border-[#292B38] rounded-2xl p-5 space-y-3.5">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-[#F4F4F7]">
                      Funil Comercial & Gestão de Prospecção
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div>
                        <label className="block text-[11px] text-[#A3A6B5] mb-1.5">Status do Lead:</label>
                        <select
                          value={outreachStatus}
                          onChange={e => setOutreachStatus(e.target.value as OutreachStatus)}
                          className="w-full bg-[#101118] border border-[#292B38] text-[#F4F4F7] rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-[#85A9FA]"
                        >
                          <option value="novo">Novo Lead (Aguardando)</option>
                          <option value="contatado">Contatado via WhatsApp/Telefone</option>
                          <option value="em_negociacao">Em Negociação / Proposta Enviada</option>
                          <option value="fechado">Fechado (Cliente Ganho)</option>
                          <option value="descartado">Descartado</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[11px] text-[#A3A6B5] mb-1.5">Anotações do SDR / Operador:</label>
                        <div className="flex items-center gap-2.5">
                          <input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Ex: Falei com o proprietário no WhatsApp, pediu proposta de site..."
                            className="flex-1 bg-[#101118] border border-[#292B38] text-[#F4F4F7] rounded-xl px-3.5 py-2 text-xs outline-none focus:border-[#85A9FA]"
                          />
                          <button
                            type="button"
                            onClick={handleSaveOutreach}
                            disabled={savingStatus}
                            className="btn-forgeon-primary h-9 px-5 text-xs uppercase cursor-pointer"
                          >
                            {savingStatus ? 'Salvando...' : 'Salvar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Site Audit */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <div className="bg-[#171923] border border-[#292B38] rounded-2xl p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#A3A6B5]">
                          Presença Web
                        </span>
                        <h3 className="text-lg font-heading font-bold text-[#F4F4F7] mt-1">
                          {site?.tipo === 'site_proprio' ? 'Possui Website Próprio' :
                           site?.tipo === 'rede_social' ? 'Apenas Link de Rede Social / Agregador' :
                           'Sem Site no Cadastro do Maps'}
                        </h3>
                        <p className="text-xs text-[#A3A6B5] font-mono mt-0.5">
                          URL: {site?.url || 'Nenhuma'}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-[#A3A6B5]">Score de Qualidade Web:</span>
                        <p className="text-3xl font-heading font-bold text-[#85A9FA] tabular-nums">
                          {site?.score_qualidade ?? (site?.tem_site_proprio ? 'N/A' : '0')} / 100
                        </p>
                      </div>
                    </div>

                    {/* Diagnostic Matrix */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-2 border-t border-[#292B38]">
                      <div className="bg-[#101118] p-3.5 rounded-xl border border-[#292B38]">
                        <span className="text-[11px] text-[#A3A6B5]">Protocolo HTTPS</span>
                        <p className="text-sm font-semibold font-mono mt-1 text-[#F4F4F7]">
                          {site?.https ? '✓ Seguro (HTTPS)' : '✗ Inseguro (HTTP)'}
                        </p>
                      </div>

                      <div className="bg-[#101118] p-3.5 rounded-xl border border-[#292B38]">
                        <span className="text-[11px] text-[#A3A6B5]">Meta Viewport Mobile</span>
                        <p className="text-sm font-semibold font-mono mt-1 text-[#F4F4F7]">
                          {site?.viewport_meta ? '✓ Adaptado' : '✗ Ausente (Quebra)'}
                        </p>
                      </div>

                      <div className="bg-[#101118] p-3.5 rounded-xl border border-[#292B38]">
                        <span className="text-[11px] text-[#A3A6B5]">Tempo de Carga</span>
                        <p className="text-sm font-semibold font-mono mt-1 text-[#F4F4F7]">
                          {site?.tempo_carga_s ? `${site.tempo_carga_s} s` : 'N/D'}
                        </p>
                      </div>

                      <div className="bg-[#101118] p-3.5 rounded-xl border border-[#292B38]">
                        <span className="text-[11px] text-[#A3A6B5]">Ano Copyright</span>
                        <p className="text-sm font-semibold font-mono mt-1 text-[#F4F4F7]">
                          {site?.ano_copyright || 'Não detectado'}
                        </p>
                      </div>
                    </div>

                    {/* Detected Tech */}
                    <div className="pt-2">
                      <span className="text-xs font-semibold text-[#F4F4F7]">Tecnologias Identificadas:</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {site?.tecnologia && site.tecnologia.length > 0 ? (
                          site.tecnologia.map((t: string, i: number) => (
                            <span key={i} className="px-2.5 py-1 text-xs font-mono bg-[#101118] border border-[#292B38] rounded-lg text-[#F4F4F7]">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[#A3A6B5] italic">Nenhum CMS ou framework identificado.</span>
                        )}
                      </div>
                    </div>

                    {/* Problems List */}
                    {site?.problemas && site.problemas.length > 0 && (
                      <div className="p-4 bg-rose-950/20 border border-rose-900/40 rounded-xl space-y-1.5">
                        <span className="text-xs font-semibold text-rose-300">Problemas Detectados para Abordagem:</span>
                        <ul className="list-disc list-inside text-xs text-rose-200 space-y-0.5">
                          {site.problemas.map((prob: string, i: number) => (
                            <li key={i}>{prob}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Extracted Design System */}
              {activeTab === 'design' && (
                <div className="space-y-4">
                  <div className="bg-[#171923] border border-[#292B38] rounded-2xl p-6 space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-heading font-bold text-[#F4F4F7]">Tokens do Design System Extraído</h3>
                        <p className="text-xs text-[#A3A6B5] mt-1">
                          Extraídos do site do cliente para criar pitch com redesign instantâneo
                        </p>
                      </div>
                      <span className="text-xs font-mono text-[#85A9FA] bg-[#101118] px-3 py-1 rounded-full border border-[#292B38]">
                        site/tokens.json
                      </span>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      <div className="p-4 bg-[#101118] rounded-xl border border-[#292B38] space-y-2">
                        <span className="text-[11px] text-[#A3A6B5]">Cor de Acento (Primária):</span>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-full border border-white/20 shadow-inner"
                            style={{ backgroundColor: design?.accent || '#454DFC' }}
                          />
                          <span className="font-mono text-xs font-bold text-[#F4F4F7]">
                            {design?.accent || '#454DFC'}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-[#101118] rounded-xl border border-[#292B38] space-y-2">
                        <span className="text-[11px] text-[#A3A6B5]">Modo de Exibição:</span>
                        <p className="text-sm font-semibold font-mono text-[#F4F4F7] uppercase">
                          {design?.mode || 'dark'}
                        </p>
                      </div>

                      <div className="p-4 bg-[#101118] rounded-xl border border-[#292B38] space-y-2">
                        <span className="text-[11px] text-[#A3A6B5]">Sistema de Raios:</span>
                        <p className="text-sm font-semibold font-mono text-[#F4F4F7]">
                          {design?.radius_system || 'pill (999px)'}
                        </p>
                      </div>
                    </div>

                    {/* Fonts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                      <div className="p-4 bg-[#101118] rounded-xl border border-[#292B38]">
                        <span className="text-[11px] text-[#A3A6B5]">Fonte dos Títulos:</span>
                        <p className="text-sm font-bold text-[#F4F4F7] mt-1 font-heading">
                          {design?.heading_font || 'Montserrat'}
                        </p>
                      </div>

                      <div className="p-4 bg-[#101118] rounded-xl border border-[#292B38]">
                        <span className="text-[11px] text-[#A3A6B5]">Fonte do Corpo de Texto:</span>
                        <p className="text-sm font-medium text-[#F4F4F7] mt-1 font-sans">
                          {design?.body_font || 'Space Grotesk'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Photos */}
              {activeTab === 'photos' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#A3A6B5]">
                      {leadData.fotosLinks?.length || 0} fotos catalogadas em fotos/fotos.json
                    </span>
                  </div>

                  {leadData.fotosLinks && leadData.fotosLinks.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3.5">
                      {leadData.fotosLinks.map((url: string, idx: number) => (
                        <div
                          key={idx}
                          className="bg-[#171923] border border-[#292B38] rounded-2xl overflow-hidden group relative aspect-[4/3]"
                        >
                          <img
                            src={url}
                            alt={`Foto ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                            <a
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#85A9FA] hover:underline truncate"
                            >
                              Ver em alta resolução ↗
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 text-[#A3A6B5] text-xs font-sans">
                      Nenhuma foto coletada para esta empresa.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: Files and Raw JSON */}
              {activeTab === 'files' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-[#F4F4F7]">
                        Estrutura Gravada em Disco ({leadData.arquivos?.length || 0} arquivos)
                      </h4>
                      <p className="text-[11px] font-mono text-[#A3A6B5]">
                        📁 {caminhoAbsoluto}
                      </p>
                    </div>

                    <button
                      onClick={copyJson}
                      className="btn-forgeon-secondary h-8 px-3 text-xs cursor-pointer"
                    >
                      {copySuccess ? 'Copiado!' : 'Copiar dadosEmpresa.json'}
                    </button>
                  </div>

                  <div className="bg-[#08090D] border border-[#292B38] rounded-xl p-4 font-mono text-xs text-[#F4F4F7] max-h-96 overflow-y-auto">
                    <pre>{JSON.stringify(dados, null, 2)}</pre>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
