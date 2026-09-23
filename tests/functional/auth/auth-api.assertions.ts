import { APIResponse } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../utils/api.utils';
import { AuthErrorResponseBody } from './auth-api.data';

// jwt.guard.ts throws this when the Authorization header is missing entirely,
// or present without a "Bearer " prefix. Applies identically to every domain's
// JwtGuard-guarded routes, not just one — see docs/qa/conventions.md rule 19.
export async function assertMissingTokenError(response: APIResponse) {
  assertResponseStatus(response, 401);
  const body: AuthErrorResponseBody = await response.json();
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
  const body: AuthErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Invalid token',
    error: 'Unauthorized',
    statusCode: 401,
  }, { exact: true });
}

export async function assertMissingTenantIdError(response: APIResponse) {
  assertResponseStatus(response, 403);
  const body: AuthErrorResponseBody = await response.json();
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
  const body: AuthErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Not a member of this tenant',
    error: 'Forbidden',
    statusCode: 403,
  }, { exact: true });
}
