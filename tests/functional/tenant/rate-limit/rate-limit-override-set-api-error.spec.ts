import { test } from '@playwright/test';
import { withHookRequestContext } from '../../utils/api.utils';
import { generateAccessToken } from '../../auth/login/login-api.flow';
import { getTenantId } from '../../utils/seed.utils';
import {
  rateLimitMutatingOwnerLoginBody,
  rateLimitMutatingAdminLoginBody,
  rateLimitMutatingMemberLoginBody,
  rateLimitMutatingViewerLoginBody,
  rateLimitMutatingBillingLoginBody,
} from '../../auth/login/login-api.data';
import { sendRateLimitOverrideSetRequest } from './rate-limit-api.actions';
import { assertRateLimitCeilingExceededError, assertRequiresOwnerError } from './rate-limit-api.assertions';
import { RATE_LIMIT_OVERRIDE_CEILINGS } from './rate-limit-api.data';
import {
  assertInvalidTokenError,
  assertMissingTokenError,
  assertMissingTenantIdError,
  assertNotMemberOfTenantError,
} from '../../auth/auth-api.assertions';

test.describe('rate limit override set api - errors', { tag: ['@tenant', '@rate-limit', '@api', '@error'] }, () => {
  let ownerToken: string;
  let adminToken: string;
  let memberToken: string;
  let viewerToken: string;
  let billingToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, rateLimitMutatingOwnerLoginBody);
      adminToken = await generateAccessToken(request, rateLimitMutatingAdminLoginBody);
      memberToken = await generateAccessToken(request, rateLimitMutatingMemberLoginBody);
      viewerToken = await generateAccessToken(request, rateLimitMutatingViewerLoginBody);
      billingToken = await generateAccessToken(request, rateLimitMutatingBillingLoginBody);
    });
  });

  test('validate a rate limit override cannot be set with an invalid access token', async ({ request }) => {
    const response = await sendRateLimitOverrideSetRequest(request, 'not-a-real-token', getTenantId('rate-limit-mutating-free'), { rateLimitPerMinute: 200 });
    await assertInvalidTokenError(response);
  });

  test('validate a rate limit override cannot be set for a tenant the actor is not a member of', async ({ request }) => {
    const response = await sendRateLimitOverrideSetRequest(request, ownerToken, getTenantId('northwind'), { rateLimitPerMinute: 200 });
    await assertNotMemberOfTenantError(response);
  });

  test('validate a rate limit override cannot be set without an access token', async ({ request }) => {
    const response = await sendRateLimitOverrideSetRequest(request, undefined, getTenantId('rate-limit-mutating-free'), { rateLimitPerMinute: 200 });
    await assertMissingTokenError(response);
  });

  test('validate a rate limit override cannot be set without a tenant id', async ({ request }) => {
    const response = await sendRateLimitOverrideSetRequest(request, ownerToken, undefined, { rateLimitPerMinute: 200 });
    await assertMissingTenantIdError(response);
  });

  test('validate owner user cannot set a rate limit override above the free plan ceiling', async ({ request }) => {
    const response = await sendRateLimitOverrideSetRequest(request, ownerToken, getTenantId('rate-limit-mutating-free'), {
      rateLimitPerMinute: RATE_LIMIT_OVERRIDE_CEILINGS.FREE + 1,
    });
    await assertRateLimitCeilingExceededError(response, RATE_LIMIT_OVERRIDE_CEILINGS.FREE, 'FREE');
  });

  test('validate owner user cannot set a rate limit override above the growth plan ceiling', async ({ request }) => {
    const response = await sendRateLimitOverrideSetRequest(request, ownerToken, getTenantId('rate-limit-mutating-growth'), {
      rateLimitPerMinute: RATE_LIMIT_OVERRIDE_CEILINGS.GROWTH + 1,
    });
    await assertRateLimitCeilingExceededError(response, RATE_LIMIT_OVERRIDE_CEILINGS.GROWTH, 'GROWTH');
  });

  test('validate owner user cannot set a rate limit override above the scale plan ceiling', async ({ request }) => {
    const response = await sendRateLimitOverrideSetRequest(request, ownerToken, getTenantId('rate-limit-mutating-scale'), {
      rateLimitPerMinute: RATE_LIMIT_OVERRIDE_CEILINGS.SCALE + 1,
    });
    await assertRateLimitCeilingExceededError(response, RATE_LIMIT_OVERRIDE_CEILINGS.SCALE, 'SCALE');
  });

  test('validate admin user cannot set a rate limit override', async ({ request }) => {
    const response = await sendRateLimitOverrideSetRequest(request, adminToken, getTenantId('rate-limit-mutating-free'), { rateLimitPerMinute: 200 });
    await assertRequiresOwnerError(response);
  });

  test('validate member user cannot set a rate limit override', async ({ request }) => {
    const response = await sendRateLimitOverrideSetRequest(request, memberToken, getTenantId('rate-limit-mutating-free'), { rateLimitPerMinute: 200 });
    await assertRequiresOwnerError(response);
  });

  test('validate viewer user cannot set a rate limit override', async ({ request }) => {
    const response = await sendRateLimitOverrideSetRequest(request, viewerToken, getTenantId('rate-limit-mutating-free'), { rateLimitPerMinute: 200 });
    await assertRequiresOwnerError(response);
  });

  test('validate billing user cannot set a rate limit override', async ({ request }) => {
    const response = await sendRateLimitOverrideSetRequest(request, billingToken, getTenantId('rate-limit-mutating-free'), { rateLimitPerMinute: 200 });
    await assertRequiresOwnerError(response);
  });

});
