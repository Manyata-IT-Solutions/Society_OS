import { Injectable, HttpStatus } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { ConfigService } from '../config/config.service.js';
import type { JwtPayload } from '@community-os/types';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@Injectable()
export class JwtTokenService {
  private readonly secret: string;
  private readonly expiresInSeconds = 900; // 15 minutes
  private readonly issuer = 'community-os-api';
  private readonly audience = 'community-os-app';

  constructor(private readonly config: ConfigService) {
    this.secret = String(
      this.config.get('JWT_ACCESS_SECRET') ||
        'community_os_default_development_secret_do_not_use_in_prod',
    );
  }

  signAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresInSeconds,
      issuer: this.issuer,
      audience: this.audience,
    });
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.secret, {
        issuer: this.issuer,
        audience: this.audience,
      }) as JwtPayload;
    } catch (err: unknown) {
      const errorName = (err as { name?: string })?.name;
      if (errorName === 'TokenExpiredError') {
        throw new DomainException(
          'SESSION_EXPIRED',
          'Access token has expired. Please refresh session.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new DomainException(
        'AUTHENTICATION_REQUIRED',
        'Invalid authentication token.',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  getExpiresInSeconds(): number {
    return this.expiresInSeconds;
  }
}
