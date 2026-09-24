import { test } from '@playwright/test';
import { assertResponseStatus } from '../../utils/api.utils';
import {
  GW_MUTATING_SCOPE_UNSCOPED_API_KEY,
  GW_MUTATING_SCOPE_READ_API_KEY,
  GW_MUTATING_SCOPE_BOTH_API_KEY,
} from '../gw-api.data';
import { sendPingRequest } from './ping-api.actions';

// A2 / docs/qa/conventions.md rule 24: ScopeGuard enforcement belongs here
// (gw/), not in keys/keys-create-api.spec.ts — that spec only proves a key's
// scopes persist correctly via create + GET /api/v1/keys.
test.describe('gw ping api', { tag: ['@gw', '@ping', '@api'] }, () => {

  test('validate an unscoped key can read via ping', async ({ request }) => {
    const response = await sendPingRequest(request, GW_MUTATING_SCOPE_UNSCOPED_API_KEY);
    assertResponseStatus(response, 200);
  });

  test('validate a read-scoped key can read via ping', async ({ request }) => {
    const response = await sendPingRequest(request, GW_MUTATING_SCOPE_READ_API_KEY);
    assertResponseStatus(response, 200);
  });

  test('validate a read-and-write-scoped key can read via ping', async ({ request }) => {
    const response = await sendPingRequest(request, GW_MUTATING_SCOPE_BOTH_API_KEY);
    assertResponseStatus(response, 200);
  });

});
