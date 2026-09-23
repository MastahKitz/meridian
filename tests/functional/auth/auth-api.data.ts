// Nest's default HttpException body shape — shared across every JwtGuard-
// guarded endpoint (see jwt.guard.ts), regardless of which domain's controller
// it's guarding, so this isn't owned by any one domain's own data.ts.
export interface AuthErrorResponseBody {
  message: string;
  error: string;
  statusCode: number;
}
