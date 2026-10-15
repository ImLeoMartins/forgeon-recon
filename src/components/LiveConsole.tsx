import React, { useState, useEffect, useRef } from 'react';
import { ScrapeJob } from '../types';

interface LiveConsoleProps {
  job: ScrapeJob | null;
  onCancelJob: (jobId: string) => void;
  onOpenNewScrape: () => void;
  onViewLeadDetails: (caminho: string) => void;
}

export const LiveConsole: React.FC<LiveConsoleProps> = ({
  job,
  onCancelJob,
  onOpenNewScrape,
  onViewLeadDetails,
}) => {
  const [autoscroll, setAutoscroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warn' | 'error'>('all');
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoscroll && logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [job?.logs, autoscroll]);

  if (!job) {
    return (
      <div className="bg-[#101118] border border-[#292B38] rounded-2xl p-10 text-center space-y-4 max-w-xl mx-auto my-12">
        <div className="w-14 h-14 rounded-full bg-[#171923] border border-[#292B38] mx-auto flex items-center justify-center text-[#85A9FA]">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-heading font-bold text-[#F4F4F7]">Nenhuma Varredura em Execução</h3>
          <p className="text-sm text-[#A3A6B5] mt-1.5 max-w-sm mx-auto">
            Dispare um reconhecimento no Google Maps para acompanhar o fluxo de extração, auditoria de sites e divisão automática de pastas.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={onOpenNewScrape}
            className="btn-forgeon-primary h-10 px-6 text-xs uppercase cursor-pointer"
          >
            Iniciar Nova Varredura
          </button>
        </div>
      </div>
    );
  }

  const isRunning = job.status === 'running';
  const isCompleted = job.status === 'completed';
  const isFailed = job.status === 'failed';

  const filteredLogs = (job.logs || []).filter(l => {
    if (filterLevel === 'all') return true;
    return l.level === filterLevel;
  });

  const copyAllLogs = () => {
    const text = job.logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.text}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-5">
      {/* Top Banner Status & Progress */}
      <div className="bg-[#101118] border border-[#292B38] rounded-2xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 text-xs font-sans">
              <span className="font-mono text-[#A3A6B5]">ID: {job.id}</span>
              <span className="text-[#6C6F82]">·</span>
              <span
                className={`font-semibold ${
                  isRunning
                    ? 'text-[#85A9FA]'
                    : isCompleted
                    ? 'text-emerald-400'
                    : isFailed
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {isRunning ? 'VARREDURA EM ANDAMENTO' : job.status.toUpperCase()}
              </span>
              <span className="text-[#6C6F82]">·</span>
              <span className="text-[#A3A6B5]">
                Motor: {job.engineUsed === 'python_playwright' ? 'Python Playwright' : 'Forgeon Core Engine'}
              </span>
            </div>

            <h2 className="text-xl font-heading font-bold text-[#F4F4F7] mt-1.5">
              {job.config.query}
            </h2>

            <div className="flex items-center gap-2 text-xs text-[#A3A6B5] mt-1 font-sans">
              <span>Destino: /{job.config.pasta_saida}</span>
              <span>·</span>
              <span>Meta: {job.config.max_leads} empresas</span>
              <span>·</span>
              <span>Iniciado: {new Date(job.iniciadoEm).toLocaleTimeString('pt-BR')}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {isRunning && (
              <button
                onClick={() => onCancelJob(job.id)}
                className="btn-forgeon-secondary h-9 px-4 text-xs text-rose-300 border-rose-900/60 hover:bg-rose-950/40 cursor-pointer"
              >
                Interromper
              </button>
            )}
            <button
              onClick={onOpenNewScrape}
              className="btn-forgeon-primary h-9 px-5 text-xs uppercase cursor-pointer"
            >
              Nova Varredura
            </button>
          </div>
        </div>

        {/* Progress Bar & Stage Tracker */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-sans">
            <span className="text-[#F4F4F7] font-medium flex items-center gap-2">
              {isRunning && <span className="w-2 h-2 rounded-full bg-[#454DFC] animate-ping" />}
              <span>{job.stage || 'Processando...'}</span>
              {job.currentLead && (
                <span className="text-[#85A9FA] font-mono">» {job.currentLead}</span>
              )}
            </span>
            <span className="font-mono font-bold text-[#85A9FA]">{job.progress}%</span>
          </div>

          <div className="w-full h-2.5 bg-[#171923] rounded-full overflow-hidden border border-[#292B38]">
            <div
              className={`h-full transition-all duration-300 ${
                isCompleted
                  ? 'bg-emerald-500'
                  : isFailed
                  ? 'bg-rose-500'
                  : 'bg-gradient-to-r from-[#4128FB] via-[#454DFC] to-[#85A9FA]'
              }`}
              style={{ width: `${job.progress}%` }}
            />
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-[#292B38]">
          <div className="bg-[#171923] p-3 rounded-xl border border-[#292B38]">
            <span className="text-[11px] text-[#A3A6B5]">Leads no Radar</span>
            <p className="text-xl font-bold font-heading text-[#F4F4F7] mt-1">{job.leadsEncontrados}</p>
          </div>
          <div className="bg-[#171923] p-3 rounded-xl border border-[#292B38]">
            <span className="text-[11px] text-[#A3A6B5]">Salvos em Disco</span>
            <p className="text-xl font-bold font-heading text-[#85A9FA] mt-1">{job.leadsProcessados}</p>
          </div>
          <div className="bg-[#171923] p-3 rounded-xl border border-[#292B38]">
            <span className="text-[11px] text-[#A3A6B5]">Divisão Hierárquica</span>
            <p className="text-sm font-semibold text-[#F4F4F7] mt-1 truncate">
              País / Categoria
            </p>
          </div>
          <div className="bg-[#171923] p-3 rounded-xl border border-[#292B38]">
            <span className="text-[11px] text-[#A3A6B5]">Linhas de Telemetria</span>
            <p className="text-xl font-bold font-heading text-[#F4F4F7] mt-1">{job.logs.length}</p>
          </div>
        </div>
      </div>

      {/* Terminal Logs & Newly Scraped Leads Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Real-time Terminal Log Viewer (2 cols) */}
        <div className="lg:col-span-2 bg-[#101118] border border-[#292B38] rounded-2xl overflow-hidden flex flex-col h-[520px]">
          {/* Terminal Title Bar */}
          <div className="bg-[#171923] px-4 py-3 border-b border-[#292B38] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono font-medium text-[#F4F4F7] ml-2">
                forgeon-recon-live.log
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-[#101118] p-0.5 rounded-lg border border-[#292B38] text-[11px] font-sans">
                <button
                  onClick={() => setFilterLevel('all')}
                  className={`px-2.5 py-0.5 rounded-md ${
                    filterLevel === 'all' ? 'bg-[#1F2230] text-[#F4F4F7]' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterLevel('warn')}
                  className={`px-2.5 py-0.5 rounded-md ${
                    filterLevel === 'warn' ? 'bg-[#1F2230] text-amber-300' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
                  }`}
                >
                  Alertas
                </button>
                <button
                  onClick={() => setFilterLevel('error')}
                  className={`px-2.5 py-0.5 rounded-md ${
                    filterLevel === 'error' ? 'bg-[#1F2230] text-rose-300' : 'text-[#A3A6B5] hover:text-[#F4F4F7]'
                  }`}
                >
                  Erros
                </button>
              </div>

              <button
                onClick={() => setAutoscroll(!autoscroll)}
                title="Autoscroll"
                className={`px-2.5 py-1 text-[11px] font-sans rounded-lg border border-[#292B38] transition-colors ${
                  autoscroll ? 'bg-[#4128FB]/20 text-[#85A9FA] border-[#454DFC]/40' : 'text-[#A3A6B5]'
                }`}
              >
                Auto-scroll
              </button>

              <button
                onClick={copyAllLogs}
                title="Copiar Logs"
                className="p-1.5 text-[#A3A6B5] hover:text-[#F4F4F7] rounded-lg hover:bg-[#1F2230] transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
          </div>

          {/* Log Stream Body */}
          <div
            ref={logsContainerRef}
            className="flex-1 p-4 overflow-y-auto font-mono text-[12px] leading-relaxed space-y-1 bg-[#08090D]"
          >
            {filteredLogs.length === 0 ? (
              <div className="text-[#A3A6B5] italic py-8 text-center font-sans">
                Aguardando linhas de saída do motor de scraping...
              </div>
            ) : (
              filteredLogs.map(l => {
                let color = 'text-[#F4F4F7]';
                if (l.level === 'success') color = 'text-emerald-400';
                if (l.level === 'warn') color = 'text-amber-400';
                if (l.level === 'error') color = 'text-rose-400';
                if (l.level === 'debug') color = 'text-[#A3A6B5]';

                return (
                  <div key={l.id} className="flex items-start gap-2.5 hover:bg-[#101118] px-1.5 py-0.5 rounded">
                    <span className="text-[#6C6F82] select-none shrink-0">{l.timestamp}</span>
                    <span
                      className={`shrink-0 text-[10px] uppercase font-bold px-1.5 rounded ${
                        l.level === 'error'
                          ? 'bg-rose-950 text-rose-300'
                          : l.level === 'warn'
                          ? 'bg-amber-950 text-amber-300'
                          : l.level === 'success'
                          ? 'bg-emerald-950 text-emerald-300'
                          : 'text-[#6C6F82]'
                      }`}
                    >
                      {l.level}
                    </span>
                    <span className={`${color} break-all flex-1`}>{l.text}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Real-time Extracted Leads Column */}
        <div className="bg-[#101118] border border-[#292B38] rounded-2xl overflow-hidden flex flex-col h-[520px]">
          <div className="bg-[#171923] px-4 py-3 border-b border-[#292B38] flex items-center justify-between">
            <h3 className="text-xs font-sans font-semibold uppercase tracking-wider text-[#F4F4F7]">
              Leads Desta Sessão ({job.leads?.length || 0})
            </h3>
            <span className="text-[11px] font-sans text-[#A3A6B5]">Salvos em disco</span>
          </div>

          <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
            {!job.leads || job.leads.length === 0 ? (
              <div className="text-center py-12 text-[#A3A6B5] text-xs font-sans">
                {isRunning
                  ? 'Os leads encontrados começarão a surgir aqui durante a execução...'
                  : 'Nenhum lead processado nesta sessão.'}
              </div>
            ) : (
              job.leads.map(lead => (
                <div
                  key={lead.id}
                  onClick={() => onViewLeadDetails(lead.caminho_absoluto)}
                  className="p-3.5 bg-[#171923] hover:bg-[#1F2230] border border-[#292B38] hover:border-[#85A9FA] rounded-xl cursor-pointer transition-all space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-heading font-bold text-[#F4F4F7] group-hover:text-[#85A9FA] transition-colors truncate">
                      {lead.nome}
                    </h4>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        lead.classe === 'A'
                          ? 'bg-[#4128FB]/20 text-[#85A9FA] border border-[#454DFC]/40'
                          : 'bg-[#101118] text-[#A3A6B5]'
                      }`}
                    >
                      {lead.score} pts
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#A3A6B5] font-sans truncate">
                    <span>{lead.pais}</span>
                    <span>/</span>
                    <span className="truncate">{lead.categoria}</span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-[#292B38]">
                    <span className="text-[#A3A6B5]">
                      {lead.tem_site ? 'Possui site próprio' : 'Sem site no Maps'}
                    </span>
                    <span className="text-[#85A9FA] font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Ver Ficha
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
