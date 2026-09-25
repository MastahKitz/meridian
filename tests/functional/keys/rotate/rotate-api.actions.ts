import { APIRequestContext } from '@playwright/test';
import { sendApiRequest } from '../../utils/api.utils';
import { RotateKeyRequestBody } from './rotate-api.data';

export async function sendKeyRotateRequest(
  request: APIRequestContext,
  accessToken: string | undefined,
  tenantId: string | undefined,
  keyId: string,
  body: RotateKeyRequestBody,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken !== undefined) headers['Authorization'] = `Bearer ${accessToken}`;
  if (tenantId !== undefined) headers['x-tenant-id'] = tenantId;

  return sendApiRequest(request, {
    method: 'POST',
    url: `api/v1/keys/${keyId}/rotate`,
    headers,
    body,
  });
}
