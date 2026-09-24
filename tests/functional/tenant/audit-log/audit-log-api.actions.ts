import { APIRequestContext } from '@playwright/test';
import { sendApiRequest } from '../../utils/api.utils';

export async function sendAuditLogRequest(request: APIRequestContext, accessToken?: string, tenantId?: string) {
  const headers: Record<string, string> = {};
  if (accessToken !== undefined) headers['Authorization'] = `Bearer ${accessToken}`;
  if (tenantId !== undefined) headers['x-tenant-id'] = tenantId;

  return sendApiRequest(request, {
    method: 'GET',
    url: 'api/v1/tenant/audit-log',
    headers,
  });
}
