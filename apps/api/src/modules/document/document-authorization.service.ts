import { Injectable, HttpStatus } from '@nestjs/common';
import { AuthorizationService } from '../authorization/authorization.service.js';
import { PERMISSIONS } from '@community-os/auth';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type { Document, Actor } from '@community-os/types';

@Injectable()
export class DocumentAuthorizationService {
  constructor(private readonly authService: AuthorizationService) {}

  /**
   * Enforce tenant isolation and classification-aware read authorization.
   */
  async authorizeDocumentRead(document: Document, actor: Actor): Promise<void> {
    if (actor.isPlatformAdmin) return;

    // 1. Classification Validation
    if (document.classification === 'PUBLIC') {
      return; // Public documents are readable by any authenticated tenant member
    }

    const scopeType = document.communityId ? 'COMMUNITY' : 'ORGANIZATION';
    const scopeId = document.communityId || document.organizationId;

    if (document.classification === 'INTERNAL') {
      await this.authService.enforce(actor, PERMISSIONS.DOCUMENT_VIEW, {
        scopeType,
        scopeId,
      });
      return;
    }

    if (document.classification === 'CONFIDENTIAL' || document.classification === 'RESTRICTED') {
      await this.authService.enforce(actor, PERMISSIONS.DOCUMENT_MANAGE_RESTRICTED, {
        scopeType,
        scopeId,
      });
    }
  }

  /**
   * Enforce write authorization for updating, archiving, or adding versions to a document.
   */
  async authorizeDocumentWrite(document: Document, actor: Actor): Promise<void> {
    if (document.isLocked) {
      throw new DomainException(
        'DOCUMENT_LOCKED',
        'This document is locked and cannot be modified.',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (actor.isPlatformAdmin) return;

    const scopeType = document.communityId ? 'COMMUNITY' : 'ORGANIZATION';
    const scopeId = document.communityId || document.organizationId;

    await this.authService.enforce(actor, PERMISSIONS.DOCUMENT_UPDATE, {
      scopeType,
      scopeId,
    });
  }
}
