import { test } from '@playwright/test';
import { withHookRequestContext, assertResponseStatus } from '../../utils/api.utils';
import { generateAccessToken } from '../../auth/login/login-api.flow';
import { keysMutatingOwnerLoginBody } from '../../auth/login/login-api.data';
import { getTenantId } from '../../utils/seed.utils';
import { createKey, revokeKey } from '../../keys/keys-api.flow';
import { GW_MUTATING_SCOPE_READ_API_KEY } from '../gw-api.data';
import { sendEchoRequest } from './echo-api.actions';
import { assertScopeForbiddenError, assertInvalidApiKeyError } from '../gw-api.assertions';

test.describe('gw echo api - errors', { tag: ['@gw', '@echo', '@api', '@error', '@mutating'] }, () => {
  let ownerToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, keysMutatingOwnerLoginBody);
    });
  });

  test('validate a read-only-scoped key cannot write via echo', async ({ request }) => {
    const response = await sendEchoRequest(request, GW_MUTATING_SCOPE_READ_API_KEY);
    await assertScopeForbiddenError(response, 'write');
  });

  test('validate a revoked key is rejected on echo', async ({ request }) => {
    const tenantId = getTenantId('keys-mutating');
    const key = await createKey(request, ownerToken, tenantId, { name: 'SUP-1051 repro (echo)' });

    const beforeRevoke = await sendEchoRequest(request, key.secret);
    assertResponseStatus(beforeRevoke, 201);

    await revokeKey(request, ownerToken, tenantId, key.id);

    const afterRevoke = await sendEchoRequest(request, key.secret);
    await assertInvalidApiKeyError(afterRevoke);
  });

});
