import { APIResponse, expect } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../utils/api.utils';

export function assertRateLimitEnforcedSequentially(responses: APIResponse[], limit: number, successStatus: number) {
  const statuses = responses.map((r) => r.status());
  const successCount = statuses.filter((s) => s === successStatus).length;
  const limitedCount = statuses.filter((s) => s === 429).length;
  expect.soft(successCount, `expected exactly ${limit} of ${responses.length} sequential requests to succeed`).toBe(limit);
  expect.soft(limitedCount, `expected the remaining ${responses.length - limit} sequential requests to be rate-limited`).toBe(responses.length - limit);
}

export function assertRateLimitNotExceeded(responses: APIResponse[], limit: number) {
  const successCount = responses.filter((r) => r.status() === 200).length;
  expect.soft(successCount, `expected at most ${limit} concurrent requests to succeed, got ${successCount}`).toBeLessThanOrEqual(limit);
}

// A2: scope.guard.ts's own rejection when a key's scopes don't include the
// current route's required scope (GET -> read, POST -> write).
export async function assertScopeForbiddenError(response: APIResponse, missingScope: 'read' | 'write') {
  assertResponseStatus(response, 403);
  const body = await response.json();
  assertResponseBody(body, {
    message: `Key is missing required scope: ${missingScope}`,
    error: 'Forbidden',
    statusCode: 403,
  }, { exact: true });
}
