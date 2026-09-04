import { z } from 'zod';
import {
  entityStatusSchema,
  slugSchema,
  communityCodeSchema,
  timezoneSchema,
  currencySchema,
  localeSchema,
  addressSchema,
  paginationQuerySchema,
  uuidSchema,
} from './common.js';

export const createCommunitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Community name must be at least 2 characters' })
    .max(255, { message: 'Community name must not exceed 255 characters' }),
  code: communityCodeSchema,
  slug: slugSchema,
  timezone: timezoneSchema.default('UTC'),
  locale: localeSchema.default('en-US'),
  currency: currencySchema.default('USD'),
  address: addressSchema,
  settings: z.record(z.unknown()).optional().default({}),
});

export const updateCommunitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Community name must be at least 2 characters' })
    .max(255, { message: 'Community name must not exceed 255 characters' })
    .optional(),
  timezone: timezoneSchema.optional(),
  locale: localeSchema.optional(),
  currency: currencySchema.optional(),
  address: addressSchema.partial().optional(),
  settings: z.record(z.unknown()).optional(),
  expectedVersion: z.number().int().positive().optional(),
});

export const changeCommunityStatusSchema = z.object({
  status: entityStatusSchema,
  expectedVersion: z.number().int().positive().optional(),
});

export const communityQuerySchema = paginationQuerySchema.extend({
  organizationId: uuidSchema.optional(),
  status: entityStatusSchema.optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['name', 'code', 'slug', 'status', 'createdAt', 'updatedAt']).default('createdAt'),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;
export type UpdateCommunityInput = z.infer<typeof updateCommunitySchema>;
export type ChangeCommunityStatusInput = z.infer<typeof changeCommunityStatusSchema>;
export type CommunityQueryParams = z.infer<typeof communityQuerySchema>;
