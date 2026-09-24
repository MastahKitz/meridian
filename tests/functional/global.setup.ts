import { Pool } from 'pg';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
import { requireEnv } from './utils/env.utils';
// scripts/seed.js is the single source of truth for fixture data — reused here
// rather than reimplemented, so the manual `npm run seed` and the automated test
// setup can never drift apart.
const { seed } = require('../../scripts/seed.js');

export default async function globalSetup() {
  const pool = new Pool({ connectionString: requireEnv('DATABASE_URL') });
  try {
    // CASCADE follows every FK from users/tenants (memberships, sessions, api_keys,
    // usage_events, usage_daily, billing_events, webhook_endpoints, webhook_deliveries,
    // audit_log) — see db/001_init.sql. seed.js assumes it's starting from empty tables.
    await pool.query('TRUNCATE users, tenants RESTART IDENTITY CASCADE');
  } finally {
    await pool.end();
  }

  // rate-limit.guard.ts's buckets (rl:<prefix>:<window>) live in Redis, not
  // Postgres — the TRUNCATE above never touches them. Without this, a rate-limit
  // test's counts from a previous run can carry into the next one if it falls
  // within the same 60s window, since nothing else ever resets them.
  const redis = new Redis(requireEnv('REDIS_URL'));
  try {
    await redis.flushdb();
  } finally {
    redis.disconnect();
  }

  const { tenants } = await seed({ large: process.env.SEED_LARGE === 'true' });

  // Tenant ids are fresh UUIDs every reseed (see utils/seed.utils.ts) — written
  // here once, right after the ids are known, so tests can read a slug's real
  // id without a network round trip.
  fs.writeFileSync(
    path.join(__dirname, 'config/.seed-output.json'),
    JSON.stringify({ tenants }, null, 2),
  );
}
