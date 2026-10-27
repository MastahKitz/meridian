# Meridian

Multi-tenant API usage platform. Tenants issue API keys, traffic flows through a metered
gateway with per-plan rate limiting, and usage rolls up into reports and overage billing.

## Stack

- **API** — NestJS, PostgreSQL, Redis (`apps/api`)
- **Dashboard** — Next.js (`apps/web`)
- **Billing provider** — mock third-party service (`apps/mock-billing`)

## Running

```bash
cp .env.example .env
docker compose up --build
```

Wait for the API to report healthy, then seed:

```bash
npm install
DATABASE_URL=postgres://meridian:meridian@localhost:5432/meridian npm run seed
```

`npm run seed:large` instead seeds production-scale volume against the Northwind tenant
(~540k usage events across 26 keys). Use it when testing report performance.

- Dashboard: http://localhost:3000
- API: http://localhost:4000/api/v1
- Health: http://localhost:4000/health
- Mock billing provider: http://localhost:4010

The seed script prints API key secrets. They are not recoverable afterwards.
All seeded users share the password `Password123!`.

## Seeded data

| Tenant | Plan | Timezone | Users |
|---|---|---|---|
| Acme Corp | FREE | UTC | owner@, admin@, member@, viewer@, billing@acme.test |
| Northwind Traders | GROWTH | America/New_York | owner@, admin@northwind.test |
| Sakura KK | SCALE | Asia/Tokyo | owner@sakura.test |

`member@acme.test` also holds a VIEWER role in Northwind.

## Authentication

Dashboard requests use a bearer access token plus an `x-tenant-id` header identifying the
active tenant. Gateway requests authenticate with `x-api-key` in the form `prefix.secret`.

```bash
curl -X POST localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"owner@acme.test","password":"Password123!"}'

curl localhost:4000/api/v1/gw/ping -H "x-api-key: mk_xxxx.yyyy"
```

## Endpoints

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/login` | |
| POST | `/auth/refresh` | |
| POST | `/auth/logout` | |
| GET | `/auth/me` | |
| GET | `/tenant` | Current tenant and effective limits |
| PATCH | `/tenant` | |
| GET | `/tenant/audit-log` | |
| GET | `/memberships` | |
| POST | `/memberships/invite` | |
| PATCH | `/memberships/:id` | |
| DELETE | `/memberships/:id` | |
| GET | `/keys` | |
| POST | `/keys` | |
| DELETE | `/keys/:id` | Revoke |
| GET | `/usage/summary` | |
| GET | `/usage/daily` | |
| GET | `/usage/export` | CSV |
| GET | `/billing/events` | |
| GET | `/billing/invoice-preview` | |
| POST | `/billing/sync` | Pushes charges to the provider |
| GET | `/webhooks` | |
| POST | `/webhooks` | |
| POST | `/webhooks/test` | |
| GET | `/webhooks/deliveries` | |
| DELETE | `/webhooks/:id` | |
| GET/POST | `/gw/ping`, `/gw/echo`, `/gw/transform` | Metered, rate limited |

## Mock billing provider

Supports `Idempotency-Key` on `POST /charges`. Failure and latency injection via the
`FAILURE_RATE` and `LATENCY_MS` environment variables in `docker-compose.yml`.
`POST /_admin/reset` clears its state.

## Docs

- `docs/rbac-matrix.md` — role and permission specification
- `docs/reported-issues.md` — open support tickets
- `docs/feature-specs/` — specifications for work in progress

## Notes

- `usage_daily` is written on every metered request but no read path currently uses it;
  the reporting endpoints aggregate `usage_events` directly.
- The gateway checks `tenants.suspended`, but nothing currently sets it.

## Tests

### Unit tests (Jest)

`apps/api` — permission resolution, limit calculation, usage aggregation, billing arithmetic.

```bash
npm run test:unit                    # from repo root; coverage + thresholds enforced
npm test --workspace=apps/api        # no coverage, faster loop
```

### Functional / E2E tests (Playwright)

Requires the stack running and seeded (see [Running](#running) above).

```bash
npm run test:functional              # full suite
npx playwright test --grep @api      # tag-filtered: @api / @ui / @mutating / @error
npm run test:functional:report       # open the last HTML report
```

### CI

One GitHub Actions workflow runs unit tests, then the Playwright suite, on every push to
`main`, and can also be dispatched manually against any branch (optionally with an `@tag`
filter) from the Actions tab. Every run publishes results — E2E counts and unit test
coverage — to a dashboard:

- Dashboard: https://mastahkitz.github.io/meridian/
- Example green run: https://github.com/MastahKitz/meridian/actions/runs/36006748101
