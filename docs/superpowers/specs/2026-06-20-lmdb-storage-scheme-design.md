# LMDB storage scheme — one encrypted central store for all server state

**Date:** 2026-06-20
**Status:** Approved (brainstorm)
**Context:** A worker-token "MISSING" bug exposed deep storage fragmentation (20+ localStorage keys; worker token + credentials scattered across JSON files, a misnamed "sqlite" JSON store, a real `enhanced_credentials.db`, IndexedDB, and 3 modal variants). Phases 1–2 of the consolidation already landed an own LMDB store (`src/server/data/lmdb`) backing worker tokens, credentials, per-flow credentials, and a generic kv namespace, and rewrote `credentialsSqliteApi.js` off sqlite3 onto it. This spec defines the *target storage scheme* the rest of the work builds toward: one encrypted LMDB as the single source of truth for **all** server-side state, with the operational pieces (migration, TTL, backup, schema versioning) to run it safely.

## Goals
- One embedded store (LMDB) for all server state — no parallel JSON/sqlite stores.
- Secrets encrypted at rest.
- Idempotent migration off every legacy store.
- Operable: expiry cleanup, portable backup/restore, schema versioning.

## Non-goals
- Changing the frontend single-source-of-truth work (separate consolidation phases: `unifiedWorkerTokenService`/`unifiedCredentialService`, reader convergence, one V9 modal).
- A networked/multi-process DB. LMDB single-process embedded is sufficient.

## Engine (decided: keep LMDB)
One env at `src/server/data/lmdb` (override `LMDB_PATH`), on the existing `oauth-data` Docker volume; excluded from the image by `.dockerignore`; gitignored locally. Synchronous `putSync/get/removeSync/getRange`. Already wired in `src/server/lmdb/openEnv.js`.

## Sub-DBs (namespaced, `encoding:'json'`)
| sub-DB | key | value | replaces |
|---|---|---|---|
| `worker_tokens` | envId | `{accessToken*, expiresAt, savedAt}` | worker-tokens.json *(done)* |
| `credentials` | envId | enriched creds (`clientSecret*`) | enhanced_credentials.db *(done)* |
| `flow_credentials` | flowKey | `{credentials*, savedAt}` | `pingone_flow_credentials_*` *(done)* |
| `users` | userId | user record (`passwordHash*`) | `users.db` |
| `settings` | key | value | settings DB |
| `backups` | backupId | `{meta, blob}` | `backups.db` |
| `apikeys` | service | `{key*}` | `sqlite-store.json` key entries |
| `kv` | string | any JSON | mcp-config.json, `/api/credentials/save` files |
| `_meta` | `schema_version`, … | scalar | — |

`*` = field encrypted at rest.

## Encryption (decided: field-level AES-256-GCM)
`src/server/lmdb/crypto.js`:
- `encryptField(plaintext) -> { v:1, iv, tag, ct }` (base64); `decryptField(envelope) -> plaintext`.
- `sealFields(obj, paths[])` / `openFields(obj, paths[])` walk dot-paths and encrypt/decrypt in place.
- Key from `PLAYGROUND_ENC_KEY` (32-byte, hex or base64). If unset: generate once to a gitignored `src/server/data/.enc-key` and log a warning (dev convenience; prod sets the env var / volume secret).
- `credentialStore` declares the secret paths per sub-DB and seals on write / opens on read.
- **Back-compat:** `openFields` treats a non-envelope value as already-plaintext (legacy), so pre-encryption records still read; they get sealed on the next write (lazy re-encrypt). The dump from backup keeps secrets sealed.

## TTL + cleanup
- Records may carry `expiresAt` (ms). Reads already drop-on-expiry for worker tokens.
- An hourly sweep (`setInterval`, cleared on shutdown) scans `worker_tokens` (and future `sessions`) and `removeSync`s expired entries so `data.mdb` doesn't accumulate dead tokens.

## Backup / restore
- `GET /api/store/backup` → single JSON document: `{ schema_version, <subDbName>: { <key>: <value> } }` for all sub-DBs. Secret fields stay **sealed** (encrypted) in the dump, so it's safe to copy.
- `POST /api/store/restore` ← that document: validates `schema_version`, writes each sub-DB. Admin-guarded.

## Boot migration (idempotent, `_meta.schema_version`-gated)
One `migrateAllToLmdb()` run on boot, guarded so it runs at most once per source:
1. **Phase A sources (small kv):** legacy JSON files *(worker/cred already done)*; `sqlite-store.json` API-key entries → `apikeys`; `mcp-config.json` + `/api/credentials/save` files → `kv`.
2. **Phase B sources (query-backed):** `users.db` → `users`; settings DB → `settings`; `backups.db` → `backups`. Requires rewriting `userDatabaseService`, `settingsDatabaseService`, and `backupApiRoutes` to read/write the LMDB sub-DBs (their SQL `WHERE`/`ORDER BY` become `getRange` scans / filtered maps).
After importing a source, mark it migrated (`_meta` flag) and rename the file `*.migrated` where applicable. Never overwrite newer LMDB data.

## Phasing (agreed)
- **Phase A — now, with the in-flight consolidation:** `crypto.js` + field encryption on the existing sub-DBs; TTL sweep; backup/restore endpoints; fold `apikeys` + `mcp-config`/file blobs into `kv`/`apikeys`; `_meta.schema_version`. Low risk, high value (covers the high-churn, secret-bearing data).
- **Phase B — separate pass:** migrate `users` / `settings` / `backups` by rewriting their services onto LMDB. Larger, isolated, independently verifiable.

This is independent of, and runs alongside, the frontend consolidation phases (single `unifiedWorkerTokenService`/`unifiedCredentialService`, reader convergence, one V9 modal).

## Risks
- **Encryption key management:** lost/rotated key ⇒ unreadable secrets. Mitigate: key on the persistent volume / env; back-compat path tolerates plaintext; document rotation = re-seal on write.
- **Phase B service rewrites:** `users.db`/`backups.db` carry the most logic; keep behind the same service interfaces so callers don't change; verify with existing user/backup flows.
- **Sweep vs. reads:** sweep only removes already-expired entries; reads independently drop-on-expiry, so no race that hides a valid token.
- **LMDB unavailable (Vercel/CI):** keep the existing no-op fallback; encryption/sweep/backup become no-ops there.

## Verification
- Round-trip each sub-DB through its endpoint; confirm `data.mdb` is the only on-disk store and no `enhanced_credentials.db`/`*.json` token stores are recreated.
- Encryption: inspect `data.mdb` (or a backup dump) and confirm secret fields are `{v,iv,tag,ct}` envelopes, not plaintext; confirm a legacy plaintext value still reads and is sealed after a re-save.
- TTL: insert an already-expired token, run the sweep, confirm removal.
- Backup/restore: dump → wipe → restore → data intact; secrets still decrypt.
- Boot migration: with legacy files/DBs present and empty LMDB, boot once → data imported, sources flagged; second boot imports nothing.
- `npx vite build` exit 0; deploy prod images and re-verify `/environments` get-worker-token persists across reload + container restart (volume).
