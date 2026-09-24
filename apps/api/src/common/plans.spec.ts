import { planFor, rateLimitOverrideCeilingFor, PLANS, RATE_LIMIT_OVERRIDE_CEILINGS, PlanTier } from './plans';

const tiers = Object.keys(PLANS) as PlanTier[];

describe('planFor', () => {
  it.each(tiers)('returns the declared definition for %s', (tier) => {
    expect(planFor(tier)).toBe(PLANS[tier]);
  });

  it('falls back to FREE for an unrecognized tier', () => {
    expect(planFor('ENTERPRISE' as PlanTier)).toBe(PLANS.FREE);
  });

  it('increases quota and rate limit, and decreases the per-request overage rate, at higher tiers', () => {
    expect(PLANS.GROWTH.monthlyQuota).toBeGreaterThan(PLANS.FREE.monthlyQuota);
    expect(PLANS.SCALE.monthlyQuota).toBeGreaterThan(PLANS.GROWTH.monthlyQuota);
    expect(PLANS.GROWTH.rateLimitPerMinute).toBeGreaterThan(PLANS.FREE.rateLimitPerMinute);
    expect(PLANS.SCALE.rateLimitPerMinute).toBeGreaterThan(PLANS.GROWTH.rateLimitPerMinute);
    expect(PLANS.GROWTH.overageRatePerRequest).toBeLessThan(PLANS.FREE.overageRatePerRequest);
    expect(PLANS.SCALE.overageRatePerRequest).toBeLessThan(PLANS.GROWTH.overageRatePerRequest);
  });
});

describe('rateLimitOverrideCeilingFor', () => {
  it.each(tiers)('returns the declared ceiling for %s', (tier) => {
    expect(rateLimitOverrideCeilingFor(tier)).toBe(RATE_LIMIT_OVERRIDE_CEILINGS[tier]);
  });

  it('falls back to the FREE ceiling for an unrecognized tier', () => {
    expect(rateLimitOverrideCeilingFor('ENTERPRISE' as PlanTier)).toBe(RATE_LIMIT_OVERRIDE_CEILINGS.FREE);
  });

  // A1: the override ceiling only means something if it's never below the
  // plan's own un-overridden default — otherwise "override" could mean
  // "override to something worse than what you already have".
  it('is never lower than the plan\'s own default rate limit', () => {
    for (const tier of tiers) {
      expect(rateLimitOverrideCeilingFor(tier)).toBeGreaterThanOrEqual(PLANS[tier].rateLimitPerMinute);
    }
  });
});
