import { ExpectedTenantDetails, PLAN_LIMITS } from '../tenant/tenant-api.data';

// Part C / SUP-1067's own scratch tenant — used to test rate-limit
// enforcement via real gateway requests, across any of its endpoints (see
// scripts/seed.js).
export const gwMutatingTenantDetails: ExpectedTenantDetails = {
  name: 'gw-mutating', slug: 'gw-mutating', plan: 'FREE', timezone: 'UTC', suspended: false, limits: PLAN_LIMITS.FREE,
};

// Fixed, known keys seeded for gw-mutating (scripts/seed.js) — see that
// file's comment for why these are pinned rather than randomly generated.
// Named for the endpoint each one exercises, since all of them share this one
// tenant.
export const GW_MUTATING_PING_SEQUENTIAL_API_KEY = 'mk_gwmutatingpingsequential.gwmutatingpingsequentialsecretgwmutatingpingsequential';
export const GW_MUTATING_PING_BURST_API_KEY = 'mk_gwmutatingpingburst.gwmutatingpingburstsecretgwmutatingpingburstsecret';
export const GW_MUTATING_ECHO_API_KEY = 'mk_gwmutatingecho.gwmutatingechosecretgwmutatingechosecretgwmutatingecho';
export const GW_MUTATING_TRANSFORM_API_KEY = 'mk_gwmutatingtransform.gwmutatingtransformsecretgwmutatingtransformsecret';

// A2 scope-enforcement keys (docs/qa/conventions.md rule 24) — shared across
// ping/echo/transform's own <endpoint>-api.spec.ts / <endpoint>-api-error.spec.ts.
export const GW_MUTATING_SCOPE_UNSCOPED_API_KEY = 'mk_gwmutatingscopeunscoped.gwmutatingscopeunscopedsecretgwmutatingscopeunscoped';
export const GW_MUTATING_SCOPE_WRITE_API_KEY = 'mk_gwmutatingscopewrite.gwmutatingscopewritesecretgwmutatingscopewritesecret';
export const GW_MUTATING_SCOPE_READ_API_KEY = 'mk_gwmutatingscoperead.gwmutatingscopereadsecretgwmutatingscopereadsecretgw';
export const GW_MUTATING_SCOPE_BOTH_API_KEY = 'mk_gwmutatingscopeboth.gwmutatingscopebothsecretgwmutatingscopebothsecretgw';
