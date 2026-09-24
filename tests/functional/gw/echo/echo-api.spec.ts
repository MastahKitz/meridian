import { test } from '@playwright/test';
import { assertResponseStatus } from '../../utils/api.utils';
import {
  GW_MUTATING_SCOPE_UNSCOPED_API_KEY,
  GW_MUTATING_SCOPE_WRITE_API_KEY,
  GW_MUTATING_SCOPE_BOTH_API_KEY,
} from '../gw-api.data';
import { sendEchoRequest } from './echo-api.actions';

// A2 / docs/qa/conventions.md rule 24: ScopeGuard enforcement belongs here
// (gw/), not in keys/keys-create-api.spec.ts — that spec only proves a key's
// scopes persist correctly via create + GET /api/v1/keys.
test.describe('gw echo api', { tag: ['@gw', '@echo', '@api'] }, () => {

  test('validate an unscoped key can write via echo', async ({ request }) => {
    const response = await sendEchoRequest(request, GW_MUTATING_SCOPE_UNSCOPED_API_KEY);
    assertResponseStatus(response, 201);
  });

  test('validate a write-scoped key can write via echo', async ({ request }) => {
    const response = await sendEchoRequest(request, GW_MUTATING_SCOPE_WRITE_API_KEY);
    assertResponseStatus(response, 201);
  });

  test('validate a read-and-write-scoped key can write via echo', async ({ request }) => {
    const response = await sendEchoRequest(request, GW_MUTATING_SCOPE_BOTH_API_KEY);
    assertResponseStatus(response, 201);
  });

});
