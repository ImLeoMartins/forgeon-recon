import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  checkPlaywrightAvailable,
  startScrapeJob,
  getJob,
  getAllJobs,
  cancelJob,
  subscribeToJob,
} from './scraperEngine';
import {
  listarTodosLeads,
  carregarDetalhesLead,
  gerarZipLeads,
  seedInitialLeads,
} from './storage';
import { ScrapeConfig } from './types';

// Seed demo leads so initial view displays full hierarchy immediately
seedInitialLeads();

export const apiRouter = express.Router();
apiRouter.use(express.json());

export const apiApp = express();
apiApp.use(express.json());
apiApp.use(apiRouter);

// 1. Status & Runtime Health
apiRouter.get('/status', async (_req: Request, res: Response) => {
  const playwrightAvailable = await checkPlaywrightAvailable();
  const leads = listarTodosLeads();
  const jobs = getAllJobs();
  const activeJobs = jobs.filter(j => j.status === 'running').length;

  res.json({
    online: true,
    version: '2.4.0',
    brand: 'Forgeon Recon',
    pythonReady: true,
    playwrightAvailable,
    totalLeads: leads.length,
    activeJobs,
  });
});

// 2. Start Scraping Job
apiRouter.post('/scrape/start', async (req: Request, res: Response) => {
  try {
    const {
      query,
      max_leads = 5,
      max_fotos = 10,
      pasta_saida = 'leads',
      baixar = true,
      pular_site = false,
      pagespeed = false,
      organizar_hierarquia = true,
    } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ error: 'Parâmetro "query" é obrigatório (ex: "Bar São Paulo").' });
    }

    const config: ScrapeConfig = {
      query: query.trim(),
      max_leads: Math.min(Math.max(1, Number(max_leads) || 1), 50),
      max_fotos: Math.min(Math.max(1, Number(max_fotos) || 1), 30),
      pasta_saida: (pasta_saida || 'leads').trim(),
      baixar: Boolean(baixar),
      pular_site: Boolean(pular_site),
      pagespeed: Boolean(pagespeed),
      organizar_hierarquia: Boolean(organizar_hierarquia),
    };

    const job = await startScrapeJob(config);
    res.json({ success: true, job });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao iniciar scraping.' });
  }
});

// 3. SSE Stream for Real-time Monitoring & Logs
apiRouter.get('/scrape/stream/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const job = getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job não encontrado.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Send current state and past logs immediately
  const initialPayload = {
    type: 'initial',
    job: {
      id: job.id,
      status: job.status,
      progress: job.progress,
      stage: job.stage,
      currentLead: job.currentLead,
      leadsEncontrados: job.leadsEncontrados,
      leadsProcessados: job.leadsProcessados,
      engineUsed: job.engineUsed,
      erro: job.erro,
    },
    logs: job.logs,
  };
  res.write(`data: ${JSON.stringify(initialPayload)}\n\n`);

  const unsubscribe = subscribeToJob(jobId, data => {
    res.write(data);
  });

  req.on('close', () => {
    unsubscribe();
  });
});

// 4. Jobs List
apiRouter.get('/scrape/jobs', (_req: Request, res: Response) => {
  res.json({ jobs: getAllJobs() });
});

// 5. Cancel Job
apiRouter.post('/scrape/cancel/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const cancelled = cancelJob(jobId);
  res.json({ success: cancelled });
});

// 6. Get All Leads with Hierarchy Taxonomy
apiRouter.get('/leads', (req: Request, res: Response) => {
  const pastaBase = req.query.pasta ? String(req.query.pasta) : undefined;
  const leads = listarTodosLeads(pastaBase);

  // Group by Country and Category
  const hierarchyMap: Record<
    string,
    Record<string, { count: number; leads: typeof leads }>
  > = {};

  let classA = 0;
  let classB = 0;
  let classC = 0;
  let semSite = 0;
  let comSite = 0;

  for (const lead of leads) {
    if (lead.classe === 'A') classA++;
    else if (lead.classe === 'B') classB++;
    else classC++;

    if (lead.tem_site) comSite++;
    else semSite++;

    if (!hierarchyMap[lead.pais]) {
      hierarchyMap[lead.pais] = {};
    }
    if (!hierarchyMap[lead.pais][lead.categoria]) {
      hierarchyMap[lead.pais][lead.categoria] = { count: 0, leads: [] };
    }
    hierarchyMap[lead.pais][lead.categoria].count++;
    hierarchyMap[lead.pais][lead.categoria].leads.push(lead);
  }

  const hierarchy = Object.entries(hierarchyMap).map(([pais, cats]) => ({
    pais,
    total: Object.values(cats).reduce((acc, c) => acc + c.count, 0),
    categorias: Object.entries(cats).map(([categoria, val]) => ({
      categoria,
      count: val.count,
      leads: val.leads,
    })),
  }));

  res.json({
    total: leads.length,
    stats: {
      classA,
      classB,
      classC,
      semSite,
      comSite,
    },
    hierarchy,
    leads,
  });
});

// 7. Get Single Lead Dossier Details
apiRouter.get('/leads/details', (req: Request, res: Response) => {
  const caminho = req.query.path as string;
  if (!caminho) {
    return res.status(400).json({ error: 'Parâmetro "path" é obrigatório.' });
  }

  const resolved = path.isAbsolute(caminho) ? caminho : path.resolve(process.cwd(), caminho);
  const details = carregarDetalhesLead(resolved);

  if (!details.dados && details.arquivos.length === 0) {
    return res.status(404).json({ error: 'Lead não encontrado no caminho informado.' });
  }

  res.json(details);
});

// 8. Update Outreach Status
apiRouter.patch('/leads/status', (req: Request, res: Response) => {
  const { path: caminho, status, notes } = req.body;
  if (!caminho || !status) {
    return res.status(400).json({ error: 'Campos "path" e "status" são obrigatórios.' });
  }

  const resolved = path.isAbsolute(caminho) ? caminho : path.resolve(process.cwd(), caminho);
  const dadosFile = path.join(resolved, 'dadosEmpresa.json');

  if (!fs.existsSync(dadosFile)) {
    return res.status(404).json({ error: 'Arquivo dadosEmpresa.json não encontrado.' });
  }

  try {
    const raw = fs.readFileSync(dadosFile, 'utf-8');
    const dados = JSON.parse(raw);
    dados.outreach_status = status;
    if (notes !== undefined) dados.notes = notes;
    fs.writeFileSync(dadosFile, JSON.stringify(dados, null, 2), 'utf-8');
    res.json({ success: true, outreach_status: status });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 9. Delete Lead
apiRouter.delete('/leads', (req: Request, res: Response) => {
  const caminho = req.query.path as string;
  if (!caminho) {
    return res.status(400).json({ error: 'Parâmetro "path" é obrigatório.' });
  }

  const resolved = path.isAbsolute(caminho) ? caminho : path.resolve(process.cwd(), caminho);
  // Proteção: não permitir deletar a raiz
  if (resolved === process.cwd() || resolved === path.join(process.cwd(), 'leads')) {
    return res.status(403).json({ error: 'Não é permitido remover a pasta raiz.' });
  }

  if (fs.existsSync(resolved)) {
    fs.rmSync(resolved, { recursive: true, force: true });
    return res.json({ success: true });
  }
  res.status(404).json({ error: 'Caminho não encontrado.' });
});

// 10. Export Leads as ZIP (Full archive or subtree)
apiRouter.get('/leads/export-zip', async (req: Request, res: Response) => {
  try {
    const targetPath = req.query.path
      ? path.resolve(process.cwd(), String(req.query.path))
      : path.join(process.cwd(), 'leads');

    const zipBuffer = await gerarZipLeads(targetPath);
    const filename = `forgeon_recon_${path.basename(targetPath)}_${Date.now()}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(zipBuffer);
  } catch (err: any) {
    res.status(500).json({ error: 'Falha ao compactar pasta de leads: ' + err.message });
  }
});

// 11. Read Raw Python Script
apiRouter.get('/leads/python-script', (_req: Request, res: Response) => {
  const pyPath = path.join(process.cwd(), 'recon_maps.py');
  if (fs.existsSync(pyPath)) {
    const content = fs.readFileSync(pyPath, 'utf-8');
    return res.type('text/plain').send(content);
  }
  res.status(404).send('# recon_maps.py não encontrado.');
});
