import dotenv from 'dotenv';
import path from 'path';

// Loaded here rather than left to the importer (playwright.config.ts) — a plain
// `import` of this file hoists above any `dotenv.config()` call the importer makes
// afterwards, so relying on import order silently reads unset env vars.
dotenv.config({ path: path.join(__dirname, '.env') });

export interface EnvironmentConfig {
  apiBaseUrl: string;
  webBaseUrl: string;
}

// Values come from .env (see .env.example) or CI secrets — no fallback defaults,
// so a missing var fails loudly here instead of silently resolving to undefined.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and fill in real values.`);
  }
  return value;
}

const environments: Record<string, EnvironmentConfig> = {
  local: {
    apiBaseUrl: requireEnv('API_BASE_URL'),
    webBaseUrl: requireEnv('WEB_BASE_URL'),
  },
};

const envName = requireEnv('QA_ENV');

export const environment = environments[envName];
