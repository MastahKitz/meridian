import { APIRequestContext } from '@playwright/test';
import { sendApiRequest } from '../../utils/api.utils';
import { RefreshRequestBody } from './refresh-api.data';

export async function sendRefreshRequest(request: APIRequestContext, body: RefreshRequestBody) {
  return sendApiRequest(request, {
    method: 'POST',
    url: 'api/v1/auth/refresh',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
}
