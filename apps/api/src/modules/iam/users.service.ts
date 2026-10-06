import { Injectable, HttpStatus } from '@nestjs/common';
import { UserRepository } from './user.repository.js';
import { CryptoService } from '../auth/crypto.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { createEvent, DOMAIN_EVENT_NAMES } from '@community-os/events';
import type {
  CreateUserInput,
  UpdateUserInput,
  ChangeUserStatusInput,
  UserQueryParams,
} from '@community-os/validation';
import type { UserResponseDto } from '@community-os/contracts';
import { toUserResponseDto } from '@community-os/contracts';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly cryptoService: CryptoService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  async create(input: CreateUserInput): Promise<UserResponseDto> {
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new DomainException(
        'DUPLICATE_IDENTITY',
        `A user with email '${input.email}' already exists.`,
        HttpStatus.CONFLICT,
      );
    }

    if (input.phone) {
      const existingPhone = await this.userRepo.findByPhone(input.phone);
      if (existingPhone) {
        throw new DomainException(
          'DUPLICATE_IDENTITY',
          `A user with phone '${input.phone}' already exists.`,
          HttpStatus.CONFLICT,
        );
      }
    }

    const passwordHash = input.password
      ? await this.cryptoService.hashPassword(input.password)
      : null;

    const user = await this.userRepo.create({
      ...input,
      passwordHash,
    });

    this.logger.log(`User provisioned: ${user.email} (${user.id})`, 'UsersService');

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.USER_CREATED,
        {
          userId: user.id,
          email: user.email,
          displayName: user.displayName,
          status: user.status,
        },
        {},
      ),
    );

    return toUserResponseDto(user);
  }

  async findById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepo.findById(id);
    if (!user) {
      throw new DomainException(
        'USER_NOT_FOUND',
        `User with ID '${id}' not found.`,
        HttpStatus.NOT_FOUND,
      );
    }
    return toUserResponseDto(user);
  }

  async findMany(params: UserQueryParams): Promise<{
    items: UserResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20 } = params;
    const { items, total } = await this.userRepo.findMany(params);
    const totalPages = Math.ceil(total / limit) || 1;

    return {
      items: items.map(toUserResponseDto),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async update(id: string, input: UpdateUserInput): Promise<UserResponseDto> {
    await this.findById(id);
    const updated = await this.userRepo.update(id, input, input.expectedVersion);
    return toUserResponseDto(updated);
  }

  async changeStatus(id: string, input: ChangeUserStatusInput): Promise<UserResponseDto> {
    const current = await this.findById(id);

    if (current.status === input.status) {
      return current;
    }

    const updated = await this.userRepo.updateStatus(id, input.status, input.expectedVersion);

    this.logger.log(
      `User ${id} status updated: ${current.status} -> ${updated.status}`,
      'UsersService',
    );

    await this.eventsService.publish(
      createEvent(
        DOMAIN_EVENT_NAMES.USER_STATUS_CHANGED,
        {
          userId: updated.id,
          previousStatus: current.status,
          newStatus: updated.status,
          version: updated.version,
        },
        {},
      ),
    );

    return toUserResponseDto(updated);
  }
}
