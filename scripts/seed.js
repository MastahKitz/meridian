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
  ];
  if (large) {
    for (let i = 1; i <= 24; i++) keySpecs.push(['northwind', `Pipeline worker ${i}`]);
  }
  for (const [slug, name] of keySpecs) {
    const prefix = 'mk_' + randomBytes(4).toString('hex');
    const secret = randomBytes(24).toString('hex');
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
