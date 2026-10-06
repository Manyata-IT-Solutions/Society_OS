import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { OwnershipRepository, type OwnershipWithRelations } from './ownership.repository.js';
import { ResidentRepository } from './resident.repository.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { createEvent, DOMAIN_EVENT_NAMES } from '@community-os/events';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type {
  CreateOwnershipInput,
  TransferOwnershipInput,
  OwnershipQueryParams,
} from '@community-os/validation';
import type { UnitOwnership, OwnershipType } from '@community-os/types';

@Injectable()
export class OwnershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ownershipRepo: OwnershipRepository,
    private readonly residentRepo: ResidentRepository,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async createOwnership(unitId: string, input: CreateOwnershipInput): Promise<UnitOwnership> {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new DomainException('UNIT_NOT_FOUND', 'Unit not found.', HttpStatus.NOT_FOUND);
    }

    const resident = await this.residentRepo.findById(input.residentId);
    if (!resident || resident.communityId !== unit.communityId) {
      throw new DomainException(
        'RESIDENT_NOT_FOUND',
        'Resident not found in this community.',
        HttpStatus.NOT_FOUND,
      );
    }

    // Validate ownership shares if provided
    if (input.ownershipShare) {
      const activeOwners = await this.ownershipRepo.findActiveByUnitId(unitId);
      const currentTotalShare = activeOwners.reduce(
        (sum, o) => sum + (o.ownershipShare ? Number(o.ownershipShare) : 0),
        0,
      );

      if (currentTotalShare + input.ownershipShare > 100.0) {
        throw new DomainException(
          'INVALID_OWNERSHIP_SHARE',
          `Total ownership share cannot exceed 100%. Current allocated: ${currentTotalShare}%, Requested: ${input.ownershipShare}%.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const ownership = await this.ownershipRepo.create(unit.organizationId, unit.communityId, {
      ...input,
      unitId,
    });

    this.logger.log(
      `Created ownership for resident: ${input.residentId} on unit: ${unitId}`,
      'OwnershipService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.OWNERSHIP_STARTED,
        {
          ownershipId: ownership.id,
          organizationId: ownership.organizationId,
          communityId: ownership.communityId,
          unitId: ownership.unitId,
          residentId: ownership.residentId,
          ownershipType: ownership.ownershipType,
          ownershipShare: ownership.ownershipShare ? Number(ownership.ownershipShare) : null,
        },
        { organizationId: ownership.organizationId, communityId: ownership.communityId },
      ),
    );

    return ownership;
  }

  async transferOwnership(unitId: string, input: TransferOwnershipInput): Promise<UnitOwnership[]> {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new DomainException('UNIT_NOT_FOUND', 'Unit not found.', HttpStatus.NOT_FOUND);
    }

    const transferDate = new Date(input.transferDate);

    // Validate all incoming residents exist in community
    for (const newOwner of input.newOwners) {
      const res = await this.residentRepo.findById(newOwner.residentId);
      if (!res || res.communityId !== unit.communityId) {
        throw new DomainException(
          'RESIDENT_NOT_FOUND',
          `Incoming owner resident (${newOwner.residentId}) not found in this community.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Validate total incoming shares <= 100%
    const totalIncomingShare = input.newOwners.reduce(
      (sum, o) => sum + (o.ownershipShare ? Number(o.ownershipShare) : 0),
      0,
    );
    if (totalIncomingShare > 100.0) {
      throw new DomainException(
        'INVALID_OWNERSHIP_SHARE',
        `Total incoming ownership shares exceed 100% (Sum: ${totalIncomingShare}%).`,
        HttpStatus.BAD_REQUEST,
      );
    }

    const previousActiveOwners = await this.ownershipRepo.findActiveByUnitId(unitId);
    const previousOwnerIds = previousActiveOwners.map((o) => o.residentId);

    // Execute atomic transfer in transaction
    const createdOwners: UnitOwnership[] = await this.prisma.$transaction(async (tx) => {
      // 1. End previous ownerships
      for (const oldOwner of previousActiveOwners) {
        await tx.unitOwnership.update({
          where: { id: oldOwner.id },
          data: {
            status: 'TRANSFERRED',
            endDate: transferDate,
            version: { increment: 1 },
          },
        });
      }

      // 2. Create new ownerships
      const results: UnitOwnership[] = [];
      for (const newOwner of input.newOwners) {
        const record = await tx.unitOwnership.create({
          data: {
            organizationId: unit.organizationId,
            communityId: unit.communityId,
            unitId,
            residentId: newOwner.residentId,
            ownershipShare: newOwner.ownershipShare ?? null,
            ownershipType: (newOwner.ownershipType || 'SOLE') as OwnershipType,
            isPrimaryOwner: newOwner.isPrimaryOwner ?? true,
            startDate: transferDate,
            status: 'ACTIVE',
            version: 1,
          },
        });
        results.push(record as unknown as UnitOwnership);
      }

      return results;
    });

    this.logger.log(
      `Transferred ownership of unit: ${unitId} on ${input.transferDate} to ${createdOwners.length} owners`,
      'OwnershipService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.OWNERSHIP_TRANSFERRED,
        {
          unitId,
          organizationId: unit.organizationId,
          communityId: unit.communityId,
          previousOwnerIds,
          newOwnerIds: input.newOwners.map((o) => o.residentId),
          transferDate: input.transferDate,
        },
        { organizationId: unit.organizationId, communityId: unit.communityId },
      ),
    );

    return createdOwners;
  }

  async findOwnershipById(id: string): Promise<OwnershipWithRelations> {
    const record = await this.ownershipRepo.findById(id);
    if (!record) {
      throw new DomainException(
        'OWNERSHIP_NOT_FOUND',
        'Ownership record not found.',
        HttpStatus.NOT_FOUND,
      );
    }
    return record;
  }

  async listActiveOwnersForUnit(unitId: string): Promise<OwnershipWithRelations[]> {
    return this.ownershipRepo.findActiveByUnitId(unitId);
  }

  async listOwnershipForUnit(
    unitId: string,
    params: OwnershipQueryParams,
  ): Promise<{ items: OwnershipWithRelations[]; total: number }> {
    return this.ownershipRepo.findByUnitId(unitId, params);
  }

  async listOwnershipForResident(residentId: string): Promise<OwnershipWithRelations[]> {
    return this.ownershipRepo.findByResidentId(residentId);
  }
}
