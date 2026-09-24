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
    const row = await this.db.one(
      `SELECT k.id, k.tenant_id, k.prefix, k.scopes, t.plan, t.timezone, t.suspended, t.rate_limit_override
         FROM api_keys k
         JOIN tenants t ON t.id = k.tenant_id
        WHERE k.prefix = $1 AND k.secret_hash = $2 AND k.revoked_at IS NULL`,
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

    this.cache.set(rawKey, { value, expiresAt: Date.now() + CACHE_TTL_MS });
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
