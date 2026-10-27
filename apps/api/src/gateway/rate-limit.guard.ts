import { CanActivate, ExecutionContext, Injectable, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiKeyService } from './api-key.service';
import { RedisService } from '../db/redis.service';
import { planFor, PlanTier } from '../common/plans';

const WINDOW_SECONDS = 60;

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly keys: ApiKeyService,
    private readonly redis: RedisService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const res = ctx.switchToHttp().getResponse();

    const rawKey = req.headers['x-api-key'];
    if (!rawKey) throw new UnauthorizedException('Missing x-api-key');

    const resolved = await this.keys.resolve(rawKey);
    if (!resolved) throw new UnauthorizedException('Invalid API key');

    const limit = resolved.rateLimitOverride ?? planFor(resolved.plan as PlanTier).rateLimitPerMinute;

    const window = Math.floor(Date.now() / 1000 / WINDOW_SECONDS);
    const bucket = `rl:${resolved.prefix}:${window}`;

    // SUP-1067: INCR is atomic, unlike the previous GET-then-SET, which let
    // concurrent requests all read the same `current` before any of them
    // wrote their increment — letting more through than `limit`. The window
    // only needs its expiry set once, by whichever request happens to be the
    // first to create the key (INCR returns 1).
    const next = await this.redis.client.incr(bucket);
    if (next === 1) {
      await this.redis.client.expire(bucket, WINDOW_SECONDS);
    }

    if (next > limit) {
      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('Retry-After', String(WINDOW_SECONDS));
      throw new HttpException('Rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);
    }

    res.setHeader('X-RateLimit-Limit', String(limit));
    res.setHeader('X-RateLimit-Remaining', String(Math.max(0, limit - next)));

    req.apiKey = resolved;
    return true;
  }
}
