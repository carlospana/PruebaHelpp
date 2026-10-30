import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export interface EnvProfile {
  name: string;
  description: string;
  baseURL: string;
  /** Query string que se agrega a cada navegación (p. ej. "build=rc"). */
  appQuery: string;
  startLocalServer: boolean;
  /** Build que el ambiente debe reportar en la app; se verifica antes de probar. */
  expectedBuild: 'stable' | 'rc';
}

const VALID = ['local', 'rc', 'example'] as const;

export function loadEnv(): EnvProfile {
  const name = (process.env.TEST_ENV ?? 'local').trim();
  const file = join(__dirname, 'environments', `${name}.json`);
  if (!existsSync(file)) {
    throw new Error(`TEST_ENV="${name}" no existe. Valores válidos: ${VALID.join(', ')}`);
  }
  const profile = JSON.parse(readFileSync(file, 'utf-8')) as EnvProfile;
  const override = process.env.BASE_URL?.trim();
  if (override) profile.baseURL = override;
  if (profile.baseURL.includes('<')) {
    throw new Error(`El perfil "${name}" requiere BASE_URL (ver .env.example).`);
  }
  if (profile.startLocalServer && process.env.APP_PORT) {
    profile.baseURL = `http://127.0.0.1:${process.env.APP_PORT}`;
  }
  return profile;
}

export const env = loadEnv();
