import { APIRequestContext } from '@playwright/test';
import { sendKeysListRequest } from './keys-api.actions';
import { assertKeyListedCorrectly } from './keys-api.assertions';
import { CreateKeyResponseBody } from './keys-api.data';

export async function assertKeyPersistedCorrectly(
  request: APIRequestContext,
  accessToken: string,
  tenantId: string,
  key: Omit<CreateKeyResponseBody, 'secret'>,
): Promise<void> {
  const response = await sendKeysListRequest(request, accessToken, tenantId);
  await assertKeyListedCorrectly(response, key);
}
