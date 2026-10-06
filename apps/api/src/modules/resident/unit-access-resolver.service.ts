import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { ResidentRepository } from './resident.repository.js';
import type { Actor } from '@community-os/types';

export interface UnitAccessResolution {
  hasAccess: boolean;
  isOwner: boolean;
  isOccupant: boolean;
  isHouseholdMember: boolean;
  isManager: boolean;
  residentId?: string;
  householdId?: string;
}

@Injectable()
export class UnitAccessResolver {
  constructor(
    private readonly prisma: PrismaService,
    private readonly residentRepo: ResidentRepository,
  ) {}

  async resolveAccess(actor: Actor, unitId: string): Promise<UnitAccessResolution> {
    if (!actor || !actor.id) {
      return {
        hasAccess: false,
        isOwner: false,
        isOccupant: false,
        isHouseholdMember: false,
        isManager: false,
      };
    }

    if (actor.isPlatformAdmin) {
      return {
        hasAccess: true,
        isOwner: false,
        isOccupant: false,
        isHouseholdMember: false,
        isManager: true,
      };
    }

    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      select: { organizationId: true, communityId: true },
    });

    if (!unit) {
      return {
        hasAccess: false,
        isOwner: false,
        isOccupant: false,
        isHouseholdMember: false,
        isManager: false,
      };
    }

    // Check if actor has manager role on organization or community
    const managerAssignment = await this.prisma.roleAssignment.findFirst({
      where: {
        userId: actor.id,
        status: 'ACTIVE',
        OR: [
          { scopeType: 'PLATFORM' },
          { scopeType: 'ORGANIZATION', scopeId: unit.organizationId },
          { scopeType: 'COMMUNITY', scopeId: unit.communityId },
        ],
        role: {
          code: { in: ['PLATFORM_ADMIN', 'PLATFORM_SUPPORT', 'ORG_ADMIN', 'COMMUNITY_ADMIN'] },
        },
      },
    });

    if (managerAssignment) {
      return {
        hasAccess: true,
        isOwner: false,
        isOccupant: false,
        isHouseholdMember: false,
        isManager: true,
      };
    }

    // Resolve Resident profiles linked to this user
    const residents = await this.residentRepo.findByUserId(actor.id, unit.communityId);
    if (residents.length === 0) {
      return {
        hasAccess: false,
        isOwner: false,
        isOccupant: false,
        isHouseholdMember: false,
        isManager: false,
      };
    }

    const residentIds = residents.map((r) => r.id);

    // 1. Check Ownership
    const activeOwnership = await this.prisma.unitOwnership.findFirst({
      where: {
        unitId,
        residentId: { in: residentIds },
        status: 'ACTIVE',
      },
    });

    // 2. Check Active Household Membership
    const activeMember = await this.prisma.householdMember.findFirst({
      where: {
        residentId: { in: residentIds },
        status: 'ACTIVE',
        household: {
          unitId,
          status: 'ACTIVE',
        },
      },
      include: { household: true },
    });

    const isOwner = Boolean(activeOwnership);
    const isHouseholdMember = Boolean(activeMember);
    const isOccupant = Boolean(activeMember);

    const hasAccess = isOwner || isHouseholdMember;

    return {
      hasAccess,
      isOwner,
      isOccupant,
      isHouseholdMember,
      isManager: false,
      residentId: activeOwnership?.residentId || activeMember?.residentId || residentIds[0],
      householdId: activeMember?.householdId,
    };
  }
}
