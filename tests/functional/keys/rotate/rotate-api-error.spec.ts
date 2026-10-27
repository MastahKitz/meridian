import { test } from '@playwright/test';
import { withHookRequestContext } from '../../utils/api.utils';
import { generateAccessToken } from '../../auth/login/login-api.flow';
import { getTenantId } from '../../utils/seed.utils';
import {
  keysMutatingOwnerLoginBody,
  keysMutatingMemberLoginBody,
  keysMutatingViewerLoginBody,
  keysMutatingBillingLoginBody,
} from '../../auth/login/login-api.data';
import { createKey, revokeKey } from '../keys-api.flow';
import { sendKeyRotateRequest } from './rotate-api.actions';
import {
  assertRequiresOwnerAdminError,
  assertInvalidGracePeriodError,
  assertKeyNotFoundOrAlreadyRevokedError,
} from './rotate-api.assertions';
import {
  assertInvalidTokenError,
  assertMissingTokenError,
  assertMissingTenantIdError,
  assertNotMemberOfTenantError,
} from '../../auth/auth-api.assertions';

const FAKE_KEY_ID = '00000000-0000-0000-0000-000000000000';

test.describe('keys api - rotate errors', { tag: ['@keys', '@rotate', '@api', '@error', '@mutating'] }, () => {
  let ownerToken: string;
  let memberToken: string;
  let viewerToken: string;
  let billingToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, keysMutatingOwnerLoginBody);
      memberToken = await generateAccessToken(request, keysMutatingMemberLoginBody);
      viewerToken = await generateAccessToken(request, keysMutatingViewerLoginBody);
      billingToken = await generateAccessToken(request, keysMutatingBillingLoginBody);
    });
  });

  test('validate a key cannot be rotated with an invalid access token', async ({ request }) => {
    const response = await sendKeyRotateRequest(request, 'not-a-real-token', getTenantId('keys-mutating'), FAKE_KEY_ID, {});
    await assertInvalidTokenError(response);
  });

  test('validate a key cannot be rotated for a tenant the actor is not a member of', async ({ request }) => {
    const response = await sendKeyRotateRequest(request, ownerToken, getTenantId('northwind'), FAKE_KEY_ID, {});
    await assertNotMemberOfTenantError(response);
  });

  test('validate a key cannot be rotated without an access token', async ({ request }) => {
    const response = await sendKeyRotateRequest(request, undefined, getTenantId('keys-mutating'), FAKE_KEY_ID, {});
    await assertMissingTokenError(response);
  });

  test('validate a key cannot be rotated without a tenant id', async ({ request }) => {
    const response = await sendKeyRotateRequest(request, ownerToken, undefined, FAKE_KEY_ID, {});
    await assertMissingTenantIdError(response);
  });

  // docs/rbac-matrix.md / keys.controller.ts: rotate() is OWNER/ADMIN only —
  // stricter than create()'s OWNER/ADMIN/MEMBER, so MEMBER is rejected here too.
  test('validate member user cannot rotate a key', async ({ request }) => {
    const response = await sendKeyRotateRequest(request, memberToken, getTenantId('keys-mutating'), FAKE_KEY_ID, {});
    await assertRequiresOwnerAdminError(response);
  });

  test('validate viewer user cannot rotate a key', async ({ request }) => {
    const response = await sendKeyRotateRequest(request, viewerToken, getTenantId('keys-mutating'), FAKE_KEY_ID, {});
    await assertRequiresOwnerAdminError(response);
  });

  test('validate billing user cannot rotate a key', async ({ request }) => {
    const response = await sendKeyRotateRequest(request, billingToken, getTenantId('keys-mutating'), FAKE_KEY_ID, {});
    await assertRequiresOwnerAdminError(response);
  });

  test('validate a key cannot be rotated with a negative grace period', async ({ request }) => {
    const tenantId = getTenantId('keys-mutating');
    const key = await createKey(request, ownerToken, tenantId, { name: 'Rotate negative grace period' });

    const response = await sendKeyRotateRequest(request, ownerToken, tenantId, key.id, { gracePeriodSeconds: -1 });
    await assertInvalidGracePeriodError(response);
  });

  test('validate a key cannot be rotated with a grace period above the maximum', async ({ request }) => {
    const tenantId = getTenantId('keys-mutating');
    const key = await createKey(request, ownerToken, tenantId, { name: 'Rotate above max grace period' });

    const response = await sendKeyRotateRequest(request, ownerToken, tenantId, key.id, { gracePeriodSeconds: 86401 });
    await assertInvalidGracePeriodError(response);
  });

  // A2-key-scopes-and-rotation.md: "A revoked key cannot be rotated."
  test('validate a revoked key cannot be rotated', async ({ request }) => {
    const tenantId = getTenantId('keys-mutating');
    const key = await createKey(request, ownerToken, tenantId, { name: 'Rotate after revoke' });
    await revokeKey(request, ownerToken, tenantId, key.id);

    const response = await sendKeyRotateRequest(request, ownerToken, tenantId, key.id, {});
    await assertKeyNotFoundOrAlreadyRevokedError(response);
  });

});
