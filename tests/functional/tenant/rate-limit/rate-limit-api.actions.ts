import { APIRequestContext } from '@playwright/test';
import { sendApiRequest } from '../../utils/api.utils';
import { RateLimitOverrideSetRequestBody } from './rate-limit-api.data';

export async function sendRateLimitOverrideSetRequest(
  request: APIRequestContext,
  accessToken?: string,
  tenantId?: string,
  body?: RateLimitOverrideSetRequestBody,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken !== undefined) headers['Authorization'] = `Bearer ${accessToken}`;
  if (tenantId !== undefined) headers['x-tenant-id'] = tenantId;

  return sendApiRequest(request, {
    method: 'PATCH',
    url: 'api/v1/tenant/rate-limit',
    headers,
    body,
  });
}
