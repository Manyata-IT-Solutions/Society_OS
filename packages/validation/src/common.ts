import { z } from 'zod';

export const uuidSchema = z.string().uuid({ message: 'Invalid UUID format' });

export const entityStatusSchema = z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED'], {
  errorMap: () => ({ message: "Status must be 'ACTIVE', 'SUSPENDED', or 'ARCHIVED'" }),
});

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2, { message: 'Slug must be at least 2 characters' })
  .max(100, { message: 'Slug must not exceed 100 characters' })
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must contain only lowercase alphanumeric characters separated by single hyphens',
  });

export const communityCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(2, { message: 'Code must be at least 2 characters' })
  .max(50, { message: 'Code must not exceed 50 characters' })
  .regex(/^[A-Z0-9_-]+$/, {
    message: 'Code must contain only uppercase alphanumeric characters, hyphens, or underscores',
  });

export const timezoneSchema = z
  .string()
  .trim()
  .min(1, { message: 'Timezone is required' })
  .max(50)
  .refine(
    (tz) => {
      try {
        Intl.DateTimeFormat(undefined, { timeZone: tz });
        return true;
      } catch {
        return false;
      }
    },
    {
      message: 'Invalid IANA timezone identifier (e.g. "Asia/Kolkata", "America/New_York", "UTC")',
    },
  );

export const currencySchema = z
  .string()
  .trim()
  .toUpperCase()
  .length(3, { message: 'Currency must be a 3-letter ISO 4217 code (e.g. INR, USD, EUR)' })
  .regex(/^[A-Z]{3}$/, { message: 'Currency must consist of 3 uppercase letters' });

export const countryCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .min(2, { message: 'Country code must be 2 or 3 uppercase letters' })
  .max(3, { message: 'Country code must be 2 or 3 uppercase letters' })
  .regex(/^[A-Z]{2,3}$/, { message: 'Country code must be ISO 3166-1 alpha-2 or alpha-3 format' });

export const localeSchema = z
  .string()
  .trim()
  .min(2, { message: 'Locale must be at least 2 characters' })
  .max(20, { message: 'Locale must not exceed 20 characters' })
  .regex(/^[a-z]{2}(?:-[A-Z]{2})?$/, {
    message: 'Locale must follow BCP 47 format (e.g. "en", "en-US", "en-IN")',
  });

export const addressSchema = z.object({
  addressLine1: z
    .string()
    .trim()
    .min(3, { message: 'Address line 1 must be at least 3 characters' })
    .max(255),
  addressLine2: z.string().trim().max(255).optional().nullable(),
  locality: z.string().trim().max(100).optional().nullable(),
  city: z.string().trim().min(2, { message: 'City must be at least 2 characters' }).max(100),
  region: z.string().trim().max(100).optional().nullable(),
  postalCode: z
    .string()
    .trim()
    .min(2, { message: 'Postal code must be at least 2 characters' })
    .max(30),
  countryCode: countryCodeSchema.default('US'),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: 'Invalid email address' });

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid international phone number (E.164 format recommended)',
  });

export const sanitizedStringSchema = (min = 1, max = 255) =>
  z
    .string()
    .trim()
    .min(min, { message: `Must be at least ${min} characters` })
    .max(max, { message: `Must not exceed ${max} characters` });

export const tenantHeaderSchema = z.object({
  'x-organization-id': z.string().uuid().optional(),
  'x-community-id': z.string().uuid().optional(),
  'x-correlation-id': z.string().optional(),
});
