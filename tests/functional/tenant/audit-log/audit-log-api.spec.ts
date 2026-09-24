import { test } from '@playwright/test';
import { withHookRequestContext } from '../../utils/api.utils';
import { generateAccessToken } from '../../auth/login/login-api.flow';
import { auditLogMutatingOwnerLoginBody, auditLogMutatingAdminLoginBody } from '../../auth/login/login-api.data';
import { getTenantId } from '../../utils/seed.utils';
import { sendAuditLogRequest } from './audit-log-api.actions';
import { assertAuditLogEntries } from './audit-log-api.assertions';
import { auditLogMutatingTenantDetails, ExpectedAuditLogEntry } from './audit-log-api.data';
import { setRateLimitOverride, clearRateLimitOverride } from '../rate-limit/rate-limit-api.flow';
import {
  RATE_LIMIT_OVERRIDE_CEILINGS,
  RATE_LIMIT_OVERRIDE_SET_ACTION,
  RATE_LIMIT_OVERRIDE_CLEAR_ACTION,
} from '../rate-limit/rate-limit-api.data';

test.describe.configure({ mode: 'serial' });

test.describe('audit log api', { tag: ['@tenant', '@audit-log', '@api', '@mutating'] }, () => {
  const tenant = auditLogMutatingTenantDetails;
  let ownerToken: string;
  let adminToken: string;
  let tenantId: string;
  const expectedEntries: ExpectedAuditLogEntry[] = [];

  test.beforeAll(async ({ playwright }) => {
    tenantId = getTenantId(tenant.slug);
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, auditLogMutatingOwnerLoginBody);
      adminToken = await generateAccessToken(request, auditLogMutatingAdminLoginBody);
    });
  });

  test('validate a freshly seeded tenant has no audit log entries', async ({ request }) => {
    const response = await sendAuditLogRequest(request, ownerToken, tenantId);
    await assertAuditLogEntries(response, expectedEntries);
  });

  test('validate setting a rate limit override is recorded in the audit log', async ({ request }) => {
    const rateLimitPerMinute = RATE_LIMIT_OVERRIDE_CEILINGS.FREE - 1;
    await setRateLimitOverride(request, ownerToken, tenant, rateLimitPerMinute);

    expectedEntries.unshift({
      action: RATE_LIMIT_OVERRIDE_SET_ACTION,
      target: tenantId,
      metadata: { previous: null, next: rateLimitPerMinute },
      actor_email: auditLogMutatingOwnerLoginBody.email,
    });

    const response = await sendAuditLogRequest(request, ownerToken, tenantId);
    await assertAuditLogEntries(response, expectedEntries);
  });

  test('validate clearing a rate limit override is recorded in the audit log', async ({ request }) => {
    const previous = RATE_LIMIT_OVERRIDE_CEILINGS.FREE - 1; // left behind by the previous test's set
    await clearRateLimitOverride(request, ownerToken, tenant);

    expectedEntries.unshift({
      action: RATE_LIMIT_OVERRIDE_CLEAR_ACTION,
      target: tenantId,
      metadata: { previous, next: null },
      actor_email: auditLogMutatingOwnerLoginBody.email,
    });

    const response = await sendAuditLogRequest(request, ownerToken, tenantId);
    await assertAuditLogEntries(response, expectedEntries);
  });

  // rbac-matrix.md "View audit log": OWNER and ADMIN both allowed.
  test('validate admin user can also view the audit log', async ({ request }) => {
    const response = await sendAuditLogRequest(request, adminToken, tenantId);
    await assertAuditLogEntries(response, expectedEntries);
  });

});
