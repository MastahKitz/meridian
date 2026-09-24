import { test } from '@playwright/test';
import { withHookRequestContext } from '../../utils/api.utils';
import { generateAccessToken } from '../../auth/login/login-api.flow';
import { gwMutatingOwnerLoginBody } from '../../auth/login/login-api.data';
import { setRateLimitOverride } from '../../tenant/rate-limit/rate-limit-api.flow';
import { gwMutatingTenantDetails, GW_MUTATING_TRANSFORM_API_KEY } from '../gw-api.data';
import { sendTransformRequest } from './transform-api.actions';
import { assertRateLimitEnforcedSequentially } from '../gw-api.assertions';

const LIMIT = 5;
const REQUEST_COUNT = 8;

test.describe('gw transform rate limit', { tag: ['@gw', '@transform', '@api', '@mutating'] }, () => {
  let ownerToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, gwMutatingOwnerLoginBody);
    });
  });

  test('validate the rate limit override is enforced on transform', async ({ request }) => {
    await setRateLimitOverride(request, ownerToken, gwMutatingTenantDetails, LIMIT);

    const responses = [];
    for (let i = 0; i < REQUEST_COUNT; i++) {
      responses.push(await sendTransformRequest(request, GW_MUTATING_TRANSFORM_API_KEY));
    }

    assertRateLimitEnforcedSequentially(responses, LIMIT, 201);
  });

});
