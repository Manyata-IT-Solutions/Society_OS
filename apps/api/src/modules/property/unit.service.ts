import { Injectable, HttpStatus } from '@nestjs/common';
import { UnitRepository, type UnitWithParents } from './unit.repository.js';
import { CommunityRepository } from '../community/community.repository.js';
import { PropertyHierarchyService } from './property-hierarchy.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import {
  DomainException,
  DuplicateEntityException,
} from '../../common/exceptions/domain.exceptions.js';
import { DOMAIN_EVENT_NAMES, createEvent } from '@community-os/events';
import type { CreateUnitInput, UpdateUnitInput, UnitQueryParams } from '@community-os/validation';
import type { Unit, UnitStatus } from '@community-os/types';

@Injectable()
export class UnitService {
  constructor(
    private readonly unitRepo: UnitRepository,
    private readonly communityRepo: CommunityRepository,
    private readonly hierarchyService: PropertyHierarchyService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async createUnit(communityId: string, input: CreateUnitInput): Promise<Unit> {
    const community = await this.communityRepo.findByIdUnscoped(communityId);
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
        'Cannot create unit in an archived community.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate parent hierarchy consistency
    await this.hierarchyService.validateParentConsistency(
      communityId,
      input.sectionId,
      input.buildingId,
      input.floorId,
    );

    // Validate duplicate unit number in target building/community
    const existingUnit = await this.unitRepo.findByUnitNumber(
      communityId,
      input.unitNumber,
      input.buildingId,
    );
    if (existingUnit) {
      throw new DuplicateEntityException(
        `Unit number '${input.unitNumber}' already exists in this ${input.buildingId ? 'building' : 'community'}.`,
      );
    }

    const unit = await this.unitRepo.create(community.organizationId, communityId, input);

    this.logger.log(`Created unit: ${unit.unitNumber} (${unit.id})`, 'UnitService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.UNIT_CREATED,
        {
          unitId: unit.id,
          organizationId: unit.organizationId,
          communityId: unit.communityId,
          sectionId: unit.sectionId,
          buildingId: unit.buildingId,
          floorId: unit.floorId,
          unitNumber: unit.unitNumber,
          unitType: unit.unitType,
          status: unit.status,
          areaUnit: unit.areaUnit,
        },
        { organizationId: unit.organizationId, communityId: unit.communityId },
      ),
    );

    return unit;
  }

  async findById(id: string): Promise<UnitWithParents> {
    const unit = await this.unitRepo.findById(id);
    if (!unit) {
      throw new DomainException('UNIT_NOT_FOUND', 'Unit not found.', HttpStatus.NOT_FOUND);
    }
    return unit;
  }

  async findMany(
    communityId: string,
    params: UnitQueryParams,
  ): Promise<{ items: UnitWithParents[]; total: number }> {
    return this.unitRepo.findMany(communityId, params);
  }

  async updateUnit(id: string, input: UpdateUnitInput): Promise<Unit> {
    const unit = await this.findById(id);

    if (input.sectionId || input.buildingId || input.floorId) {
      await this.hierarchyService.validateParentConsistency(
        unit.communityId,
        input.sectionId ?? unit.sectionId,
        input.buildingId ?? unit.buildingId,
        input.floorId ?? unit.floorId,
      );
    }

    const previousStatus = unit.status;
    const updated = await this.unitRepo.update(id, input);

    this.logger.log(`Updated unit: ${updated.unitNumber} (${updated.id})`, 'UnitService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.UNIT_UPDATED,
        {
          unitId: updated.id,
          organizationId: updated.organizationId,
          communityId: updated.communityId,
          displayName: updated.displayName,
          unitType: updated.unitType,
          status: updated.status,
          version: updated.version,
        },
        { organizationId: updated.organizationId, communityId: updated.communityId },
      ),
    );

    if (input.status && input.status !== previousStatus) {
      await this.eventsService.publish(
        createEvent(
          DOMAIN_EVENT_NAMES.UNIT_STATUS_CHANGED,
          {
            unitId: updated.id,
            organizationId: updated.organizationId,
            communityId: updated.communityId,
            previousStatus,
            newStatus: updated.status as UnitStatus,
            version: updated.version,
          },
          { organizationId: updated.organizationId, communityId: updated.communityId },
        ),
      );
    }

    return updated;
  }
}
