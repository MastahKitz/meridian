import { APIRequestContext } from '@playwright/test';
import { assertResponseStatus } from '../../utils/api.utils';
import { getTenantId } from '../../utils/seed.utils';
import { ExpectedTenantDetails } from '../tenant-api.data';
import { sendRateLimitOverrideSetRequest } from './rate-limit-api.actions';

export async function setRateLimitOverride(
  request: APIRequestContext,
  accessToken: string,
  tenant: ExpectedTenantDetails,
  rateLimitPerMinute: number,
): Promise<void> {
  const tenantId = getTenantId(tenant.slug);
  const response = await sendRateLimitOverrideSetRequest(request, accessToken, tenantId, { rateLimitPerMinute });
  assertResponseStatus(response, 200);
}
