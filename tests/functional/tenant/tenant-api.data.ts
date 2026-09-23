export interface TenantLimits {
  rateLimitPerMinute: number;
  monthlyQuota: number;
  overageRatePerRequest: number;
}

// tenants.controller.ts spreads the raw DB row (snake_case, as pg returns it)
// and appends `limits`, computed from the tenant's plan tier at request time —
// it's never stored on the row itself.
export interface TenantResponseBody {
  id: string;
  name: string;
  slug: string;
  plan: string;
  timezone: string;
  suspended: boolean;
  created_at: string;
  limits: TenantLimits;
}

// Mirrors apps/api/src/common/plans.ts's PLANS map — duplicated here rather than
// imported, since these tests assert against the API's actual output as a black
// box, not against the backend's own source of truth.
export const PLAN_LIMITS: Record<string, TenantLimits> = {
  FREE: { rateLimitPerMinute: 100, monthlyQuota: 10_000, overageRatePerRequest: 0.002 },
  GROWTH: { rateLimitPerMinute: 1_000, monthlyQuota: 500_000, overageRatePerRequest: 0.001 },
  SCALE: { rateLimitPerMinute: 5_000, monthlyQuota: 5_000_000, overageRatePerRequest: 0.0005 },
};

// Literal fields only — id and created_at are server-generated / per-run, so
// the assertion layer attaches its own matchers for those rather than this
// file holding fake ones.
export interface ExpectedTenantDetails {
  name: string;
  slug: string;
  plan: string;
  timezone: string;
  suspended: boolean;
  limits: TenantLimits;
}

// scripts/seed.js's tenantSpecs is the source of truth for name/slug/plan/timezone.
export const acmeTenantDetails: ExpectedTenantDetails = {
  name: 'Acme Corp', slug: 'acme', plan: 'FREE', timezone: 'UTC', suspended: false, limits: PLAN_LIMITS.FREE,
};

export const northwindTenantDetails: ExpectedTenantDetails = {
  name: 'Northwind Traders', slug: 'northwind', plan: 'GROWTH', timezone: 'America/New_York', suspended: false, limits: PLAN_LIMITS.GROWTH,
};

export const sakuraTenantDetails: ExpectedTenantDetails = {
  name: 'Sakura KK', slug: 'sakura', plan: 'SCALE', timezone: 'Asia/Tokyo', suspended: false, limits: PLAN_LIMITS.SCALE,
};
