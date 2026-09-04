import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { HouseholdRepository, type HouseholdWithRelations } from './household.repository.js';
import { ResidentRepository } from './resident.repository.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { createEvent, DOMAIN_EVENT_NAMES } from '@community-os/events';
import {
  DomainException,
  DuplicateEntityException,
} from '../../common/exceptions/domain.exceptions.js';
import type {
  CreateHouseholdInput,
  UpdateHouseholdInput,
  HouseholdQueryParams,
  AddHouseholdMemberInput,
} from '@community-os/validation';
import type { Household, HouseholdMember } from '@community-os/types';

@Injectable()
export class HouseholdService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly householdRepo: HouseholdRepository,
    private readonly residentRepo: ResidentRepository,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async createHousehold(unitId: string, input: CreateHouseholdInput): Promise<Household> {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: { community: true },
    });

    if (!unit) {
      throw new DomainException('UNIT_NOT_FOUND', 'Unit not found.', HttpStatus.NOT_FOUND);
    }

    if (unit.status === 'ARCHIVED') {
      throw new DomainException(
        'UNIT_ARCHIVED',
        'Cannot create household in an archived unit.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate primary contact resident if provided
    if (input.primaryContactResidentId) {
      const primaryRes = await this.residentRepo.findById(input.primaryContactResidentId);
      if (!primaryRes || primaryRes.communityId !== unit.communityId) {
        throw new DomainException(
          'INVALID_PRIMARY_CONTACT',
          'Primary contact resident not found in this community.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const household = await this.householdRepo.create(unit.organizationId, unit.communityId, {
      ...input,
      unitId,
    });

    // If primary contact provided, add as member
    if (input.primaryContactResidentId) {
      await this.householdRepo.addMember(unit.organizationId, unit.communityId, household.id, {
        residentId: input.primaryContactResidentId,
        relationshipType: 'SELF',
        isPrimaryContact: true,
        joinedAt: input.startDate,
      });
    }

    this.logger.log(
      `Created household: ${household.id} for unit: ${unit.unitNumber}`,
      'HouseholdService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.HOUSEHOLD_CREATED,
        {
          householdId: household.id,
          organizationId: household.organizationId,
          communityId: household.communityId,
          unitId: household.unitId,
          name: household.name,
          status: household.status,
        },
        { organizationId: household.organizationId, communityId: household.communityId },
      ),
    );

    return household;
  }

  async findHouseholdById(id: string): Promise<HouseholdWithRelations> {
    const household = await this.householdRepo.findById(id);
    if (!household) {
      throw new DomainException(
        'HOUSEHOLD_NOT_FOUND',
        'Household not found.',
        HttpStatus.NOT_FOUND,
      );
    }
    return household;
  }

  async findActiveHouseholdForUnit(unitId: string): Promise<HouseholdWithRelations | null> {
    return this.householdRepo.findActiveByUnitId(unitId);
  }

  async listHouseholdsForUnit(
    unitId: string,
    params: HouseholdQueryParams,
  ): Promise<{ items: HouseholdWithRelations[]; total: number }> {
    return this.householdRepo.findByUnitId(unitId, params);
  }

  async updateHousehold(id: string, input: UpdateHouseholdInput): Promise<Household> {
    const existing = await this.findHouseholdById(id);

    if (existing.status === 'ARCHIVED') {
      throw new DomainException(
        'HOUSEHOLD_ARCHIVED',
        'Cannot modify an archived household.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (input.primaryContactResidentId) {
      const primaryRes = await this.residentRepo.findById(input.primaryContactResidentId);
      if (!primaryRes || primaryRes.communityId !== existing.communityId) {
        throw new DomainException(
          'INVALID_PRIMARY_CONTACT',
          'Primary contact resident not found in this community.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const updated = await this.householdRepo.update(id, input);
    this.logger.log(`Updated household: ${id}`, 'HouseholdService');
    return updated;
  }

  async addMember(householdId: string, input: AddHouseholdMemberInput): Promise<HouseholdMember> {
    const household = await this.findHouseholdById(householdId);

    if (household.status !== 'ACTIVE') {
      throw new DomainException(
        'HOUSEHOLD_INACTIVE',
        'Cannot add members to an inactive or archived household.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const resident = await this.residentRepo.findById(input.residentId);
    if (!resident || resident.communityId !== household.communityId) {
      throw new DomainException(
        'RESIDENT_NOT_FOUND',
        'Resident not found in this community.',
        HttpStatus.NOT_FOUND,
      );
    }

    const existingMember = await this.householdRepo.findMember(householdId, input.residentId);
    if (existingMember && existingMember.status === 'ACTIVE') {
      throw new DuplicateEntityException('Resident is already an active member of this household.');
    }

    let member: HouseholdMember;
    if (existingMember) {
      member = await this.householdRepo.updateMember(householdId, input.residentId, {
        relationshipType: input.relationshipType,
        isPrimaryContact: input.isPrimaryContact,
        status: 'ACTIVE',
        leftAt: null,
      });
    } else {
      member = await this.householdRepo.addMember(
        household.organizationId,
        household.communityId,
        householdId,
        input,
      );
    }

    if (input.isPrimaryContact) {
      await this.householdRepo.update(householdId, {
        primaryContactResidentId: input.residentId,
      });
    }

    this.logger.log(
      `Added member: ${input.residentId} to household: ${householdId}`,
      'HouseholdService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.HOUSEHOLD_MEMBER_ADDED,
        {
          householdId,
          residentId: input.residentId,
          relationshipType: input.relationshipType || 'SELF',
          isPrimaryContact: Boolean(input.isPrimaryContact),
        },
        { organizationId: household.organizationId, communityId: household.communityId },
      ),
    );

    return member;
  }

  async removeMember(householdId: string, residentId: string): Promise<void> {
    const household = await this.findHouseholdById(householdId);
    const member = await this.householdRepo.findMember(householdId, residentId);

    if (!member) {
      throw new DomainException(
        'MEMBER_NOT_FOUND',
        'Resident is not a member of this household.',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.householdRepo.removeMember(householdId, residentId);

    if (household.primaryContactResidentId === residentId) {
      await this.householdRepo.update(householdId, {
        primaryContactResidentId: null,
      });
    }

    this.logger.log(
      `Removed member: ${residentId} from household: ${householdId}`,
      'HouseholdService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.HOUSEHOLD_MEMBER_REMOVED,
        {
          householdId,
          residentId,
        },
        { organizationId: household.organizationId, communityId: household.communityId },
      ),
    );
  }
}
