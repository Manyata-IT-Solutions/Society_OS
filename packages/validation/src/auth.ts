import { z } from 'zod';
import { emailSchema, phoneSchema, uuidSchema, paginationQuerySchema } from './common.js';

export const userStatusSchema = z.enum(['PENDING', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'ARCHIVED']);
export const membershipStatusSchema = z.enum([
  'INVITED',
  'ACTIVE',
  'SUSPENDED',
  'REVOKED',
  'EXPIRED',
]);
export const scopeTypeSchema = z.enum(['PLATFORM', 'ORGANIZATION', 'COMMUNITY', 'OWN']);
export const assignmentStatusSchema = z.enum(['ACTIVE', 'REVOKED']);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }).max(128),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(10, { message: 'Valid refresh token is required' }),
});

export const createUserSchema = z.object({
  email: emailSchema,
  phone: phoneSchema.optional().nullable(),
  displayName: z
    .string()
    .trim()
    .min(2, { message: 'Display name must be at least 2 characters' })
    .max(100),
  password: z.string().min(8, { message: 'Password must be at least 8 characters' }).optional(),
  preferredLocale: z.string().default('en-US'),
  timezone: z.string().default('UTC'),
});

export const updateUserSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  phone: phoneSchema.optional().nullable(),
  preferredLocale: z.string().optional(),
  timezone: z.string().optional(),
  expectedVersion: z.number().int().positive().optional(),
});

export const changeUserStatusSchema = z.object({
  status: userStatusSchema,
  expectedVersion: z.number().int().positive().optional(),
});

export const createMembershipSchema = z.object({
  userId: uuidSchema,
  organizationId: uuidSchema,
  communityId: uuidSchema.optional().nullable(),
  status: membershipStatusSchema.default('ACTIVE'),
});

export const changeMembershipStatusSchema = z.object({
  status: membershipStatusSchema,
  expectedVersion: z.number().int().positive().optional(),
});

export const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(100),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(50)
    .regex(/^[A-Z0-9_]+$/, { message: 'Role code must be uppercase alphanumeric and underscores' }),
  description: z.string().trim().max(255).optional().nullable(),
  scopeType: scopeTypeSchema,
  organizationId: uuidSchema.optional().nullable(),
  permissionCodes: z
    .array(z.string())
    .min(1, { message: 'At least one permission must be selected' }),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(255).optional().nullable(),
  permissionCodes: z.array(z.string()).optional(),
  expectedVersion: z.number().int().positive().optional(),
});

export const createRoleAssignmentSchema = z.object({
  userId: uuidSchema,
  roleId: uuidSchema,
  scopeType: scopeTypeSchema,
  scopeId: uuidSchema.optional().nullable(),
  validFrom: z.string().datetime().optional().nullable(),
  validUntil: z.string().datetime().optional().nullable(),
});

export const userQuerySchema = paginationQuerySchema.extend({
  organizationId: uuidSchema.optional(),
  communityId: uuidSchema.optional(),
  status: userStatusSchema.optional(),
  search: z.string().trim().optional(),
});

export const membershipQuerySchema = paginationQuerySchema.extend({
  organizationId: uuidSchema.optional(),
  communityId: uuidSchema.optional(),
  userId: uuidSchema.optional(),
  status: membershipStatusSchema.optional(),
});

export const roleQuerySchema = paginationQuerySchema.extend({
  organizationId: uuidSchema.optional(),
  scopeType: scopeTypeSchema.optional(),
  isSystem: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
});

export const roleAssignmentQuerySchema = paginationQuerySchema.extend({
  userId: uuidSchema.optional(),
  roleId: uuidSchema.optional(),
  scopeType: scopeTypeSchema.optional(),
  scopeId: uuidSchema.optional(),
  status: assignmentStatusSchema.optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ChangeUserStatusInput = z.infer<typeof changeUserStatusSchema>;
export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;
export type ChangeMembershipStatusInput = z.infer<typeof changeMembershipStatusSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type CreateRoleAssignmentInput = z.infer<typeof createRoleAssignmentSchema>;
export type UserQueryParams = z.infer<typeof userQuerySchema>;
export type MembershipQueryParams = z.infer<typeof membershipQuerySchema>;
export type RoleQueryParams = z.infer<typeof roleQuerySchema>;
export type RoleAssignmentQueryParams = z.infer<typeof roleAssignmentQuerySchema>;
