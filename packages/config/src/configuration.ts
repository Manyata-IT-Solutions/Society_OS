import { validateEnvironment, type Environment } from '@community-os/validation';
import * as dotenv from 'dotenv';
import * as path from 'path';

export function loadConfig(envFilePath?: string): Environment {
  if (envFilePath) {
    dotenv.config({ path: envFilePath });
  } else {
    // Default search order: .env.local, .env
    dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
    dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
  }

  return validateEnvironment(process.env);
}

export type { Environment };
