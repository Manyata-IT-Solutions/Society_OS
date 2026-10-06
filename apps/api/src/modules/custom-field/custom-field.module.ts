import { Module } from '@nestjs/common';
import { CustomFieldDefinitionRepository } from './custom-field-definition.repository.js';
import { CustomFieldValueRepository } from './custom-field-value.repository.js';
import { CustomFieldValidatorService } from './custom-field-validator.service.js';
import { CustomFieldService } from './custom-field.service.js';
import { CustomFieldsController } from './custom-fields.controller.js';
import { DatabaseModule } from '../database/database.module.js';
import { EventsModule } from '../events/events.module.js';
import { LoggerModule } from '../logger/logger.module.js';

@Module({
  imports: [DatabaseModule, EventsModule, LoggerModule],
  controllers: [CustomFieldsController],
  providers: [
    CustomFieldDefinitionRepository,
    CustomFieldValueRepository,
    CustomFieldValidatorService,
    CustomFieldService,
  ],
  exports: [
    CustomFieldDefinitionRepository,
    CustomFieldValueRepository,
    CustomFieldValidatorService,
    CustomFieldService,
  ],
})
export class CustomFieldModule {}
