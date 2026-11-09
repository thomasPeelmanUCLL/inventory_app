# Deployment on Kubernetes

## Pipeline overview

```
git push main
  --> GitHub Actions (.github/workflows/deploy.yml, workflow name "Build & Push")
        ci-frontend: npm ci, tsc --noEmit, next build
        ci-backend : npm ci, prisma generate, tsc --noEmit, lint
        docker-*   : build and push to ghcr.io/thomaspeelmanucll/inventory-{frontend,backend}
                     tags sha-<40 hex> and latest (push events only, not PRs)
  --> Argo CD Image Updater detects new sha-* digest, updates the Deployment image
  --> Argo CD Application inventory-app syncs path k8s/ (automated, selfHeal true, prune false)
```

`ci.yml` also exists for checks. The deploy workflow no longer talks to the cluster; the cluster pulls changes (GitOps).

## Prerequisites on the cluster

- Argo CD and Argo CD Image Updater installed in namespace `argocd`.
- ingress-nginx (namespace `ingress-nginx`) plus TLS (cert-manager or equivalent) for the host. VERIFY the TLS block: `ingress.yml` currently has no `tls:` section.
- A CNI that enforces NetworkPolicy (Calico, Cilium, ...). Otherwise policies are silently ignored.
- A default StorageClass for the 5Gi ReadWriteOnce PVC.
- GHCR pull access if the packages are private (imagePullSecret, not present in the manifests).
- metrics-server for the HPAs.

## First deploy

```bash
kubectl create namespace inventory   # Application uses CreateNamespace=false

kubectl -n inventory create secret generic postgres-secret \
  --from-literal=POSTGRES_PASSWORD='<strong>'

kubectl -n inventory create secret generic inventory-backend-secret \
  --from-literal=DATABASE_URL='mysql://inventory:<url-encoded-pw>@postgres.inventory.svc.cluster.local:3306/inventory' \
  --from-literal=BETTER_AUTH_SECRET="$(openssl rand -hex 32)" \
  --from-literal=FRONTEND_URL='https://inventory.iswleuven.be' \
  --from-literal=BACKEND_URL='https://inventory.iswleuven.be'

kubectl -n inventory create secret generic inventory-integration-token \
  --from-literal=token="$(openssl rand -hex 32)"

kubectl apply -f argocd/application.yaml
argocd app sync inventory-app    # or wait for auto sync
```

Set the GitHub Actions secret `NEXT_PUBLIC_API_URL` before the first image build; it is baked into the front-end bundle. Note `BACKEND_URL` must match the public origin that Better Auth sees, which is the front-end host here because `/api/auth` is routed on the same host. VERIFY against your live secret.

The back-end init container `wait-for-db` blocks startup until MariaDB accepts the `inventory` login.

## Database migrations

Nothing in the manifests applies migrations. Run once per schema change from a pod that has the schema and `DATABASE_URL`:

```bash
kubectl -n inventory exec deploy/inventory-backend -- \
  npx prisma migrate deploy --schema=repository/prisma/schema.prisma
```

Caveats: the runtime image installs `--omit=dev`, so the `prisma` CLI may be missing. If so, use a one-off Job with the builder stage image or run from a workstation through `kubectl port-forward svc/postgres 3306:3306 -n inventory`. A cleaner fix is an init container or Job running `prisma migrate deploy` with a pinned CLI.

## Manifest reference

| File | Purpose |
|---|---|
| namespace.yml | Namespace `inventory` |
| mariadb.yml | PVC (Argo `Prune=false,Delete=false`), Deployment (Recreate), Service ClusterIP |
| backend-deployment.yml | 1 replica, RollingUpdate maxUnavailable 0, probes on `/health`, 250m/384Mi request, 750m/768Mi limit |
| backend-configmap.yml | NODE_ENV=production, PORT=3000 |
| backend-service.yml / frontend-service.yml | ClusterIP Services on port 80 |
| frontend-deployment.yml | startup/liveness/readiness on `/`, 150m/256Mi request, 500m/512Mi limit, `HOSTNAME=::` |
| frontend-configmap.yml | `INTERNAL_API_URL` (runtime), `NEXT_PUBLIC_API_URL` (documentation only, build-time in reality) |
| hpa.yml | Both 1 to 2 replicas; backend CPU 70%, mem 80%; front-end CPU 85%, mem 90% |
| ingress.yml | Host rules, class nginx |
| allow-food-api-to-inventory-backend.yaml | NetworkPolicy, see security.md |

`HOSTNAME=::` makes Next.js listen on IPv6 (dual-stack). On an IPv4-only cluster change it to `0.0.0.0`.

## Day-2 operations

```bash
# status
kubectl -n inventory get deploy,po,svc,ing,hpa,pvc,netpol
argocd app get inventory-app

# rollout
kubectl -n inventory rollout status deploy/inventory-backend
kubectl -n inventory rollout history deploy/inventory-backend

# rollback (Argo selfHeal will revert manual changes, so pin in Git)
kubectl -n inventory rollout undo deploy/inventory-backend
# GitOps rollback: set the image tag in k8s/*-deployment.yml to an older sha-... and push
```

Because `selfHeal: true`, manual `kubectl edit` changes are reverted. Pause with `argocd app set inventory-app --sync-policy none` while debugging, and re-enable afterwards.

## Known inconsistencies to clean up

- Names `postgres`, `postgres-secret`, `POSTGRES_PASSWORD` refer to MariaDB.
- Image tags in the manifests are rewritten by Image Updater; commits to `k8s/` may appear from it.
- Port 3000 container, Service port 80: check `targetPort` in the Service files when debugging.
