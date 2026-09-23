import fs from 'fs';
import path from 'path';

const SEED_OUTPUT_PATH = path.join(__dirname, '../config/.seed-output.json');

interface SeedOutput {
  tenants: Record<string, string>;
}

let cached: SeedOutput | null = null;

function loadSeedOutput(): SeedOutput {
  if (cached) return cached;
  const parsed: SeedOutput = JSON.parse(fs.readFileSync(SEED_OUTPUT_PATH, 'utf-8'));
  cached = parsed;
  return parsed;
}

// Tenant ids are UUIDs handed out by gen_random_uuid() every time
// global.setup.ts truncates and reseeds — stable for the duration of one run,
// but never hardcodable. global.setup.ts writes this file right after seeding
// so any domain's tests can read a slug's real id directly, without logging in
// and parsing it back out of a login response just to get a header value.
export function getTenantId(slug: string): string {
  const id = loadSeedOutput().tenants[slug];
  if (!id) throw new Error(`No seeded tenant id for slug "${slug}"`);
  return id;
}
