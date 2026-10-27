import { Body, Controller, Delete, Get, Param, Post, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Actor, RequestActor, Roles } from '../common/decorators';
import { DbService } from '../db/db.service';
import { AuditService } from '../audit/audit.service';
import { ApiKeyService } from '../gateway/api-key.service';

const MAX_GRACE_PERIOD_SECONDS = 86400;
const DEFAULT_GRACE_PERIOD_SECONDS = 3600;

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

const VALID_SCOPES = ['read', 'write'];

function parseScopes(scopes: unknown): string[] | null {
  if (scopes === undefined) return null;
  if (
    !Array.isArray(scopes) ||
    scopes.length === 0 ||
    !scopes.every((s) => VALID_SCOPES.includes(s)) ||
    new Set(scopes).size !== scopes.length
  ) {
    throw new BadRequestException(`scopes must be a non-empty array of unique values from: ${VALID_SCOPES.join(', ')}`);
  }
  return scopes;
}

@Controller('keys')
@UseGuards(JwtGuard, RolesGuard)
export class KeysController {
  constructor(
    private readonly db: DbService,
    private readonly audit: AuditService,
    private readonly apiKeys: ApiKeyService,
  ) {}

  @Get()
  list(@Actor() actor: RequestActor) {
    return this.db.query(
      `SELECT id, name, prefix, revoked_at, last_used_at, scopes, created_at
         FROM api_keys
        WHERE tenant_id = $1
        ORDER BY created_at DESC`,
      [actor.tenantId],
    );
  }

  @Post()
  @Roles('OWNER', 'ADMIN', 'MEMBER')
  async create(@Actor() actor: RequestActor, @Body() body: { name?: string; scopes?: string[] }) {
    if (!body?.name) throw new BadRequestException('name required');
    const scopes = parseScopes(body.scopes);

    const prefix = 'mk_' + randomBytes(4).toString('hex');
    const secret = randomBytes(24).toString('hex');

    const key = await this.db.one(
      `INSERT INTO api_keys (tenant_id, name, prefix, secret_hash, scopes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, prefix, scopes, created_at`,
      [actor.tenantId, body.name, prefix, hashSecret(secret), scopes],
    );

    await this.audit.record({
      tenantId: actor.tenantId,
      actorId: actor.userId,
      action: 'key.created',
      target: key.id,
      metadata: { name: body.name, scopes },
    });

    return { ...key, secret: `${prefix}.${secret}` };
  }

  @Delete(':id')
  @Roles('OWNER', 'ADMIN')
  async revoke(@Actor() actor: RequestActor, @Param('id') id: string) {
    const key = await this.db.one(
      `UPDATE api_keys SET revoked_at = now()
        WHERE id = $1 AND tenant_id = $2 AND revoked_at IS NULL
        RETURNING id, prefix`,
      [id, actor.tenantId],
    );
    if (!key) throw new NotFoundException('Key not found or already revoked');

    // SUP-1051: without this, a key resolved (and therefore cached) shortly
    // before revocation keeps authenticating against the gateway for up to
    // api-key.service.ts's 60s cache TTL, even though the DB already marked
    // it revoked.
    this.apiKeys.invalidateTenant(actor.tenantId);

    await this.audit.record({
      tenantId: actor.tenantId,
      actorId: actor.userId,
      action: 'key.revoked',
      target: id,
      metadata: { prefix: key.prefix },
    });
    return { ok: true };
  }

  @Post(':id/rotate')
  @Roles('OWNER', 'ADMIN')
  async rotate(@Actor() actor: RequestActor, @Param('id') id: string, @Body() body: { gracePeriodSeconds?: number }) {
    const gracePeriodSeconds = body?.gracePeriodSeconds ?? DEFAULT_GRACE_PERIOD_SECONDS;
    if (!Number.isInteger(gracePeriodSeconds) || gracePeriodSeconds < 0 || gracePeriodSeconds > MAX_GRACE_PERIOD_SECONDS) {
      throw new BadRequestException(`gracePeriodSeconds must be an integer between 0 and ${MAX_GRACE_PERIOD_SECONDS}`);
    }

    const secret = randomBytes(24).toString('hex');

    // secret_hash on the right-hand side of its own SET clause refers to the
    // pre-update value, so this atomically captures "whatever was current"
    // into the previous slot — the same rule whether that's the key's
    // original secret or an earlier rotation's, which is what makes
    // rotating again immediately cut off anything already in that slot
    // (see docs/qa/conventions.md's A2 notes: only ever one previous secret
    // is honored at a time).
    const key = await this.db.one(
      `UPDATE api_keys
          SET previous_secret_hash = secret_hash,
              previous_secret_expires_at = now() + ($3 || ' seconds')::interval,
              secret_hash = $4
        WHERE id = $1 AND tenant_id = $2 AND revoked_at IS NULL
        RETURNING id, name, prefix, scopes, created_at`,
      [id, actor.tenantId, String(gracePeriodSeconds), hashSecret(secret)],
    );
    if (!key) throw new NotFoundException('Key not found or already revoked');

    this.apiKeys.invalidateTenant(actor.tenantId);

    await this.audit.record({
      tenantId: actor.tenantId,
      actorId: actor.userId,
      action: 'key.rotated',
      target: key.id,
      metadata: { prefix: key.prefix, gracePeriodSeconds },
    });

    return { ...key, secret: `${key.prefix}.${secret}` };
  }
}
