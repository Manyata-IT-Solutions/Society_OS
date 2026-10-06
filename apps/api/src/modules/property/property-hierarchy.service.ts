import { Injectable, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type {
  PropertyTreeNode,
  BuildingStatus,
  FloorStatus,
  UnitStatus,
} from '@community-os/types';

@Injectable()
export class PropertyHierarchyService {
  constructor(private readonly prisma: PrismaService) {}

  async getPropertyTree(communityId: string): Promise<PropertyTreeNode> {
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            buildings: {
              orderBy: { sortOrder: 'asc' },
              include: {
                floors: {
                  orderBy: { sortOrder: 'asc' },
                  include: {
                    units: {
                      orderBy: { unitNumber: 'asc' },
                    },
                  },
                },
                units: {
                  where: { floorId: null },
                  orderBy: { unitNumber: 'asc' },
                },
              },
            },
            units: {
              where: { buildingId: null },
              orderBy: { unitNumber: 'asc' },
            },
          },
        },
        buildings: {
          where: { sectionId: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            floors: {
              orderBy: { sortOrder: 'asc' },
              include: {
                units: {
                  orderBy: { unitNumber: 'asc' },
                },
              },
            },
            units: {
              where: { floorId: null },
              orderBy: { unitNumber: 'asc' },
            },
          },
        },
        units: {
          where: { sectionId: null, buildingId: null },
          orderBy: { unitNumber: 'asc' },
        },
      },
    });

    if (!community) {
      throw new DomainException(
        'COMMUNITY_NOT_FOUND',
        'Community not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    // Build the hierarchical tree
    const rootNode: PropertyTreeNode = {
      id: community.id,
      type: 'COMMUNITY',
      name: community.name,
      code: community.code,
      status: community.status,
      children: [],
    };

    // 1. Process Sections
    for (const section of community.sections) {
      const sectionNode: PropertyTreeNode = {
        id: section.id,
        type: 'SECTION',
        name: section.name,
        code: section.code,
        status: section.status,
        parentId: community.id,
        children: [],
      };

      // Buildings under Section
      for (const building of section.buildings) {
        const buildingNode = this.buildBuildingNode(building, section.id);
        sectionNode.children!.push(buildingNode);
      }

      // Direct Units under Section (e.g. Villas in a Section)
      for (const unit of section.units) {
        sectionNode.children!.push({
          id: unit.id,
          type: 'UNIT',
          name: unit.displayName || unit.unitNumber,
          code: unit.unitNumber,
          status: unit.status,
          parentId: section.id,
        });
      }

      rootNode.children!.push(sectionNode);
    }

    // 2. Process Standalone Buildings (Not in any Section)
    for (const building of community.buildings) {
      const buildingNode = this.buildBuildingNode(building, community.id);
      rootNode.children!.push(buildingNode);
    }

    // 3. Process Standalone Units (Directly under Community)
    for (const unit of community.units) {
      rootNode.children!.push({
        id: unit.id,
        type: 'UNIT',
        name: unit.displayName || unit.unitNumber,
        code: unit.unitNumber,
        status: unit.status,
        parentId: community.id,
      });
    }

    return rootNode;
  }

  private buildBuildingNode(
    building: {
      id: string;
      name: string;
      code: string;
      status: BuildingStatus;
      floors?: Array<{
        id: string;
        label: string;
        status: FloorStatus;
        units?: Array<{
          id: string;
          unitNumber: string;
          displayName: string | null;
          status: UnitStatus;
        }>;
      }>;
      units?: Array<{
        id: string;
        unitNumber: string;
        displayName: string | null;
        status: UnitStatus;
      }>;
    },
    parentId: string,
  ): PropertyTreeNode {
    const buildingNode: PropertyTreeNode = {
      id: building.id,
      type: 'BUILDING',
      name: building.name,
      code: building.code,
      status: building.status,
      parentId,
      children: [],
    };

    // Floors in Building
    for (const floor of building.floors || []) {
      const floorNode: PropertyTreeNode = {
        id: floor.id,
        type: 'FLOOR',
        name: `Floor ${floor.label}`,
        code: floor.label,
        status: floor.status,
        parentId: building.id,
        children: [],
      };

      for (const unit of floor.units || []) {
        floorNode.children!.push({
          id: unit.id,
          type: 'UNIT',
          name: unit.displayName || unit.unitNumber,
          code: unit.unitNumber,
          status: unit.status,
          parentId: floor.id,
        });
      }

      buildingNode.children!.push(floorNode);
    }

    // Direct units under building without floor
    for (const unit of building.units || []) {
      buildingNode.children!.push({
        id: unit.id,
        type: 'UNIT',
        name: unit.displayName || unit.unitNumber,
        code: unit.unitNumber,
        status: unit.status,
        parentId: building.id,
      });
    }

    return buildingNode;
  }

  async generateUnitPath(unit: {
    communityId: string;
    sectionId?: string | null;
    buildingId?: string | null;
    floorId?: string | null;
    unitNumber: string;
  }): Promise<string> {
    const parts: string[] = [];

    const community = await this.prisma.community.findUnique({
      where: { id: unit.communityId },
      select: { name: true },
    });
    if (community) parts.push(community.name);

    if (unit.sectionId) {
      const section = await this.prisma.communitySection.findUnique({
        where: { id: unit.sectionId },
        select: { name: true },
      });
      if (section) parts.push(section.name);
    }

    if (unit.buildingId) {
      const building = await this.prisma.building.findUnique({
        where: { id: unit.buildingId },
        select: { name: true },
      });
      if (building) parts.push(building.name);
    }

    if (unit.floorId) {
      const floor = await this.prisma.floor.findUnique({
        where: { id: unit.floorId },
        select: { label: true },
      });
      if (floor) parts.push(`Floor ${floor.label}`);
    }

    parts.push(unit.unitNumber);

    return parts.join(' / ');
  }

  async validateParentConsistency(
    communityId: string,
    sectionId?: string | null,
    buildingId?: string | null,
    floorId?: string | null,
  ): Promise<void> {
    // 1. If sectionId is provided, verify it belongs to this community
    if (sectionId) {
      const section = await this.prisma.communitySection.findFirst({
        where: { id: sectionId, communityId },
      });
      if (!section) {
        throw new DomainException(
          'INVALID_PROPERTY_HIERARCHY',
          'Specified section does not belong to this community.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 2. If buildingId is provided, verify it belongs to this community
    if (buildingId) {
      const building = await this.prisma.building.findFirst({
        where: { id: buildingId, communityId },
      });
      if (!building) {
        throw new DomainException(
          'INVALID_PROPERTY_HIERARCHY',
          'Specified building does not belong to this community.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // If both sectionId and buildingId provided, verify building belongs to that section
      if (sectionId && building.sectionId && building.sectionId !== sectionId) {
        throw new DomainException(
          'INVALID_PROPERTY_HIERARCHY',
          'Building belongs to a different section.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // 3. If floorId is provided, verify it belongs to the building
    if (floorId) {
      if (!buildingId) {
        throw new DomainException(
          'INVALID_PROPERTY_HIERARCHY',
          'Floor cannot be specified without a parent building.',
          HttpStatus.BAD_REQUEST,
        );
      }

      const floor = await this.prisma.floor.findFirst({
        where: { id: floorId, buildingId, communityId },
      });
      if (!floor) {
        throw new DomainException(
          'INVALID_PROPERTY_HIERARCHY',
          'Specified floor does not belong to this building/community.',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }
}
