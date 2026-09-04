import { Injectable, HttpStatus } from '@nestjs/common';
import { RoleAssignmentRepository } from './role-assignment.repository.js';
import { RoleRepository } from './role.repository.js';
import { UserRepository } from './user.repository.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { createEvent, DOMAIN_EVENT_NAMES } from '@community-os/events';
import type {
  CreateRoleAssignmentInput,
  RoleAssignmentQueryParams,
} from '@community-os/validation';
import type { RoleAssignmentResponseDto } from '@community-os/contracts';
import { toRoleAssignmentResponseDto } from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type { Actor } from '@community-os/types';

@Injectable()
export class RoleAssignmentsService {
  constructor(
    private readonly roleAssignmentRepo: RoleAssignmentRepository,
    private readonly roleRepo: RoleRepository,
    private readonly userRepo: UserRepository,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async create(actor: Actor, input: CreateRoleAssignmentInput): Promise<RoleAssignmentResponseDto> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new DomainException('USER_NOT_FOUND', 'User does not exist.', HttpStatus.NOT_FOUND);
    }

    const role = await this.roleRepo.findById(input.roleId);
    if (!role) {
      throw new DomainException('ROLE_NOT_FOUND', 'Role does not exist.', HttpStatus.NOT_FOUND);
    }

    // PRIVILEGE ESCALATION GUARD 1: Only Platform Admin can assign PLATFORM scope or Platform Admin role
    if (input.scopeType === 'PLATFORM' || role.code === 'PLATFORM_ADMIN') {
      if (!actor.isPlatformAdmin) {
        throw new DomainException(
          'PRIVILEGE_ESCALATION_DENIED',
          'Only Platform Administrators can grant platform-level authority.',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    // PRIVILEGE ESCALATION GUARD 2: Scope compatibility
    if (input.scopeType === 'ORGANIZATION' && !input.scopeId) {
      throw new DomainException(
        'INVALID_SCOPE',
        'Organization scope requires a valid organizationId.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (input.scopeType === 'COMMUNITY' && !input.scopeId) {
      throw new DomainException(
        'INVALID_SCOPE',
        'Community scope requires a valid communityId.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const assignment = await this.roleAssignmentRepo.create(input);

    this.logger.log(
      `Assigned role ${role.name} to user ${user.email} with scope ${input.scopeType}:${input.scopeId || 'global'}`,
      'RoleAssignmentsService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.ROLE_ASSIGNMENT_CREATED,
        {
          assignmentId: assignment.id,
          userId: assignment.userId,
          roleId: assignment.roleId,
          scopeType: assignment.scopeType,
          scopeId: assignment.scopeId,
        },
        {},
      ),
    );

    return toRoleAssignmentResponseDto(assignment);
  }

  async findMany(params: RoleAssignmentQueryParams): Promise<{
    items: RoleAssignmentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = params;
    const { items, total } = await this.roleAssignmentRepo.findMany(params);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map(toRoleAssignmentResponseDto),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async revoke(actor: Actor, id: string): Promise<RoleAssignmentResponseDto> {
    const current = await this.roleAssignmentRepo.findById(id);
    if (!current) {
      throw new DomainException(
        'ASSIGNMENT_NOT_FOUND',
        'Role assignment not found.',
        HttpStatus.NOT_FOUND,
      );
    }

    // Platform admin check for platform scope assignments
    if (current.scopeType === 'PLATFORM' && !actor.isPlatformAdmin) {
      throw new DomainException(
        'PRIVILEGE_ESCALATION_DENIED',
        'Only Platform Administrators can revoke platform assignments.',
        HttpStatus.FORBIDDEN,
      );
    }

    const revoked = await this.roleAssignmentRepo.revoke(id);

    this.logger.log(`Revoked role assignment ${id}`, 'RoleAssignmentsService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.ROLE_ASSIGNMENT_REVOKED,
        {
          assignmentId: revoked.id,
          userId: revoked.userId,
          roleId: revoked.roleId,
          status: revoked.status,
        },
        {},
      ),
    );

    return toRoleAssignmentResponseDto(revoked);
  }
}
