# Operations

## Health model

| Probe | Target | Settings |
|---|---|---|
| Back-end liveness | GET /health:3000 | delay 15s, period 10s, 3 failures |
| Back-end readiness | GET /health:3000 | delay 5s, period 5s, 3 failures |
| Front-end startup | GET / | 12 failures x 5s |
| Front-end liveness / readiness | GET / | 20s / 10s |
| MariaDB | `healthcheck.sh --connect --innodb_initialized` | liveness delay 30s |

Back-end liveness depends on the DB through `/health`. A database outage therefore restarts back-end pods repeatedly. Consider pointing liveness at a process-only check and keeping `/health` for readiness.

## Scaling and capacity

- HPAs allow 1 to 2 replicas per tier. Back-end max 2 pods x 768Mi.
- MariaDB is a single pod (Recreate). Expect downtime during restarts. There is no HA.
- Storage: 5Gi PVC, `Prune=false,Delete=false` protects it from Argo deletions.

## Backup (not implemented in repo, recommended)

```bash
kubectl -n inventory exec deploy/postgres -- \
  sh -c 'mariadb-dump -uroot -p"$MARIADB_ROOT_PASSWORD" --single-transaction inventory' \
  | gzip > inventory-$(date +%F).sql.gz
```

Automate with a CronJob writing to off-cluster storage and test restores quarterly.

## Monitoring suggestions

- Alert on pod restarts, `/health` 503, HPA at max, PVC usage over 80%, 5xx rate at ingress, 429 spikes, and failed sign-in bursts (10 per 15 min limit).
- Ship structured logs (each line has the request id) to Loki or similar.

## Maintenance checklist

- Monthly: update base images (`node:20-alpine`, `mariadb:11`), run `npm audit`, review `inventory_users` and `users`.
- Per release: check `argocd app get`, run migrations, smoke test `/health`, sign-in, one sale, analytics.
- Quarterly: rotate `BETTER_AUTH_SECRET` and integration token, restore-test backup.
