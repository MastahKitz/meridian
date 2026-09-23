import { test } from '@playwright/test';
import { withHookRequestContext } from '../../utils/api.utils';
import { generateAccessToken } from '../../auth/login/login-api.flow';
import { rateLimitMutatingOwnerLoginBody } from '../../auth/login/login-api.data';
import { getTenantId } from '../../utils/seed.utils';
import { assertTenantDetailsCorrect } from '../tenant-api.flow';
import { setRateLimitOverride } from './rate-limit-api.flow';
import { sendRateLimitOverrideClearRequest } from './rate-limit-api.actions';
import { assertRateLimitOverrideClearSuccess } from './rate-limit-api.assertions';
import {
  RATE_LIMIT_OVERRIDE_CEILINGS,
  rateLimitMutatingClearFreeTenantDetails,
  rateLimitMutatingClearGrowthTenantDetails,
  rateLimitMutatingClearScaleTenantDetails,
} from './rate-limit-api.data';

test.describe('rate limit override clear api', { tag: ['@tenant', '@rate-limit', '@api', '@mutating'] }, () => {
  let ownerToken: string;

  test.beforeAll(async ({ playwright }) => {
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, rateLimitMutatingOwnerLoginBody);
    });
  });

  test('validate owner user can clear a rate limit override on a free plan tenant', async ({ request }) => {
    const tenant = rateLimitMutatingClearFreeTenantDetails;
    const tenantId = getTenantId(tenant.slug);

    await setRateLimitOverride(request, ownerToken, tenant, RATE_LIMIT_OVERRIDE_CEILINGS.FREE - 1);

    const deleteResponse = await sendRateLimitOverrideClearRequest(request, ownerToken, tenantId);
    await assertRateLimitOverrideClearSuccess(deleteResponse, tenant);

    await assertTenantDetailsCorrect(request, ownerToken, tenantId, tenant);
  });

  test('validate owner user can clear a rate limit override on a growth plan tenant', async ({ request }) => {
    const tenant = rateLimitMutatingClearGrowthTenantDetails;
    const tenantId = getTenantId(tenant.slug);

    await setRateLimitOverride(request, ownerToken, tenant, RATE_LIMIT_OVERRIDE_CEILINGS.GROWTH - 1);

    const deleteResponse = await sendRateLimitOverrideClearRequest(request, ownerToken, tenantId);
    await assertRateLimitOverrideClearSuccess(deleteResponse, tenant);

    await assertTenantDetailsCorrect(request, ownerToken, tenantId, tenant);
  });

  test('validate owner user can clear a rate limit override on a scale plan tenant', async ({ request }) => {
    const tenant = rateLimitMutatingClearScaleTenantDetails;
    const tenantId = getTenantId(tenant.slug);

    await setRateLimitOverride(request, ownerToken, tenant, RATE_LIMIT_OVERRIDE_CEILINGS.SCALE - 1);

    const deleteResponse = await sendRateLimitOverrideClearRequest(request, ownerToken, tenantId);
    await assertRateLimitOverrideClearSuccess(deleteResponse, tenant);

    await assertTenantDetailsCorrect(request, ownerToken, tenantId, tenant);
  });

});
