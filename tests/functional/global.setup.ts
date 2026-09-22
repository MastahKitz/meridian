import { Pool } from 'pg';
// scripts/seed.js is the single source of truth for fixture data — reused here
// rather than reimplemented, so the manual `npm run seed` and the automated test
// setup can never drift apart.
const { seed } = require('../../scripts/seed.js');

export default async function globalSetup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    // CASCADE follows every FK from users/tenants (memberships, sessions, api_keys,
    // usage_events, usage_daily, billing_events, webhook_endpoints, webhook_deliveries,
    // audit_log) — see db/001_init.sql. seed.js assumes it's starting from empty tables.
    await pool.query('TRUNCATE users, tenants RESTART IDENTITY CASCADE');
  } finally {
    await pool.end();
  }

  await seed({ large: process.env.SEED_LARGE === 'true' });
}
