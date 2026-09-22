// Values come from .env (see config/.env.example) or CI secrets — no fallback
// defaults, so a missing var fails loudly here instead of silently resolving to
// undefined at whatever line first tries to use it.
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and fill in real values.`);
  }
  return value;
}
