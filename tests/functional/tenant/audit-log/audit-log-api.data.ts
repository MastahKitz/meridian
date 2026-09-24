import { ExpectedTenantDetails, PLAN_LIMITS } from '../tenant-api.data';

// This domain's own scratch tenant — covers any transaction that writes an
// audit entry, not just whichever domain's action a given spec uses to
// trigger one. Kept separate from every other mutating domain's tenants so
// this spec's "starts with zero entries" assertion can never see their
// writes. Audit-log recording isn't plan-dependent, so one tenant (FREE) is
// enough.
export const auditLogMutatingTenantDetails: ExpectedTenantDetails = {
  name: 'audit-log-mutating', slug: 'audit-log-mutating', plan: 'FREE', timezone: 'UTC', suspended: false, limits: PLAN_LIMITS.FREE,
};

// audit.service.ts's list() shape — a general tenant capability, reusable by
// any domain wanting to confirm its own actions were recorded, not specific
// to whichever domain's mutation is being audited.
export interface TenantAuditLogEntry {
  id: string;
  action: string;
  target: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_email: string | null;
}

// What a caller supplies to check for an entry — id/created_at are always
// server-generated, so the assertion layer attaches its own matchers for
// those rather than every domain having to.
export interface ExpectedAuditLogEntry {
  action: string;
  target: string | null;
  metadata: Record<string, unknown>;
  actor_email: string | null;
}

// Same shape as auth's/memberships'/rate-limit's error bodies (Nest's default
// HttpException), own literal type rather than a shared one — this domain's
// role-gate message ("Requires one of: OWNER, ADMIN") is its own.
export interface AuditLogErrorResponseBody {
  message: string;
  error: string;
  statusCode: number;
}
