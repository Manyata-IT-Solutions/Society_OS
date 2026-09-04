import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRepository } from '../iam/user.repository.js';
import { SessionRepository } from './session.repository.js';
import { CryptoService } from './crypto.service.js';
import { JwtTokenService } from './jwt.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { createEvent, DOMAIN_EVENT_NAMES } from '@community-os/events';
import type { LoginInput, RefreshTokenInput } from '@community-os/validation';
import type {
  LoginResponseDto,
  RefreshTokenResponseDto,
  SessionResponseDto,
  UserResponseDto,
} from '@community-os/contracts';
import { toUserResponseDto, toSessionResponseDto } from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import { RoleAssignmentRepository } from '../iam/role-assignment.repository.js';

@Injectable()
export class AuthService {
  private readonly REFRESH_TOKEN_DAYS = 30;

  constructor(
    private readonly userRepo: UserRepository,
    private readonly sessionRepo: SessionRepository,
    private readonly roleAssignmentRepo: RoleAssignmentRepository,
    private readonly cryptoService: CryptoService,
    private readonly jwtService: JwtTokenService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async login(
    input: LoginInput,
    meta: { userAgent?: string; ipAddress?: string },
  ): Promise<LoginResponseDto> {
    const user = await this.userRepo.findByEmail(input.email);

    if (!user || !user.passwordHash) {
      throw new DomainException(
        'INVALID_CREDENTIALS',
        'Invalid email or password.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (user.status !== 'ACTIVE') {
      throw new DomainException(
        'USER_SUSPENDED',
        `Account is ${user.status.toLowerCase()}. Access denied.`,
        HttpStatus.FORBIDDEN,
      );
    }

    const isPasswordValid = await this.cryptoService.comparePassword(
      input.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new DomainException(
        'INVALID_CREDENTIALS',
        'Invalid email or password.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    // Check if user has platform admin role assignment
    const activeAssignments = await this.roleAssignmentRepo.findActiveByUserId(user.id);
    const isPlatformAdmin = activeAssignments.some(
      (a) => a.scopeType === 'PLATFORM' && a.role?.code === 'PLATFORM_ADMIN',
    );

    // Generate refresh token and hash
    const rawRefreshToken = this.cryptoService.generateRefreshToken();
    const refreshTokenHash = this.cryptoService.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_DAYS);

    const session = await this.sessionRepo.create({
      userId: user.id,
      refreshTokenHash,
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt,
    });

    // Sign JWT Access Token
    const accessToken = this.jwtService.signAccessToken({
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      isPlatformAdmin,
      sessionId: session.id,
    });

    this.logger.log(`User logged in: ${user.email} (session: ${session.id})`, 'AuthService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.SESSION_CREATED,
        {
          sessionId: session.id,
          userId: user.id,
          ipAddress: meta.ipAddress,
          userAgent: meta.userAgent,
        },
        {},
      ),
    );

    return {
      user: toUserResponseDto(user),
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: this.jwtService.getExpiresInSeconds(),
        tokenType: 'Bearer',
      },
      sessionId: session.id,
    };
  }

  async refresh(
    input: RefreshTokenInput,
    _meta: { userAgent?: string; ipAddress?: string },
  ): Promise<RefreshTokenResponseDto> {
    const refreshTokenHash = this.cryptoService.hashToken(input.refreshToken);
    const session = await this.sessionRepo.findByRefreshTokenHash(refreshTokenHash);

    if (!session || session.revokedAt || new Date(session.expiresAt) <= new Date()) {
      throw new DomainException(
        'SESSION_REVOKED',
        'Session is invalid or expired. Please sign in again.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user || user.status !== 'ACTIVE') {
      await this.sessionRepo.revoke(session.id);
      throw new DomainException(
        'USER_SUSPENDED',
        'Account is suspended or deactivated.',
        HttpStatus.FORBIDDEN,
      );
    }

    const activeAssignments = await this.roleAssignmentRepo.findActiveByUserId(user.id);
    const isPlatformAdmin = activeAssignments.some(
      (a) => a.scopeType === 'PLATFORM' && a.role?.code === 'PLATFORM_ADMIN',
    );

    // Rotate refresh token
    const newRefreshToken = this.cryptoService.generateRefreshToken();
    const newRefreshTokenHash = this.cryptoService.hashToken(newRefreshToken);
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + this.REFRESH_TOKEN_DAYS);

    await this.sessionRepo.updateRefreshToken(session.id, newRefreshTokenHash, newExpiresAt);

    const accessToken = this.jwtService.signAccessToken({
      sub: user.id,
      email: user.email,
      displayName: user.displayName,
      isPlatformAdmin,
      sessionId: session.id,
    });

    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: this.jwtService.getExpiresInSeconds(),
      tokenType: 'Bearer',
    };
  }

  async logout(sessionId: string): Promise<void> {
    await this.sessionRepo.revoke(sessionId);
    this.logger.log(`Session revoked: ${sessionId}`, 'AuthService');
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionRepo.revokeAllForUser(userId);
    this.logger.log(`All sessions revoked for user: ${userId}`, 'AuthService');
  }

  async getMe(
    userId: string,
    _sessionId: string,
  ): Promise<{ user: UserResponseDto; isPlatformAdmin: boolean }> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new DomainException('USER_NOT_FOUND', 'User profile not found.', HttpStatus.NOT_FOUND);
    }

    const activeAssignments = await this.roleAssignmentRepo.findActiveByUserId(user.id);
    const isPlatformAdmin = activeAssignments.some(
      (a) => a.scopeType === 'PLATFORM' && a.role?.code === 'PLATFORM_ADMIN',
    );

    return {
      user: toUserResponseDto(user),
      isPlatformAdmin,
    };
  }

  async getUserSessions(userId: string, currentSessionId: string): Promise<SessionResponseDto[]> {
    const sessions = await this.sessionRepo.findActiveByUserId(userId);
    return sessions.map((s) => toSessionResponseDto(s, currentSessionId));
  }

  async revokeSession(
    userId: string,
    sessionIdToRevoke: string,
    isPlatformAdmin = false,
  ): Promise<void> {
    const session = await this.sessionRepo.findById(sessionIdToRevoke);
    if (!session) {
      throw new DomainException('SESSION_NOT_FOUND', 'Session not found.', HttpStatus.NOT_FOUND);
    }

    if (session.userId !== userId && !isPlatformAdmin) {
      throw new DomainException(
        'TENANT_ACCESS_DENIED',
        'Cannot revoke session of another user.',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.sessionRepo.revoke(sessionIdToRevoke);

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.SESSION_REVOKED,
        {
          sessionId: sessionIdToRevoke,
          userId: session.userId,
        },
        {},
      ),
    );
  }
}
