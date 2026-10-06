import type { PrismaClient } from '@prisma/client';
import { db } from './client.js';

export abstract class BaseRepository {
  protected readonly prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || db;
  }
}
