import { APIResponse, expect } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../utils/api.utils';
import { getTenantId } from '../utils/seed.utils';
import { ExpectedTenantDetails, TenantResponseBody } from './tenant-api.data';

const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export async function assertGetTenantSuccess(response: APIResponse, params: ExpectedTenantDetails) {
  assertResponseStatus(response, 200);
  const body: TenantResponseBody = await response.json();
  assertResponseBody(body, {
    // the tenant's own id — known exactly for this run, same value getTenantId
    // gives the request layer for `x-tenant-id`, so asserted literally.
    id: getTenantId(params.slug),
    name: params.name,
    slug: params.slug,
    plan: params.plan,
    timezone: params.timezone,
    suspended: params.suspended,
    created_at: expect.stringMatching(ISO_TIMESTAMP),
    limits: params.limits,
  }, { exact: true });
}
