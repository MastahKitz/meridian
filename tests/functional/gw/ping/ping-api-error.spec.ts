import { test } from '@playwright/test';
import { withHookRequestContext, assertResponseStatus, waitSeconds } from '../../utils/api.utils';
import { generateAccessToken } from '../../auth/login/login-api.flow';
import { keysMutatingOwnerLoginBody } from '../../auth/login/login-api.data';
import { getTenantId } from '../../utils/seed.utils';
import { createKey, revokeKey } from '../../keys/keys-api.flow';
import { rotateKey } from '../../keys/rotate/rotate-api.flow';
import { GW_MUTATING_SCOPE_WRITE_API_KEY } from '../gw-api.data';
import { sendPingRequest } from './ping-api.actions';
import { assertScopeForbiddenError, assertInvalidApiKeyError } from '../gw-api.assertions';

test.describe('gw ping api - errors', { tag: ['@gw', '@ping', '@api', '@error', '@mutating'] }, () => {
  let ownerToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, keysMutatingOwnerLoginBody);
    });
  });

  test('validate a write-only-scoped key cannot read via ping', async ({ request }) => {
    const response = await sendPingRequest(request, GW_MUTATING_SCOPE_WRITE_API_KEY);
    await assertScopeForbiddenError(response, 'read');
  });

  test('validate a revoked key is rejected on ping', async ({ request }) => {
    const tenantId = getTenantId('keys-mutating');
    const key = await createKey(request, ownerToken, tenantId, { name: 'SUP-1051 repro (ping)' });

    const beforeRevoke = await sendPingRequest(request, key.secret);
    assertResponseStatus(beforeRevoke, 200);

    await revokeKey(request, ownerToken, tenantId, key.id);

    const afterRevoke = await sendPingRequest(request, key.secret);
    await assertInvalidApiKeyError(afterRevoke);
  });

  test('validate the previous secret stops working once its rotation grace period ends', async ({ request }) => {
    const tenantId = getTenantId('keys-mutating');
    const key = await createKey(request, ownerToken, tenantId, { name: 'Rotate grace period (ping)' });
    const oldSecret = key.secret;

    const rotated = await rotateKey(request, ownerToken, tenantId, key.id, { gracePeriodSeconds: 10 });

    const oldSecretJustAfterRotate = await sendPingRequest(request, oldSecret);
    assertResponseStatus(oldSecretJustAfterRotate, 200);

    const newSecretJustAfterRotate = await sendPingRequest(request, rotated.secret);
    assertResponseStatus(newSecretJustAfterRotate, 200);

    await waitSeconds(5);
    const oldSecretMidGrace = await sendPingRequest(request, oldSecret);
    assertResponseStatus(oldSecretMidGrace, 200);

    await waitSeconds(5);
    const oldSecretAfterGrace = await sendPingRequest(request, oldSecret);
    await assertInvalidApiKeyError(oldSecretAfterGrace);

    const newSecretAfterGrace = await sendPingRequest(request, rotated.secret);
    assertResponseStatus(newSecretAfterGrace, 200);
  });

});
