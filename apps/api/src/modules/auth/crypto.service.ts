import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

@Injectable()
export class CryptoService {
  private readonly SALT_ROUNDS = 12;

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }
}
