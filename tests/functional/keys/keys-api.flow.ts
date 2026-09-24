import { APIRequestContext } from '@playwright/test';
import { assertResponseStatus } from '../utils/api.utils';
import { sendKeysListRequest, sendKeyCreateRequest, getGeneratedKey, sendKeyDeleteRequest } from './keys-api.actions';
import { assertKeyListedCorrectly } from './keys-api.assertions';
import { CreateKeyRequestBody, CreateKeyResponseBody } from './keys-api.data';

export async function createKey(
  request: APIRequestContext,
  accessToken: string,
  tenantId: string,
  body: CreateKeyRequestBody,
): Promise<CreateKeyResponseBody> {
  const response = await sendKeyCreateRequest(request, accessToken, tenantId, body);
  assertResponseStatus(response, 201);
  return getGeneratedKey(response);
}

export async function assertKeyPersistedCorrectly(
  request: APIRequestContext,
  accessToken: string,
  tenantId: string,
  key: Omit<CreateKeyResponseBody, 'secret'>,
): Promise<void> {
  const response = await sendKeysListRequest(request, accessToken, tenantId);
  await assertKeyListedCorrectly(response, key);
}

export async function revokeKey(
  request: APIRequestContext,
  accessToken: string,
  tenantId: string,
  keyId: string,
): Promise<void> {
  const response = await sendKeyDeleteRequest(request, accessToken, tenantId, keyId);
  assertResponseStatus(response, 200);
}
