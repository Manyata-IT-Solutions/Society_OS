import { Injectable, HttpStatus } from '@nestjs/common';
import { MembershipRepository } from './membership.repository.js';
import { UserRepository } from './user.repository.js';
import { OrganizationService } from '../organization/organization.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { createEvent, DOMAIN_EVENT_NAMES } from '@community-os/events';
import type {
  CreateMembershipInput,
  ChangeMembershipStatusInput,
  MembershipQueryParams,
} from '@community-os/validation';
import type { MembershipResponseDto } from '@community-os/contracts';
import { toMembershipResponseDto } from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@Injectable()
export class MembershipsService {
  constructor(
    private readonly membershipRepo: MembershipRepository,
    private readonly userRepo: UserRepository,
    private readonly orgService: OrganizationService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async create(input: CreateMembershipInput): Promise<MembershipResponseDto> {
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new DomainException('USER_NOT_FOUND', 'User does not exist.', HttpStatus.NOT_FOUND);
    }

    await this.orgService.findById(input.organizationId);

    const existing = await this.membershipRepo.findByUserAndTenant(
      input.userId,
      input.organizationId,
      input.communityId,
    );

    if (existing) {
      throw new DomainException(
        'DUPLICATE_MEMBERSHIP',
        'User already has a membership record in this tenant scope.',
        HttpStatus.CONFLICT,
      );
    }

    const membership = await this.membershipRepo.create(input);

    this.logger.log(
      `Created membership for user ${user.email} in org ${input.organizationId}`,
      'MembershipsService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.MEMBERSHIP_CREATED,
        {
          membershipId: membership.id,
          userId: membership.userId,
          organizationId: membership.organizationId,
          communityId: membership.communityId,
          status: membership.status,
        },
        {
          organizationId: membership.organizationId,
          communityId: membership.communityId || undefined,
        },
      ),
    );

    return toMembershipResponseDto(membership);
  }

  async findById(id: string): Promise<MembershipResponseDto> {
    const membership = await this.membershipRepo.findById(id);
    if (!membership) {
      throw new DomainException(
        'MEMBERSHIP_NOT_FOUND',
        'Membership not found.',
        HttpStatus.NOT_FOUND,
      );
    }
    return toMembershipResponseDto(membership);
  }

  async findMany(params: MembershipQueryParams): Promise<{
    items: MembershipResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = params;
    const { items, total } = await this.membershipRepo.findMany(params);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map(toMembershipResponseDto),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async changeStatus(
    id: string,
    input: ChangeMembershipStatusInput,
  ): Promise<MembershipResponseDto> {
    const current = await this.findById(id);

    if (current.status === input.status) {
      return current;
    }

    const updated = await this.membershipRepo.updateStatus(id, input.status, input.expectedVersion);

    this.logger.log(
      `Membership ${id} status updated: ${current.status} -> ${updated.status}`,
      'MembershipsService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.MEMBERSHIP_STATUS_CHANGED,
        {
          membershipId: updated.id,
          userId: updated.userId,
          organizationId: updated.organizationId,
          previousStatus: current.status,
          newStatus: updated.status,
          version: updated.version,
        },
        { organizationId: updated.organizationId, communityId: updated.communityId || undefined },
      ),
    );

    return toMembershipResponseDto(updated);
  }
}
