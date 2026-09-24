import { APIResponse, expect } from '@playwright/test';

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
