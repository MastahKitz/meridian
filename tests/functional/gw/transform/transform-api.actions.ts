import { APIRequestContext } from '@playwright/test';
import { sendApiRequest } from '../../utils/api.utils';

export async function sendTransformRequest(request: APIRequestContext, apiKey: string) {
  return sendApiRequest(request, {
    method: 'POST',
    url: 'api/v1/gw/transform',
    headers: { 'x-api-key': apiKey, 'Content-Type': 'application/json' },
    body: { text: 'test', op: 'upper' },
  });
}
