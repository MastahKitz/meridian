import { APIRequestContext } from '@playwright/test';
import { sendApiRequest } from '../../utils/api.utils';

export async function sendPingRequest(request: APIRequestContext, secret: string) {
  return sendApiRequest(request, {
    method: 'GET',
    url: 'api/v1/gw/ping',
    headers: { 'x-api-key': secret },
  });
}
