import { requireEnv } from '../../utils/env.utils';

export interface LoginRequestBody {
  email: string;
  password: string;
}

// All seeded users share one password (see README's "Seeded data" table); the emails
// themselves aren't secrets — they're fixed identifiers our own seed script creates
// (scripts/seed.js), not credentials for an external system we don't control.
const password = requireEnv('SEED_USER_PASSWORD');

export const ownerLoginBody: LoginRequestBody = { email: 'owner@acme.test', password };
export const adminLoginBody: LoginRequestBody = { email: 'admin@acme.test', password };
export const memberLoginBody: LoginRequestBody = { email: 'member@acme.test', password };
export const viewerLoginBody: LoginRequestBody = { email: 'viewer@acme.test', password };
export const billingLoginBody: LoginRequestBody = { email: 'billing@acme.test', password };

export interface LoginResponseBody {
  accessToken: string;
  refreshToken: string;
  user: { id: string; email: string };
  tenants: Array<{ id: string; name: string; slug: string; plan: string; role: string }>;
}

// Literal fields only — id is a UUID regenerated on every reseed, so the assertion
// layer attaches its own matcher for it rather than this file holding a fake one.
export interface ExpectedTenantMembership {
  name: string;
  slug: string;
  plan: string;
  role: string;
}
