import { Injectable, NotFoundException } from '@nestjs/common';
import { VendorRepository } from './vendor.repository.js';
import { VendorEligibilityService } from './vendor-eligibility.service.js';
import { VendorPerformanceService } from './vendor-performance.service.js';
import { PrismaService } from '../database/prisma.service.js';
import { EventsService } from '../events/events.service.js';
import { AuditService } from '../audit/audit.service.js';
import { DOMAIN_EVENTS, createEvent } from '@community-os/events';
import type { Actor, Vendor } from '@community-os/types';

@Injectable()
export class VendorService {
  constructor(
    private readonly vendorRepo: VendorRepository,
    private readonly eligibilityService: VendorEligibilityService,
    private readonly performanceService: VendorPerformanceService,
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
    private readonly auditService: AuditService,
  ) {}

  async createVendor(
    data: {
      organizationId: string;
      vendorCode?: string;
      legalName: string;
      displayName: string;
      vendorType?: any;
      countryCode?: string;
      primaryEmail?: string | null;
      primaryPhone?: string | null;
      website?: string | null;
      paymentTerms?: string | null;
      riskRating?: any;
      isPreferred?: boolean;
      communityIds?: string[];
      capabilities?: Array<{
        inventoryCategoryId?: string | null;
        serviceCategoryKey?: string | null;
        description?: string | null;
      }>;
      contacts?: Array<{
        name: string;
        designation?: string | null;
        email?: string | null;
        phone?: string | null;
        contactType?: any;
        isPrimary?: boolean;
      }>;
      addresses?: Array<{
        addressType?: any;
        addressLine1: string;
        addressLine2?: string | null;
        city: string;
        state: string;
        postalCode: string;
        countryCode?: string;
        isPrimary?: boolean;
      }>;
      taxRegistrations?: Array<{
        countryCode?: string;
        registrationType?: any;
        registrationNumber: string;
        validFrom?: string | null;
        validTo?: string | null;
      }>;
    },
    actor: Actor,
  ): Promise<Vendor> {
    const code = data.vendorCode || `VND-${Date.now().toString().slice(-6)}`;

    const vendor = await this.vendorRepo.create({
      organization: { connect: { id: data.organizationId } },
      vendorCode: code,
      legalName: data.legalName,
      displayName: data.displayName,
      vendorType: data.vendorType ?? 'SUPPLIER',
      countryCode: data.countryCode ?? 'IND',
      primaryEmail: data.primaryEmail ?? null,
      primaryPhone: data.primaryPhone ?? null,
      website: data.website ?? null,
      paymentTerms: data.paymentTerms ?? null,
      riskRating: data.riskRating ?? 'LOW',
      isPreferred: Boolean(data.isPreferred),
      createdByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      contacts: data.contacts
        ? {
            create: data.contacts.map((c) => ({
              name: c.name,
              designation: c.designation ?? null,
              email: c.email ?? null,
              phone: c.phone ?? null,
              contactType: c.contactType ?? 'SALES',
              isPrimary: Boolean(c.isPrimary),
            })),
          }
        : undefined,
      addresses: data.addresses
        ? {
            create: data.addresses.map((a) => ({
              addressType: a.addressType ?? 'REGISTERED',
              addressLine1: a.addressLine1,
              addressLine2: a.addressLine2 ?? null,
              city: a.city,
              state: a.state,
              postalCode: a.postalCode,
              countryCode: a.countryCode ?? 'IND',
              isPrimary: Boolean(a.isPrimary),
            })),
          }
        : undefined,
      taxRegistrations: data.taxRegistrations
        ? {
            create: data.taxRegistrations.map((t) => ({
              countryCode: t.countryCode ?? 'IND',
              registrationType: t.registrationType ?? 'GSTIN',
              registrationNumber: t.registrationNumber,
              validFrom: t.validFrom ? new Date(t.validFrom) : null,
              validTo: t.validTo ? new Date(t.validTo) : null,
            })),
          }
        : undefined,
      capabilities: data.capabilities
        ? {
            create: data.capabilities.map((cap) => ({
              inventoryCategoryId: cap.inventoryCategoryId ?? null,
              serviceCategoryKey: cap.serviceCategoryKey ?? null,
              description: cap.description ?? null,
            })),
          }
        : undefined,
      communityLinks: data.communityIds
        ? {
            create: data.communityIds.map((cid) => ({
              community: { connect: { id: cid } },
            })),
          }
        : undefined,
    } as any);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).VENDOR_CREATED ?? 'vendor.created.v1',
        {
          vendorId: vendor.id,
          vendorCode: vendor.vendorCode,
          displayName: vendor.displayName,
        },
        {
          organizationId: data.organizationId,
          userId: actor?.id,
        },
      ),
    );

    return vendor as unknown as Vendor;
  }

  async submitForReview(id: string, organizationId: string, actor: Actor) {
    const vendor = await this.vendorRepo.findById(id, organizationId);
    if (!vendor) throw new NotFoundException('Vendor not found');

    const updated = await this.vendorRepo.update(id, organizationId, {
      onboardingStatus: 'UNDER_REVIEW',
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).VENDOR_SUBMITTED ?? 'vendor.submitted.v1',
        {
          vendorId: id,
        },
        {
          organizationId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async approveVendor(id: string, organizationId: string, actor: Actor) {
    const vendor = await this.vendorRepo.findById(id, organizationId);
    if (!vendor) throw new NotFoundException('Vendor not found');

    const updated = await this.vendorRepo.update(id, organizationId, {
      onboardingStatus: 'APPROVED',
      status: 'ACTIVE',
      approvedByUser: actor?.id ? { connect: { id: actor.id } } : undefined,
      approvedAt: new Date(),
    } as any);

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).VENDOR_APPROVED ?? 'vendor.approved.v1',
        {
          vendorId: id,
          approvedById: actor?.id,
        },
        {
          organizationId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async suspendVendor(id: string, organizationId: string, reason: string, actor: Actor) {
    const vendor = await this.vendorRepo.findById(id, organizationId);
    if (!vendor) throw new NotFoundException('Vendor not found');

    const updated = await this.vendorRepo.update(id, organizationId, {
      status: 'SUSPENDED',
      suspendedAt: new Date(),
      suspensionReason: reason,
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).VENDOR_SUSPENDED ?? 'vendor.suspended.v1',
        {
          vendorId: id,
          reason,
        },
        {
          organizationId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async blacklistVendor(id: string, organizationId: string, reason: string, actor: Actor) {
    const vendor = await this.vendorRepo.findById(id, organizationId);
    if (!vendor) throw new NotFoundException('Vendor not found');

    const updated = await this.vendorRepo.update(id, organizationId, {
      status: 'BLACKLISTED',
      blacklistedAt: new Date(),
      blacklistReason: reason,
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).VENDOR_BLACKLISTED ?? 'vendor.blacklisted.v1',
        {
          vendorId: id,
          reason,
        },
        {
          organizationId,
          userId: actor?.id,
        },
      ),
    );

    return updated;
  }

  async addDocument(
    vendorId: string,
    organizationId: string,
    data: {
      documentType: any;
      documentId?: string | null;
      documentNumber?: string | null;
      issuedAt?: string | null;
      expiresAt?: string | null;
      isExpiryTracked?: boolean;
    },
    actor: Actor,
  ) {
    const vendor = await this.vendorRepo.findById(vendorId, organizationId);
    if (!vendor) throw new NotFoundException('Vendor not found');

    const doc = await this.prisma.vendorDocument.create({
      data: {
        vendorId,
        documentType: data.documentType,
        documentId: data.documentId ?? null,
        documentNumber: data.documentNumber ?? null,
        issuedAt: data.issuedAt ? new Date(data.issuedAt) : null,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        isExpiryTracked: Boolean(data.isExpiryTracked),
        isVerified: true,
        verifiedAt: new Date(),
      },
    });

    this.eventsService.publish(
      createEvent(
        (DOMAIN_EVENTS as any).VENDOR_DOCUMENT_UPLOADED ?? 'vendor.document_uploaded.v1',
        {
          documentId: doc.id,
          documentType: doc.documentType,
        },
        {
          organizationId,
          userId: actor?.id,
        },
      ),
    );

    return doc;
  }

  async addRating(
    data: {
      vendorId: string;
      purchaseOrderId?: string | null;
      ratingCategory?: any;
      score: number;
      reviewComments?: string | null;
    },
    actor: Actor,
  ) {
    const rating = await this.prisma.vendorRating.create({
      data: {
        vendorId: data.vendorId,
        purchaseOrderId: data.purchaseOrderId ?? null,
        ratingCategory: data.ratingCategory ?? 'OVERALL',
        score: data.score,
        reviewComments: data.reviewComments ?? null,
        ratedById: actor?.id ?? null,
      },
    });

    return rating;
  }

  async getVendor(id: string, organizationId?: string) {
    const vendor = await this.vendorRepo.findById(id, organizationId);
    if (!vendor) throw new NotFoundException('Vendor not found');
    return vendor;
  }

  async listVendors(params: {
    organizationId: string;
    communityId?: string;
    status?: any;
    onboardingStatus?: any;
    vendorType?: any;
    search?: string;
    isPreferred?: boolean;
    skip?: number;
    take?: number;
  }) {
    return this.vendorRepo.findMany(params);
  }

  async checkEligibility(params: {
    vendorId: string;
    organizationId: string;
    communityId?: string;
    requiredCategoryKey?: string;
    requiredInventoryCategoryId?: string;
  }) {
    return this.eligibilityService.checkEligibility(params);
  }

  async getScorecard(vendorId: string, periodStart: Date, periodEnd: Date) {
    return this.performanceService.calculateVendorScorecard(vendorId, periodStart, periodEnd);
  }
}
