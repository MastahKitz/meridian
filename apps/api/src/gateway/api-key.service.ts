import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import { DbService } from '../db/db.service';

export interface ResolvedKey {
  keyId: string;
  tenantId: string;
  prefix: string;
  plan: string;
  timezone: string;
  suspended: boolean;
  rateLimitOverride: number | null;
  scopes: string[] | null;
}

const CACHE_TTL_MS = 60_000;

@Injectable()
export class ApiKeyService {
  private cache = new Map<string, { value: ResolvedKey | null; expiresAt: number }>();

  constructor(private readonly db: DbService) {}

  async resolve(rawKey: string): Promise<ResolvedKey | null> {
    const cached = this.cache.get(rawKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const [prefix, secret] = String(rawKey).split('.');
    if (!prefix || !secret) return null;

    const hash = createHash('sha256').update(secret).digest('hex');
    // A2 rotation: a key resolves on its current secret, or its previous
    // secret while that secret's own grace period hasn't expired yet.
    // is_current flags which branch matched, so a previous-secret match
    // never gets cached below — see that comment for why.
    const row = await this.db.one(
      `SELECT k.id, k.tenant_id, k.prefix, k.scopes, t.plan, t.timezone, t.suspended, t.rate_limit_override,
              (k.secret_hash = $2) AS is_current
         FROM api_keys k
         JOIN tenants t ON t.id = k.tenant_id
        WHERE k.prefix = $1
          AND k.revoked_at IS NULL
          AND (
            k.secret_hash = $2
            OR (k.previous_secret_hash = $2 AND k.previous_secret_expires_at > now())
          )`,
      [prefix, hash],
    );

    const value: ResolvedKey | null = row
      ? {
          keyId: row.id,
          tenantId: row.tenant_id,
          prefix: row.prefix,
          plan: row.plan,
          timezone: row.timezone,
          suspended: row.suspended,
          rateLimitOverride: row.rate_limit_override,
          scopes: row.scopes,
        }
      : null;

    // A previous secret's validity has a hard wall-clock boundary
    // (previous_secret_expires_at) that invalidateTenant() can't preempt —
    // nothing calls it when a grace period elapses on its own. Caching a
    // previous-secret match would let it keep authenticating past that
    // boundary for up to this cache's own TTL, the same staleness class as
    // SUP-1051 but via natural expiry instead of an explicit revoke/rotate.
    // The current secret has no such boundary (only ever ended by an
    // explicit action, which does call invalidateTenant()), so it's safe to
    // cache as before.
    if (!row || row.is_current) {
      this.cache.set(rawKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    }
    return value;
  }

  // A1: "the change takes effect on the next request through the gateway" —
  // this cache's 60s TTL would otherwise leave a just-changed override stale
  // for up to a minute. Scoped to the one tenant rather than clearing
  // everything, since an unrelated tenant's cached keys are still valid.
  invalidateTenant(tenantId: string) {
    for (const [rawKey, entry] of this.cache) {
      if (entry.value?.tenantId === tenantId) this.cache.delete(rawKey);
    }
  }
}
