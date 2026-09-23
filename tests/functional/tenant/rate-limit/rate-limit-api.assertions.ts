import { APIResponse } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../../utils/api.utils';
import { getTenantId } from '../../utils/seed.utils';
import { ExpectedTenantDetails } from '../tenant-api.data';
import { RateLimitOverrideSetResponseBody, TenantErrorResponseBody } from './rate-limit-api.data';

export async function assertRateLimitOverrideSetSuccess(response: APIResponse, tenant: ExpectedTenantDetails, rateLimitPerMinute: number) {
  assertResponseStatus(response, 200);
  const body: RateLimitOverrideSetResponseBody = await response.json();
  assertResponseBody(body, {
    id: getTenantId(tenant.slug),
    name: tenant.name,
    slug: tenant.slug,
    plan: tenant.plan,
    timezone: tenant.timezone,
    suspended: tenant.suspended,
    limits: { ...tenant.limits, rateLimitPerMinute },
  }, { exact: true });
}

export async function assertRateLimitCeilingExceededError(response: APIResponse, ceiling: number, plan: string) {
  assertResponseStatus(response, 400);
  const body: TenantErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: `rateLimitPerMinute may not exceed ${ceiling} for the ${plan} plan`,
    error: 'Bad Request',
    statusCode: 400,
  }, { exact: true });
}

// roles.guard.ts throws this for any role not in the endpoint's @Roles(...)
// list — PATCH/DELETE /tenant/rate-limit are OWNER-only (A1-tenant-rate-limit-override.md).
export async function assertRequiresOwnerError(response: APIResponse) {
  assertResponseStatus(response, 403);
  const body: TenantErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Requires one of: OWNER',
    error: 'Forbidden',
    statusCode: 403,
  }, { exact: true });
}
