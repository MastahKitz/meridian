import { APIResponse, expect } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../../utils/api.utils';
import { CreateKeyResponseBody, KeyErrorResponseBody } from '../keys-api.data';

const SECRET = /^mk_[0-9a-f]{8}\.[0-9a-f]{48}$/;

// id/name/prefix/scopes/created_at must come back unchanged — rotation only
// replaces the secret, it doesn't create a new key identity.
export async function assertKeyRotateSuccess(
  response: APIResponse,
  expected: { id: string; name: string; prefix: string; scopes: string[] | null; created_at: string },
  previousSecret: string,
): Promise<void> {
  assertResponseStatus(response, 201);
  const body: CreateKeyResponseBody = await response.json();
  assertResponseBody(body, {
    id: expected.id,
    name: expected.name,
    prefix: expected.prefix,
    scopes: expected.scopes,
    created_at: expected.created_at,
    secret: expect.stringMatching(SECRET),
  }, { exact: true });
  expect.soft(body.secret, 'expected rotation to issue a different secret').not.toBe(previousSecret);
}

export async function assertInvalidGracePeriodError(response: APIResponse) {
  assertResponseStatus(response, 400);
  const body: KeyErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'gracePeriodSeconds must be an integer between 0 and 86400',
    error: 'Bad Request',
    statusCode: 400,
  }, { exact: true });
}

// roles.guard.ts throws this for any role not in the endpoint's @Roles(...)
// list — rotate() is OWNER/ADMIN only, unlike create()'s OWNER/ADMIN/MEMBER.
export async function assertRequiresOwnerAdminError(response: APIResponse) {
  assertResponseStatus(response, 403);
  const body: KeyErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Requires one of: OWNER, ADMIN',
    error: 'Forbidden',
    statusCode: 403,
  }, { exact: true });
}

export async function assertKeyNotFoundOrAlreadyRevokedError(response: APIResponse) {
  assertResponseStatus(response, 404);
  const body: KeyErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Key not found or already revoked',
    error: 'Not Found',
    statusCode: 404,
  }, { exact: true });
}
