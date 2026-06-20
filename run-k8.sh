#!/usr/bin/env bash
# Build images + deploy oauthPlayground to Kubernetes.
# Works against a local cluster that shares the docker daemon (orbstack,
# docker-desktop). For a remote cluster, push the images to a registry and set
# the image: fields in k8s/20-backend.yaml / 30-frontend.yaml accordingly.
set -euo pipefail
cd "$(dirname "$0")"

NS=oauth-playground
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo unknown)

echo "==> Building images (GIT_SHA=$GIT_SHA)"
docker build -f Dockerfile.backend  --build-arg GIT_SHA="$GIT_SHA" -t oauthplayground-oauth-backend:latest  .
docker build -f Dockerfile.frontend --build-arg GIT_SHA="$GIT_SHA" -t oauthplayground-oauth-frontend:latest .

echo "==> Namespace"
kubectl apply -f k8s/00-namespace.yaml

echo "==> Secrets (from local files — never committed)"
# Encryption key: reuse $PLAYGROUND_ENC_KEY if exported, else generate a stable one.
# IMPORTANT: keep this key — losing it makes existing sealed secrets unreadable.
ENC_KEY="${PLAYGROUND_ENC_KEY:-$(openssl rand -hex 32)}"
kubectl -n "$NS" create secret generic oauth-enc \
  --from-literal=PLAYGROUND_ENC_KEY="$ENC_KEY" \
  --from-literal=STORE_ADMIN_SECRET="${STORE_ADMIN_SECRET:-}" \
  --dry-run=client -o yaml | kubectl apply -f -

if [ -f .env ]; then
  kubectl -n "$NS" create secret generic oauth-env \
    --from-env-file=.env --dry-run=client -o yaml | kubectl apply -f -
else
  echo "   (no .env found — skipping oauth-env secret)"
fi

kubectl -n "$NS" create secret generic oauth-certs \
  --from-file=server.crt=certs/server.crt \
  --from-file=server.key=certs/server.key \
  --dry-run=client -o yaml | kubectl apply -f -

echo "==> Workloads"
kubectl apply -f k8s/10-pvc.yaml -f k8s/20-backend.yaml -f k8s/30-frontend.yaml

echo "==> Waiting for rollout"
kubectl -n "$NS" rollout status deploy/oauth-backend  --timeout=180s
kubectl -n "$NS" rollout status deploy/oauth-frontend --timeout=120s
kubectl -n "$NS" get pods,svc

cat <<EOF

Done. The frontend Service is type LoadBalancer on :3000.
  - orbstack/docker-desktop: https://localhost:3000
  - add '127.0.0.1 api.ping.demo' to /etc/hosts to match the cert/redirect URIs
Backend is internal (Service oauth-backend:3001); nginx proxies /api/ to it.
EOF
