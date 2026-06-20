# Kubernetes deployment

Deploys the oauthPlayground frontend (nginx) + backend (Express, LMDB store) to
Kubernetes. Vercel/serverless has been removed; this is the supported deploy path
alongside `docker compose -f docker-compose.yml`.

## Quick start (local cluster: orbstack / docker-desktop)

```bash
./run-k8.sh
```

This builds both images into the local docker daemon, creates the secrets from
your local `.env` + `./certs`, generates an encryption key, and applies the
manifests. Frontend comes up on `https://localhost:3000` (LoadBalancer).

## What the LMDB store needs in K8s (important)

- **Persistent volume** — `k8s/10-pvc.yaml` (`oauth-data`, ReadWriteOnce) mounts at
  `/app/src/server/data`; `LMDB_PATH` points at `…/data/lmdb`. Without it the store
  is wiped on every pod restart.
- **Single writer** — the backend Deployment is `replicas: 1` with `strategy:
  Recreate`. LMDB is a single-process embedded DB; never run two pods against the
  RWO volume at once. Do not scale the backend up.
- **Stable encryption key** — `PLAYGROUND_ENC_KEY` (Secret `oauth-enc`). Secrets are
  sealed at rest with this key; if it changes or is lost, existing secrets become
  unreadable (they degrade to null, not a crash). Keep the key safe and reuse it
  across deploys: `PLAYGROUND_ENC_KEY=<existing> ./run-k8.sh`.

## Manifests

| file | purpose |
|---|---|
| `00-namespace.yaml` | `oauth-playground` namespace |
| `10-pvc.yaml` | RWO PVC for the LMDB store |
| `20-backend.yaml` | backend Deployment (1 replica, Recreate) + Service `oauth-backend:3001` |
| `30-frontend.yaml` | frontend Deployment + LoadBalancer Service `:3000` |
| `secret.example.yaml` | template for the 3 secrets (run-k8.sh creates them for you) |

## Secrets (created by run-k8.sh, never committed)

- `oauth-enc` — `PLAYGROUND_ENC_KEY` (+ optional `STORE_ADMIN_SECRET`)
- `oauth-env` — the app `.env` (PingOne client ids/secrets, VAULT_PASSWORD, …)
- `oauth-certs` — `server.crt` + `server.key` (both pods serve HTTPS)

## Remote clusters

Push the images to your registry and update the `image:` fields, or pre-load them
onto nodes. Replace the LoadBalancer Service with an Ingress if you terminate TLS
at the edge (the frontend serves HTTPS on 3000; use a backend-protocol HTTPS
annotation).

## Backup / restore

`GET /api/store/backup` dumps the whole LMDB store (secrets stay sealed);
`POST /api/store/restore` loads it. Both are same-origin gated and honor
`STORE_ADMIN_SECRET` via the `x-store-admin` header.
