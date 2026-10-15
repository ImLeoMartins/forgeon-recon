export type LeadClass = 'A' | 'B' | 'C';
export type OpportunityType = 'criar_site' | 'redesign' | 'melhoria' | 'baixa_prioridade';
export type JobStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';
export type OutreachStatus = 'novo' | 'contatado' | 'em_negociacao' | 'fechado' | 'descartado';

export interface LeadSummary {
  id: string;
  nome: string;
  pais: string;
  categoria: string;
  caminho_relativo: string;
  caminho_absoluto: string;
  score: number;
  classe: LeadClass;
  oportunidade: OpportunityType;
  tem_site: boolean;
  site_url: string | null;
  telefone: string | null;
  nota: string | null;
  avaliacoes: string | null;
  qtd_fotos: number;
  atualizado_em: string;
  outreach_status: OutreachStatus;
}

export interface HierarchyCategory {
  categoria: string;
  count: number;
  leads: LeadSummary[];
}

export interface HierarchyCountry {
  pais: string;
  total: number;
  categorias: HierarchyCategory[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  text: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
  stage?: string;
}

export interface ScrapeJob {
  id: string;
  config: {
    query: string;
    max_leads: number;
    max_fotos: number;
    pasta_saida: string;
    baixar: boolean;
    pular_site: boolean;
    pagespeed: boolean;
    organizar_hierarquia: boolean;
  };
  status: JobStatus;
  progress: number;
  stage: string;
  currentLead: string | null;
  leadsEncontrados: number;
  leadsProcessados: number;
  iniciadoEm: string;
  finalizadoEm?: string;
  erro?: string;
  logs: LogEntry[];
  leads: LeadSummary[];
  engineUsed: 'python_playwright' | 'forgeon_core_engine';
}
