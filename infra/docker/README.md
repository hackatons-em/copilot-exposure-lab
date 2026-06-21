# Local full stack (Docker Compose)

Brings up the whole product on your machine: Postgres + a one-shot migration +
the API, worker, and web dashboard.

```bash
# from the repo root, with Docker Desktop running:
docker compose -f infra/docker/docker-compose.yml up --build
```

Then:

- **Web dashboard:** http://localhost:3000 (landing) → http://localhost:3000/overview
- **API:** http://localhost:4000/health
- **Postgres:** localhost:5432 (`cel` / `cel` / db `cel`)

The API boots a ready-to-demo **`ws-demo`** workspace (Acme Health Finance Ltd),
seeds the demo company, and runs the first scan automatically.

## The <5-minute demo flow

1. Open the dashboard → **Run exposure assessment**.
2. See the band distribution: **1 critical, 4 high, 4 medium** (9 findings).
3. Open the critical **salary** finding → the evidence chain
   `Bob Novak → Everyone Except External Users → organization-wide link → 2026_salary_plan.xlsx`.
4. **Apply fix & re-verify** → the finding flips to resolved (proof-of-fix).
5. **Reports → Generate → Download** the Markdown/HTML CISO report.

## Services

| Service | Purpose |
|---|---|
| `postgres` | Database (volume `pgdata`) |
| `migrate` | One-shot Drizzle migration, then exits |
| `api` | Fastify REST API (`:4000`), Postgres-backed |
| `worker` | Polls the `jobs` queue (scan / report / cleanup) |
| `web` | Next.js dashboard (`:3000`) |

Tear down (and wipe data):

```bash
docker compose -f infra/docker/docker-compose.yml down -v
```
