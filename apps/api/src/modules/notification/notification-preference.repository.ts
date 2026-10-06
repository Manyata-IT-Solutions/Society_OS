import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import type {
  NotificationPreference,
  NotificationCategory,
  NotificationChannel,
} from '@community-os/types';

@Injectable()
export class NotificationPreferenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<NotificationPreference[]> {
    const prefs = await this.prisma.notificationPreference.findMany({
      where: { userId },
    });
    return prefs as unknown as NotificationPreference[];
  }

  async isChannelEnabledForUser(
    userId: string,
    category: NotificationCategory,
    channel: NotificationChannel,
  ): Promise<boolean> {
    // Mandatory security categories cannot be disabled by user preferences
    if (category === 'SECURITY') {
      return true;
    }

    const pref = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_category_channel: {
          userId,
          category,
          channel,
        },
      },
    });

    // Default to true if no explicit user preference is recorded
    return pref ? pref.isEnabled : true;
  }

  async upsertPreference(
    userId: string,
    category: NotificationCategory,
    channel: NotificationChannel,
    isEnabled: boolean,
  ): Promise<NotificationPreference> {
    const pref = await this.prisma.notificationPreference.upsert({
      where: {
        userId_category_channel: {
          userId,
          category,
          channel,
        },
      },
      update: { isEnabled },
      create: {
        userId,
        category,
        channel,
        isEnabled,
      },
    });
    return pref as unknown as NotificationPreference;
  }
}
