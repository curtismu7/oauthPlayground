import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

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
            } catch {
              res.statusCode = 400;
              res.end('Bad Request');
            }
          });
        });

        // Client log ingestion (development only)
        server.middlewares.use('/__client-log', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end('Method Not Allowed');
            return;
          }
          let body = '';
          req.on('data', (chunk) => (body += chunk));
          req.on('end', () => {
            try {
              const payload = JSON.parse(body || '{}');
              const logsDir = path.resolve(process.cwd(), 'logs');
              if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
              const file = path.join(logsDir, 'client.log');
              const line = `${new Date().toISOString()} ${payload.level || 'info'} ${payload.message || ''} ${JSON.stringify(payload.meta || {})}\n`;
              fs.appendFileSync(file, line, { encoding: 'utf8' });
              res.statusCode = 204;
              res.end();
            } catch {
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
      
      // Define the HTTPS server options type
      type HttpsServerOptions = {
        key: Buffer;
        cert: Buffer;
      };
      
      try {
        if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
          const options: HttpsServerOptions = {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          };
          return options;
        }
      } catch (error) {
        console.error('Error reading SSL certificates:', error);
      }
      
      // Fall back to self-signed mode
      return {}; // Vite will generate a self-signed cert when https: {}
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
