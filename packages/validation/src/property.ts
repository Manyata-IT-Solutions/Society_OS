import { z } from 'zod';
import { paginationQuerySchema } from './common.js';

// --- Enums ---
export const buildingTypeSchema = z.enum([
  'TOWER',
  'BLOCK',
  'WING',
  'BUILDING',
  'VILLA_CLUSTER',
  'ROW_HOUSE_BLOCK',
  'OTHER',
]);

export const buildingStatusSchema = z.enum(['PLANNED', 'ACTIVE', 'INACTIVE', 'ARCHIVED']);

export const floorStatusSchema = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);

export const unitTypeSchema = z.enum([
  'APARTMENT',
  'VILLA',
  'PENTHOUSE',
  'STUDIO',
  'DUPLEX',
  'ROW_HOUSE',
  'OTHER',
]);

export const unitStatusSchema = z.enum([
  'PLANNED',
  'UNDER_CONSTRUCTION',
  'READY',
  'ACTIVE',
  'INACTIVE',
  'ARCHIVED',
]);

export const areaUnitSchema = z.enum(['SQFT', 'SQM']);

// --- Portfolio ---
export const createPortfolioSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  code: z
    .string()
    .min(2, 'Code must be at least 2 characters')
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, 'Code must contain only letters, numbers, hyphens, or underscores'),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().max(500).optional(),
});

export const updatePortfolioSchema = z.object({
  name: z.string().min(2).max(255).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  version: z.number().int().positive('Version number required for concurrency control'),
});

export const portfolioQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  search: z.string().optional(),
});

// --- Property Section / Zone ---
export const createSectionSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, 'Code must be alphanumeric with hyphens or underscores'),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
    .optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().default(0),
});

export const updateSectionSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  sortOrder: z.number().int().optional(),
  version: z.number().int().positive('Version number required for concurrency control'),
});

export const sectionQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  search: z.string().optional(),
});

// --- Building ---
export const createBuildingSchema = z.object({
  sectionId: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(100),
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50)
    .regex(/^[A-Z0-9_-]+$/i, 'Code must be alphanumeric with hyphens or underscores'),
  buildingType: buildingTypeSchema.default('TOWER'),
  numberOfFloors: z.number().int().min(0).max(250).optional(),
  sortOrder: z.number().int().default(0),
});

export const updateBuildingSchema = z.object({
  sectionId: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(100).optional(),
  buildingType: buildingTypeSchema.optional(),
  status: buildingStatusSchema.optional(),
  numberOfFloors: z.number().int().min(0).max(250).nullable().optional(),
  sortOrder: z.number().int().optional(),
  version: z.number().int().positive('Version number required for concurrency control'),
});

export const buildingQuerySchema = paginationQuerySchema.extend({
  sectionId: z.string().uuid().optional(),
  buildingType: buildingTypeSchema.optional(),
  status: buildingStatusSchema.optional(),
  search: z.string().optional(),
});

// --- Floor ---
export const createFloorSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50),
  levelNumber: z.number().int().min(-20).max(250).optional(),
  sortOrder: z.number().int().default(0),
});

export const updateFloorSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  levelNumber: z.number().int().min(-20).max(250).nullable().optional(),
  status: floorStatusSchema.optional(),
  sortOrder: z.number().int().optional(),
  version: z.number().int().positive('Version number required for concurrency control'),
});

export const floorQuerySchema = paginationQuerySchema.extend({
  status: floorStatusSchema.optional(),
  search: z.string().optional(),
});

// --- Unit ---
export const createUnitSchema = z.object({
  sectionId: z.string().uuid().optional(),
  buildingId: z.string().uuid().optional(),
  floorId: z.string().uuid().optional(),
  unitNumber: z.string().min(1, 'Unit number is required').max(50),
  displayName: z.string().min(1).max(100).optional(),
  unitType: unitTypeSchema.default('APARTMENT'),
  status: unitStatusSchema.default('ACTIVE'),
  carpetArea: z.number().positive().max(1000000).optional(),
  builtUpArea: z.number().positive().max(1000000).optional(),
  superBuiltUpArea: z.number().positive().max(1000000).optional(),
  areaUnit: areaUnitSchema.default('SQFT'),
  bedroomCount: z.number().int().min(0).max(50).optional(),
  bathroomCount: z.number().int().min(0).max(50).optional(),
});

export const updateUnitSchema = z.object({
  sectionId: z.string().uuid().nullable().optional(),
  buildingId: z.string().uuid().nullable().optional(),
  floorId: z.string().uuid().nullable().optional(),
  displayName: z.string().min(1).max(100).optional(),
  unitType: unitTypeSchema.optional(),
  status: unitStatusSchema.optional(),
  carpetArea: z.number().positive().max(1000000).nullable().optional(),
  builtUpArea: z.number().positive().max(1000000).nullable().optional(),
  superBuiltUpArea: z.number().positive().max(1000000).nullable().optional(),
  areaUnit: areaUnitSchema.optional(),
  bedroomCount: z.number().int().min(0).max(50).nullable().optional(),
  bathroomCount: z.number().int().min(0).max(50).nullable().optional(),
  version: z.number().int().positive('Version number required for concurrency control'),
});

export const unitQuerySchema = paginationQuerySchema.extend({
  sectionId: z.string().uuid().optional(),
  buildingId: z.string().uuid().optional(),
  floorId: z.string().uuid().optional(),
  unitType: unitTypeSchema.optional(),
  status: unitStatusSchema.optional(),
  search: z.string().optional(),
});

// --- Bulk Unit Creation ---
export const bulkCreateUnitsSchema = z.object({
  sectionId: z.string().uuid().optional(),
  buildingId: z.string().uuid().optional(),
  floors: z
    .array(
      z.object({
        floorId: z.string().uuid().optional(),
        floorLabel: z.string().min(1).max(50),
        levelNumber: z.number().int().optional(),
      }),
    )
    .min(1, 'At least one floor is required')
    .max(100, 'Maximum 100 floors per bulk operation'),
  unitSuffixes: z
    .array(z.string().min(1).max(20))
    .min(1, 'At least one unit pattern suffix is required')
    .max(50, 'Maximum 50 units per floor pattern'),
  unitType: unitTypeSchema.default('APARTMENT'),
  areaUnit: areaUnitSchema.default('SQFT'),
  carpetArea: z.number().positive().optional(),
  builtUpArea: z.number().positive().optional(),
  superBuiltUpArea: z.number().positive().optional(),
  bedroomCount: z.number().int().min(0).max(20).optional(),
  bathroomCount: z.number().int().min(0).max(20).optional(),
});

// --- CSV Import ---
export const propertyImportRowSchema = z.object({
  sectionCode: z.string().max(50).optional(),
  sectionName: z.string().max(100).optional(),
  buildingCode: z.string().max(50).optional(),
  buildingName: z.string().max(100).optional(),
  buildingType: buildingTypeSchema.optional(),
  floorLabel: z.string().max(50).optional(),
  unitNumber: z.string().min(1, 'Unit number is required').max(50),
  displayName: z.string().max(100).optional(),
  unitType: unitTypeSchema.default('APARTMENT'),
  status: unitStatusSchema.default('ACTIVE'),
  carpetArea: z.number().positive().optional(),
  builtUpArea: z.number().positive().optional(),
  superBuiltUpArea: z.number().positive().optional(),
  areaUnit: areaUnitSchema.default('SQFT'),
  bedroomCount: z.number().int().min(0).optional(),
  bathroomCount: z.number().int().min(0).optional(),
});

export const propertyImportCommitSchema = z.object({
  rows: z
    .array(propertyImportRowSchema)
    .min(1, 'At least one row required')
    .max(5000, 'Max 5,000 rows per batch'),
  sourceFileName: z.string().max(255).optional(),
});

// --- Inferred Types ---
export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
export type PortfolioQueryParams = z.infer<typeof portfolioQuerySchema>;

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type SectionQueryParams = z.infer<typeof sectionQuerySchema>;

export type CreateBuildingInput = z.infer<typeof createBuildingSchema>;
export type UpdateBuildingInput = z.infer<typeof updateBuildingSchema>;
export type BuildingQueryParams = z.infer<typeof buildingQuerySchema>;

export type CreateFloorInput = z.infer<typeof createFloorSchema>;
export type UpdateFloorInput = z.infer<typeof updateFloorSchema>;
export type FloorQueryParams = z.infer<typeof floorQuerySchema>;

export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type UnitQueryParams = z.infer<typeof unitQuerySchema>;

export type BulkCreateUnitsInput = z.infer<typeof bulkCreateUnitsSchema>;
export type PropertyImportRowInput = z.infer<typeof propertyImportRowSchema>;
export type PropertyImportCommitInput = z.infer<typeof propertyImportCommitSchema>;
