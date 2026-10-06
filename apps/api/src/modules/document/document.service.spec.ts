import { DocumentService } from './document.service.js';
import type { DocumentRepository } from './document.repository.js';
import type { DocumentVersionRepository } from './document-version.repository.js';
import type { DocumentLinkRepository } from './document-link.repository.js';
import type { LocalDiskStorageProvider } from './storage/local-disk-storage.provider.js';
import type { DocumentAuthorizationService } from './document-authorization.service.js';
import type { EventsService } from '../events/events.service.js';
import type { LoggerService } from '../logger/logger.service.js';
import type { Actor } from '@community-os/types';

describe('DocumentService (Unit)', () => {
  let service: DocumentService;
  let mockDocRepo: DocumentRepository;
  let mockVersionRepo: DocumentVersionRepository;
  let mockLinkRepo: DocumentLinkRepository;
  let mockStorage: LocalDiskStorageProvider;
  let mockAuth: DocumentAuthorizationService;
  let mockEvents: EventsService;
  let mockLogger: LoggerService;

  const mockActor: Actor = {
    id: 'user-123',
    email: 'admin@communityos.io',
    displayName: 'Admin User',
    isPlatformAdmin: true,
    sessionId: 'session-123',
  };

  beforeEach(() => {
    mockDocRepo = {
      createWithInitialVersion: jest.fn().mockImplementation(async (data) => ({
        document: {
          id: 'doc-123',
          organizationId: data.organizationId,
          communityId: data.communityId,
          title: data.title,
          category: data.category,
          classification: data.classification,
          status: 'ACTIVE',
          version: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        version: {
          id: 'ver-1',
          documentId: 'doc-123',
          versionNumber: 1,
          fileName: data.initialVersion.fileName,
          sizeBytes: data.initialVersion.sizeBytes,
          checksum: data.initialVersion.checksum,
          status: 'ACTIVE',
          uploadedAt: new Date(),
        },
      })),
      findById: jest.fn().mockResolvedValue({
        id: 'doc-123',
        organizationId: 'org-123',
        communityId: 'comm-123',
        title: 'Bylaws',
        category: 'POLICY',
        classification: 'PUBLIC',
        status: 'ACTIVE',
        currentVersionId: 'ver-1',
        version: 1,
        isLocked: false,
      }),
      findMany: jest.fn(),
      update: jest.fn(),
    } as unknown as DocumentRepository;

    mockVersionRepo = {
      create: jest.fn(),
      findByDocumentIdAndVersion: jest.fn(),
      findById: jest.fn().mockResolvedValue({
        id: 'ver-1',
        documentId: 'doc-123',
        versionNumber: 1,
        storageKey: 'org-123/comm-123/documents/doc-123/v1/bylaws.pdf',
        fileName: 'bylaws.pdf',
        originalFileName: 'Society_Bylaws.pdf',
        mimeType: 'application/pdf',
        sizeBytes: BigInt(20480),
        checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        status: 'ACTIVE',
      }),
      findByDocumentId: jest.fn().mockResolvedValue([]),
      getLatestVersionNumber: jest.fn().mockResolvedValue(1),
    } as unknown as DocumentVersionRepository;

    mockLinkRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByResource: jest.fn(),
      findByDocumentId: jest.fn().mockResolvedValue([]),
      delete: jest.fn(),
    } as unknown as DocumentLinkRepository;

    mockStorage = {
      putObject: jest.fn().mockResolvedValue({
        storageKey: 'org-123/comm-123/documents/doc-123/v1/bylaws.pdf',
        sizeBytes: BigInt(20480),
        checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        mimeType: 'application/pdf',
        fileName: 'bylaws.pdf',
      }),
      getObjectStream: jest.fn().mockResolvedValue({
        stream: {} as unknown as NodeJS.ReadableStream,
        metadata: {
          key: 'key',
          sizeBytes: 20480,
          mimeType: 'application/pdf',
          checksum: 'hash',
          lastModified: new Date(),
        },
      }),
    } as unknown as LocalDiskStorageProvider;

    mockAuth = {
      authorizeDocumentRead: jest.fn().mockResolvedValue(undefined),
      authorizeDocumentWrite: jest.fn().mockResolvedValue(undefined),
    } as unknown as DocumentAuthorizationService;

    mockEvents = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as unknown as EventsService;

    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
    } as unknown as LoggerService;

    service = new DocumentService(
      mockDocRepo,
      mockVersionRepo,
      mockLinkRepo,
      mockStorage,
      mockAuth,
      mockEvents,
      mockLogger,
    );
  });

  it('should create a document with initial version and emit event', async () => {
    const input = {
      title: 'Community Bylaws 2026',
      description: 'Rules and regulations',
      category: 'POLICY' as const,
      classification: 'PUBLIC' as const,
      initialVersion: {
        fileName: 'bylaws.pdf',
        originalFileName: 'bylaws.pdf',
        mimeType: 'application/pdf',
        sizeBytes: BigInt(20480),
        checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        storageKey: 'org-123/comm-123/documents/bylaws.pdf',
      },
    };

    const { document, version } = await service.createDocument(
      'org-123',
      'comm-123',
      input,
      mockActor,
    );

    expect(document.id).toBe('doc-123');
    expect(version.versionNumber).toBe(1);
    expect(mockEvents.publish).toHaveBeenCalled();
  });

  it('should prevent download of QUARANTINED file version', async () => {
    (mockVersionRepo.findByDocumentIdAndVersion as jest.Mock).mockResolvedValueOnce({
      id: 'ver-1',
      documentId: 'doc-123',
      versionNumber: 1,
      storageKey: 'key',
      fileName: 'virus.exe',
      originalFileName: 'virus.exe',
      mimeType: 'application/x-msdownload',
      sizeBytes: BigInt(500),
      checksum: 'badhash',
      status: 'QUARANTINED',
      uploadedAt: new Date(),
    });

    await expect(service.downloadDocument('doc-123', 1, mockActor)).rejects.toThrow(/quarantined/);
  });
});
