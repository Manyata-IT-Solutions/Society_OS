import { CustomFieldService } from './custom-field.service.js';
import { CustomFieldDefinitionRepository } from './custom-field-definition.repository.js';
import { CustomFieldValueRepository } from './custom-field-value.repository.js';
import { CustomFieldValidatorService } from './custom-field-validator.service.js';
import { EventsService } from '../events/events.service.js';
import { LoggerService } from '../logger/logger.service.js';
import type { CustomFieldDefinition } from '@community-os/types';

describe('CustomFieldService (Unit)', () => {
  let service: CustomFieldService;
  let mockDefRepo: jest.Mocked<CustomFieldDefinitionRepository>;
  let mockValRepo: jest.Mocked<CustomFieldValueRepository>;
  let validator: CustomFieldValidatorService;
  let mockEvents: jest.Mocked<EventsService>;
  let mockLogger: jest.Mocked<LoggerService>;

  beforeEach(() => {
    mockDefRepo = {
      findDefinitionById: jest.fn(),
      findDefinitionByKey: jest.fn(),
      findManyDefinitions: jest.fn(),
      findActiveDefinitionsForEntity: jest.fn(),
      createDefinition: jest.fn(),
      updateDefinition: jest.fn(),
    } as unknown as jest.Mocked<CustomFieldDefinitionRepository>;

    mockValRepo = {
      findValuesForEntity: jest.fn(),
      upsertValue: jest.fn(),
      countValuesByDefinitionId: jest.fn(),
    } as unknown as jest.Mocked<CustomFieldValueRepository>;

    validator = new CustomFieldValidatorService();

    mockEvents = {
      publish: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<EventsService>;

    mockLogger = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    service = new CustomFieldService(mockDefRepo, mockValRepo, validator, mockEvents, mockLogger);
  });

  it('creates custom field definition and publishes event', async () => {
    mockDefRepo.findDefinitionByKey.mockResolvedValue(null);
    mockDefRepo.createDefinition.mockResolvedValue({
      id: 'def-1',
      organizationId: 'org-1',
      communityId: 'comm-1',
      entityType: 'UNIT',
      key: 'handoverDate',
      label: 'Handover Date',
      description: 'Possession date',
      fieldType: 'DATE',
      required: false,
      searchable: true,
      filterable: true,
      status: 'ACTIVE',
      validationRules: null,
      options: null,
      defaultValue: null,
      displayOrder: 1,
      visibility: 'TENANT_INTERNAL',
      version: 1,
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await service.createDefinition(
      {
        entityType: 'UNIT',
        key: 'handoverDate',
        label: 'Handover Date',
        fieldType: 'DATE',
        required: false,
        searchable: true,
        filterable: true,
        displayOrder: 1,
        visibility: 'TENANT_INTERNAL',
      },
      {
        userId: 'user-1',
        organizationId: 'org-1',
        communityId: 'comm-1',
      },
    );

    expect(result.key).toBe('handoverDate');
    expect(mockEvents.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          eventName: 'custom_field.created.v1',
        }),
      }),
    );
  });

  it('rejects duplicate custom field key for same entityType within tenant', async () => {
    mockDefRepo.findDefinitionByKey.mockResolvedValue({
      id: 'def-existing',
    } as unknown as CustomFieldDefinition);

    await expect(
      service.createDefinition(
        {
          entityType: 'UNIT',
          key: 'handoverDate',
          label: 'Handover Date',
          fieldType: 'DATE',
          required: false,
          searchable: true,
          filterable: true,
          displayOrder: 1,
          visibility: 'TENANT_INTERNAL',
        },
        {
          userId: 'user-1',
          organizationId: 'org-1',
          communityId: 'comm-1',
        },
      ),
    ).rejects.toThrow('A custom field with key "handoverDate" already exists for UNIT');
  });

  it('validates and persists custom field values with strict type checking', async () => {
    const mockDef: CustomFieldDefinition = {
      id: 'def-select',
      organizationId: 'org-1',
      communityId: 'comm-1',
      entityType: 'RESIDENT',
      key: 'bloodGroup',
      label: 'Blood Group',
      description: null,
      fieldType: 'SELECT',
      required: true,
      searchable: false,
      filterable: true,
      status: 'ACTIVE',
      validationRules: null,
      options: [
        { key: 'A_POS', label: 'A+', isActive: true },
        { key: 'O_POS', label: 'O+', isActive: true },
      ],
      defaultValue: null,
      displayOrder: 1,
      visibility: 'TENANT_INTERNAL',
      version: 1,
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDefRepo.findDefinitionById.mockResolvedValue(mockDef);
    mockValRepo.upsertValue.mockResolvedValue({
      id: 'val-1',
      definitionId: 'def-select',
      organizationId: 'org-1',
      communityId: 'comm-1',
      entityType: 'RESIDENT',
      entityId: 'res-1',
      value: 'O_POS',
      version: 1,
      createdById: 'user-1',
      updatedById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const results = await service.setEntityValues(
      'RESIDENT',
      'res-1',
      {
        values: [{ definitionId: 'def-select', value: 'O_POS' }],
      },
      {
        userId: 'user-1',
        organizationId: 'org-1',
        communityId: 'comm-1',
      },
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.value).toBe('O_POS');
  });

  it('rejects invalid option key for SELECT custom fields', async () => {
    const mockDef: CustomFieldDefinition = {
      id: 'def-select',
      organizationId: 'org-1',
      communityId: 'comm-1',
      entityType: 'RESIDENT',
      key: 'bloodGroup',
      label: 'Blood Group',
      description: null,
      fieldType: 'SELECT',
      required: false,
      searchable: false,
      filterable: true,
      status: 'ACTIVE',
      validationRules: null,
      options: [{ key: 'A_POS', label: 'A+', isActive: true }],
      defaultValue: null,
      displayOrder: 1,
      visibility: 'TENANT_INTERNAL',
      version: 1,
      createdById: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDefRepo.findDefinitionById.mockResolvedValue(mockDef);

    await expect(
      service.setEntityValues(
        'RESIDENT',
        'res-1',
        {
          values: [{ definitionId: 'def-select', value: 'INVALID_GROUP' }],
        },
        {
          userId: 'user-1',
          organizationId: 'org-1',
          communityId: 'comm-1',
        },
      ),
    ).rejects.toThrow('Invalid option "INVALID_GROUP" for field "Blood Group"');
  });

  it('blocks cross-tenant custom field assignment', async () => {
    const mockDefFromOtherOrg: CustomFieldDefinition = {
      id: 'def-foreign',
      organizationId: 'org-foreign',
      communityId: null,
      entityType: 'UNIT',
      key: 'specialKey',
      label: 'Special',
      description: null,
      fieldType: 'TEXT',
      required: false,
      searchable: false,
      filterable: false,
      status: 'ACTIVE',
      validationRules: null,
      options: null,
      defaultValue: null,
      displayOrder: 1,
      visibility: 'TENANT_INTERNAL',
      version: 1,
      createdById: 'user-other',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockDefRepo.findDefinitionById.mockResolvedValue(mockDefFromOtherOrg);

    await expect(
      service.setEntityValues(
        'UNIT',
        'unit-1',
        {
          values: [{ definitionId: 'def-foreign', value: 'Test' }],
        },
        {
          userId: 'user-1',
          organizationId: 'org-local',
          communityId: 'comm-local',
        },
      ),
    ).rejects.toThrow('Cannot assign custom field value from a different organization');
  });
});
