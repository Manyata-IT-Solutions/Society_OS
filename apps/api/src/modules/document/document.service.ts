import { Injectable, HttpStatus } from '@nestjs/common';
import { DocumentRepository } from './document.repository.js';
import { DocumentVersionRepository } from './document-version.repository.js';
import { DocumentLinkRepository } from './document-link.repository.js';
import { LocalDiskStorageProvider } from './storage/local-disk-storage.provider.js';
import { DocumentAuthorizationService } from './document-authorization.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import { DOMAIN_EVENT_NAMES, createEvent } from '@community-os/events';
import { DomainException } from '../../common/exceptions/domain.exceptions.js';
import type {
  CreateDocumentInput,
  UpdateDocumentInput,
  CreateDocumentVersionInput,
  CreateDocumentLinkInput,
  DocumentQueryParams,
} from '@community-os/validation';
import type { Document, DocumentVersion, DocumentLink, Actor } from '@community-os/types';
import crypto from 'crypto';
import type { Readable } from 'stream';

@Injectable()
export class DocumentService {
  constructor(
    private readonly documentRepo: DocumentRepository,
    private readonly versionRepo: DocumentVersionRepository,
    private readonly linkRepo: DocumentLinkRepository,
    private readonly storageProvider: LocalDiskStorageProvider,
    private readonly docAuth: DocumentAuthorizationService,
    private readonly eventsService: EventsService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * Create new document with initial file version.
   */
  async createDocument(
    organizationId: string,
    communityId: string | null | undefined,
    input: CreateDocumentInput,
    actor: Actor,
    fileBuffer?: Buffer,
  ): Promise<{ document: Document; version: DocumentVersion }> {
    const docId = crypto.randomUUID();
    const commId = communityId || 'global';
    const storageKey =
      input.initialVersion.storageKey ||
      `${organizationId}/${commId}/documents/${docId}/v1/${input.initialVersion.fileName}`;

    let checksum = input.initialVersion.checksum;
    let sizeBytes = input.initialVersion.sizeBytes;

    if (fileBuffer) {
      const uploadResult = await this.storageProvider.putObject(
        storageKey,
        fileBuffer,
        input.initialVersion.mimeType,
      );
      checksum = uploadResult.checksum;
      sizeBytes = uploadResult.sizeBytes;
    }

    const { document, version } = await this.documentRepo.createWithInitialVersion({
      organizationId,
      communityId: communityId || null,
      title: input.title,
      description: input.description,
      category: input.category,
      classification: input.classification,
      status: 'ACTIVE',
      retentionDate: input.retentionDate ? new Date(input.retentionDate) : null,
      createdById: actor.id,
      initialVersion: {
        fileName: input.initialVersion.fileName,
        originalFileName: input.initialVersion.originalFileName,
        mimeType: input.initialVersion.mimeType,
        sizeBytes,
        checksum,
        storageKey,
      },
    });

    this.logger.log(
      `Created document: "${document.title}" (id: ${document.id}) with version 1`,
      'DocumentService',
    );

    await this.eventsService.publish(
      createEvent(DOMAIN_EVENT_NAMES.DOCUMENT_CREATED, {
        documentId: document.id,
        organizationId: document.organizationId,
        communityId: document.communityId,
        title: document.title,
        category: document.category,
        classification: document.classification,
      }),
    );

    return { document, version };
  }

  /**
   * Upload an incremental version to an existing document.
   */
  async uploadVersion(
    documentId: string,
    input: CreateDocumentVersionInput,
    actor: Actor,
    fileBuffer?: Buffer,
  ): Promise<DocumentVersion> {
    const document = await this.documentRepo.findById(documentId);
    if (!document) {
      throw new DomainException(
        'DOCUMENT_NOT_FOUND',
        `Document ${documentId} not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.docAuth.authorizeDocumentWrite(document, actor);

    const latestVersion = await this.versionRepo.getLatestVersionNumber(documentId);
    const newVersionNumber = latestVersion + 1;

    const commId = document.communityId || 'global';
    const storageKey =
      input.storageKey ||
      `${document.organizationId}/${commId}/documents/${document.id}/v${newVersionNumber}/${input.fileName}`;

    let checksum = input.checksum;
    let sizeBytes = input.sizeBytes;

    if (fileBuffer) {
      const uploadResult = await this.storageProvider.putObject(
        storageKey,
        fileBuffer,
        input.mimeType,
      );
      checksum = uploadResult.checksum;
      sizeBytes = uploadResult.sizeBytes;
    }

    const version = await this.versionRepo.create({
      documentId: document.id,
      versionNumber: newVersionNumber,
      storageKey,
      fileName: input.fileName,
      originalFileName: input.originalFileName,
      mimeType: input.mimeType,
      sizeBytes,
      checksum,
      status: 'ACTIVE',
      uploadedById: actor.id,
    });

    await this.documentRepo.update(document.id, {
      currentVersionId: version.id,
    });

    this.logger.log(
      `Uploaded version ${newVersionNumber} for document ${document.id}`,
      'DocumentService',
    );

    await this.eventsService.publish(
      createEvent(DOMAIN_EVENT_NAMES.DOCUMENT_VERSION_UPLOADED, {
        documentId: document.id,
        versionNumber: newVersionNumber,
        versionId: version.id,
        fileName: version.fileName,
      }),
    );

    return version;
  }

  /**
   * Link document to a business domain resource.
   */
  async linkResource(
    documentId: string,
    input: CreateDocumentLinkInput,
    actor: Actor,
  ): Promise<DocumentLink> {
    const document = await this.documentRepo.findById(documentId);
    if (!document) {
      throw new DomainException(
        'DOCUMENT_NOT_FOUND',
        `Document ${documentId} not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.docAuth.authorizeDocumentWrite(document, actor);

    const link = await this.linkRepo.create({
      organizationId: document.organizationId,
      communityId: document.communityId || null,
      documentId: document.id,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      relationshipType: input.relationshipType,
      createdById: actor.id,
    });

    await this.eventsService.publish(
      createEvent(DOMAIN_EVENT_NAMES.DOCUMENT_LINKED, {
        linkId: link.id,
        documentId: document.id,
        resourceType: input.resourceType,
        resourceId: input.resourceId,
      }),
    );

    return link;
  }

  /**
   * Unlink document from a business resource.
   */
  async unlinkResource(linkId: string, actor: Actor): Promise<boolean> {
    const link = await this.linkRepo.findById(linkId);
    if (!link) {
      throw new DomainException(
        'LINK_NOT_FOUND',
        `Document link ${linkId} not found`,
        HttpStatus.NOT_FOUND,
      );
    }

    const document = await this.documentRepo.findById(link.documentId);
    if (document) {
      await this.docAuth.authorizeDocumentWrite(document, actor);
    }

    const deleted = await this.linkRepo.delete(linkId);

    if (deleted) {
      await this.eventsService.publish(
        createEvent(DOMAIN_EVENT_NAMES.DOCUMENT_UNLINKED, {
          linkId,
          documentId: link.documentId,
          resourceType: link.resourceType,
          resourceId: link.resourceId,
        }),
      );
    }

    return deleted;
  }

  /**
   * Download or stream authorized document version.
   */
  async downloadDocument(
    documentId: string,
    versionNumber: number | undefined,
    actor: Actor,
  ): Promise<{ stream: Readable; fileName: string; mimeType: string; sizeBytes: number }> {
    const document = await this.documentRepo.findById(documentId);
    if (!document) {
      throw new DomainException(
        'DOCUMENT_NOT_FOUND',
        `Document ${documentId} not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.docAuth.authorizeDocumentRead(document, actor);

    let version: DocumentVersion | null = null;
    if (versionNumber) {
      version = await this.versionRepo.findByDocumentIdAndVersion(documentId, versionNumber);
    } else if (document.currentVersionId) {
      version = await this.versionRepo.findById(document.currentVersionId);
    }

    if (!version) {
      throw new DomainException(
        'DOCUMENT_VERSION_NOT_FOUND',
        `No document version available for download.`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (version.status === 'QUARANTINED') {
      throw new DomainException(
        'DOCUMENT_QUARANTINED',
        'This file version has been quarantined and cannot be downloaded.',
        HttpStatus.FORBIDDEN,
      );
    }

    const { stream, metadata } = await this.storageProvider.getObjectStream(version.storageKey);

    return {
      stream,
      fileName: version.originalFileName || version.fileName,
      mimeType: version.mimeType,
      sizeBytes: metadata.sizeBytes,
    };
  }

  /**
   * Get document metadata by ID.
   */
  async getDocumentById(
    documentId: string,
    actor: Actor,
  ): Promise<{
    document: Document;
    currentVersion: DocumentVersion | null;
    versions: DocumentVersion[];
    links: DocumentLink[];
  }> {
    const document = await this.documentRepo.findById(documentId);
    if (!document) {
      throw new DomainException(
        'DOCUMENT_NOT_FOUND',
        `Document ${documentId} not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.docAuth.authorizeDocumentRead(document, actor);

    const [versions, links] = await Promise.all([
      this.versionRepo.findByDocumentId(documentId),
      this.linkRepo.findByDocumentId(documentId),
    ]);

    const currentVersion = document.currentVersionId
      ? versions.find((v) => v.id === document.currentVersionId) || null
      : null;

    return { document, currentVersion, versions, links };
  }

  /**
   * List documents.
   */
  async listDocuments(
    params: DocumentQueryParams,
    _actor: Actor,
  ): Promise<{ items: Document[]; total: number; page: number; limit: number }> {
    return this.documentRepo.findMany(params);
  }

  /**
   * Update document metadata.
   */
  async updateDocument(
    documentId: string,
    input: UpdateDocumentInput,
    actor: Actor,
  ): Promise<Document> {
    const document = await this.documentRepo.findById(documentId);
    if (!document) {
      throw new DomainException(
        'DOCUMENT_NOT_FOUND',
        `Document ${documentId} not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.docAuth.authorizeDocumentWrite(document, actor);

    return this.documentRepo.update(documentId, {
      title: input.title,
      description: input.description,
      category: input.category,
      classification: input.classification,
      status: input.status,
      isLocked: input.isLocked,
      retentionDate: input.retentionDate ? new Date(input.retentionDate) : undefined,
    });
  }

  /**
   * Archive document.
   */
  async archiveDocument(documentId: string, actor: Actor): Promise<Document> {
    const document = await this.documentRepo.findById(documentId);
    if (!document) {
      throw new DomainException(
        'DOCUMENT_NOT_FOUND',
        `Document ${documentId} not found.`,
        HttpStatus.NOT_FOUND,
      );
    }

    await this.docAuth.authorizeDocumentWrite(document, actor);

    const updated = await this.documentRepo.update(documentId, {
      status: 'ARCHIVED',
    });

    await this.eventsService.publish(
      createEvent(DOMAIN_EVENT_NAMES.DOCUMENT_ARCHIVED, {
        documentId: updated.id,
      }),
    );

    return updated;
  }
}
