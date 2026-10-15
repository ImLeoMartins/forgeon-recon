import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { HierarchyExplorer } from './components/HierarchyExplorer';
import { LiveConsole } from './components/LiveConsole';
import { ScrapeModal } from './components/ScrapeModal';
import { LeadDossierModal } from './components/LeadDossierModal';
import { FolderStructureView } from './components/FolderStructureView';
import { BotCodeViewer } from './components/BotCodeViewer';
import { DesignSystemView } from './components/DesignSystemView';
import { LeadSummary, HierarchyCountry, ScrapeJob } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'leads' | 'live' | 'hierarchy' | 'code' | 'design-system'>('leads');
  const [isScrapeModalOpen, setIsScrapeModalOpen] = useState(false);
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);
  const [selectedLeadPath, setSelectedLeadPath] = useState<string | null>(null);

  // Leads & Directory state
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [hierarchy, setHierarchy] = useState<HierarchyCountry[]>([]);
  const [stats, setStats] = useState({
    classA: 0,
    classB: 0,
    classC: 0,
    semSite: 0,
    comSite: 0,
  });
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // Live Scrape Job state
  const [activeJob, setActiveJob] = useState<ScrapeJob | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  // Load leads from backend
  const fetchLeads = useCallback(() => {
    setIsLoadingLeads(true);
    fetch('/api/leads')
      .then(res => res.json())
      .then(data => {
        setLeads(data.leads || []);
        setHierarchy(data.hierarchy || []);
        if (data.stats) setStats(data.stats);
        setIsLoadingLeads(false);
      })
      .catch(err => {
        console.error('Erro ao carregar leads:', err);
        setIsLoadingLeads(false);
      });
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Connect SSE stream for active job
  const connectSSE = useCallback((jobId: string) => {
    if (eventSource) {
      eventSource.close();
    }

    const es = new EventSource(`/api/scrape/stream/${jobId}`);
    setEventSource(es);

    es.onmessage = event => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'initial') {
          setActiveJob(prev => ({
            ...prev,
            ...payload.job,
            logs: payload.logs || [],
          } as ScrapeJob));
        } else if (payload.type === 'status') {
          setActiveJob(prev => {
            if (!prev) return null;
            return {
              ...prev,
              ...payload.job,
            };
          });
          if (payload.job?.status === 'completed') {
            fetchLeads();
          }
        } else if (payload.type === 'log') {
          setActiveJob(prev => {
            if (!prev) return null;
            const newLogs = payload.log ? [...prev.logs, payload.log] : prev.logs;
            return {
              ...prev,
              ...payload.job,
              logs: newLogs,
            };
          });
        }
      } catch (e) {
        console.error('Erro ao processar mensagem SSE:', e);
      }
    };

    es.onerror = () => {
      es.close();
    };
  }, [eventSource, fetchLeads]);

  // Handle starting a new scrape mission
  const handleStartScrape = async (config: {
    query: string;
    max_leads: number;
    max_fotos: number;
    pasta_saida: string;
    baixar: boolean;
    pular_site: boolean;
    pagespeed: boolean;
    organizar_hierarquia: boolean;
  }) => {
    setIsScrapingLoading(true);
    try {
      const res = await fetch('/api/scrape/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (data.job) {
        setActiveJob(data.job);
        setIsScrapeModalOpen(false);
        setCurrentTab('live');
        connectSSE(data.job.id);
      }
    } catch (e) {
      console.error('Falha ao disparar varredura:', e);
    } finally {
      setIsScrapingLoading(false);
    }
  };

  // Handle cancelling active scrape
  const handleCancelScrape = async (jobId: string) => {
    try {
      await fetch(`/api/scrape/cancel/${jobId}`, { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
  };

  // Handle ZIP Export
  const handleExportZip = (subPath?: string) => {
    const url = subPath
      ? `/api/leads/export-zip?path=${encodeURIComponent(subPath)}`
      : '/api/leads/export-zip';
    window.location.href = url;
  };

  // Handle lead deletion
  const handleDeleteLead = async (caminho: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta pasta de lead?')) return;
    try {
      const res = await fetch(`/api/leads?path=${encodeURIComponent(caminho)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchLeads();
        if (selectedLeadPath === caminho) setSelectedLeadPath(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isJobRunning = activeJob?.status === 'running';

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F4F4F7] flex flex-col font-sans relative overflow-x-hidden">
      {/* Forgeon V2 Ambient Radial Lighting Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(60% 45% at 75% 10%, rgba(65, 40, 251, 0.16), transparent 70%), radial-gradient(40% 40% at 88% 30%, rgba(133, 169, 250, 0.10), transparent 70%)',
        }}
      />

      {/* Forgeon V2 Floating Blur Pill Navigation */}
      <Header
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab as any)}
        onOpenNewScrape={() => setIsScrapeModalOpen(true)}
        isJobRunning={isJobRunning}
      />

      {/* Main Workspace Viewport */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-6 z-10 relative">
        {currentTab === 'leads' && (
          <HierarchyExplorer
            leads={leads}
            hierarchy={hierarchy}
            stats={stats}
            isLoading={isLoadingLeads}
            onRefresh={fetchLeads}
            onSelectLead={path => setSelectedLeadPath(path)}
            onExportZip={handleExportZip}
            onDeleteLead={handleDeleteLead}
            onOpenNewScrape={() => setIsScrapeModalOpen(true)}
          />
        )}

        {currentTab === 'live' && (
          <LiveConsole
            job={activeJob}
            onCancelJob={handleCancelScrape}
            onOpenNewScrape={() => setIsScrapeModalOpen(true)}
            onViewLeadDetails={path => setSelectedLeadPath(path)}
          />
        )}

        {currentTab === 'hierarchy' && <FolderStructureView />}

        {currentTab === 'design-system' && <DesignSystemView />}

        {currentTab === 'code' && <BotCodeViewer />}
      </main>

      {/* Scrape Configuration Modal */}
      <ScrapeModal
        isOpen={isScrapeModalOpen}
        onClose={() => setIsScrapeModalOpen(false)}
        onSubmit={handleStartScrape}
        isLoading={isScrapingLoading}
      />

      {/* Single Lead Dossier Modal */}
      <LeadDossierModal
        caminhoAbsoluto={selectedLeadPath}
        onClose={() => setSelectedLeadPath(null)}
        onExportZip={handleExportZip}
        onStatusUpdated={fetchLeads}
        onDeleteLead={handleDeleteLead}
      />

      {/* Forgeon V2 Footer */}
      <footer className="border-t border-[#292B38] bg-[#08090D] py-8 px-6 text-sm text-[#A3A6B5] z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-heading font-extrabold text-[#F4F4F7]">FORGEON</span>
            <span className="text-[#85A9FA] font-mono">//</span>
            <span className="text-xs uppercase tracking-wider font-semibold text-[#85A9FA]">RECON</span>
            <span>·</span>
            <span>Inteligência de Leads & Scraping no Google Maps</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-sans text-[#A3A6B5]">
            <span>Design System V2</span>
            <span>·</span>
            <span>Taxonomia: País / Categoria / Negócio</span>
            <span>·</span>
            <span className="font-mono text-[#F4F4F7]">/leads</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
