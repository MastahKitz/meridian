export interface MembershipResponseItem {
  id: string;
  role: string;
  created_at: string;
  user_id: string;
  email: string;
}

// Literal fields only — id/user_id are UUIDs regenerated on every reseed, and
// created_at is server-set, so the assertion layer attaches its own matchers
// for those rather than this file holding fake ones.
export interface ExpectedMember {
  email: string;
  role: string;
}

// Ordered by email ascending, matching memberships.controller.ts's ORDER BY —
// see scripts/seed.js's memberships list for the source of truth.
export const acmeMembers: ExpectedMember[] = [
  { email: 'admin@acme.test', role: 'ADMIN' },
  { email: 'billing@acme.test', role: 'BILLING' },
  { email: 'member@acme.test', role: 'MEMBER' },
  { email: 'owner@acme.test', role: 'OWNER' },
  { email: 'viewer@acme.test', role: 'VIEWER' },
];

// member@acme.test holds a second, separate membership here (VIEWER) — see
// scripts/seed.js — distinct from their MEMBER role in Acme above.
export const northwindMembers: ExpectedMember[] = [
  { email: 'admin@northwind.test', role: 'ADMIN' },
  { email: 'member@acme.test', role: 'VIEWER' },
  { email: 'owner@northwind.test', role: 'OWNER' },
];
