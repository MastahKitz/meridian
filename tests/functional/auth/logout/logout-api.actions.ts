import { APIRequestContext } from '@playwright/test';
import { sendApiRequest } from '../../utils/api.utils';
import { LogoutRequestBody } from './logout-api.data';

export async function sendLogoutRequest(request: APIRequestContext, body: LogoutRequestBody) {
  return sendApiRequest(request, {
    method: 'POST',
    url: 'api/v1/auth/logout',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}
