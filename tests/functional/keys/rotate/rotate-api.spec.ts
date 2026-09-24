import { test } from '@playwright/test';
import { withHookRequestContext } from '../../utils/api.utils';
import { generateAccessToken } from '../../auth/login/login-api.flow';
import { getTenantId } from '../../utils/seed.utils';
import { keysMutatingOwnerLoginBody, keysMutatingAdminLoginBody } from '../../auth/login/login-api.data';
import { createKey, assertKeyPersistedCorrectly } from '../keys-api.flow';
import { sendKeyRotateRequest } from './rotate-api.actions';
import { assertKeyRotateSuccess } from './rotate-api.assertions';

// docs/qa/conventions.md rule 24: this spec proves POST /api/v1/keys/:id/rotate
// persists a new secret while leaving the key's identity (id/name/prefix/scopes/
// created_at) unchanged — whether the previous secret's grace period is
// actually enforced by the gateway is gw/'s own concern (see
// gw/ping/ping-api-error.spec.ts).
test.describe('keys api - rotate', { tag: ['@keys', '@rotate', '@api', '@mutating'] }, () => {
  let ownerToken: string;
  let adminToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, keysMutatingOwnerLoginBody);
      adminToken = await generateAccessToken(request, keysMutatingAdminLoginBody);
    });
  });

  test('validate owner user can rotate a key', async ({ request }) => {
    const tenantId = getTenantId('keys-mutating');
    const key = await createKey(request, ownerToken, tenantId, { name: 'Rotate happy path (owner)' });

    const response = await sendKeyRotateRequest(request, ownerToken, tenantId, key.id, {});
    await assertKeyRotateSuccess(response, key, key.secret);

    await assertKeyPersistedCorrectly(request, ownerToken, tenantId, key);
  });

  test('validate admin user can rotate a key', async ({ request }) => {
    const tenantId = getTenantId('keys-mutating');
    const key = await createKey(request, ownerToken, tenantId, { name: 'Rotate happy path (admin)' });

    const response = await sendKeyRotateRequest(request, adminToken, tenantId, key.id, {});
    await assertKeyRotateSuccess(response, key, key.secret);

    await assertKeyPersistedCorrectly(request, ownerToken, tenantId, key);
  });

  test('validate a key can be rotated with a custom grace period', async ({ request }) => {
    const tenantId = getTenantId('keys-mutating');
    const key = await createKey(request, ownerToken, tenantId, { name: 'Rotate custom grace period' });

    const response = await sendKeyRotateRequest(request, ownerToken, tenantId, key.id, { gracePeriodSeconds: 60 });
    await assertKeyRotateSuccess(response, key, key.secret);

    await assertKeyPersistedCorrectly(request, ownerToken, tenantId, key);
  });

});
