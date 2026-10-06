import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { OccupancyRepository, type OccupancyWithRelations } from './occupancy.repository.js';
import { HouseholdRepository } from './household.repository.js';
import { OwnershipRepository } from './ownership.repository.js';
import { TenancyRepository } from './tenancy.repository.js';
import { ResidentRepository } from './resident.repository.js';
import { ResidentService } from './resident.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { createEvent, DOMAIN_EVENT_NAMES } from '@community-os/events';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type { MoveInInput, MoveOutInput, OccupancyQueryParams } from '@community-os/validation';
import type {
  MoveInResultDto,
  UnitResidentialStateDto,
  OccupancyResponseDto,
} from '@community-os/contracts';
import {
  toHouseholdResponseDto,
  toHouseholdMemberResponseDto,
  toOccupancyResponseDto,
  toTenancyResponseDto,
  toOwnershipResponseDto,
  toResidentSummaryDto,
} from '@community-os/contracts';
import type { OccupancyType, OwnershipType, HouseholdRelationshipType } from '@community-os/types';

@Injectable()
export class OccupancyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly occupancyRepo: OccupancyRepository,
    private readonly householdRepo: HouseholdRepository,
    private readonly ownershipRepo: OwnershipRepository,
    private readonly tenancyRepo: TenancyRepository,
    private readonly residentRepo: ResidentRepository,
    private readonly residentService: ResidentService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async moveIn(unitId: string, input: MoveInInput): Promise<MoveInResultDto> {
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
        'Cannot move into an archived unit.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const effectiveDate = new Date(input.effectiveDate);
    const leaseEndDate = input.leaseEndDate ? new Date(input.leaseEndDate) : null;

    // 1. Prevent Overlapping Active Occupancies
    const conflicts = await this.occupancyRepo.findConflictingOccupancies(
      unitId,
      effectiveDate,
      leaseEndDate,
    );

    if (conflicts.length > 0) {
      throw new DomainException(
        'OCCUPANCY_DATE_CONFLICT',
        `An active or scheduled occupancy already exists for unit ${unit.unitNumber} during this period.`,
        HttpStatus.CONFLICT,
      );
    }

    // 2. Resolve Primary Resident
    let primaryResidentId = input.primaryResident.residentId;
    if (!primaryResidentId) {
      if (!input.primaryResident.firstName || !input.primaryResident.lastName) {
        throw new DomainException(
          'PRIMARY_RESIDENT_REQUIRED',
          'Primary resident details (first name, last name) or existing residentId must be provided.',
          HttpStatus.BAD_REQUEST,
        );
      }
      const newResident = await this.residentRepo.create(unit.organizationId, unit.communityId, {
        firstName: input.primaryResident.firstName,
        lastName: input.primaryResident.lastName,
        phone: input.primaryResident.phone || null,
        email: input.primaryResident.email || null,
        status: 'ACTIVE',
        preferredLanguage: 'en',
      });
      primaryResidentId = newResident.id;
    } else {
      const existing = await this.residentRepo.findById(primaryResidentId);
      if (!existing || existing.communityId !== unit.communityId) {
        throw new DomainException(
          'RESIDENT_NOT_FOUND',
          'Provided primary resident does not belong to this community.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 3. Resolve Additional Members
    const memberResidentIds: Array<{
      residentId: string;
      relationshipType: HouseholdRelationshipType;
    }> = [];
    for (const member of input.additionalMembers || []) {
      let memberId = member.residentId;
      if (!memberId) {
        if (!member.firstName || !member.lastName) {
          throw new DomainException(
            'MEMBER_DETAILS_REQUIRED',
            'Additional member must have first name and last name or residentId.',
            HttpStatus.BAD_REQUEST,
          );
        }
        const newMemberResident = await this.residentRepo.create(
          unit.organizationId,
          unit.communityId,
          {
            firstName: member.firstName,
            lastName: member.lastName,
            phone: member.phone || null,
            email: member.email || null,
            status: 'ACTIVE',
            preferredLanguage: 'en',
          },
        );
        memberId = newMemberResident.id;
      }
      memberResidentIds.push({
        residentId: memberId,
        relationshipType: (member.relationshipType || 'OTHER') as HouseholdRelationshipType,
      });
    }

    // 4. Transactional Move-in Execution
    const result = await this.prisma.$transaction(async (tx) => {
      // Create Household
      const household = await tx.household.create({
        data: {
          organizationId: unit.organizationId,
          communityId: unit.communityId,
          unitId,
          name: input.householdName || null,
          primaryContactResidentId: primaryResidentId,
          startDate: effectiveDate,
          status: 'ACTIVE',
          version: 1,
        },
      });

      // Add Primary Member
      const primaryMember = await tx.householdMember.create({
        data: {
          organizationId: unit.organizationId,
          communityId: unit.communityId,
          householdId: household.id,
          residentId: primaryResidentId,
          relationshipType: (input.primaryResident.relationshipType ||
            'SELF') as HouseholdRelationshipType,
          isPrimaryContact: true,
          status: 'ACTIVE',
          joinedAt: effectiveDate,
          version: 1,
        },
      });

      // Add Additional Members
      const members = [primaryMember];
      for (const m of memberResidentIds) {
        const memRecord = await tx.householdMember.create({
          data: {
            organizationId: unit.organizationId,
            communityId: unit.communityId,
            householdId: household.id,
            residentId: m.residentId,
            relationshipType: m.relationshipType,
            isPrimaryContact: false,
            status: 'ACTIVE',
            joinedAt: effectiveDate,
            version: 1,
          },
        });
        members.push(memRecord);
      }

      // If Tenant Occupied -> Create Tenancy
      let tenancy = null;
      if (input.occupancyType === 'TENANT_OCCUPIED') {
        tenancy = await tx.unitTenancy.create({
          data: {
            organizationId: unit.organizationId,
            communityId: unit.communityId,
            unitId,
            householdId: household.id,
            startDate: effectiveDate,
            endDate: leaseEndDate,
            status: 'ACTIVE',
            agreementReference: input.agreementReference || null,
            version: 1,
          },
        });
      }

      // If Owner Occupied & Creating Ownership -> Create Ownership
      let ownership = null;
      if (input.occupancyType === 'OWNER_OCCUPIED' && input.isNewOwner) {
        ownership = await tx.unitOwnership.create({
          data: {
            organizationId: unit.organizationId,
            communityId: unit.communityId,
            unitId,
            residentId: primaryResidentId,
            ownershipShare: input.ownershipShare ?? null,
            ownershipType: (input.ownershipType || 'SOLE') as OwnershipType,
            isPrimaryOwner: true,
            startDate: effectiveDate,
            status: 'ACTIVE',
            version: 1,
          },
        });
      }

      // Create Occupancy
      const occupancy = await tx.unitOccupancy.create({
        data: {
          organizationId: unit.organizationId,
          communityId: unit.communityId,
          unitId,
          householdId: household.id,
          occupancyType: input.occupancyType as OccupancyType,
          startDate: effectiveDate,
          endDate: leaseEndDate,
          status: 'ACTIVE',
          version: 1,
        },
      });

      return { household, occupancy, tenancy, ownership, members };
    });

    // 5. Send App Invitations if requested
    if (input.sendAppInvitations) {
      try {
        await this.residentService.inviteResident(primaryResidentId);
      } catch (err: unknown) {
        this.logger.warn(
          `Could not send app invitation during move-in: ${(err as Error).message}`,
          'OccupancyService',
        );
      }
    }

    this.logger.log(
      `Completed move-in for unit: ${unit.unitNumber} (${input.occupancyType}) with household: ${result.household.id}`,
      'OccupancyService',
    );

    // 6. Publish Events
    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.UNIT_MOVE_IN_COMPLETED,
        {
          unitId,
          organizationId: unit.organizationId,
          communityId: unit.communityId,
          householdId: result.household.id,
          primaryResidentId,
          occupancyType: input.occupancyType as OccupancyType,
          effectiveDate: input.effectiveDate,
        },
        { organizationId: unit.organizationId, communityId: unit.communityId },
      ),
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.OCCUPANCY_STARTED,
        {
          occupancyId: result.occupancy.id,
          organizationId: unit.organizationId,
          communityId: unit.communityId,
          unitId,
          householdId: result.household.id,
          occupancyType: input.occupancyType as OccupancyType,
          startDate: input.effectiveDate,
        },
        { organizationId: unit.organizationId, communityId: unit.communityId },
      ),
    );

    const primaryResident = await this.residentRepo.findById(primaryResidentId);

    return {
      household: toHouseholdResponseDto(result.household),
      occupancy: toOccupancyResponseDto(result.occupancy),
      tenancy: result.tenancy ? toTenancyResponseDto(result.tenancy) : null,
      ownership: result.ownership ? toOwnershipResponseDto(result.ownership) : null,
      primaryResident: toResidentSummaryDto(primaryResident!),
      members: result.members.map((m) => toHouseholdMemberResponseDto(m)),
    };
  }

  async moveOut(occupancyId: string, input: MoveOutInput): Promise<OccupancyResponseDto> {
    const occupancy = await this.occupancyRepo.findById(occupancyId);
    if (!occupancy) {
      throw new DomainException(
        'OCCUPANCY_NOT_FOUND',
        'Occupancy record not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    if (occupancy.status !== 'ACTIVE') {
      throw new DomainException(
        'OCCUPANCY_NOT_ACTIVE',
        'Cannot execute move-out on an occupancy that is not currently active.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const effectiveDate = new Date(input.effectiveDate);

    // Execute atomic move-out in transaction
    await this.prisma.$transaction(async (tx) => {
      // 1. End occupancy
      await tx.unitOccupancy.update({
        where: { id: occupancyId },
        data: {
          status: 'ENDED',
          endDate: effectiveDate,
          version: { increment: 1 },
        },
      });

      // 2. End household
      await tx.household.update({
        where: { id: occupancy.householdId },
        data: {
          status: 'INACTIVE',
          endDate: effectiveDate,
          version: { increment: 1 },
        },
      });

      // 3. End tenancy if rental
      const activeTenancy = await tx.unitTenancy.findFirst({
        where: {
          unitId: occupancy.unitId,
          householdId: occupancy.householdId,
          status: 'ACTIVE',
        },
      });

      if (activeTenancy) {
        await tx.unitTenancy.update({
          where: { id: activeTenancy.id },
          data: {
            status: 'ENDED',
            endDate: effectiveDate,
            version: { increment: 1 },
          },
        });
      }
    });

    this.logger.log(
      `Completed move-out for occupancy: ${occupancyId} on ${input.effectiveDate}`,
      'OccupancyService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.UNIT_MOVE_OUT_COMPLETED,
        {
          unitId: occupancy.unitId,
          organizationId: occupancy.organizationId,
          communityId: occupancy.communityId,
          householdId: occupancy.householdId,
          occupancyId,
          effectiveDate: input.effectiveDate,
          reason: input.reason || null,
        },
        { organizationId: occupancy.organizationId, communityId: occupancy.communityId },
      ),
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.OCCUPANCY_ENDED,
        {
          occupancyId,
          unitId: occupancy.unitId,
          householdId: occupancy.householdId,
          endDate: input.effectiveDate,
        },
        { organizationId: occupancy.organizationId, communityId: occupancy.communityId },
      ),
    );

    const updated = await this.occupancyRepo.findById(occupancyId);
    return toOccupancyResponseDto(updated!);
  }

  async getCurrentUnitOccupancy(unitId: string): Promise<OccupancyWithRelations | null> {
    return this.occupancyRepo.findActiveByUnitId(unitId);
  }

  async getUnitResidentialState(unitId: string): Promise<UnitResidentialStateDto> {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        building: { select: { id: true, name: true, code: true } },
      },
    });

    if (!unit) {
      throw new DomainException('UNIT_NOT_FOUND', 'Unit not found.', HttpStatus.NOT_FOUND);
    }

    const [
      currentOccupancy,
      currentHousehold,
      currentOwners,
      currentTenancy,
      occupancyHistory,
      ownershipHistory,
      tenancyHistory,
    ] = await Promise.all([
      this.occupancyRepo.findActiveByUnitId(unitId),
      this.householdRepo.findActiveByUnitId(unitId),
      this.ownershipRepo.findActiveByUnitId(unitId),
      this.tenancyRepo.findActiveByUnitId(unitId),
      this.occupancyRepo.findByUnitId(unitId, { page: 1, limit: 20, sortOrder: 'desc' }),
      this.ownershipRepo.findByUnitId(unitId, { page: 1, limit: 20, sortOrder: 'desc' }),
      this.tenancyRepo.findByUnitId(unitId, { page: 1, limit: 20, sortOrder: 'desc' }),
    ]);

    return {
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      displayName: unit.displayName,
      isOccupied: Boolean(currentOccupancy),
      currentOccupancy: currentOccupancy ? toOccupancyResponseDto(currentOccupancy) : null,
      currentHousehold: currentHousehold ? toHouseholdResponseDto(currentHousehold) : null,
      currentOwners: currentOwners.map((o) => toOwnershipResponseDto(o)),
      currentTenancy: currentTenancy ? toTenancyResponseDto(currentTenancy) : null,
      occupancyHistory: occupancyHistory.items.map((o) => toOccupancyResponseDto(o)),
      ownershipHistory: ownershipHistory.items.map((o) => toOwnershipResponseDto(o)),
      tenancyHistory: tenancyHistory.items.map((t) => toTenancyResponseDto(t)),
    };
  }

  async listOccupanciesForUnit(
    unitId: string,
    params: OccupancyQueryParams,
  ): Promise<{ items: OccupancyWithRelations[]; total: number }> {
    return this.occupancyRepo.findByUnitId(unitId, params);
  }
}
