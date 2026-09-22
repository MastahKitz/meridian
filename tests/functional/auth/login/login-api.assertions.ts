import { APIResponse, expect } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../../utils/api.utils';
import { ExpectedTenantMembership, LoginResponseBody } from './login-api.data';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// The full response shape is known and asserted exactly — including the tenants array,
// which must be given in full (auth.service.ts orders it by tenant name). Most seeded
// users hold exactly one membership; member@acme.test is the deliberate exception (also
// VIEWER in Northwind, per README), so callers pass every membership they expect rather
// than this function assuming a single Acme-only tenant.
export async function assertLoginSuccess(
  response: APIResponse,
  params: { email: string; tenants: ExpectedTenantMembership[] },
) {
  assertResponseStatus(response, 201);
  const body: LoginResponseBody = await response.json();
  assertResponseBody(body, {
    // JWT: base64url header.payload.signature — regenerated every run.
    accessToken: expect.stringMatching(/^[\w-]+\.[\w-]+\.[\w-]+$/),
    // randomBytes(32).toString('hex') — see auth.service.ts.
    refreshToken: expect.stringMatching(/^[0-9a-f]{64}$/),
    user: { id: expect.stringMatching(UUID), email: params.email },
    tenants: params.tenants.map((t) => ({ id: expect.stringMatching(UUID), ...t })),
  }, { exact: true });
}
