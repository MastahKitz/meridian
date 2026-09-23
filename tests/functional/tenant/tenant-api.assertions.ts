import { APIResponse, expect } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../utils/api.utils';
import { getTenantId } from '../utils/seed.utils';
import { TenantErrorResponseBody, TenantLimits, TenantResponseBody } from './tenant-api.data';

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export async function assertGetTenantSuccess(
  response: APIResponse,
  params: {
    name: string;
    slug: string;
    plan: string;
    timezone: string;
    suspended: boolean;
    limits: TenantLimits;
  },
) {
  assertResponseStatus(response, 200);
  const body: TenantResponseBody = await response.json();
  assertResponseBody(body, {
    // the tenant's own id — known exactly for this run, same value getTenantId
    // gives the request layer for `x-tenant-id`, so asserted literally.
    id: getTenantId(params.slug),
    name: params.name,
    slug: params.slug,
    plan: params.plan,
    timezone: params.timezone,
    suspended: params.suspended,
    created_at: expect.stringMatching(ISO_TIMESTAMP),
    limits: params.limits,
  }, { exact: true });
}

// jwt.guard.ts throws this when the Authorization header is missing entirely,
// or present without a "Bearer " prefix.
export async function assertMissingTokenError(response: APIResponse) {
  assertResponseStatus(response, 401);
  const body: TenantErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Missing bearer token',
    error: 'Unauthorized',
    statusCode: 401,
  }, { exact: true });
}

// jwt.guard.ts throws this for any token jsonwebtoken.verify rejects — malformed,
// expired, or signed with a different secret; it never distinguishes which.
export async function assertInvalidTokenError(response: APIResponse) {
  assertResponseStatus(response, 401);
  const body: TenantErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Invalid token',
    error: 'Unauthorized',
    statusCode: 401,
  }, { exact: true });
}

export async function assertMissingTenantIdError(response: APIResponse) {
  assertResponseStatus(response, 403);
  const body: TenantErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Missing x-tenant-id',
    error: 'Forbidden',
    statusCode: 403,
  }, { exact: true });
}

// Tenant isolation (docs/rbac-matrix.md): a valid token for one tenant must not
// grant access to another tenant just because its id was supplied.
export async function assertNotMemberOfTenantError(response: APIResponse) {
  assertResponseStatus(response, 403);
  const body: TenantErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Not a member of this tenant',
    error: 'Forbidden',
    statusCode: 403,
  }, { exact: true });
}
