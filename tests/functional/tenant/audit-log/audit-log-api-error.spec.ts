import { test } from '@playwright/test';
import { withHookRequestContext } from '../../utils/api.utils';
import { generateAccessToken } from '../../auth/login/login-api.flow';
import { getTenantId } from '../../utils/seed.utils';
import {
  auditLogMutatingOwnerLoginBody,
  auditLogMutatingMemberLoginBody,
  auditLogMutatingViewerLoginBody,
  auditLogMutatingBillingLoginBody,
} from '../../auth/login/login-api.data';
import { sendAuditLogRequest } from './audit-log-api.actions';
import { assertRequiresOwnerOrAdminError } from './audit-log-api.assertions';
import { auditLogMutatingTenantDetails } from './audit-log-api.data';
import {
  assertInvalidTokenError,
  assertMissingTokenError,
  assertMissingTenantIdError,
  assertNotMemberOfTenantError,
} from '../../auth/auth-api.assertions';

test.describe('audit log api - errors', { tag: ['@tenant', '@audit-log', '@api', '@error'] }, () => {
  let ownerToken: string;
  let memberToken: string;
  let viewerToken: string;
  let billingToken: string;
  let tenantId: string;

  test.beforeAll(async ({ playwright }) => {
    tenantId = getTenantId(auditLogMutatingTenantDetails.slug);
    await withHookRequestContext(playwright, async (request) => {
      ownerToken = await generateAccessToken(request, auditLogMutatingOwnerLoginBody);
      memberToken = await generateAccessToken(request, auditLogMutatingMemberLoginBody);
      viewerToken = await generateAccessToken(request, auditLogMutatingViewerLoginBody);
      billingToken = await generateAccessToken(request, auditLogMutatingBillingLoginBody);
    });
  });

  test('validate the audit log cannot be viewed with an invalid access token', async ({ request }) => {
    const response = await sendAuditLogRequest(request, 'not-a-real-token', tenantId);
    await assertInvalidTokenError(response);
  });

  test('validate the audit log cannot be viewed for a tenant the actor is not a member of', async ({ request }) => {
    const response = await sendAuditLogRequest(request, ownerToken, getTenantId('northwind'));
    await assertNotMemberOfTenantError(response);
  });

  test('validate the audit log cannot be viewed without an access token', async ({ request }) => {
    const response = await sendAuditLogRequest(request, undefined, tenantId);
    await assertMissingTokenError(response);
  });

  test('validate the audit log cannot be viewed without a tenant id', async ({ request }) => {
    const response = await sendAuditLogRequest(request, ownerToken, undefined);
    await assertMissingTenantIdError(response);
  });

  test('validate member user cannot view the audit log', async ({ request }) => {
    const response = await sendAuditLogRequest(request, memberToken, tenantId);
    await assertRequiresOwnerOrAdminError(response);
  });

  test('validate viewer user cannot view the audit log', async ({ request }) => {
    const response = await sendAuditLogRequest(request, viewerToken, tenantId);
    await assertRequiresOwnerOrAdminError(response);
  });

  test('validate billing user cannot view the audit log', async ({ request }) => {
    const response = await sendAuditLogRequest(request, billingToken, tenantId);
    await assertRequiresOwnerOrAdminError(response);
  });

});
