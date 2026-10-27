import { APIRequestContext } from '@playwright/test';
import { sendApiRequest } from '../utils/api.utils';

export async function sendUsageSummaryRequest(request: APIRequestContext, accessToken: string | undefined, tenantId: string | undefined) {
  const headers: Record<string, string> = {};
  if (accessToken !== undefined) headers['Authorization'] = `Bearer ${accessToken}`;
  if (tenantId !== undefined) headers['x-tenant-id'] = tenantId;

  return sendApiRequest(request, {
    method: 'GET',
    url: 'api/v1/usage/summary',
    headers,
  });
}
