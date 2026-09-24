import { test } from '@playwright/test';
import { withHookRequestContext } from '../utils/api.utils';
import { generateAccessToken } from '../auth/login/login-api.flow';
import { usageMutatingOwnerLoginBody } from '../auth/login/login-api.data';
import { getTenantId } from '../utils/seed.utils';
import { createKey } from '../keys/keys-api.flow';
import { rotateKey } from '../keys/rotate/rotate-api.flow';
import { sendPingRequest } from '../gw/ping/ping-api.actions';
import { sendUsageSummaryRequest } from './usage-api.actions';
import { assertUsageSummary } from './usage-api.assertions';

test.describe('usage api - summary', { tag: ['@usage', '@api', '@mutating'] }, () => {
  let ownerToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, usageMutatingOwnerLoginBody);
    });
  });

  test('validate usage from both the previous and new secret is attributed to the same key', async ({ request }) => {
    const tenantId = getTenantId('usage-mutating');
    const key = await createKey(request, ownerToken, tenantId, { name: 'Usage attribution' });

    await sendPingRequest(request, key.secret);
    await sendPingRequest(request, key.secret);

    const rotated = await rotateKey(request, ownerToken, tenantId, key.id, {});

    await sendPingRequest(request, key.secret);
    await sendPingRequest(request, rotated.secret);
    await sendPingRequest(request, rotated.secret);

    const response = await sendUsageSummaryRequest(request, ownerToken, tenantId);
    await assertUsageSummary(response, { keyId: key.id, name: 'Usage attribution', prefix: key.prefix, requests: 5 });
  });

});
