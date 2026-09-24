import { test } from '@playwright/test';
import { withHookRequestContext } from '../utils/api.utils';
import { generateAccessToken } from '../auth/login/login-api.flow';
import { getTenantId } from '../utils/seed.utils';
import {
  keysMutatingOwnerLoginBody,
  keysMutatingAdminLoginBody,
  keysMutatingMemberLoginBody,
} from '../auth/login/login-api.data';
import { sendKeyCreateRequest, getGeneratedKey } from './keys-api.actions';
import { assertKeyCreateSuccess } from './keys-api.assertions';
import { assertKeyPersistedCorrectly } from './keys-api.flow';

// docs/qa/conventions.md rule 24: this spec proves POST /api/v1/keys persists
// the requested scopes correctly (create response + GET /api/v1/keys
// read-back) — whether ScopeGuard actually enforces those scopes on a real
// gateway call is gw/'s own concern (see gw/ping/ping-api.spec.ts,
// gw/echo/echo-api.spec.ts, gw/transform/transform-api.spec.ts and their
// -error counterparts).
test.describe('keys api - create', { tag: ['@keys', '@api', '@mutating'] }, () => {
  let ownerToken: string;
  let adminToken: string;
  let memberToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, keysMutatingOwnerLoginBody);
      adminToken = await generateAccessToken(request, keysMutatingAdminLoginBody);
      memberToken = await generateAccessToken(request, keysMutatingMemberLoginBody);
    });
  });

  test('validate a key can be created without scopes', async ({ request }) => {
    const response = await sendKeyCreateRequest(request, ownerToken, getTenantId('keys-mutating'), { name: 'Unscoped' });
    await assertKeyCreateSuccess(response, 'Unscoped', null);
    const key = await getGeneratedKey(response);
    await assertKeyPersistedCorrectly(request, ownerToken, getTenantId('keys-mutating'), key);
  });

  test('validate a key can be created with only the write scope', async ({ request }) => {
    const response = await sendKeyCreateRequest(request, ownerToken, getTenantId('keys-mutating'), { name: 'Write only', scopes: ['write'] });
    await assertKeyCreateSuccess(response, 'Write only', ['write']);
    const key = await getGeneratedKey(response);
    await assertKeyPersistedCorrectly(request, ownerToken, getTenantId('keys-mutating'), key);
  });

  test('validate a key can be created with only the read scope', async ({ request }) => {
    const response = await sendKeyCreateRequest(request, ownerToken, getTenantId('keys-mutating'), { name: 'Read only', scopes: ['read'] });
    await assertKeyCreateSuccess(response, 'Read only', ['read']);
    const key = await getGeneratedKey(response);
    await assertKeyPersistedCorrectly(request, ownerToken, getTenantId('keys-mutating'), key);
  });

  test('validate a key can be created with both read and write scopes', async ({ request }) => {
    const response = await sendKeyCreateRequest(request, ownerToken, getTenantId('keys-mutating'), { name: 'Read and write', scopes: ['read', 'write'] });
    await assertKeyCreateSuccess(response, 'Read and write', ['read', 'write']);
    const key = await getGeneratedKey(response);
    await assertKeyPersistedCorrectly(request, ownerToken, getTenantId('keys-mutating'), key);
  });

  test('validate admin user can create a key', async ({ request }) => {
    const response = await sendKeyCreateRequest(request, adminToken, getTenantId('keys-mutating'), { name: 'Admin created' });
    await assertKeyCreateSuccess(response, 'Admin created', null);
    const key = await getGeneratedKey(response);
    await assertKeyPersistedCorrectly(request, adminToken, getTenantId('keys-mutating'), key);
  });

  test('validate member user can create a key', async ({ request }) => {
    const response = await sendKeyCreateRequest(request, memberToken, getTenantId('keys-mutating'), { name: 'Member created' });
    await assertKeyCreateSuccess(response, 'Member created', null);
    const key = await getGeneratedKey(response);
    await assertKeyPersistedCorrectly(request, memberToken, getTenantId('keys-mutating'), key);
  });

});
