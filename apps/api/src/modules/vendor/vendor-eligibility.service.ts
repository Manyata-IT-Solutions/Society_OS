import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';

export interface VendorEligibilityResult {
  isEligible: boolean;
  reasons: string[];
  vendorId: string;
  vendorName: string;
  status: string;
  onboardingStatus: string;
  hasExpiredDocuments: boolean;
}

@Injectable()
export class VendorEligibilityService {
  constructor(private readonly prisma: PrismaService) {}

  async checkEligibility(params: {
    vendorId: string;
    organizationId: string;
    communityId?: string;
    requiredCategoryKey?: string;
    requiredInventoryCategoryId?: string;
  }): Promise<VendorEligibilityResult> {
    const {
      vendorId,
      organizationId,
      communityId,
      requiredCategoryKey,
      requiredInventoryCategoryId,
    } = params;

    const vendor = await this.prisma.vendor.findFirst({
      where: { id: vendorId, organizationId },
      include: {
        documents: true,
        communityLinks: true,
        capabilities: true,
      },
    });

    if (!vendor) {
      return {
        isEligible: false,
        reasons: ['Vendor not found in organization'],
        vendorId,
        vendorName: 'Unknown',
        status: 'INACTIVE',
        onboardingStatus: 'DRAFT',
        hasExpiredDocuments: false,
      };
    }

    const reasons: string[] = [];
    const now = new Date();

    if (vendor.status !== 'ACTIVE') {
      reasons.push(`Vendor status is ${vendor.status} (must be ACTIVE)`);
    }

    if (vendor.onboardingStatus !== 'APPROVED') {
      reasons.push(`Vendor onboarding is ${vendor.onboardingStatus} (must be APPROVED)`);
    }

    // Check community link
    if (communityId && vendor.communityLinks.length > 0) {
      const isLinked = vendor.communityLinks.some(
        (l) => l.communityId === communityId && l.status === 'ACTIVE',
      );
      if (!isLinked) {
        reasons.push('Vendor is restricted from servicing this community');
      }
    }

    // Check expired documents
    const expiredDocs = vendor.documents.filter(
      (d) => d.isExpiryTracked && d.expiresAt && new Date(d.expiresAt) < now,
    );
    const hasExpiredDocuments = expiredDocs.length > 0;
    if (hasExpiredDocuments) {
      reasons.push(`Vendor has ${expiredDocs.length} expired statutory compliance document(s)`);
    }

    // Check capability match if requested
    if (requiredInventoryCategoryId) {
      const hasCap = vendor.capabilities.some(
        (c) => c.inventoryCategoryId === requiredInventoryCategoryId,
      );
      if (!hasCap && vendor.capabilities.length > 0) {
        reasons.push('Vendor does not list capability for this inventory category');
      }
    }

    if (requiredCategoryKey) {
      const hasCap = vendor.capabilities.some((c) => c.serviceCategoryKey === requiredCategoryKey);
      if (!hasCap && vendor.capabilities.length > 0) {
        reasons.push('Vendor does not list capability for this service category');
      }
    }

    return {
      isEligible: reasons.length === 0,
      reasons,
      vendorId: vendor.id,
      vendorName: vendor.displayName,
      status: vendor.status,
      onboardingStatus: vendor.onboardingStatus,
      hasExpiredDocuments,
    };
  }
}
