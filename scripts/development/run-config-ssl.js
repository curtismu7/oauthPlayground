#!/usr/bin/env node
/**
 * Run-config SSL: load or prompt for custom domain, generate cert, persist in SQLite.
 * Outputs FRONTEND_HOST, BACKEND_HOST, SSL_CERT_PATH, SSL_KEY_PATH for run.sh to eval.
 * All messages go to stderr; only var=value lines go to stdout.
 */

import { createInterface } from 'node:readline';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const configDir = path.join(projectRoot, 'config');
const certDir = path.join(projectRoot, 'certs');
const dbPath = path.join(configDir, 'run-config.db');

const DEFAULT_DOMAIN = 'api.pingdemo.com';
const PROMPT_FLAG = '--prompt';

function log(...args) {
	console.error(...args);
}

function out(line) {
	process.stdout.write(line + '\n');
}

/** Sanitize domain for use in file paths (no spaces, safe chars). */
function sanitizeDomain(domain) {
	return (domain || '').replace(/[^a-zA-Z0-9.-]/g, '_').replace(/^_+|_+$/g, '') || 'custom';
}

/** Generate self-signed cert for domain; returns { certPath, keyPath }. */
function generateCert(domain) {
	if (!fs.existsSync(certDir)) {
		fs.mkdirSync(certDir, { recursive: true });
	}
	const base = sanitizeDomain(domain);
	const keyPath = path.join(certDir, `${base}.key`);
	const certPath = path.join(certDir, `${base}.crt`);
	const subj = `/C=US/ST=State/L=City/O=OAuth Playground/CN=${domain}`;
	try {
		execSync(
			`openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "${subj}"`,
			{ stdio: ['inherit', 'inherit', 'ignore'], cwd: projectRoot }
		);
		return { certPath, keyPath };
	} catch (err) {
		log('Failed to generate certificate:', err.message);
		throw err;
	}
}

/** Prompt for domain (default api.pingdemo.com). */
function promptDomain() {
	return new Promise((resolve) => {
		const rl = createInterface({ input: process.stdin, output: process.stderr });
		rl.question(`Custom domain [${DEFAULT_DOMAIN}]: `, (answer) => {
			rl.close();
			const domain = (answer || '').trim() || DEFAULT_DOMAIN;
			resolve(domain);
		});
	});
}

function main() {
	const forcePrompt = process.argv.includes(PROMPT_FLAG);
	ensureConfigDir();

	// Use dynamic import for sqlite3 (CommonJS)
	import('sqlite3').then((mod) => {
		const sqlite3 = mod.default || mod;
		const db = new sqlite3.Database(dbPath, (err) => {
			if (err) {
				log('SQLite open error:', err.message);
				// Fallback: use default domain and generate cert
				ensureConfigDir();
				runWithDomain(DEFAULT_DOMAIN);
				return;
			}

			db.run(
				`CREATE TABLE IF NOT EXISTS run_ssl_config (
					id INTEGER PRIMARY KEY CHECK (id = 1),
					domain TEXT NOT NULL,
					cert_path TEXT,
					key_path TEXT,
					updated_at TEXT
				)`,
				(err) => {
					if (err) {
						log('SQLite create table error:', err.message);
						runWithDomain(DEFAULT_DOMAIN);
						db.close();
						return;
					}

					db.get('SELECT domain, cert_path, key_path FROM run_ssl_config WHERE id = 1', (err, row) => {
						if (err) {
							log('SQLite read error:', err.message);
							runWithDomain(DEFAULT_DOMAIN);
							db.close();
							return;
						}

						if (forcePrompt || !row || !row.domain) {
							promptDomain().then((domain) => {
								runWithDomain(domain, db);
							});
							return;
						}

						const certPath = row.cert_path;
						const keyPath = row.key_path;
						const certExists = certPath && fs.existsSync(certPath);
						const keyExists = keyPath && fs.existsSync(keyPath);

						if (certExists && keyExists) {
							emitVars(row.domain, certPath, keyPath);
							db.close();
							return;
						}

						log('Saved cert paths missing or invalid; regenerating for', row.domain);
						runWithDomain(row.domain, db);
					});
				}
			);
		});
		}).catch((err) => {
		log('sqlite3 not available:', err.message);
		log('Using default domain and certs in project certs/');
		ensureConfigDir();
		runWithDomain(DEFAULT_DOMAIN, null);
	});
}

function ensureConfigDir() {
	if (!fs.existsSync(configDir)) {
		fs.mkdirSync(configDir, { recursive: true });
	}
}

function emitVars(domain, certPath, keyPath) {
	const q = (s) => (s == null || s === '' ? '' : `"${String(s).replace(/"/g, '\\"')}"`);
	out(`FRONTEND_HOST=${q(domain)}`);
	out(`BACKEND_HOST=${q(domain)}`);
	out(`SSL_CERT_PATH=${q(certPath)}`);
	out(`SSL_KEY_PATH=${q(keyPath)}`);
}

function runWithDomain(domain, db) {
	ensureConfigDir();
	doRun(domain, db || null);
}

function doRun(domain, db) {
	try {
		log('Generating certificate for domain:', domain);
		const { certPath, keyPath } = generateCert(domain);
		log('Certificate generated:', certPath, keyPath);

		const updatedAt = new Date().toISOString();
		if (db) {
			db.run(
				`INSERT INTO run_ssl_config (id, domain, cert_path, key_path, updated_at) VALUES (1, ?, ?, ?, ?)
				 ON CONFLICT(id) DO UPDATE SET domain = ?, cert_path = ?, key_path = ?, updated_at = ?`,
				[domain, certPath, keyPath, updatedAt, domain, certPath, keyPath, updatedAt],
				(err) => {
					if (err) log('SQLite write error:', err.message);
					emitVars(domain, certPath, keyPath);
					if (db) db.close();
				}
			);
		} else {
			emitVars(domain, certPath, keyPath);
		}
	} catch (err) {
		log('Error:', err.message);
		emitVars(DEFAULT_DOMAIN, null, null);
		if (db) db.close();
	}
}

main();
