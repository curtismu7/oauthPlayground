// lib/vault/loader.cjs
//
// Startup loader: unlock secrets.vault with VAULT_PASSWORD and inject allowlisted
// entries into process.env BEFORE the server reads config. CommonJS so it works
// from server.js (ESM) via createRequire. No-op (never blocks startup) when the
// vault file or password is absent — oauthPlayground is a dev playground.

const path = require('node:path');
const fs = require('node:fs');
const { openVault } = require('./index.js');

// Vault lives at repo root: lib/vault/loader.cjs -> ../../secrets.vault
const DEFAULT_VAULT = path.join(__dirname, '..', '..', 'secrets.vault');

// Only inject names matching these prefixes (closed allowlist — never arbitrary).
const ALLOW = /^(PINGONE_|VITE_PINGONE_|OAUTH_|SESSION_SECRET$|CONFIG_)/;

async function loadVaultIntoEnv(opts = {}) {
	const filePath = opts.filePath || process.env.VAULT_PATH || DEFAULT_VAULT;
	if (!fs.existsSync(filePath)) {
		return { loaded: false, reason: 'no-vault-file' };
	}
	const password = opts.password || process.env.VAULT_PASSWORD;
	if (!password) {
		console.error(
			'[vault] secrets.vault present but VAULT_PASSWORD not set — skipping vault load'
		);
		return { loaded: false, reason: 'no-password' };
	}

	let vault;
	try {
		vault = await openVault(filePath, password);
		let count = 0;
		for (const name of vault.list()) {
			if (!ALLOW.test(name)) continue;
			// Existing process.env wins (explicit env override beats vault).
			if (process.env[name] !== undefined) continue;
			try {
				process.env[name] = vault.read(name);
				count++;
			} catch {
				// skip unreadable entry, keep going
			}
		}
		return { loaded: true, entries: count };
	} finally {
		if (vault) {
			try {
				vault.close();
			} catch {
				/* noop */
			}
		}
		// Shrink the VAULT_PASSWORD exposure window unless caller asked to keep it.
		if (!opts.keepPassword) delete process.env.VAULT_PASSWORD;
	}
}

module.exports = { loadVaultIntoEnv };
