import { APIRequestContext } from '@playwright/test';
import { sendLogoutRequest } from './logout-api.actions';
import { assertLogoutSuccess } from './logout-api.assertions';

export async function terminateRefreshToken(request: APIRequestContext, refreshToken: string): Promise<void> {
  const response = await sendLogoutRequest(request, { refreshToken });
  await assertLogoutSuccess(response);
}
