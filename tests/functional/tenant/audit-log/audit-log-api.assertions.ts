import { APIResponse, expect } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../../utils/api.utils';
import { TenantAuditLogEntry, ExpectedAuditLogEntry, AuditLogErrorResponseBody } from './audit-log-api.data';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export async function assertAuditLogEntries(response: APIResponse, expected: ExpectedAuditLogEntry[]) {
  assertResponseStatus(response, 200);
  const body: TenantAuditLogEntry[] = await response.json();
  assertResponseBody(body, expected.map((entry) => ({
    id: expect.stringMatching(UUID),
    created_at: expect.stringMatching(ISO_TIMESTAMP),
    ...entry,
  })), { exact: true });
}

// roles.guard.ts throws this for any role not in the endpoint's @Roles(...)
// list — GET /tenant/audit-log is OWNER/ADMIN only (rbac-matrix.md "View audit log").
export async function assertRequiresOwnerOrAdminError(response: APIResponse) {
  assertResponseStatus(response, 403);
  const body: AuditLogErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Requires one of: OWNER, ADMIN',
    error: 'Forbidden',
    statusCode: 403,
  }, { exact: true });
}
