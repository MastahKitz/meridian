export interface RotateKeyRequestBody {
  gracePeriodSeconds?: number;
}

// keys.controller.ts's rotate()'s literal action name for its audit.record()
// call — the one domain-specific piece a caller supplies when checking the
// generic audit-log assertion (tenant/audit-log/audit-log-api.assertions.ts).
export const KEY_ROTATED_ACTION = 'key.rotated';
