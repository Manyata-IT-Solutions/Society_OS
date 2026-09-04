import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';

@Injectable()
export class PassCredentialService {
  generateSecureToken(): { rawToken: string; hash: string; preview: string } {
    const rawToken = 'SEC-' + crypto.randomBytes(16).toString('hex').toUpperCase();
    const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const preview = rawToken.slice(0, 7) + '***';
    return { rawToken, hash, preview };
  }

  generateSecureOtp(): { otp: string; hash: string } {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = crypto.createHash('sha256').update(otp).digest('hex');
    return { otp, hash };
  }

  hashCredential(raw: string): string {
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
