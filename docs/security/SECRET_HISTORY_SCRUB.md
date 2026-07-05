# Secret History Scrub Plan

**Status: NOT YET EXECUTED — rotate keys first, then run the scrub.**

The current tree (HEAD) is clean: no `.pem`/`.key`/`.env` files are tracked, and
`.gitignore` blocks them. However, git **history** still contains previously
committed private keys and an `.env` file. Anyone with a clone of this repo can
recover them with `git log --all -- '*.key'`.

## Secret files found in history

```
.env
.key
api.ping.demo-key.pem
api.ping.demo.pem
api.pingdemo.com.key
api.pingone.com.key
auth.pingdemo.com.key
backup-2025-10-14T03-50-22/private_key.pem
certs/api.pingdemo.com.key
certs/cert.pem
certs/key.pem
certs/server.key
private_key.pem
```

(Two additional hits under `node_modules/` are vendored test fixtures, not real
secrets, but they get removed by the same scrub.)

## Step 1 — Rotate (manual, do this first)

Treat every key above as compromised:

- [ ] Reissue/replace TLS certs and keys for `api.pingone.com`, `api.pingdemo.com`, `auth.pingdemo.com`, `api.ping.demo`
- [ ] Rotate any credentials that were in the committed `.env` (check its contents: `git show $(git log --all --format=%H -- .env | tail -1):.env`)
- [ ] Rotate whatever `private_key.pem` signed (JWT signing key for private_key_jwt?)

## Step 2 — Scrub history

Requires [git-filter-repo](https://github.com/newren/git-filter-repo) (`brew install git-filter-repo`).
Work on a **fresh clone**, not your working copy:

```bash
git clone --no-local /Users/cmuir/Development/oauthplayground oauthplayground-scrub
cd oauthplayground-scrub
git filter-repo \
  --invert-paths \
  --path .env \
  --path .key \
  --path api.ping.demo-key.pem \
  --path api.ping.demo.pem \
  --path api.pingdemo.com.key \
  --path api.pingone.com.key \
  --path auth.pingdemo.com.key \
  --path backup-2025-10-14T03-50-22/private_key.pem \
  --path certs/ \
  --path private_key.pem \
  --path-glob 'node_modules/**'
```

## Step 3 — Force-push and re-clone

```bash
git remote add origin <remote-url>
git push --force --all origin
git push --force --tags origin
```

Then every collaborator must re-clone (old clones still contain the secrets).
If the repo is on GitHub, also contact GitHub support or use the web UI to
invalidate cached views of the old commits, since force-pushed commits remain
reachable by SHA.

## Why this wasn't done automatically

History rewriting invalidates every existing clone and requires a coordinated
force-push; key rotation has to happen first and needs access to the Ping
tenant/CA. Both are owner decisions.
