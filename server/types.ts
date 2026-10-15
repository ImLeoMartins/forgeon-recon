export type LeadClass = 'A' | 'B' | 'C';
export type OpportunityType = 'criar_site' | 'redesign' | 'melhoria' | 'baixa_prioridade';
export type JobStatus = 'idle' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface LeadScoreDetails {
  oportunidade: number;
  reputacao: number;
  volume: number;
  contato: number;
}

export interface LeadScore {
  score: number;
  classe: LeadClass;
  detalhes: LeadScoreDetails;
  motivos: string[];
}

export interface DesignTokens {
  accent: string | null;
  neutral_base: string[];
  mode: 'dark' | 'light' | 'both';
  heading_font: string | null;
  body_font: string | null;
  scale?: string | null;
  radius_system?: string;
  radius_notes?: string;
  cores?: string[];
  fontes?: string[];
}

export interface SiteAuditInfo {
  tem_site_proprio: boolean;
  url: string | null;
  tipo: 'site_proprio' | 'rede_social' | 'sem_site';
  status: 'no_ar' | 'fora_do_ar' | 'erro_http' | null;
  status_http: number | null;
  https: boolean | null;
  viewport_meta: boolean | null;
  mobile_ok: boolean | null;
  tempo_carga_s: number | null;
  tecnologia: string[];
  ano_copyright: number | null;
  titulo: string | null;
  descricao: string | null;
  emails: string[];
  redes_sociais: Record<string, string>;
  whatsapp_no_site: boolean;
  json_ld: Record<string, any>;
  pagespeed: {
    performance_mobile: number;
    fcp: string;
    lcp: string;
  } | null;
  score_qualidade: number | null;
  qualidade: 'boa' | 'media' | 'ruim' | null;
  problemas: string[];
  oportunidade: OpportunityType | null;
  motivo: string | null;
}

export interface DadosEmpresa {
  meta: {
    project_name: string;
    generated_at: string;
    language: string;
    country: string;
    category: string;
    niche?: string;
    vibe?: string | null;
  };
  contact: {
    nome: string;
    telefone: string | null;
    endereco: string | null;
    nota_google: string | null;
    total_avaliacoes: string | null;
    horarios: string[] | null;
    maps_url: string;
    tripadvisor?: string | null;
  };
  site: SiteAuditInfo | null;
  lead: LeadScore | null;
  design_system?: DesignTokens | null;
  sections?: any[];
  hero_rules?: any;
  copy_guidelines?: any;
  responsive_notes?: string;
  anti_cliche_checklist?: Record<string, boolean>;
  handoff_to_build?: {
    ready: boolean;
    notes_for_build_skill: string;
  };
  outreach_status?: 'novo' | 'contatado' | 'em_negociacao' | 'fechado' | 'descartado';
  notes?: string;
}

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
  outreach_status: 'novo' | 'contatado' | 'em_negociacao' | 'fechado' | 'descartado';
}

export interface ScrapeConfig {
  query: string;
  max_leads: number;
  max_fotos: number;
  pasta_saida: string;
  baixar: boolean;
  pular_site: boolean;
  pagespeed: boolean;
  organizar_hierarquia: boolean;
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
  config: ScrapeConfig;
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
