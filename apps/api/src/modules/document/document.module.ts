import { Module } from '@nestjs/common';
import { DocumentRepository } from './document.repository.js';
import { DocumentVersionRepository } from './document-version.repository.js';
import { DocumentLinkRepository } from './document-link.repository.js';
import { LocalDiskStorageProvider } from './storage/local-disk-storage.provider.js';
import { DocumentAuthorizationService } from './document-authorization.service.js';
import { DocumentService } from './document.service.js';
import { DocumentsController } from './documents.controller.js';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { LoggerModule } from '../logger/logger.module.js';
import { AuthorizationModule } from '../authorization/authorization.module.js';

@Module({
  imports: [DatabaseModule, EventsModule, LoggerModule, AuthorizationModule],
  controllers: [DocumentsController],
  providers: [
    DocumentRepository,
    DocumentVersionRepository,
    DocumentLinkRepository,
    LocalDiskStorageProvider,
    DocumentAuthorizationService,
    DocumentService,
  ],
  exports: [
    DocumentRepository,
    DocumentVersionRepository,
    DocumentLinkRepository,
    LocalDiskStorageProvider,
    DocumentService,
  ],
})
export class DocumentModule {}
