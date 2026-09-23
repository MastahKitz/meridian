import { APIRequestContext } from '@playwright/test';
import { sendApiRequest } from '../utils/api.utils';
import { CreateMembershipRequestBody } from './memberships-api.data';

export async function sendGetMembershipsRequest(request: APIRequestContext, accessToken?: string, tenantId?: string) {
  const headers: Record<string, string> = {};
  if (accessToken !== undefined) headers['Authorization'] = `Bearer ${accessToken}`;
  if (tenantId !== undefined) headers['x-tenant-id'] = tenantId;

  return sendApiRequest(request, {
    method: 'GET',
    url: 'api/v1/memberships',
    headers,
  });
}

export async function sendCreateMembershipRequest(
  request: APIRequestContext,
  accessToken: string | undefined,
  tenantId: string | undefined,
  body: CreateMembershipRequestBody,
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (accessToken !== undefined) headers['Authorization'] = `Bearer ${accessToken}`;
  if (tenantId !== undefined) headers['x-tenant-id'] = tenantId;

  return sendApiRequest(request, {
    method: 'POST',
    url: 'api/v1/memberships/invite',
    headers,
    body,
  });
}
