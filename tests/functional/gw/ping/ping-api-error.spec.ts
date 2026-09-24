import { test } from '@playwright/test';
import { GW_MUTATING_SCOPE_WRITE_API_KEY } from '../gw-api.data';
import { sendPingRequest } from './ping-api.actions';
import { assertScopeForbiddenError } from '../gw-api.assertions';

test.describe('gw ping api - errors', { tag: ['@gw', '@ping', '@api', '@error'] }, () => {

  test('validate a write-only-scoped key cannot read via ping', async ({ request }) => {
    const response = await sendPingRequest(request, GW_MUTATING_SCOPE_WRITE_API_KEY);
    await assertScopeForbiddenError(response, 'read');
  });

});
