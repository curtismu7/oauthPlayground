import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    // Fallback self-signed cert if no local trusted certs are present
    basicSsl(),
    {
      name: 'request-logger',
      configureServer(server) {
        const logDir = path.resolve(process.cwd(), 'logs');
        const logFile = path.join(logDir, 'server.log');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

        const append = (line: string) => {
          const ts = new Date().toISOString();
          fs.appendFile(logFile, `[${ts}] ${line}\n`, () => {});
        };

        // Custom client log endpoint: POST /__log { message }
        server.middlewares.use('/__log', (req, res, next) => {
          if (req.method !== 'POST') return next();
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const json = JSON.parse(body || '{}');
              const msg = typeof json.message === 'string' ? json.message : JSON.stringify(json);
              append(`CLIENT ${req.method} ${req.url} :: ${msg}`);
              res.statusCode = 204;
              res.end();
            } catch (e) {
              res.statusCode = 400;
              res.end('Bad Request');
            }
          });
        });

        // General request logger
        server.middlewares.use((req, res, next) => {
          const start = Date.now();
          const { method, url } = req;
          res.on('finish', () => {
            const duration = Date.now() - start;
            append(`${method} ${url} -> ${res.statusCode} (${duration}ms)`);
          });
          next();
        });
      },
    },
  ],
  server: {
    port: 3000,
    open: true,
    https: (() => {
      // Try to use mkcert-generated local CA certs if present
      const certDir = path.resolve(process.cwd(), 'certs');
      const keyPath = path.join(certDir, 'localhost-key.pem');
      const certPath = path.join(certDir, 'localhost-cert.pem');
      try {
        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
          return {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          } as any;
        }
      } catch {}
      // Fall back to self-signed mode
      return true;
    })(),
    hmr: { protocol: 'wss' },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  define: {
    'process.env': {},
  },
});
