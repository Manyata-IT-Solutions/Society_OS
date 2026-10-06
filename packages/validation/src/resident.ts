import { z } from 'zod';
import { paginationQuerySchema } from './common.js';

export const residentStatusEnum = z.enum(['PENDING', 'ACTIVE', 'INACTIVE', 'ARCHIVED']);
export const genderEnum = z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']);
export const householdStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);
export const householdRelationshipTypeEnum = z.enum([
  'SELF',
  'SPOUSE',
  'CHILD',
  'PARENT',
  'SIBLING',
  'RELATIVE',
  'DOMESTIC_STAFF',
  'OTHER',
]);
export const householdMemberStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'LEFT']);
export const ownershipTypeEnum = z.enum([
  'SOLE',
  'JOINT',
  'CORPORATE',
  'DEVELOPER',
  'TRUST',
  'OTHER',
]);
export const ownershipStatusEnum = z.enum(['ACTIVE', 'TRANSFERRED', 'ENDED', 'CANCELLED']);
export const tenancyStatusEnum = z.enum(['PLANNED', 'ACTIVE', 'ENDED', 'CANCELLED']);
export const occupancyTypeEnum = z.enum([
  'OWNER_OCCUPIED',
  'TENANT_OCCUPIED',
  'FAMILY_OCCUPIED',
  'OTHER',
]);
export const occupancyStatusEnum = z.enum(['SCHEDULED', 'ACTIVE', 'ENDED', 'CANCELLED']);

// --- RESIDENTS ---
export const createResidentSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  middleName: z.string().max(100).optional().nullable(),
  lastName: z.string().min(1, 'Last name is required').max(100),
  displayName: z.string().max(150).optional().nullable(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid E.164 phone format')
    .optional()
    .nullable(),
  email: z.string().email('Invalid email address').max(255).optional().nullable(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  gender: genderEnum.optional().nullable(),
  status: residentStatusEnum.default('ACTIVE'),
  preferredLanguage: z.string().max(20).default('en'),
});

export const updateResidentSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  middleName: z.string().max(100).optional().nullable(),
  lastName: z.string().min(1).max(100).optional(),
  displayName: z.string().max(150).optional().nullable(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid E.164 phone format')
    .optional()
    .nullable(),
  email: z.string().email('Invalid email address').max(255).optional().nullable(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)')
    .optional()
    .nullable(),
  gender: genderEnum.optional().nullable(),
  status: residentStatusEnum.optional(),
  preferredLanguage: z.string().max(20).optional(),
});

export const residentQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  status: residentStatusEnum.optional(),
  unitId: z.string().uuid().optional(),
  householdId: z.string().uuid().optional(),
  hasUser: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

export const linkResidentUserSchema = z.object({
  userId: z.string().uuid('User ID must be a valid UUID'),
});

// --- HOUSEHOLDS ---
export const createHouseholdSchema = z.object({
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  name: z.string().max(150).optional().nullable(),
  primaryContactResidentId: z.string().uuid().optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be YYYY-MM-DD'),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be YYYY-MM-DD')
    .optional()
    .nullable(),
  status: householdStatusEnum.default('ACTIVE'),
});

export const updateHouseholdSchema = z.object({
  name: z.string().max(150).optional().nullable(),
  primaryContactResidentId: z.string().uuid().optional().nullable(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  status: householdStatusEnum.optional(),
});

export const householdQuerySchema = paginationQuerySchema.extend({
  unitId: z.string().uuid().optional(),
  status: householdStatusEnum.optional(),
  search: z.string().optional(),
});

// --- HOUSEHOLD MEMBERS ---
export const addHouseholdMemberSchema = z.object({
  residentId: z.string().uuid('Resident ID must be a valid UUID'),
  relationshipType: householdRelationshipTypeEnum.default('SELF'),
  isPrimaryContact: z.boolean().default(false),
  joinedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default(() => new Date().toISOString().slice(0, 10)),
});

export const updateHouseholdMemberSchema = z.object({
  relationshipType: householdRelationshipTypeEnum.optional(),
  isPrimaryContact: z.boolean().optional(),
  status: householdMemberStatusEnum.optional(),
  leftAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

// --- OWNERSHIP ---
export const createOwnershipSchema = z.object({
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  residentId: z.string().uuid('Resident ID must be a valid UUID'),
  ownershipShare: z.number().min(0.01).max(100.0).optional().nullable(),
  ownershipType: ownershipTypeEnum.default('SOLE'),
  isPrimaryOwner: z.boolean().default(true),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default(() => new Date().toISOString().slice(0, 10)),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

export const transferOwnershipSchema = z.object({
  transferDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default(() => new Date().toISOString().slice(0, 10)),
  newOwners: z
    .array(
      z.object({
        residentId: z.string().uuid(),
        ownershipShare: z.number().min(0.01).max(100.0).optional().nullable(),
        ownershipType: ownershipTypeEnum.default('SOLE'),
        isPrimaryOwner: z.boolean().default(true),
      }),
    )
    .min(1, 'At least one incoming owner is required'),
});

export const ownershipQuerySchema = paginationQuerySchema.extend({
  unitId: z.string().uuid().optional(),
  residentId: z.string().uuid().optional(),
  status: ownershipStatusEnum.optional(),
});

// --- TENANCY ---
export const createTenancySchema = z.object({
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  householdId: z.string().uuid('Household ID must be a valid UUID'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  agreementReference: z.string().max(100).optional().nullable(),
  status: tenancyStatusEnum.default('ACTIVE'),
});

export const updateTenancySchema = z.object({
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  agreementReference: z.string().max(100).optional().nullable(),
  status: tenancyStatusEnum.optional(),
});

export const tenancyQuerySchema = paginationQuerySchema.extend({
  unitId: z.string().uuid().optional(),
  householdId: z.string().uuid().optional(),
  status: tenancyStatusEnum.optional(),
});

// --- OCCUPANCY & MOVE-IN / MOVE-OUT ---
export const createOccupancySchema = z.object({
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  householdId: z.string().uuid('Household ID must be a valid UUID'),
  occupancyType: occupancyTypeEnum.default('OWNER_OCCUPIED'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  status: occupancyStatusEnum.default('ACTIVE'),
});

export const moveInSchema = z.object({
  unitId: z.string().uuid('Unit ID must be a valid UUID'),
  occupancyType: occupancyTypeEnum,
  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default(() => new Date().toISOString().slice(0, 10)),
  householdName: z.string().max(150).optional().nullable(),
  // Primary Resident (existing or new)
  primaryResident: z.object({
    residentId: z.string().uuid().optional(),
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    relationshipType: householdRelationshipTypeEnum.default('SELF'),
  }),
  // Additional Members
  additionalMembers: z
    .array(
      z.object({
        residentId: z.string().uuid().optional(),
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        phone: z.string().optional().nullable(),
        email: z.string().email().optional().nullable(),
        relationshipType: householdRelationshipTypeEnum.default('OTHER'),
      }),
    )
    .optional()
    .default([]),
  // Optional Rental agreement reference
  agreementReference: z.string().max(100).optional().nullable(),
  leaseEndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  // Ownership Details (if owner-occupied and creating ownership)
  isNewOwner: z.boolean().default(false),
  ownershipShare: z.number().min(0.01).max(100.0).optional().nullable(),
  ownershipType: ownershipTypeEnum.optional(),
  // App Invitations
  sendAppInvitations: z.boolean().default(false),
});

export const moveOutSchema = z.object({
  effectiveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .default(() => new Date().toISOString().slice(0, 10)),
  reason: z.string().max(255).optional().nullable(),
});

export const occupancyQuerySchema = paginationQuerySchema.extend({
  unitId: z.string().uuid().optional(),
  householdId: z.string().uuid().optional(),
  status: occupancyStatusEnum.optional(),
  occupancyType: occupancyTypeEnum.optional(),
});

// --- CSV IMPORT ---
export const residentImportRowSchema = z.object({
  unitNumber: z.string().min(1, 'Unit number is required').max(50),
  buildingCode: z.string().max(50).optional().nullable(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  roleInUnit: z.enum(['OWNER', 'TENANT', 'MEMBER']).default('OWNER'),
  relationshipType: householdRelationshipTypeEnum.default('SELF'),
  isPrimaryContact: z.boolean().default(false),
  ownershipShare: z.number().min(0).max(100).optional().nullable(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

export const validateResidentImportSchema = z.object({
  rows: z.array(residentImportRowSchema).min(1, 'CSV must contain at least 1 row'),
});

export const commitResidentImportSchema = z.object({
  sourceFileName: z.string().max(255).optional(),
  rows: z.array(residentImportRowSchema).min(1, 'CSV must contain at least 1 row'),
});

export type CreateResidentInput = z.infer<typeof createResidentSchema>;
export type UpdateResidentInput = z.infer<typeof updateResidentSchema>;
export type ResidentQueryParams = z.infer<typeof residentQuerySchema>;
export type LinkResidentUserInput = z.infer<typeof linkResidentUserSchema>;

export type CreateHouseholdInput = z.infer<typeof createHouseholdSchema>;
export type UpdateHouseholdInput = z.infer<typeof updateHouseholdSchema>;
export type HouseholdQueryParams = z.infer<typeof householdQuerySchema>;

export type AddHouseholdMemberInput = z.infer<typeof addHouseholdMemberSchema>;
export type UpdateHouseholdMemberInput = z.infer<typeof updateHouseholdMemberSchema>;

export type CreateOwnershipInput = z.infer<typeof createOwnershipSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
export type OwnershipQueryParams = z.infer<typeof ownershipQuerySchema>;

export type CreateTenancyInput = z.infer<typeof createTenancySchema>;
export type UpdateTenancyInput = z.infer<typeof updateTenancySchema>;
export type TenancyQueryParams = z.infer<typeof tenancyQuerySchema>;

export type CreateOccupancyInput = z.infer<typeof createOccupancySchema>;
export type MoveInInput = z.infer<typeof moveInSchema>;
export type MoveOutInput = z.infer<typeof moveOutSchema>;
export type OccupancyQueryParams = z.infer<typeof occupancyQuerySchema>;

export type ResidentImportRowInput = z.infer<typeof residentImportRowSchema>;
export type ValidateResidentImportInput = z.infer<typeof validateResidentImportSchema>;
export type CommitResidentImportInput = z.infer<typeof commitResidentImportSchema>;
