import { APIResponse, expect } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../utils/api.utils';
import { UsageSummaryResponseBody } from './usage-api.data';

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

// Exact-match against a single key row — safe only because this domain's
// scratch tenant is dedicated and freshly seeded (rule 9), so the caller's
// key is the only one that could ever appear here.
export async function assertUsageSummary(response: APIResponse, expected: { keyId: string; name: string; prefix: string; requests: number }) {
  assertResponseStatus(response, 200);
  const body: UsageSummaryResponseBody = await response.json();
  assertResponseBody(body, {
    from: expect.stringMatching(ISO_TIMESTAMP),
    to: expect.stringMatching(ISO_TIMESTAMP),
    totalRequests: expected.requests,
    keys: [
      {
        keyId: expected.keyId,
        name: expected.name,
        prefix: expected.prefix,
        requests: expected.requests,
        errors: 0,
        avgLatencyMs: expect.any(Number),
      },
    ],
  }, { exact: true });
}
