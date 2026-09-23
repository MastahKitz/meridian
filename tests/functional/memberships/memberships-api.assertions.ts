import { APIResponse, expect } from '@playwright/test';
import { assertResponseStatus, assertResponseBody } from '../utils/api.utils';
import { ExpectedMember, MembershipResponseItem } from './memberships-api.data';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

// memberships.controller.ts orders by u.email ascending — callers pass members
// in that exact order, and the full array is asserted (not just membership),
// so a leaked row (wrong tenant) or a missing one is caught either way.
export async function assertGetMembershipsSuccess(response: APIResponse, expectedMembers: ExpectedMember[]) {
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
