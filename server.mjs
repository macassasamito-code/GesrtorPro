import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, 'dist');
const port = Number(process.env.PORT) || 3000;

const app = express();

app.disable('x-powered-by');

// Garantir que Service Worker, manifest e HTML nunca ficam presos em cache antiga
app.use((req, res, next) => {
  if (
    req.path === '/' ||
    req.path === '/index.html' ||
    req.path === '/sw.js' ||
    req.path === '/registerSW.js' ||
    req.path.endsWith('.webmanifest')
  ) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});

app.use(
  express.static(distDir, {
    maxAge: '1y',
    immutable: true,
    setHeaders: (res, filePath) => {
      if (
        filePath.endsWith('.html') ||
        filePath.endsWith('sw.js') ||
        filePath.endsWith('registerSW.js') ||
        filePath.endsWith('.webmanifest')
      ) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    },
  })
);

// Fallback SPA para todas as rotas
app.get('*', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(path.join(distDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`GestorPro em execução na porta ${port}`);
});
