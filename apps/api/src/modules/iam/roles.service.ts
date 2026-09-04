import { Injectable, HttpStatus } from '@nestjs/common';
import { RoleRepository } from './role.repository.js';
import { PermissionRepository } from './permission.repository.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { createEvent, DOMAIN_EVENT_NAMES } from '@community-os/events';
import type { CreateRoleInput, UpdateRoleInput, RoleQueryParams } from '@community-os/validation';
import type { RoleResponseDto, PermissionResponseDto } from '@community-os/contracts';
import { toRoleResponseDto } from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@Injectable()
export class RolesService {
  constructor(
    private readonly roleRepo: RoleRepository,
    private readonly permissionRepo: PermissionRepository,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async create(input: CreateRoleInput): Promise<RoleResponseDto> {
    const existing = await this.roleRepo.findByCode(input.code, input.organizationId);
    if (existing) {
      throw new DomainException(
        'DUPLICATE_ROLE_CODE',
        `A role with code '${input.code}' already exists in this scope.`,
        HttpStatus.CONFLICT,
      );
    }

    const permissions = await this.permissionRepo.findByCodes(input.permissionCodes);
    if (permissions.length === 0) {
      throw new DomainException(
        'INVALID_PERMISSIONS',
        'No valid permissions found for the specified codes.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const role = await this.roleRepo.create(
      input,
      permissions.map((p) => p.id),
    );

    this.logger.log(`Created custom role: ${role.name} (${role.id})`, 'RolesService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.ROLE_CREATED,
        {
          roleId: role.id,
          name: role.name,
          code: role.code,
          scopeType: role.scopeType,
          organizationId: role.organizationId,
        },
        { organizationId: role.organizationId || undefined },
      ),
    );

    return toRoleResponseDto(role);
  }

  async findById(id: string): Promise<RoleResponseDto> {
    const role = await this.roleRepo.findById(id);
    if (!role) {
      throw new DomainException('ROLE_NOT_FOUND', 'Role not found.', HttpStatus.NOT_FOUND);
    }
    return toRoleResponseDto(role);
  }

  async findMany(params: RoleQueryParams): Promise<{
    items: RoleResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = params;
    const { items, total } = await this.roleRepo.findMany(params);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map(toRoleResponseDto),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(id: string, input: UpdateRoleInput): Promise<RoleResponseDto> {
    const current = await this.findById(id);

    if (current.isSystem) {
      throw new DomainException(
        'PROTECTED_ROLE',
        'System-defined roles cannot be modified or customized.',
        HttpStatus.FORBIDDEN,
      );
    }

    let permissionIds: string[] | undefined;
    if (input.permissionCodes) {
      const perms = await this.permissionRepo.findByCodes(input.permissionCodes);
      permissionIds = perms.map((p) => p.id);
    }

    const updated = await this.roleRepo.update(id, input, permissionIds, input.expectedVersion);

    this.logger.log(`Updated custom role: ${updated.name} (${updated.id})`, 'RolesService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.ROLE_UPDATED,
        {
          roleId: updated.id,
          name: updated.name,
          version: updated.version,
        },
        { organizationId: updated.organizationId || undefined },
      ),
    );

    return toRoleResponseDto(updated);
  }

  async listPermissions(): Promise<PermissionResponseDto[]> {
    const perms = await this.permissionRepo.findAll();
    return perms.map((p) => ({
      id: p.id,
      code: p.code,
      resource: p.resource,
      action: p.action,
      description: p.description ?? null,
    }));
  }
}
