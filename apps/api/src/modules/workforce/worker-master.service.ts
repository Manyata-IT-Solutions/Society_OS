import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { WorkforceSequenceService } from './workforce-sequence.service.js';
import { CreateWorkerDto, UpdateWorkerDto, LinkUserDto } from '@community-os/contracts';

@Injectable()
export class WorkerMasterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequence: WorkforceSequenceService,
  ) {}

  async createWorker(dto: CreateWorkerDto) {
    const workerNumber = await this.sequence.getNextWorkerNumber(dto.organizationId);

    return this.prisma.worker.create({
      data: {
        organization: { connect: { id: dto.organizationId } },
        primaryCommunity: dto.primaryCommunityId
          ? { connect: { id: dto.primaryCommunityId } }
          : undefined,
        user: dto.userId ? { connect: { id: dto.userId } } : undefined,
        workerNumber,
        workerType: dto.workerType || 'EMPLOYEE',
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        displayName: dto.displayName || `${dto.firstName} ${dto.lastName}`,
        phone: dto.phone,
        email: dto.email,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        gender: dto.gender,
        photoDocument: dto.photoDocumentId ? { connect: { id: dto.photoDocumentId } } : undefined,
        status: 'ACTIVE',
      },
    });
  }

  async getWorkers(organizationId: string, communityId?: string, status?: string) {
    return this.prisma.worker.findMany({
      where: {
        organizationId,
        ...(communityId ? { primaryCommunityId: communityId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        engagements: {
          include: { department: true, jobRole: true, vendor: true },
        },
        skills: { include: { skill: true } },
        certifications: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getWorkerById(id: string) {
    const worker = await this.prisma.worker.findUnique({
      where: { id },
      include: {
        engagements: {
          include: { department: true, jobRole: true, vendor: true },
        },
        skills: { include: { skill: true } },
        certifications: true,
        deployments: true,
        user: true,
      },
    });
    if (!worker) throw new NotFoundException('Worker not found');
    return worker;
  }

  async updateWorker(id: string, dto: UpdateWorkerDto) {
    return this.prisma.worker.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        middleName: dto.middleName,
        lastName: dto.lastName,
        displayName: dto.displayName,
        phone: dto.phone,
        email: dto.email,
        status: dto.status,
        primaryCommunityId: dto.primaryCommunityId,
        userId: dto.userId,
      },
    });
  }

  async linkUser(dto: LinkUserDto) {
    const existing = await this.prisma.worker.findFirst({
      where: { userId: dto.userId, id: { not: dto.workerId } },
    });
    if (existing) throw new ConflictException('User is already linked to another worker');

    return this.prisma.worker.update({
      where: { id: dto.workerId },
      data: { userId: dto.userId },
    });
  }

  async offboardWorker(id: string, _reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Mark worker as EXITED
      const worker = await tx.worker.update({
        where: { id },
        data: { status: 'EXITED' },
      });

      // 2. End all active engagements
      await tx.workerEngagement.updateMany({
        where: { workerId: id, status: 'ACTIVE' },
        data: { status: 'ENDED', endDate: new Date() },
      });

      // 3. End all active deployments
      await tx.workforceDeployment.updateMany({
        where: { workerId: id, status: 'ACTIVE' },
        data: { status: 'ENDED', validUntil: new Date() },
      });

      // 4. Invalidate future shift assignments
      await tx.shiftAssignment.updateMany({
        where: {
          workerId: id,
          shiftInstance: { startAt: { gte: new Date() } },
          status: 'CONFIRMED',
        },
        data: { status: 'CANCELLED' },
      });

      return worker;
    });
  }
}
