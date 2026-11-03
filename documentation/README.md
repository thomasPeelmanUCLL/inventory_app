# Documentation Index

| Doc | Audience | Contents |
|---|---|---|
| [architecture.md](architecture.md) | everyone | Components, request flow, network layout, repo map |
| [api-reference.md](api-reference.md) | developers, testers | Every endpoint, auth, roles, validation, rate limits |
| [data-model.md](data-model.md) | developers, DBAs | Prisma schema, relations, indexes, legacy column quirks |
| [security.md](security.md) | security, ops | Auth, RBAC, hardening layers, threat model, known gaps |
| [deployment-kubernetes.md](deployment-kubernetes.md) | DevOps | CI/CD, Argo CD, manifests, secrets, first deploy, rollback |
| [troubleshooting.md](troubleshooting.md) | on-call | Debug runbook with commands, symptom to cause table |
| [development.md](development.md) | developers | Local setup, env vars, conventions |
| [operations.md](operations.md) | ops | Health probes, scaling, backups, maintenance checklist |

Conventions: namespace `inventory`; Service names `inventory-frontend`, `inventory-backend`, `postgres` (this is actually MariaDB, name kept for historical reasons).

Status note: items marked **VERIFY** were not provable from the repo alone (cluster-side state) and must be checked on the live cluster.
