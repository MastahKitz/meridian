import { APIRequestContext } from '@playwright/test';
import { sendApiRequest } from '../../utils/api.utils';

export async function sendEchoRequest(request: APIRequestContext, apiKey: string) {
  return sendApiRequest(request, {
    method: 'POST',
    url: 'api/v1/gw/echo',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: {},
  });
}
