import { Injectable, HttpStatus } from '@nestjs/common';
import { SectionRepository } from './section.repository.js';
import { BuildingRepository } from './building.repository.js';
import { FloorRepository } from './floor.repository.js';
import { CommunityRepository } from '../community/community.repository.js';
import { PropertyHierarchyService } from './property-hierarchy.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import {
  DomainException,
  DuplicateEntityException,
} from '../../common/exceptions/domain.exceptions.js';
import { DOMAIN_EVENT_NAMES, createEvent } from '@community-os/events';
import type {
  CreateSectionInput,
  UpdateSectionInput,
  SectionQueryParams,
  CreateBuildingInput,
  UpdateBuildingInput,
  BuildingQueryParams,
  CreateFloorInput,
  UpdateFloorInput,
  FloorQueryParams,
} from '@community-os/validation';
import type { CommunitySection, Building, Floor } from '@community-os/types';

@Injectable()
export class BuildingService {
  constructor(
    private readonly sectionRepo: SectionRepository,
    private readonly buildingRepo: BuildingRepository,
    private readonly floorRepo: FloorRepository,
    private readonly communityRepo: CommunityRepository,
    private readonly hierarchyService: PropertyHierarchyService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  // --- SECTIONS ---
  async createSection(communityId: string, input: CreateSectionInput): Promise<CommunitySection> {
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
        'Cannot create section in an archived community.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingCode = await this.sectionRepo.findByCode(communityId, input.code);
    if (existingCode) {
      throw new DuplicateEntityException('Section code already exists in this community.');
    }

    const section = await this.sectionRepo.create(community.organizationId, communityId, input);

    this.logger.log(`Created section: ${section.name} (${section.id})`, 'BuildingService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.PROPERTY_SECTION_CREATED,
        {
          sectionId: section.id,
          organizationId: section.organizationId,
          communityId: section.communityId,
          name: section.name,
          code: section.code,
        },
        { organizationId: section.organizationId, communityId: section.communityId },
      ),
    );

    return section;
  }

  async findSectionById(id: string): Promise<CommunitySection> {
    const section = await this.sectionRepo.findById(id);
    if (!section) {
      throw new DomainException('SECTION_NOT_FOUND', 'Section not found.', HttpStatus.NOT_FOUND);
    }
    return section;
  }

  async findSections(
    communityId: string,
    params: SectionQueryParams,
  ): Promise<{ items: CommunitySection[]; total: number }> {
    return this.sectionRepo.findMany(communityId, params);
  }

  async updateSection(id: string, input: UpdateSectionInput): Promise<CommunitySection> {
    await this.findSectionById(id);
    return this.sectionRepo.update(id, input);
  }

  // --- BUILDINGS ---
  async createBuilding(communityId: string, input: CreateBuildingInput): Promise<Building> {
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
        'Cannot create building in an archived community.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (input.sectionId) {
      await this.hierarchyService.validateParentConsistency(communityId, input.sectionId);
    }

    const existingCode = await this.buildingRepo.findByCode(communityId, input.code);
    if (existingCode) {
      throw new DuplicateEntityException('Building code already exists in this community.');
    }

    const building = await this.buildingRepo.create(community.organizationId, communityId, input);

    this.logger.log(`Created building: ${building.name} (${building.id})`, 'BuildingService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.BUILDING_CREATED,
        {
          buildingId: building.id,
          organizationId: building.organizationId,
          communityId: building.communityId,
          sectionId: building.sectionId,
          name: building.name,
          code: building.code,
          buildingType: building.buildingType,
        },
        { organizationId: building.organizationId, communityId: building.communityId },
      ),
    );

    return building;
  }

  async findBuildingById(id: string): Promise<Building> {
    const building = await this.buildingRepo.findById(id);
    if (!building) {
      throw new DomainException('BUILDING_NOT_FOUND', 'Building not found.', HttpStatus.NOT_FOUND);
    }
    return building;
  }

  async findBuildings(
    communityId: string,
    params: BuildingQueryParams,
  ): Promise<{ items: Building[]; total: number }> {
    return this.buildingRepo.findMany(communityId, params);
  }

  async updateBuilding(id: string, input: UpdateBuildingInput): Promise<Building> {
    const building = await this.findBuildingById(id);

    if (input.sectionId) {
      await this.hierarchyService.validateParentConsistency(building.communityId, input.sectionId);
    }

    const updated = await this.buildingRepo.update(id, input);

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.BUILDING_UPDATED,
        {
          buildingId: updated.id,
          organizationId: updated.organizationId,
          communityId: updated.communityId,
          name: updated.name,
          status: updated.status,
          version: updated.version,
        },
        { organizationId: updated.organizationId, communityId: updated.communityId },
      ),
    );

    return updated;
  }

  // --- FLOORS ---
  async createFloor(buildingId: string, input: CreateFloorInput): Promise<Floor> {
    const building = await this.findBuildingById(buildingId);

    if (building.status === 'ARCHIVED') {
      throw new DomainException(
        'BUILDING_ARCHIVED',
        'Cannot create floor in an archived building.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existingLabel = await this.floorRepo.findByLabel(buildingId, input.label);
    if (existingLabel) {
      throw new DuplicateEntityException('Floor label already exists in this building.');
    }

    const floor = await this.floorRepo.create(
      building.organizationId,
      building.communityId,
      buildingId,
      input,
    );

    this.logger.log(
      `Created floor: ${floor.label} in building: ${building.name}`,
      'BuildingService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.FLOOR_CREATED,
        {
          floorId: floor.id,
          organizationId: floor.organizationId,
          communityId: floor.communityId,
          buildingId: floor.buildingId,
          label: floor.label,
          sortOrder: floor.sortOrder,
        },
        { organizationId: floor.organizationId, communityId: floor.communityId },
      ),
    );

    return floor;
  }

  async findFloorById(id: string): Promise<Floor> {
    const floor = await this.floorRepo.findById(id);
    if (!floor) {
      throw new DomainException('FLOOR_NOT_FOUND', 'Floor not found.', HttpStatus.NOT_FOUND);
    }
    return floor;
  }

  async findFloors(
    buildingId: string,
    params: FloorQueryParams,
  ): Promise<{ items: Floor[]; total: number }> {
    return this.floorRepo.findMany(buildingId, params);
  }

  async updateFloor(id: string, input: UpdateFloorInput): Promise<Floor> {
    await this.findFloorById(id);
    return this.floorRepo.update(id, input);
  }
}
