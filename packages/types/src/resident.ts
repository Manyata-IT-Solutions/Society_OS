export type ResidentStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export type HouseholdStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type HouseholdRelationshipType =
  'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'SIBLING' | 'RELATIVE' | 'DOMESTIC_STAFF' | 'OTHER';

export type HouseholdMemberStatus = 'ACTIVE' | 'INACTIVE' | 'LEFT';

export type OwnershipType = 'SOLE' | 'JOINT' | 'CORPORATE' | 'DEVELOPER' | 'TRUST' | 'OTHER';

export type OwnershipStatus = 'ACTIVE' | 'TRANSFERRED' | 'ENDED' | 'CANCELLED';

export type TenancyStatus = 'PLANNED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';

export type OccupancyType = 'OWNER_OCCUPIED' | 'TENANT_OCCUPIED' | 'FAMILY_OCCUPIED' | 'OTHER';

export type OccupancyStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'CANCELLED';

export type ResidentImportStatus =
  'PENDING' | 'VALIDATING' | 'READY' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Resident {
  id: string;
  organizationId: string;
  communityId: string;
  userId?: string | null;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  displayName?: string | null;
  phone?: string | null;
  email?: string | null;
  dateOfBirth?: Date | string | null;
  gender?: Gender | null;
  status: ResidentStatus;
  preferredLanguage?: string | null;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Household {
  id: string;
  organizationId: string;
  communityId: string;
  unitId: string;
  name?: string | null;
  status: HouseholdStatus;
  primaryContactResidentId?: string | null;
  startDate: Date | string;
  endDate?: Date | string | null;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  members?: HouseholdMember[];
  unit?: {
    id: string;
    unitNumber: string;
    displayName: string;
    building?: { id: string; name: string; code: string } | null;
  } | null;
  primaryContact?: Resident | null;
}

export interface HouseholdMember {
  id: string;
  organizationId: string;
  communityId: string;
  householdId: string;
  residentId: string;
  relationshipType: HouseholdRelationshipType;
  isPrimaryContact: boolean;
  status: HouseholdMemberStatus;
  joinedAt: Date | string;
  leftAt?: Date | string | null;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  resident?: Resident;
}

export interface UnitOwnership {
  id: string;
  organizationId: string;
  communityId: string;
  unitId: string;
  residentId: string;
  ownershipShare?: number | null;
  ownershipType: OwnershipType;
  isPrimaryOwner: boolean;
  startDate: Date | string;
  endDate?: Date | string | null;
  status: OwnershipStatus;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  resident?: Resident;
  unit?: {
    id: string;
    unitNumber: string;
    displayName: string;
  };
}

export interface UnitTenancy {
  id: string;
  organizationId: string;
  communityId: string;
  unitId: string;
  householdId: string;
  startDate: Date | string;
  endDate?: Date | string | null;
  status: TenancyStatus;
  agreementReference?: string | null;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  household?: Household;
}

export interface UnitOccupancy {
  id: string;
  organizationId: string;
  communityId: string;
  unitId: string;
  householdId: string;
  occupancyType: OccupancyType;
  startDate: Date | string;
  endDate?: Date | string | null;
  status: OccupancyStatus;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  household?: Household;
}

export interface ResidentImportJob {
  id: string;
  organizationId: string;
  communityId: string;
  status: ResidentImportStatus;
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors: Record<string, unknown>[];
  sourceFileName?: string | null;
  createdBy?: string | null;
  createdAt: Date | string;
  completedAt?: Date | string | null;
}
