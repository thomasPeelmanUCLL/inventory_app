# Troubleshooting Runbook

Start wide, narrow down: Ingress, Service endpoints, Pod, App, DB.

## 0. Triage commands

```bash
NS=inventory
kubectl -n $NS get po -o wide
kubectl -n $NS get events --sort-by=.lastTimestamp | tail -30
kubectl -n $NS describe po -l app=backend
kubectl -n $NS logs deploy/inventory-backend --tail=100
kubectl -n $NS logs deploy/inventory-backend --previous    # after a crash
kubectl -n $NS logs deploy/inventory-frontend --tail=100
kubectl -n $NS get endpoints inventory-backend inventory-frontend postgres
```

Every request is logged with an id. Take `X-Request-ID` from the response header and grep the back-end log for it.

## 1. Symptom table

| Symptom | Likely cause | Check / fix |
|---|---|---|
| Back-end pod in `Init:0/1` | MariaDB unreachable or wrong password (init container loops "Waiting for inventory database...") | `kubectl logs po/<pod> -c wait-for-db`; check `postgres` pod and `postgres-secret` |
| Back-end `CrashLoopBackOff`, log `Missing required environment variables` | Secret keys missing | `kubectl get secret inventory-backend-secret -o json \| jq '.data \| keys'` |
| Log `Invalid URL format for: FRONTEND_URL` | URL lacks `https://` | fix secret, restart |
| Prisma `P1000` auth failed | PVC kept old MariaDB password; secret changed | Align password: `ALTER USER 'inventory'@'%' IDENTIFIED BY '...'`, or restore old secret. Special chars in `DATABASE_URL` password must be URL-encoded |
| Prisma `P2021` table does not exist | Migrations never ran | See deployment doc, migrate |
| 500 on sold items mentioning `paidCash` | DB has `payedCash` but client or SQL uses other name | Schema maps via `@map("payedCash")`; run `prisma generate`, redeploy |
| 502/503 from ingress | No ready endpoints | `kubectl get endpoints`; readiness probe failing on `/health` |
| `/health` returns 503 DEGRADED | DB down or slow | see section 3 |
| Browser: Mixed Content | `NEXT_PUBLIC_API_URL` not https at build | fix Actions secret, rebuild front-end image |
| Browser: CORS error / Origin not allowed | `FRONTEND_URL` differs from the real origin (scheme, host, port, trailing slash) | back-end log shows `CORS: Blocked request from unauthorized origin` |
| Login works but session lost | Cookie domain/secure mismatch, wrong `BACKEND_URL`, or `trustedOrigins` mismatch | inspect Set-Cookie in browser devtools |
| 429 Too many requests | Rate limiter | headers `X-RateLimit-*`; wait or review S-5 |
| 401 on every API call | No session cookie forwarded through the rewrite | test directly against back-end with port-forward |
| 403 on valid user | Not a member or viewer attempting write | check `inventory_users` |
| Front-end 500 on SSR pages | `INTERNAL_API_URL` wrong or back-end blocked by NetworkPolicy | section 4 |
| Integration returns 401 | Token mismatch | compare `inventory-integration-token` with food-api config |
| Integration returns 500 `WEBSITE_INVENTORY_ID is not configured` | Env empty or not integer | Deployment env |
| `ImagePullBackOff` | GHCR private or tag missing | `kubectl describe po`, check imagePullSecret and tag exists |
| `Pending` PVC | No StorageClass | `kubectl get sc,pvc` |
| Argo `OutOfSync` flapping | Image Updater vs Git, or HPA replicas | `argocd app diff inventory-app` |
| HPA shows `<unknown>` | metrics-server missing | `kubectl top po` |

## 2. Test layer by layer

```bash
# back-end directly
kubectl -n inventory port-forward svc/inventory-backend 3000:80
curl -s localhost:3000/health | jq
curl -s localhost:3000/ready  | jq

# front-end directly
kubectl -n inventory port-forward svc/inventory-frontend 8080:80
curl -sI localhost:8080/

# in-cluster DNS and connectivity from a throwaway pod
kubectl -n inventory run dbg --rm -it --image=nicolaka/netshoot -- bash
  dig +short inventory-backend.inventory.svc.cluster.local
  curl -s http://inventory-backend.inventory.svc.cluster.local/health
  nc -zv postgres.inventory.svc.cluster.local 3306

# ingress
curl -vI https://inventory.euroclasstravel.com/
curl -s https://inventory.euroclasstravel.com/api/auth/get-session
kubectl -n ingress-nginx logs deploy/ingress-nginx-controller --tail=50
```

Note: the debug pod above is in namespace `inventory` but has no `app=frontend` label. The NetworkPolicy will block it from the back-end. Label it for the test: `kubectl -n inventory run dbg --labels=app=frontend ...` and remove it afterwards.

## 3. Database

```bash
kubectl -n inventory exec -it deploy/postgres -- \
  mariadb -uinventory -p inventory -e 'SHOW TABLES; SELECT COUNT(*) FROM sold_items;'
kubectl -n inventory logs deploy/postgres --tail=100
kubectl -n inventory exec deploy/postgres -- df -h /var/lib/mysql
```

Full disk or InnoDB corruption shows in MariaDB logs. The Deployment uses strategy Recreate with a RWO volume, so a stuck old pod blocks the new one: delete the old pod.

## 4. NetworkPolicy debugging

```bash
kubectl -n inventory get netpol -o yaml
kubectl -n inventory get po --show-labels
kubectl get ns --show-labels | grep -E 'ingress-nginx|iswleuven'
```

The policy selects `app=backend` and allows only listed sources. If a new caller is added, extend the policy or traffic is dropped silently (timeouts, not refusals). The namespace selector depends on the automatic label `kubernetes.io/metadata.name`.

## 5. Argo CD / image update problems

```bash
argocd app get inventory-app --refresh
argocd app history inventory-app
kubectl -n argocd logs deploy/argocd-image-updater --tail=100
kubectl -n inventory get deploy inventory-backend -o jsonpath='{.spec.template.spec.containers[0].image}'
```

## 6. Debug an application bug locally against prod-like data

```bash
kubectl -n inventory port-forward svc/postgres 3307:3306
# back-end/.env: DATABASE_URL=mysql://inventory:<pw>@127.0.0.1:3307/inventory
cd back-end && npm run start
```

Use a copy, never a production DB, for write experiments.

## 7. Escalation data to collect

Pod `describe`, logs (current and previous), events, `argocd app get`, request id, UTC timestamp, exact URL and status code.
