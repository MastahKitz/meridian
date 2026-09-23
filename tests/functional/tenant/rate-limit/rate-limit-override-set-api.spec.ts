import { test } from '@playwright/test';
import { withHookRequestContext } from '../../utils/api.utils';
import { generateAccessToken } from '../../auth/login/login-api.flow';
import { rateLimitMutatingOwnerLoginBody } from '../../auth/login/login-api.data';
import { getTenantId } from '../../utils/seed.utils';
import { assertTenantDetailsCorrect } from '../tenant-api.flow';
import { sendRateLimitOverrideSetRequest } from './rate-limit-api.actions';
import { assertRateLimitOverrideSetSuccess } from './rate-limit-api.assertions';
import {
  RATE_LIMIT_OVERRIDE_CEILINGS,
  rateLimitMutatingFreeTenantDetails,
  rateLimitMutatingGrowthTenantDetails,
  rateLimitMutatingScaleTenantDetails,
} from './rate-limit-api.data';

test.describe('rate limit override set api', { tag: ['@tenant', '@rate-limit', '@api', '@mutating'] }, () => {
  let ownerToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, rateLimitMutatingOwnerLoginBody);
    });
  });

  test('validate owner user can set a rate limit override up to the free plan ceiling', async ({ request }) => {
    const tenant = rateLimitMutatingFreeTenantDetails;
    const rateLimitPerMinute = RATE_LIMIT_OVERRIDE_CEILINGS.FREE - 1;
    const tenantId = getTenantId(tenant.slug);

    const patchResponse = await sendRateLimitOverrideSetRequest(request, ownerToken, tenantId, { rateLimitPerMinute });
    await assertRateLimitOverrideSetSuccess(patchResponse, tenant, rateLimitPerMinute);

    await assertTenantDetailsCorrect(request, ownerToken, tenantId, { ...tenant, limits: { ...tenant.limits, rateLimitPerMinute } });
  });

  test('validate owner user can set a rate limit override up to the growth plan ceiling', async ({ request }) => {
    const tenant = rateLimitMutatingGrowthTenantDetails;
    const rateLimitPerMinute = RATE_LIMIT_OVERRIDE_CEILINGS.GROWTH - 1;
    const tenantId = getTenantId(tenant.slug);

    const patchResponse = await sendRateLimitOverrideSetRequest(request, ownerToken, tenantId, { rateLimitPerMinute });
    await assertRateLimitOverrideSetSuccess(patchResponse, tenant, rateLimitPerMinute);

    await assertTenantDetailsCorrect(request, ownerToken, tenantId, { ...tenant, limits: { ...tenant.limits, rateLimitPerMinute } });
  });

  test('validate owner user can set a rate limit override up to the scale plan ceiling', async ({ request }) => {
    const tenant = rateLimitMutatingScaleTenantDetails;
    const rateLimitPerMinute = RATE_LIMIT_OVERRIDE_CEILINGS.SCALE - 1;
    const tenantId = getTenantId(tenant.slug);

    const patchResponse = await sendRateLimitOverrideSetRequest(request, ownerToken, tenantId, { rateLimitPerMinute });
    await assertRateLimitOverrideSetSuccess(patchResponse, tenant, rateLimitPerMinute);

    await assertTenantDetailsCorrect(request, ownerToken, tenantId, { ...tenant, limits: { ...tenant.limits, rateLimitPerMinute } });
  });

  test('validate owner user can set a rate limit override exactly at the free plan ceiling', async ({ request }) => {
    const tenant = rateLimitMutatingFreeTenantDetails;
    const rateLimitPerMinute = RATE_LIMIT_OVERRIDE_CEILINGS.FREE;
    const tenantId = getTenantId(tenant.slug);

    const patchResponse = await sendRateLimitOverrideSetRequest(request, ownerToken, tenantId, { rateLimitPerMinute });
    await assertRateLimitOverrideSetSuccess(patchResponse, tenant, rateLimitPerMinute);

    await assertTenantDetailsCorrect(request, ownerToken, tenantId, { ...tenant, limits: { ...tenant.limits, rateLimitPerMinute } });
  });

  test('validate owner user can set a rate limit override exactly at the growth plan ceiling', async ({ request }) => {
    const tenant = rateLimitMutatingGrowthTenantDetails;
    const rateLimitPerMinute = RATE_LIMIT_OVERRIDE_CEILINGS.GROWTH;
    const tenantId = getTenantId(tenant.slug);

    const patchResponse = await sendRateLimitOverrideSetRequest(request, ownerToken, tenantId, { rateLimitPerMinute });
    await assertRateLimitOverrideSetSuccess(patchResponse, tenant, rateLimitPerMinute);

    await assertTenantDetailsCorrect(request, ownerToken, tenantId, { ...tenant, limits: { ...tenant.limits, rateLimitPerMinute } });
  });

  test('validate owner user can set a rate limit override exactly at the scale plan ceiling', async ({ request }) => {
    const tenant = rateLimitMutatingScaleTenantDetails;
    const rateLimitPerMinute = RATE_LIMIT_OVERRIDE_CEILINGS.SCALE;
    const tenantId = getTenantId(tenant.slug);

    const patchResponse = await sendRateLimitOverrideSetRequest(request, ownerToken, tenantId, { rateLimitPerMinute });
    await assertRateLimitOverrideSetSuccess(patchResponse, tenant, rateLimitPerMinute);

    await assertTenantDetailsCorrect(request, ownerToken, tenantId, { ...tenant, limits: { ...tenant.limits, rateLimitPerMinute } });
  });

});
