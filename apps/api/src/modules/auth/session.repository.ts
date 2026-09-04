import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type { UserSession } from '@community-os/types';

@Injectable()
export class SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    userId: string;
    refreshTokenHash: string;
    userAgent?: string | null;
    ipAddress?: string | null;
    expiresAt: Date;
  }): Promise<UserSession> {
    const session = await this.prisma.userSession.create({
      data: {
        userId: data.userId,
        refreshTokenHash: data.refreshTokenHash,
        userAgent: data.userAgent || null,
        ipAddress: data.ipAddress || null,
        expiresAt: data.expiresAt,
        lastActiveAt: new Date(),
      },
    });

    return session;
  }

  async findById(id: string): Promise<UserSession | null> {
    return this.prisma.userSession.findUnique({
      where: { id },
    });
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<UserSession | null> {
    return this.prisma.userSession.findFirst({
      where: { refreshTokenHash },
    });
  }

  async updateLastActive(id: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id },
      data: { lastActiveAt: new Date() },
    });
  }

  async updateRefreshToken(id: string, newHash: string, expiresAt: Date): Promise<void> {
    await this.prisma.userSession.update({
      where: { id },
      data: {
        refreshTokenHash: newHash,
        expiresAt,
        lastActiveAt: new Date(),
      },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.userSession.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async findActiveByUserId(userId: string): Promise<UserSession[]> {
    return this.prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: 'desc' },
    });
  }
}
