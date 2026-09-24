import { APIRequestContext } from '@playwright/test';
import { sendApiRequest } from '../utils/api.utils';
import { CreateKeyRequestBody } from './keys-api.data';

export async function sendKeysListRequest(request: APIRequestContext, accessToken: string | undefined, tenantId: string | undefined) {
  const headers: Record<string, string> = {};
  if (accessToken !== undefined) headers['Authorization'] = `Bearer ${accessToken}`;
  if (tenantId !== undefined) headers['x-tenant-id'] = tenantId;

  return sendApiRequest(request, {
    method: 'GET',
    url: 'api/v1/keys',
    headers,
  });
}

export async function sendKeyCreateRequest(
  request: APIRequestContext,
  accessToken: string | undefined,
  tenantId: string | undefined,
  body: CreateKeyRequestBody,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken !== undefined) headers['Authorization'] = `Bearer ${accessToken}`;
  if (tenantId !== undefined) headers['x-tenant-id'] = tenantId;

  return sendApiRequest(request, {
    method: 'POST',
    url: 'api/v1/keys',
    headers,
    body,
  });
}

export async function sendKeyDeleteRequest(
  request: APIRequestContext,
  accessToken: string | undefined,
  tenantId: string | undefined,
  keyId: string,
) {
  const headers: Record<string, string> = {};
  if (accessToken !== undefined) headers['Authorization'] = `Bearer ${accessToken}`;
  if (tenantId !== undefined) headers['x-tenant-id'] = tenantId;

  return sendApiRequest(request, {
    method: 'DELETE',
    url: `api/v1/keys/${keyId}`,
    headers,
  });
}
