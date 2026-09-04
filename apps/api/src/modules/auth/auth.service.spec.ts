import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service.js';
import { UserRepository } from '../iam/user.repository.js';
import { SessionRepository } from './session.repository.js';
import { RoleAssignmentRepository } from '../iam/role-assignment.repository.js';
import { CryptoService } from './crypto.service.js';
import { JwtTokenService } from './jwt.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: { [K in keyof UserRepository]?: jest.Mock };
  let sessionRepo: { [K in keyof SessionRepository]?: jest.Mock };
  let roleAssignmentRepo: { [K in keyof RoleAssignmentRepository]?: jest.Mock };
  let cryptoService: CryptoService;

  beforeEach(async () => {
    userRepo = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    sessionRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByRefreshTokenHash: jest.fn(),
      updateRefreshToken: jest.fn(),
      revoke: jest.fn(),
      revokeAllForUser: jest.fn(),
      findActiveByUserId: jest.fn(),
    };

    roleAssignmentRepo = {
      findActiveByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: userRepo },
        { provide: SessionRepository, useValue: sessionRepo },
        { provide: RoleAssignmentRepository, useValue: roleAssignmentRepo },
        CryptoService,
        {
          provide: JwtTokenService,
          useValue: {
            signAccessToken: jest.fn().mockReturnValue('mock_access_token_jwt'),
            getExpiresInSeconds: jest.fn().mockReturnValue(900),
          },
        },
        {
          provide: EventsService,
          useValue: { publish: jest.fn().mockResolvedValue(undefined) },
        },
        {
          provide: LoggerService,
          useValue: { log: jest.fn(), debug: jest.fn(), error: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  describe('login', () => {
    it('should authenticate user and return tokens + session', async () => {
      const password = 'CorrectPassword123!';
      const passwordHash = await cryptoService.hashPassword(password);

      userRepo.findByEmail!.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@example.com',
        displayName: 'Test User',
        passwordHash,
        status: 'ACTIVE',
        preferredLocale: 'en-US',
        timezone: 'UTC',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      roleAssignmentRepo.findActiveByUserId!.mockResolvedValue([]);
      sessionRepo.create!.mockResolvedValue({
        id: 'session-uuid-1',
        userId: 'user-uuid-1',
        refreshTokenHash: 'hash',
        expiresAt: new Date(Date.now() + 100000),
        lastActiveAt: new Date(),
        createdAt: new Date(),
      });

      const res = await service.login(
        { email: 'test@example.com', password },
        { userAgent: 'Jest Test Agent', ipAddress: '127.0.0.1' },
      );

      expect(res.user.email).toBe('test@example.com');
      expect(res.tokens.accessToken).toBe('mock_access_token_jwt');
      expect(res.sessionId).toBe('session-uuid-1');
      expect(res.tokens.tokenType).toBe('Bearer');
    });

    it('should throw UNAUTHORIZED on invalid password', async () => {
      const passwordHash = await cryptoService.hashPassword('RealPassword123!');

      userRepo.findByEmail!.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'test@example.com',
        displayName: 'Test User',
        passwordHash,
        status: 'ACTIVE',
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'WrongPassword!' }, {}),
      ).rejects.toThrow('Invalid email or password.');
    });

    it('should throw FORBIDDEN if user status is SUSPENDED', async () => {
      userRepo.findByEmail!.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'suspended@example.com',
        passwordHash: 'hash',
        status: 'SUSPENDED',
      });

      await expect(
        service.login({ email: 'suspended@example.com', password: 'any' }, {}),
      ).rejects.toThrow('Account is suspended.');
    });
  });
});
