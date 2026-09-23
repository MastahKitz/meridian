import { ExpectedTenantDetails, PLAN_LIMITS, TenantLimits } from '../tenant-api.data';

export const rateLimitMutatingFreeTenantDetails: ExpectedTenantDetails = {
  name: 'rate-limit-mutating-free', slug: 'rate-limit-mutating-free', plan: 'FREE', timezone: 'UTC', suspended: false, limits: PLAN_LIMITS.FREE,
};

export const rateLimitMutatingGrowthTenantDetails: ExpectedTenantDetails = {
  name: 'rate-limit-mutating-growth', slug: 'rate-limit-mutating-growth', plan: 'GROWTH', timezone: 'UTC', suspended: false, limits: PLAN_LIMITS.GROWTH,
};

export const rateLimitMutatingScaleTenantDetails: ExpectedTenantDetails = {
  name: 'rate-limit-mutating-scale', slug: 'rate-limit-mutating-scale', plan: 'SCALE', timezone: 'UTC', suspended: false, limits: PLAN_LIMITS.SCALE,
};

// A1: PATCH /tenant/rate-limit's own response has no created_at (its RETURNING
// clause doesn't select it) — a different shape from TenantResponseBody, not
// a subset of it.
export interface RateLimitOverrideSetRequestBody {
  rateLimitPerMinute?: number;
}

export interface RateLimitOverrideSetResponseBody {
  id: string;
  name: string;
  slug: string;
  plan: string;
  timezone: string;
  suspended: boolean;
  limits: TenantLimits;
}

// Mirrors apps/api/src/common/plans.ts's RATE_LIMIT_OVERRIDE_CEILINGS —
// duplicated here for the same black-box reason as tenant-api.data.ts's
// PLAN_LIMITS.
export const RATE_LIMIT_OVERRIDE_CEILINGS: Record<string, number> = {
  FREE: 500,
  GROWTH: 5_000,
  SCALE: 25_000,
};

// Same shape as auth's/memberships' error bodies (Nest's default
// HttpException), own literal type rather than a shared one — these messages
// (ceiling validation, the OWNER-only role gate) are rate-limit-specific,
// unlike JwtGuard's domain-agnostic errors in auth/auth-api.assertions.ts.
export interface TenantErrorResponseBody {
  message: string;
  error: string;
  statusCode: number;
}
