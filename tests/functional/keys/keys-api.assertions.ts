import { APIResponse, expect } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../utils/api.utils';
import { CreateKeyResponseBody, KeyErrorResponseBody, KeyListItem } from './keys-api.data';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const PREFIX = /^mk_[0-9a-f]{8}$/;
const SECRET = /^mk_[0-9a-f]{8}\.[0-9a-f]{48}$/;

export async function assertKeyCreateSuccess(response: APIResponse, expectedName: string, expectedScopes: string[] | null): Promise<void> {
  assertResponseStatus(response, 201);
  const body: CreateKeyResponseBody = await response.json();
  assertResponseBody(body, {
    id: expect.stringMatching(UUID),
    name: expectedName,
    prefix: expect.stringMatching(PREFIX),
    scopes: expectedScopes,
    created_at: expect.stringMatching(ISO_TIMESTAMP),
    secret: expect.stringMatching(SECRET),
  }, { exact: true });
}

// Finds by id rather than asserting the whole array — keys-mutating
// accumulates one row per happy-path test in the same file, so position/count
// isn't stable across tests the way memberships-list's small fixed set is.
export async function assertKeyListedCorrectly(response: APIResponse, expected: { id: string; name: string; prefix: string; scopes: string[] | null; created_at: string }) {
  assertResponseStatus(response, 200);
  const body: KeyListItem[] = await response.json();
  const entry = body.find((k) => k.id === expected.id);
  expect(entry, `expected key ${expected.id} to be present in GET /api/v1/keys`).toBeDefined();
  assertResponseBody(entry, {
    id: expected.id,
    name: expected.name,
    prefix: expected.prefix,
    revoked_at: null,
    last_used_at: null,
    scopes: expected.scopes,
    created_at: expected.created_at,
  }, { exact: true });
}

export async function assertInvalidScopeError(response: APIResponse) {
  assertResponseStatus(response, 400);
  const body: KeyErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'scopes must be a non-empty array of unique values from: read, write',
    error: 'Bad Request',
    statusCode: 400,
  }, { exact: true });
}

// roles.guard.ts throws this for any role not in the endpoint's @Roles(...) list.
export async function assertRequiresOwnerAdminOrMemberError(response: APIResponse) {
  assertResponseStatus(response, 403);
  const body: KeyErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Requires one of: OWNER, ADMIN, MEMBER',
    error: 'Forbidden',
    statusCode: 403,
  }, { exact: true });
}
