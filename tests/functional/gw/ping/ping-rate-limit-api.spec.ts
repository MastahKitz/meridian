import { test } from '@playwright/test';
import { withHookRequestContext } from '../../utils/api.utils';
import { generateAccessToken } from '../../auth/login/login-api.flow';
import { gwMutatingOwnerLoginBody } from '../../auth/login/login-api.data';
import { setRateLimitOverride } from '../../tenant/rate-limit/rate-limit-api.flow';
import {
  gwMutatingTenantDetails,
  GW_MUTATING_PING_SEQUENTIAL_API_KEY,
  GW_MUTATING_PING_BURST_API_KEY,
} from '../gw-api.data';
import { sendPingRequest } from './ping-api.actions';
import { assertRateLimitEnforcedSequentially, assertRateLimitNotExceeded } from '../gw-api.assertions';

const LIMIT = 5;
const BURST_SIZE = 20;

test.describe('gw ping rate limit concurrency (SUP-1067)', { tag: ['@gw', '@ping', '@api', '@mutating', '@defect'] }, () => {
  let ownerToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, gwMutatingOwnerLoginBody);
      await setRateLimitOverride(request, ownerToken, gwMutatingTenantDetails, LIMIT);
    });
  });

  test('validate sequential requests correctly enforce the rate limit override', async ({ request }) => {
    const responses = [];
    for (let i = 0; i < BURST_SIZE; i++) {
      responses.push(await sendPingRequest(request, GW_MUTATING_PING_SEQUENTIAL_API_KEY));
    }

    assertRateLimitEnforcedSequentially(responses, LIMIT, 200);
  });

   test('validate concurrent requests do not exceed the rate limit override', async ({ request }) => {
    const responses = await Promise.all(
      Array.from({ length: BURST_SIZE }, () => sendPingRequest(request, GW_MUTATING_PING_BURST_API_KEY)),
    );

    assertRateLimitNotExceeded(responses, LIMIT);
  });

});
