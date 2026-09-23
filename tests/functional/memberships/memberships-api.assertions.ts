import { APIResponse, expect } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../utils/api.utils';
import {
  CreateMembershipResponseBody,
  ExpectedMember,
  MembershipErrorResponseBody,
  MembershipResponseItem,
} from './memberships-api.data';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

// memberships.controller.ts orders by u.email ascending — callers pass members
// in that exact order, and the full array is asserted (not just membership),
// so a leaked row (wrong tenant) or a missing one is caught either way.
export async function assertMembershipsListSuccess(response: APIResponse, expectedMembers: ExpectedMember[]) {
  assertResponseStatus(response, 200);
  const body: MembershipResponseItem[] = await response.json();
  assertResponseBody(body, expectedMembers.map((m) => ({
    id: expect.stringMatching(UUID),
    role: m.role,
    created_at: expect.stringMatching(ISO_TIMESTAMP),
    user_id: expect.stringMatching(UUID),
    email: m.email,
  })), { exact: true });
}

export async function assertMembershipCreateSuccess(response: APIResponse, expectedRole: string) {
  assertResponseStatus(response, 201);
  const body: CreateMembershipResponseBody = await response.json();
  assertResponseBody(body, {
    id: expect.stringMatching(UUID),
    role: expectedRole,
  }, { exact: true });
}

export async function assertEmailRequiredError(response: APIResponse) {
  assertResponseStatus(response, 400);
  const body: MembershipErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'email required',
    error: 'Bad Request',
    statusCode: 400,
  }, { exact: true });
}

export async function assertInvalidRoleError(response: APIResponse) {
  assertResponseStatus(response, 400);
  const body: MembershipErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'invalid role',
    error: 'Bad Request',
    statusCode: 400,
  }, { exact: true });
}

// roles.guard.ts throws this for any role not in the endpoint's @Roles(...) list.
export async function assertRequiresOwnerOrAdminError(response: APIResponse) {
  assertResponseStatus(response, 403);
  const body: MembershipErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Requires one of: OWNER, ADMIN',
    error: 'Forbidden',
    statusCode: 403,
  }, { exact: true });
}

// ASSUMPTION, not a verified contract: docs/rbac-matrix.md's escalation rule
// says a member may not be granted a role higher than the actor's own, and
// apps/api/src/common/rbac.ts even defines ROLE_RANK/atLeast for exactly this
// — but neither is ever imported by memberships.controller.ts's invite(). This
// encodes the spec's intended behavior and is expected to currently FAIL,
// since an ADMIN can in fact invite someone as OWNER today. Kept as a
// documented, known-failing assumption rather than silently untested.
export async function assertCannotGrantHigherRoleError(response: APIResponse) {
  assertResponseStatus(response, 403);
  const body: MembershipErrorResponseBody = await response.json();
  assertResponseBody(body, {
    message: 'Cannot grant a role higher than your own',
    error: 'Forbidden',
    statusCode: 403,
  }, { exact: true });
}
