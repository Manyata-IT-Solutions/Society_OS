import { CanActivate, ExecutionContext, Injectable, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';
import { JwtTokenService } from '../../modules/auth/jwt.service.js';
import { SessionRepository } from '../../modules/auth/session.repository.js';
import { RequestContext } from '@community-os/observability';
import { DomainException } from '../exceptions/domain.exceptions.js';
import type { Actor } from '@community-os/types';

export interface AuthenticatedRequest extends Request {
  actor?: Actor;
  sessionId?: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtTokenService,
    private readonly sessionRepo: SessionRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new DomainException(
        'AUTHENTICATION_REQUIRED',
        'Authentication required. Bearer token missing.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new DomainException(
        'AUTHENTICATION_REQUIRED',
        'Authentication token missing.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const payload = this.jwtService.verifyAccessToken(token);

    // Verify session validity in database (revocable session check)
    const session = await this.sessionRepo.findById(payload.sessionId);
    if (!session || session.revokedAt || new Date(session.expiresAt) <= new Date()) {
      throw new DomainException(
        'SESSION_REVOKED',
        'Session has been revoked or expired. Please sign in again.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Update session active timestamp asynchronously
    this.sessionRepo.updateLastActive(session.id).catch(() => {});

    const actor: Actor = {
      id: payload.sub,
      userId: payload.sub,
      email: payload.email,
      displayName: payload.displayName,
      isPlatformAdmin: Boolean(payload.isPlatformAdmin),
      sessionId: payload.sessionId,
    };

    request.actor = actor;
    request.sessionId = payload.sessionId;

    // Attach to current RequestContext
    const currentStore = RequestContext.getStore();
    if (currentStore) {
      currentStore.userId = actor.id;
      currentStore.isPlatformAdmin = actor.isPlatformAdmin;
      if (payload.organizationId && !currentStore.organizationId) {
        currentStore.organizationId = payload.organizationId;
      }
      if (payload.communityId && !currentStore.communityId) {
        currentStore.communityId = payload.communityId;
      }
    }

    return true;
  }
}
