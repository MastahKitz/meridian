import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';

const REQUIRED_SCOPE: Record<string, 'read' | 'write'> = {
  GET: 'read',
  POST: 'write',
};

// A2: runs after RateLimitGuard (see GatewayController's @UseGuards order),
// which already resolved the key and attached it to req.apiKey — reused here
// rather than re-resolving. `scopes` null means the key predates A2 (or was
// created without an explicit scopes array), so it stays unrestricted.
@Injectable()
export class ScopeGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const scopes: string[] | null = req.apiKey?.scopes ?? null;
    if (!scopes) return true;

    const required = REQUIRED_SCOPE[req.method];
    if (required && !scopes.includes(required)) {
      throw new ForbiddenException(`Key is missing required scope: ${required}`);
    }
    return true;
  }
}
