/* Usage: node scripts/seed.js [--large]
   Seeds three tenants with users, keys and usage history.
   --large adds ~250k usage events to the Northwind tenant.

   Also importable as `require('./seed').seed({ large })` — used by the Playwright
   global setup to reseed after a truncate. Assumes an empty DB (or a DB truncated
   via `TRUNCATE users, tenants RESTART IDENTITY CASCADE`, which cascades to every
   other table) — api_keys and usage_events have no ON CONFLICT handling, so seeding
   twice without truncating first duplicates them. */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { randomBytes, createHash } = require('crypto');

const hash = (s) => createHash('sha256').update(s).digest('hex');

async function seed({ large = false } = {}) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const pw = await bcrypt.hash('Password123!', 10);

  const users = {};
  for (const email of [
    'owner@acme.test',
    'admin@acme.test',
    'member@acme.test',
    'viewer@acme.test',
    'billing@acme.test',
    'owner@northwind.test',
    'admin@northwind.test',
    'owner@sakura.test',
    // memberships-create's own scratch users (conventions.md rule 9): not
    // owner@acme.test/admin@acme.test, so this tenant's membership never
    // forces an update to login-api.spec.ts's exact-match tenant lists for
    // the Acme users.
    'memberships-owner@mutating.test',
    'memberships-admin@mutating.test',
    // A1's rate-limit-override scratch users — shared across its three
    // per-plan-tier tenants below (same domain, same reasoning as above).
    // member/viewer/billing exist for the @error spec's RBAC-negative tests
    // (PATCH/DELETE /tenant/rate-limit is OWNER-only) — role rejection is
    // plan-independent, so these only need membership on one tier.
    'rate-limit-owner@mutating.test',
    'rate-limit-admin@mutating.test',
    'rate-limit-member@mutating.test',
    'rate-limit-viewer@mutating.test',
    'rate-limit-billing@mutating.test',
    // The audit-log domain's own scratch users — audit-log-api.spec.ts uses
    // rate-limit-override only as an example action to trigger, so it gets
    // its own tenant and users rather than borrowing rate-limit's.
    'audit-log-owner@mutating.test',
    'audit-log-admin@mutating.test',
    'audit-log-member@mutating.test',
    'audit-log-viewer@mutating.test',
    'audit-log-billing@mutating.test',
    // Part C / SUP-1067's own scratch user — needs OWNER to lower its own
    // tenant's rate limit via A1's override before the concurrency repro.
    'gw-owner@mutating.test',
  ]) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash) VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [email, pw],
    );
    users[email] = rows[0].id;
  }

  const tenants = {};
  const tenantSpecs = [
    { name: 'Acme Corp', slug: 'acme', plan: 'FREE', timezone: 'UTC' },
    { name: 'Northwind Traders', slug: 'northwind', plan: 'GROWTH', timezone: 'America/New_York' },
    { name: 'Sakura KK', slug: 'sakura', plan: 'SCALE', timezone: 'Asia/Tokyo' },
    // conventions.md rule 9: every domain needing @mutating coverage gets its
    // own dedicated scratch tenant, named `<domain>-mutating` — never shared
    // across domains.
    { name: 'memberships-mutating', slug: 'memberships-mutating', plan: 'FREE', timezone: 'UTC' },
    // A1: rate-limit override's ceiling is plan-dependent (FREE 500 / GROWTH
    // 5,000 / SCALE 25,000), so this domain needs one scratch tenant per
    // tier rather than the usual single `<domain>-mutating` — extended as
    // `<domain>-mutating-<qualifier>`.
    { name: 'rate-limit-mutating-free', slug: 'rate-limit-mutating-free', plan: 'FREE', timezone: 'UTC' },
    { name: 'rate-limit-mutating-growth', slug: 'rate-limit-mutating-growth', plan: 'GROWTH', timezone: 'UTC' },
    { name: 'rate-limit-mutating-scale', slug: 'rate-limit-mutating-scale', plan: 'SCALE', timezone: 'UTC' },
    // DELETE /tenant/rate-limit's own tenants — separate from the three above
    // so the set and clear specs, both @mutating, can never race each other's
    // writes to the same tenant row. Clearing has no ceiling logic, but what
    // it resets *to* is still plan-dependent (FREE 100 / GROWTH 1,000 /
    // SCALE 5,000 rpm default), so this still needs one tenant per tier.
    { name: 'rate-limit-mutating-clear-free', slug: 'rate-limit-mutating-clear-free', plan: 'FREE', timezone: 'UTC' },
    { name: 'rate-limit-mutating-clear-growth', slug: 'rate-limit-mutating-clear-growth', plan: 'GROWTH', timezone: 'UTC' },
    { name: 'rate-limit-mutating-clear-scale', slug: 'rate-limit-mutating-clear-scale', plan: 'SCALE', timezone: 'UTC' },
    // The audit-log domain's own scratch tenant — covers any transaction
    // that writes an audit entry, not just rate-limit-override (which is
    // just this spec's example trigger), so it's named for the domain it
    // actually belongs to rather than borrowing rate-limit's tenant. Kept
    // separate from every other domain's mutating tenants so its "starts
    // with zero entries" assertion can never see their writes. Audit-log
    // recording isn't plan-dependent, so one tenant (FREE) is enough.
    { name: 'audit-log-mutating', slug: 'audit-log-mutating', plan: 'FREE', timezone: 'UTC' },
    // Part C / SUP-1067's own scratch tenant — reproduces the rate-limit
    // concurrency race via a real gateway request, so it needs its own
    // tenant (never shared with A1's rate-limit-mutating-* tenants, which
    // exercise the override PATCH/DELETE endpoints, not gateway enforcement).
    { name: 'gw-mutating', slug: 'gw-mutating', plan: 'FREE', timezone: 'UTC' },
  ];
  for (const spec of tenantSpecs) {
    const { rows } = await pool.query(
      `INSERT INTO tenants (name, slug, plan, timezone) VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET plan = EXCLUDED.plan
       RETURNING id`,
      [spec.name, spec.slug, spec.plan, spec.timezone],
    );
    tenants[spec.slug] = rows[0].id;
  }

  const memberships = [
    ['acme', 'owner@acme.test', 'OWNER'],
    ['acme', 'admin@acme.test', 'ADMIN'],
    ['acme', 'member@acme.test', 'MEMBER'],
    ['acme', 'viewer@acme.test', 'VIEWER'],
    ['acme', 'billing@acme.test', 'BILLING'],
    ['northwind', 'owner@northwind.test', 'OWNER'],
    ['northwind', 'admin@northwind.test', 'ADMIN'],
    ['northwind', 'member@acme.test', 'VIEWER'],
    ['sakura', 'owner@sakura.test', 'OWNER'],
    ['memberships-mutating', 'memberships-owner@mutating.test', 'OWNER'],
    ['memberships-mutating', 'memberships-admin@mutating.test', 'ADMIN'],
    ['rate-limit-mutating-free', 'rate-limit-owner@mutating.test', 'OWNER'],
    ['rate-limit-mutating-free', 'rate-limit-admin@mutating.test', 'ADMIN'],
    ['rate-limit-mutating-free', 'rate-limit-member@mutating.test', 'MEMBER'],
    ['rate-limit-mutating-free', 'rate-limit-viewer@mutating.test', 'VIEWER'],
    ['rate-limit-mutating-free', 'rate-limit-billing@mutating.test', 'BILLING'],
    ['rate-limit-mutating-growth', 'rate-limit-owner@mutating.test', 'OWNER'],
    ['rate-limit-mutating-growth', 'rate-limit-admin@mutating.test', 'ADMIN'],
    ['rate-limit-mutating-scale', 'rate-limit-owner@mutating.test', 'OWNER'],
    ['rate-limit-mutating-scale', 'rate-limit-admin@mutating.test', 'ADMIN'],
    // All 5 roles on the free tier — the clear spec's own RBAC-negative
    // tests (DELETE is OWNER-only) stay scoped to this tenant rather than
    // reaching into rate-limit-mutating-free (the *set* spec's tenant).
    ['rate-limit-mutating-clear-free', 'rate-limit-owner@mutating.test', 'OWNER'],
    ['rate-limit-mutating-clear-free', 'rate-limit-admin@mutating.test', 'ADMIN'],
    ['rate-limit-mutating-clear-free', 'rate-limit-member@mutating.test', 'MEMBER'],
    ['rate-limit-mutating-clear-free', 'rate-limit-viewer@mutating.test', 'VIEWER'],
    ['rate-limit-mutating-clear-free', 'rate-limit-billing@mutating.test', 'BILLING'],
    ['rate-limit-mutating-clear-growth', 'rate-limit-owner@mutating.test', 'OWNER'],
    ['rate-limit-mutating-clear-growth', 'rate-limit-admin@mutating.test', 'ADMIN'],
    ['rate-limit-mutating-clear-scale', 'rate-limit-owner@mutating.test', 'OWNER'],
    ['rate-limit-mutating-clear-scale', 'rate-limit-admin@mutating.test', 'ADMIN'],
    // All 5 roles — GET /tenant/audit-log is OWNER/ADMIN only
    // (rbac-matrix.md "View audit log"), so this tenant stays self-contained
    // for its own future RBAC-negative tests too.
    ['audit-log-mutating', 'audit-log-owner@mutating.test', 'OWNER'],
    ['audit-log-mutating', 'audit-log-admin@mutating.test', 'ADMIN'],
    ['audit-log-mutating', 'audit-log-member@mutating.test', 'MEMBER'],
    ['audit-log-mutating', 'audit-log-viewer@mutating.test', 'VIEWER'],
    ['audit-log-mutating', 'audit-log-billing@mutating.test', 'BILLING'],
    ['gw-mutating', 'gw-owner@mutating.test', 'OWNER'],
  ];
  for (const [slug, email, role] of memberships) {
    await pool.query(
      `INSERT INTO memberships (tenant_id, user_id, role) VALUES ($1, $2, $3)
       ON CONFLICT (tenant_id, user_id) DO UPDATE SET role = EXCLUDED.role`,
      [tenants[slug], users[email], role],
    );
  }

  const keys = {};
  const keySpecs = [
    ['acme', 'Production'],
    ['acme', 'Staging'],
    ['northwind', 'Production'],
    ['northwind', 'Analytics pipeline'],
    ['sakura', 'Production'],
    // Part C / SUP-1067: fixed, known keys so the test can reference them as
    // literal constants (gw-api.data.ts) rather than needing new
    // read-back-what-was-generated infra — safe since the DB only ever
    // stores the hash either way. Two separate keys, not one: rate-limit.guard.ts's
    // Redis bucket is keyed per api-key prefix, so the sequential-baseline
    // test and the concurrent-burst test need independent buckets — sharing
    // one key would let the baseline test's counts pollute the burst test's
    // window (or vice versa) regardless of timing.
    ['gw-mutating', 'Ping Sequential', { prefix: 'mk_gwmutatingpingsequential', secret: 'gwmutatingpingsequentialsecretgwmutatingpingsequential' }],
    ['gw-mutating', 'Ping Burst', { prefix: 'mk_gwmutatingpingburst', secret: 'gwmutatingpingburstsecretgwmutatingpingburstsecret' }],
    // Smoke keys for echo/transform (gw/echo, gw/transform) — confirm
    // RateLimitGuard is actually wired up on those endpoints too, without
    // re-running the full concurrency investigation ping's spec already
    // covers (the guard is endpoint-agnostic, applied once at the controller
    // class level — see rate-limit-concurrency test's own reasoning).
    ['gw-mutating', 'Echo', { prefix: 'mk_gwmutatingecho', secret: 'gwmutatingechosecretgwmutatingechosecretgwmutatingecho' }],
    ['gw-mutating', 'Transform', { prefix: 'mk_gwmutatingtransform', secret: 'gwmutatingtransformsecretgwmutatingtransformsecret' }],
  ];
  if (large) {
    for (let i = 1; i <= 24; i++) keySpecs.push(['northwind', `Pipeline worker ${i}`]);
  }
  for (const [slug, name, fixed] of keySpecs) {
    // `fixed` lets a spec pin a known prefix/secret instead of a random one —
    // for a scratch key a test needs to reference as a literal constant
    // (rather than reading back what got generated). Safe to do since the DB
    // only ever stores the secret's hash either way; nothing about the
    // random-by-default case relies on the value being unpredictable.
    const prefix = fixed ? fixed.prefix : 'mk_' + randomBytes(4).toString('hex');
    const secret = fixed ? fixed.secret : randomBytes(24).toString('hex');
    const { rows } = await pool.query(
      `INSERT INTO api_keys (tenant_id, name, prefix, secret_hash)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [tenants[slug], name, prefix, hash(secret)],
    );
    keys[`${slug}:${name}`] = { id: rows[0].id, full: `${prefix}.${secret}` };
  }

  await pool.query(
    `INSERT INTO webhook_endpoints (tenant_id, label, url, secret)
     VALUES ($1, $2, $3, $4)`,
    [tenants.acme, 'Ops alerts', 'http://mock-billing:4010/_webhook', randomBytes(16).toString('hex')],
  );

  const routes = ['GET /gw/ping', 'POST /gw/echo', 'POST /gw/transform'];
  async function seedUsage(tenantSlug, keyName, count, days) {
    const keyId = keys[`${tenantSlug}:${keyName}`].id;
    const tenantId = tenants[tenantSlug];
    const batch = 2000;
    for (let i = 0; i < count; i += batch) {
      const values = [];
      const params = [];
      let p = 1;
      for (let j = 0; j < Math.min(batch, count - i); j++) {
        const ago = Math.random() * days * 86400_000;
        values.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
        params.push(
          tenantId,
          keyId,
          routes[Math.floor(Math.random() * routes.length)],
          Math.random() < 0.03 ? 500 : 200,
          Math.floor(10 + Math.random() * 120),
          new Date(Date.now() - ago),
        );
      }
      await pool.query(
        `INSERT INTO usage_events (tenant_id, api_key_id, route, status, latency_ms, created_at)
         VALUES ${values.join(',')}`,
        params,
      );
    }
    console.log(`  seeded ${count} events for ${tenantSlug}/${keyName}`);
  }

  console.log('Seeding usage...');
  await seedUsage('acme', 'Production', 4000, 30);
  await seedUsage('acme', 'Staging', 500, 30);
  await seedUsage('sakura', 'Production', 3000, 30);
  await seedUsage('northwind', 'Production', large ? 250000 : 6000, 45);
  await seedUsage('northwind', 'Analytics pipeline', large ? 40000 : 2000, 45);
  if (large) {
    for (let i = 1; i <= 24; i++) {
      await seedUsage('northwind', `Pipeline worker ${i}`, 10000, 45);
    }
  }

  await pool.query(
    `INSERT INTO usage_daily (tenant_id, day, requests)
     SELECT tenant_id, created_at::date, COUNT(*) FROM usage_events
     GROUP BY tenant_id, created_at::date
     ON CONFLICT (tenant_id, day) DO UPDATE SET requests = EXCLUDED.requests`,
  );

  console.log('\nAPI keys (save these, secrets are not recoverable):');
  for (const [k, v] of Object.entries(keys)) console.log(`  ${k.padEnd(34)} ${v.full}`);
  console.log('\nAll users share the password: Password123!');

  await pool.end();
  return { tenants, users, keys };
}

module.exports = { seed };

if (require.main === module) {
  seed({ large: process.argv.includes('--large') }).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
