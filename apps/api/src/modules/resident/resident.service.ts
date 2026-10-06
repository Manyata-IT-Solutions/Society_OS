import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ResidentRepository, type ResidentWithRelations } from './resident.repository.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { createEvent, DOMAIN_EVENT_NAMES } from '@community-os/events';
import {
  DomainException,
  DuplicateEntityException,
} from '../../common/exceptions/domain.exceptions.js';
import type {
  CreateResidentInput,
  UpdateResidentInput,
  ResidentQueryParams,
} from '@community-os/validation';
import type { Resident } from '@community-os/types';
import { SYSTEM_ROLE_CODES } from '@community-os/auth';

@Injectable()
export class ResidentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly residentRepo: ResidentRepository,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async createResident(communityId: string, input: CreateResidentInput): Promise<Resident> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      throw new DomainException(
        'COMMUNITY_NOT_FOUND',
        'Community not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (community.status === 'ARCHIVED') {
      throw new DomainException(
        'COMMUNITY_ARCHIVED',
        'Cannot create resident in an archived community.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Duplicate detection by email
    if (input.email) {
      const existingEmail = await this.residentRepo.findByEmail(communityId, input.email);
      if (existingEmail) {
        throw new DuplicateEntityException(
          `A resident with email '${input.email}' already exists in this community.`,
        );
      }
    }

    // Duplicate detection by phone
    if (input.phone) {
      const existingPhone = await this.residentRepo.findByPhone(communityId, input.phone);
      if (existingPhone) {
        throw new DuplicateEntityException(
          `A resident with phone number '${input.phone}' already exists in this community.`,
        );
      }
    }

    const resident = await this.residentRepo.create(community.organizationId, communityId, input);

    this.logger.log(
      `Created resident: ${resident.displayName || resident.firstName} (${resident.id}) in community: ${communityId}`,
      'ResidentService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.RESIDENT_CREATED,
        {
          residentId: resident.id,
          organizationId: resident.organizationId,
          communityId: resident.communityId,
          displayName: resident.displayName || `${resident.firstName} ${resident.lastName}`,
          status: resident.status,
        },
        { organizationId: resident.organizationId, communityId: resident.communityId },
      ),
    );

    return resident;
  }

  async findResidentById(id: string): Promise<ResidentWithRelations> {
    const resident = await this.residentRepo.findById(id);
    if (!resident) {
      throw new DomainException('RESIDENT_NOT_FOUND', 'Resident not found.', HttpStatus.NOT_FOUND);
    }
    return resident;
  }

  async listResidents(
    communityId: string,
    params: ResidentQueryParams,
  ): Promise<{ items: ResidentWithRelations[]; total: number }> {
    return this.residentRepo.findMany(communityId, params);
  }

  async updateResident(id: string, input: UpdateResidentInput): Promise<Resident> {
    const existing = await this.findResidentById(id);

    if (existing.status === 'ARCHIVED') {
      throw new DomainException(
        'RESIDENT_ARCHIVED',
        'Cannot modify an archived resident.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check duplicate email if changing
    if (input.email && input.email.toLowerCase() !== existing.email?.toLowerCase()) {
      const dup = await this.residentRepo.findByEmail(existing.communityId, input.email);
      if (dup && dup.id !== id) {
        throw new DuplicateEntityException(
          `Another resident with email '${input.email}' already exists in this community.`,
        );
      }
    }

    // Check duplicate phone if changing
    if (input.phone && input.phone !== existing.phone) {
      const dup = await this.residentRepo.findByPhone(existing.communityId, input.phone);
      if (dup && dup.id !== id) {
        throw new DuplicateEntityException(
          `Another resident with phone '${input.phone}' already exists in this community.`,
        );
      }
    }

    const updated = await this.residentRepo.update(id, input);

    this.logger.log(`Updated resident: ${updated.id}`, 'ResidentService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.RESIDENT_UPDATED,
        {
          residentId: updated.id,
          organizationId: updated.organizationId,
          communityId: updated.communityId,
          displayName: updated.displayName || `${updated.firstName} ${updated.lastName}`,
          status: updated.status,
        },
        { organizationId: updated.organizationId, communityId: updated.communityId },
      ),
    );

    return updated;
  }

  async linkUser(residentId: string, userId: string): Promise<Resident> {
    const resident = await this.findResidentById(residentId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new DomainException('USER_NOT_FOUND', 'User not found.', HttpStatus.NOT_FOUND);
    }

    // Check if user is already linked to another resident in this community
    const existingLink = await this.residentRepo.findByUserId(userId, resident.communityId);
    if (existingLink.length > 0 && existingLink[0]?.id !== residentId) {
      throw new DomainException(
        'RESIDENT_ALREADY_LINKED',
        'This User account is already linked to another resident profile in this community.',
        HttpStatus.CONFLICT,
      );
    }

    const updated = await this.residentRepo.linkUser(residentId, userId);

    this.logger.log(`Linked resident: ${residentId} to user: ${userId}`, 'ResidentService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.RESIDENT_USER_LINKED,
        {
          residentId,
          userId,
          organizationId: resident.organizationId,
          communityId: resident.communityId,
        },
        { organizationId: resident.organizationId, communityId: resident.communityId },
      ),
    );

    return updated;
  }

  async inviteResident(
    residentId: string,
  ): Promise<{ resident: Resident; user: { id: string; email: string } }> {
    const resident = await this.findResidentById(residentId);

    if (!resident.email) {
      throw new DomainException(
        'EMAIL_REQUIRED',
        'Cannot invite resident without an email address.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 1. Check or create User
    let user = await this.prisma.user.findUnique({
      where: { email: resident.email.toLowerCase() },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: resident.email.toLowerCase(),
          phone: resident.phone || null,
          displayName: resident.displayName || `${resident.firstName} ${resident.lastName}`,
          status: 'PENDING',
        },
      });
    }

    // 2. Ensure TenantMembership exists
    await this.prisma.tenantMembership.upsert({
      where: {
        userId_organizationId_communityId: {
          userId: user.id,
          organizationId: resident.organizationId,
          communityId: resident.communityId,
        },
      },
      update: { status: 'ACTIVE' },
      create: {
        userId: user.id,
        organizationId: resident.organizationId,
        communityId: resident.communityId,
        status: 'ACTIVE',
      },
    });

    // 3. Assign RESIDENT role at COMMUNITY scope
    const residentRole = await this.prisma.role.findFirst({
      where: { code: SYSTEM_ROLE_CODES.RESIDENT },
    });

    if (residentRole) {
      const existingAssignment = await this.prisma.roleAssignment.findFirst({
        where: {
          userId: user.id,
          roleId: residentRole.id,
          scopeType: 'COMMUNITY',
          scopeId: resident.communityId,
          status: 'ACTIVE',
        },
      });

      if (!existingAssignment) {
        await this.prisma.roleAssignment.create({
          data: {
            userId: user.id,
            roleId: residentRole.id,
            scopeType: 'COMMUNITY',
            scopeId: resident.communityId,
            status: 'ACTIVE',
          },
        });
      }
    }

    // 4. Link resident to user
    const updatedResident = await this.residentRepo.linkUser(residentId, user.id);

    this.logger.log(
      `Invited resident: ${residentId} and linked to User: ${user.id} (${user.email})`,
      'ResidentService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.RESIDENT_INVITED,
        {
          residentId,
          organizationId: resident.organizationId,
          communityId: resident.communityId,
          email: resident.email,
        },
        { organizationId: resident.organizationId, communityId: resident.communityId },
      ),
    );

    return {
      resident: updatedResident,
      user: { id: user.id, email: user.email },
    };
  }

  async archiveResident(id: string): Promise<Resident> {
    await this.findResidentById(id);
    const archived = await this.residentRepo.archive(id);
    this.logger.log(`Archived resident: ${id}`, 'ResidentService');
    return archived;
  }
}
