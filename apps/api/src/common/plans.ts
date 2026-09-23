export type PlanTier = 'FREE' | 'GROWTH' | 'SCALE';

export interface PlanDefinition {
  rateLimitPerMinute: number;
  monthlyQuota: number;
  overageRatePerRequest: number;
}

export const PLANS: Record<PlanTier, PlanDefinition> = {
  FREE: { rateLimitPerMinute: 100, monthlyQuota: 10_000, overageRatePerRequest: 0.002 },
  GROWTH: { rateLimitPerMinute: 1_000, monthlyQuota: 500_000, overageRatePerRequest: 0.001 },
  SCALE: { rateLimitPerMinute: 5_000, monthlyQuota: 5_000_000, overageRatePerRequest: 0.0005 },
};

export function planFor(tier: PlanTier): PlanDefinition {
  return PLANS[tier] ?? PLANS.FREE;
}

// A1: the ceiling a tenant's rate-limit override may not exceed — distinct
// from PLANS' own rateLimitPerMinute default (the starting point before any
// override is applied).
export const RATE_LIMIT_OVERRIDE_CEILINGS: Record<PlanTier, number> = {
  FREE: 500,
  GROWTH: 5_000,
  SCALE: 25_000,
};

export function rateLimitOverrideCeilingFor(tier: PlanTier): number {
  return RATE_LIMIT_OVERRIDE_CEILINGS[tier] ?? RATE_LIMIT_OVERRIDE_CEILINGS.FREE;
}
