import { atLeast, ROLE_RANK, MemberRole } from './rbac';

const roles: MemberRole[] = ['OWNER', 'ADMIN', 'BILLING', 'MEMBER', 'VIEWER'];

describe('atLeast', () => {
  it.each(roles.flatMap((role) => roles.map((minimum) => [role, minimum] as const)))(
    'atLeast(%s, %s) matches ROLE_RANK[%s] >= ROLE_RANK[%s]',
    (role, minimum) => {
      expect(atLeast(role, minimum)).toBe(ROLE_RANK[role] >= ROLE_RANK[minimum]);
    },
  );

  it('is reflexive — every role is at least itself', () => {
    for (const role of roles) {
      expect(atLeast(role, role)).toBe(true);
    }
  });

  // docs/rbac-matrix.md: OWNER holds every capability in the table and
  // VIEWER the fewest — the only two positions the doc actually pins down
  // on their own. ADMIN/BILLING/MEMBER's relative order (used for the role
  // escalation rule) isn't independently stated anywhere else — their
  // documented capabilities don't nest (e.g. BILLING alone can sync billing
  // to the provider, which ADMIN cannot) — so ROLE_RANK's ordering for
  // those three is itself the source of truth, not something this test can
  // verify against a second, independent source.
  it('ranks OWNER above every other role, and VIEWER below every other role', () => {
    for (const role of roles) {
      if (role !== 'OWNER') expect(ROLE_RANK.OWNER).toBeGreaterThan(ROLE_RANK[role]);
      if (role !== 'VIEWER') expect(ROLE_RANK.VIEWER).toBeLessThan(ROLE_RANK[role]);
    }
  });

  it('gives every role a distinct rank, so no two roles ever tie', () => {
    const ranks = Object.values(ROLE_RANK);
    expect(new Set(ranks).size).toBe(ranks.length);
  });
});
