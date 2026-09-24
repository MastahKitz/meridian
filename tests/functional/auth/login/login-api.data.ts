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
export const northwindOwnerLoginBody: LoginRequestBody = { email: 'owner@northwind.test', password };
export const sakuraOwnerLoginBody: LoginRequestBody = { email: 'owner@sakura.test', password };

// memberships - mutating test data
export const membershipsMutatingOwnerLoginBody: LoginRequestBody = { email: 'memberships-owner@mutating.test', password };
export const membershipsMutatingAdminLoginBody: LoginRequestBody = { email: 'memberships-admin@mutating.test', password };

// rate-limit - mutating test data
export const rateLimitMutatingOwnerLoginBody: LoginRequestBody = { email: 'rate-limit-owner@mutating.test', password };
export const rateLimitMutatingAdminLoginBody: LoginRequestBody = { email: 'rate-limit-admin@mutating.test', password };
export const rateLimitMutatingMemberLoginBody: LoginRequestBody = { email: 'rate-limit-member@mutating.test', password };
export const rateLimitMutatingViewerLoginBody: LoginRequestBody = { email: 'rate-limit-viewer@mutating.test', password };
export const rateLimitMutatingBillingLoginBody: LoginRequestBody = { email: 'rate-limit-billing@mutating.test', password };

// audit-log - mutating test data
export const auditLogMutatingOwnerLoginBody: LoginRequestBody = { email: 'audit-log-owner@mutating.test', password };
export const auditLogMutatingAdminLoginBody: LoginRequestBody = { email: 'audit-log-admin@mutating.test', password };
export const auditLogMutatingMemberLoginBody: LoginRequestBody = { email: 'audit-log-member@mutating.test', password };
export const auditLogMutatingViewerLoginBody: LoginRequestBody = { email: 'audit-log-viewer@mutating.test', password };
export const auditLogMutatingBillingLoginBody: LoginRequestBody = { email: 'audit-log-billing@mutating.test', password };

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

// auth.controller.ts only does a presence check (no email format validation) and
// auth.service.ts never distinguishes "no such user" from "wrong password" — both
// error shapes are Nest's default HttpException body, not a custom envelope.
export interface LoginErrorResponseBody {
  message: string;
  error: string;
  statusCode: number;
}
