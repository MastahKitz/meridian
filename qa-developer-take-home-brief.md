# QA Developer — Technical Assessment

**Effort:** 3–5 days · **Window:** 7 calendar days

---

## The system

**Meridian** — a multi-tenant SaaS platform for API key management and usage metering.

NestJS · Next.js · PostgreSQL · Redis · Docker Compose

Tenants issue API keys. Traffic authenticates with those keys at a metered gateway, subject to per-plan rate limits. Usage is recorded per request, rolled up daily, and surfaced through reports and CSV export. Requests beyond the monthly quota generate overage charges pushed to a third-party billing provider. Users hold a role in each tenant they belong to. Tenants register webhook endpoints and receive signed events with retries. Privileged actions are written to an audit log.

### Domain

| Entity | Notes |
|---|---|
| Tenant | Isolated organisation. Carries plan, timezone, suspension state. |
| User / Membership | A user may belong to several tenants with a different role in each. |
| Role | `OWNER`, `ADMIN`, `BILLING`, `MEMBER`, `VIEWER` |
| Plan | `FREE` 100 rpm / 10k mo · `GROWTH` 1,000 rpm / 500k mo · `SCALE` 5,000 rpm / 5M mo |
| API key | Tenant-scoped, `prefix.secret`, revocable |
| Usage event | Per gateway request; aggregated into daily rollups |
| Billing event | Monthly overage, synced to the provider |
| Webhook endpoint | HMAC-signed delivery with retry |
| Audit log | Per-tenant record of privileged actions |

### Surface

Dashboard requests carry a bearer access token and an `x-tenant-id` header. Gateway requests carry `x-api-key`.

```
POST   /api/v1/auth/login | refresh | logout        GET  /api/v1/auth/me
GET    /api/v1/tenant                               PATCH /api/v1/tenant
GET    /api/v1/tenant/audit-log
GET    /api/v1/memberships                          POST /api/v1/memberships/invite
PATCH  /api/v1/memberships/:id                      DELETE /api/v1/memberships/:id
GET    /api/v1/keys                                 POST /api/v1/keys
DELETE /api/v1/keys/:id
GET    /api/v1/usage/summary | daily | export
GET    /api/v1/billing/events | invoice-preview     POST /api/v1/billing/sync
GET    /api/v1/webhooks | deliveries                POST /api/v1/webhooks | test
DELETE /api/v1/webhooks/:id
GET    /api/v1/gw/ping                              POST /api/v1/gw/echo | transform
```

`docs/rbac-matrix.md` is the role specification. `docs/reported-issues.md` holds open support tickets. `docs/feature-specs/` holds work in progress. Setup and seeded credentials are in `README.md`.

---

## Part A — Implement

Both specs in `docs/feature-specs/`, with tests.

- **A1** — Tenant rate limit override, bounded by plan ceiling
- **A2** — API key scopes and rotation with a grace period

## Part B — Test architecture

The repository has no tests.

- **Unit** — permission resolution, limit calculation, usage aggregation, billing arithmetic
- **Integration** — against real PostgreSQL and Redis in Docker. Not mocked. Cover transaction behaviour, cache boundaries, and service-to-service calls.
- **API** — the full authorisation surface as a role × endpoint × tenant matrix
- **End-to-end** — critical dashboard journeys across frontend and backend
- **Test data** — a factory or fixture layer. Tests independent, order-agnostic, parallel-safe.
- **Coverage** — reported, with thresholds enforced in CI
- **CI** — GitHub Actions running the full suite from a clean clone with no manual steps, publishing coverage, E2E traces on failure, and a machine-readable report

`docker compose up` plus one documented command goes green on a clean machine.

## Part C — Defect investigation

Work `docs/reported-issues.md`. Investigate beyond it.

For each defect: a report with severity, preconditions, exact reproduction steps, expected vs actual, and evidence. An automated regression test committed in a failing state. A fix for release-blocking defects only.

## Part D — Written submission

`SUBMISSION.md` at the repository root:

- Test strategy and the risks it covers
- What you prioritised, what you dropped, why
- What you chose not to automate, why
- Anything in Part A you had to decide for yourself, and what you decided
- Defect summary table
- Release recommendation with conditions and accepted risks
- AI usage disclosure
- Time log

---

## Optional

Depth in two beats presence in six.

- Performance and load testing with thresholds in CI
- Rate limiter behaviour under concurrency and at window boundaries
- Security testing — auth, session and token lifecycle, tenant isolation, privilege escalation, input validation, OWASP API Top 10
- Systematic tenant isolation proof across every endpoint
- Contract testing against the mock billing provider
- Webhook delivery — signing, retries, ordering, idempotency
- Accessibility — automated checks plus manual keyboard and screen reader assessment
- Browser and viewport compatibility
- Flake detection, quarantine, or retry strategy
- Mutation testing on a targeted module
- Test reporting and trend visibility

---

## Evaluation

| Area | Weight |
|---|---|
| Defect discovery — depth, diagnosis, reproduction quality | 25% |
| Test architecture — design, maintainability, reliability | 25% |
| Judgement and prioritisation | 20% |
| Part A implementation | 15% |
| CI, reproducibility, evidence | 15% |

Automatic fail: the suite does not run from a clean clone; tests that assert nothing; defect reports we cannot reproduce; work you cannot explain in the debrief.

---

## AI tools

Use them. Disclose which tools, for which parts, and where the output needed correcting.

In the debrief you will explain, modify and extend your own work live.

---

## Debrief

60 minutes.

- 20 min — architecture walkthrough and prioritisation
- 25 min — live pairing: we introduce a change, you extend your suite to cover it
- 15 min — what you would do with another two weeks

---

## Submission

Push to your branch with `SUBMISSION.md`, README updates covering how to run each layer, and a link to a green CI run.

Questions welcome.
