import express from 'express';
import path from 'path';
import { apiRouter } from './server/api';

const app = express();
const PORT = process.env.PORT || 3000;

// API routes
app.use('/api', apiRouter);

// Static assets
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// SPA Fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[FORGEON RECON] Servidor rodando na porta ${PORT}`);
});
