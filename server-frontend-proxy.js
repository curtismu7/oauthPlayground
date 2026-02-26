#!/usr/bin/env node
/**
 * Option A — Frontend proxy server.
 * Serves the built SPA from dist/ and proxies /api to the backend.
 * Run on port 3000 with backend on 3001 so /api-status and /api/health work.
 *
 * Usage:
 *   npm run build
 *   BACKEND_PORT=3001 node server.js   # start backend on 3001
 *   node server-frontend-proxy.js     # start this on 3000
 *
 * Env:
 *   FRONTEND_PORT — port for this proxy (default 3000)
 *   BACKEND_URL   — backend base URL (default https://localhost:3001)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FRONTEND_PORT = Number(process.env.FRONTEND_PORT) || 3000;
const BACKEND_URL = (process.env.BACKEND_URL || 'https://localhost:3001').replace(/\/$/, '');
const DIST = path.join(__dirname, 'dist');

const app = express();

// Proxy /api to backend
app.use('/api', async (req, res) => {
	const url = `${BACKEND_URL}${req.originalUrl}`;
	const headers = { ...req.headers };
	delete headers.host;
	try {
		const body = req.method !== 'GET' && req.method !== 'HEAD' ? await getRawBody(req) : undefined;
		const opts = { method: req.method, headers };
		if (body !== undefined) opts.body = body;
		const backendRes = await fetch(url, opts);
		res.status(backendRes.status);
		backendRes.headers.forEach((v, k) => res.setHeader(k, v));
		const buf = await backendRes.arrayBuffer();
		res.send(Buffer.from(buf));
	} catch (err) {
		console.error('[Proxy]', err.message);
		res.status(502).json({ error: 'Bad Gateway', message: err.message });
	}
});

function getRawBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		req.on('data', (c) => chunks.push(c));
		req.on('end', () => resolve(Buffer.concat(chunks)));
		req.on('error', reject);
	});
}

// Static SPA
app.use(express.static(DIST));

// SPA fallback
app.get('*', (req, res) => {
	const index = path.join(DIST, 'index.html');
	if (fs.existsSync(index)) {
		res.sendFile(index);
	} else {
		res.status(404).send('Not found. Run npm run build first.');
	}
});

app.listen(FRONTEND_PORT, '0.0.0.0', () => {
	console.log(`Frontend proxy: http://localhost:${FRONTEND_PORT} (serving dist + proxy /api -> ${BACKEND_URL})`);
});
