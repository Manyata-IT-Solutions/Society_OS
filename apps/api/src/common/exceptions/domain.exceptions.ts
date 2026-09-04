import { HttpException, HttpStatus } from '@nestjs/common';

export class DomainException extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus,
    public readonly details?: Array<{ field?: string; message: string }>,
  ) {
    super({ code, message, details }, status);
  }
}

export class OrganizationNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(
      'ORGANIZATION_NOT_FOUND',
      `Organization with identifier '${identifier}' was not found.`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class CommunityNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(
      'COMMUNITY_NOT_FOUND',
      `Community with identifier '${identifier}' was not found in the current tenant scope.`,
      HttpStatus.NOT_FOUND,
    );
  }
}

export class DuplicateOrganizationSlugException extends DomainException {
  constructor(slug: string) {
    super(
      'DUPLICATE_ORGANIZATION_SLUG',
      `An organization with slug '${slug}' already exists.`,
      HttpStatus.CONFLICT,
    );
  }
}

export class DuplicateCommunitySlugException extends DomainException {
  constructor(slug: string) {
    super(
      'DUPLICATE_COMMUNITY_SLUG',
      `A community with slug '${slug}' already exists under this organization.`,
      HttpStatus.CONFLICT,
    );
  }
}

export class DuplicateCommunityCodeException extends DomainException {
  constructor(code: string) {
    super(
      'DUPLICATE_COMMUNITY_CODE',
      `A community with code '${code}' already exists under this organization.`,
      HttpStatus.CONFLICT,
    );
  }
}

export class DuplicateEntityException extends DomainException {
  constructor(message = 'An entity with the same identifier already exists.') {
    super('DUPLICATE_ENTITY', message, HttpStatus.CONFLICT);
  }
}

export class ConcurrencyConflictException extends DomainException {
  constructor(entityName: string, id: string, currentVersion: number, expectedVersion?: number) {
    super(
      'CONCURRENCY_CONFLICT',
      `${entityName} '${id}' has been modified concurrently. Expected version: ${expectedVersion ?? 'none'}, current database version: ${currentVersion}.`,
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidStatusTransitionException extends DomainException {
  constructor(currentStatus: string, targetStatus: string) {
    super(
      'INVALID_STATUS_TRANSITION',
      `Cannot transition status from '${currentStatus}' to '${targetStatus}'.`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class TenantAccessDeniedException extends DomainException {
  constructor(message = 'Access denied: Tenant scope restriction.') {
    super('TENANT_ACCESS_DENIED', message, HttpStatus.FORBIDDEN);
  }
}

export class InvalidTenantContextException extends DomainException {
  constructor(message = 'Invalid or missing tenant scope context.') {
    super('INVALID_TENANT_CONTEXT', message, HttpStatus.BAD_REQUEST);
  }
}
