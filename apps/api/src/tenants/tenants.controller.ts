import { BadRequestException, Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Actor, RequestActor, Roles } from '../common/decorators';
import { DbService } from '../db/db.service';
import { AuditService } from '../audit/audit.service';
import { planFor, PlanTier, rateLimitOverrideCeilingFor } from '../common/plans';
import { ApiKeyService } from '../gateway/api-key.service';

@Controller('tenant')
@UseGuards(JwtGuard, RolesGuard)
export class TenantsController {
  constructor(
    private readonly db: DbService,
    private readonly audit: AuditService,
    private readonly apiKeys: ApiKeyService,
  ) {}

  @Get()
  async current(@Actor() actor: RequestActor) {
    const tenant = await this.db.one(
      `SELECT id, name, slug, plan, timezone, suspended, rate_limit_override, created_at
         FROM tenants WHERE id = $1`,
      [actor.tenantId],
    );
    const { rate_limit_override, ...rest } = tenant;
    const limits = { ...planFor(rest.plan as PlanTier), rateLimitPerMinute: rate_limit_override ?? planFor(rest.plan as PlanTier).rateLimitPerMinute };
    return { ...rest, limits };
  }

  @Patch()
  @Roles('OWNER', 'ADMIN')
  async update(
    @Actor() actor: RequestActor,
    @Body() body: { name?: string; timezone?: string },
  ) {
    const tenant = await this.db.one(
      `UPDATE tenants
          SET name = COALESCE($2, name),
              timezone = COALESCE($3, timezone)
        WHERE id = $1
        RETURNING id, name, slug, plan, timezone, suspended`,
      [actor.tenantId, body.name ?? null, body.timezone ?? null],
    );
    await this.audit.record({
      tenantId: actor.tenantId,
      actorId: actor.userId,
      action: 'tenant.updated',
      target: actor.tenantId,
      metadata: body as Record<string, unknown>,
    });
    return tenant;
  }

  @Patch('rate-limit')
  @Roles('OWNER')
  async setRateLimitOverride(
    @Actor() actor: RequestActor,
    @Body() body: { rateLimitPerMinute?: number },
  ) {
    const value = body?.rateLimitPerMinute;
    if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
      throw new BadRequestException('rateLimitPerMinute must be a positive integer');
    }

    const current = await this.db.one(
      `SELECT plan, rate_limit_override FROM tenants WHERE id = $1`,
      [actor.tenantId],
    );
    const ceiling = rateLimitOverrideCeilingFor(current.plan as PlanTier);
    // Sales asked whether an override below the plan default should be
    // permitted (for throttling abusive tenants) — Product hadn't decided.
    // Only the spec's explicit ceiling is enforced here; a lower override is
    // allowed since nothing in the spec forbids it and blocking it would
    // rule out that use case on my own authority, not the spec's.
    if (value > ceiling) {
      throw new BadRequestException(`rateLimitPerMinute may not exceed ${ceiling} for the ${current.plan} plan`);
    }

    const tenant = await this.db.one(
      `UPDATE tenants SET rate_limit_override = $2
        WHERE id = $1
        RETURNING id, name, slug, plan, timezone, suspended`,
      [actor.tenantId, value],
    );

    if (current.rate_limit_override !== value) {
      await this.audit.record({
        tenantId: actor.tenantId,
        actorId: actor.userId,
        action: 'tenant.rate_limit_override.set',
        target: actor.tenantId,
        metadata: { previous: current.rate_limit_override, next: value },
      });
      // Next gateway request must see this immediately, not after the
      // resolved-key cache's 60s TTL expires.
      this.apiKeys.invalidateTenant(actor.tenantId);
    }

    return { ...tenant, limits: { ...planFor(tenant.plan as PlanTier), rateLimitPerMinute: value } };
  }

  @Delete('rate-limit')
  @Roles('OWNER')
  async clearRateLimitOverride(@Actor() actor: RequestActor) {
    const current = await this.db.one(
      `SELECT plan, rate_limit_override FROM tenants WHERE id = $1`,
      [actor.tenantId],
    );

    const tenant = await this.db.one(
      `UPDATE tenants SET rate_limit_override = NULL
        WHERE id = $1
        RETURNING id, name, slug, plan, timezone, suspended`,
      [actor.tenantId],
    );

    if (current.rate_limit_override !== null) {
      await this.audit.record({
        tenantId: actor.tenantId,
        actorId: actor.userId,
        action: 'tenant.rate_limit_override.cleared',
        target: actor.tenantId,
        metadata: { previous: current.rate_limit_override, next: null },
      });
      this.apiKeys.invalidateTenant(actor.tenantId);
    }

    return { ...tenant, limits: planFor(tenant.plan as PlanTier) };
  }

  @Get('audit-log')
  @Roles('OWNER', 'ADMIN')
  auditLog(@Actor() actor: RequestActor) {
    return this.audit.list(actor.tenantId);
  }
}
