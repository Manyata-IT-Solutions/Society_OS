import { z } from 'zod';
import {
  entityStatusSchema,
  slugSchema,
  timezoneSchema,
  currencySchema,
  localeSchema,
  paginationQuerySchema,
} from './common.js';

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Organization name must be at least 2 characters' })
    .max(255, { message: 'Organization name must not exceed 255 characters' }),
  slug: slugSchema,
  legalName: z.string().trim().max(255).optional().nullable(),
  defaultTimezone: timezoneSchema.default('UTC'),
  defaultLocale: localeSchema.default('en-US'),
  defaultCurrency: currencySchema.default('USD'),
  settings: z.record(z.unknown()).optional().default({}),
});

export const updateOrganizationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: 'Organization name must be at least 2 characters' })
    .max(255, { message: 'Organization name must not exceed 255 characters' })
    .optional(),
  legalName: z.string().trim().max(255).optional().nullable(),
  defaultTimezone: timezoneSchema.optional(),
  defaultLocale: localeSchema.optional(),
  defaultCurrency: currencySchema.optional(),
  settings: z.record(z.unknown()).optional(),
  expectedVersion: z.number().int().positive().optional(),
});

export const changeOrganizationStatusSchema = z.object({
  status: entityStatusSchema,
  expectedVersion: z.number().int().positive().optional(),
});

export const organizationQuerySchema = paginationQuerySchema.extend({
  status: entityStatusSchema.optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['name', 'slug', 'status', 'createdAt', 'updatedAt']).default('createdAt'),
});

export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
export type ChangeOrganizationStatusInput = z.infer<typeof changeOrganizationStatusSchema>;
export type OrganizationQueryParams = z.infer<typeof organizationQuerySchema>;
