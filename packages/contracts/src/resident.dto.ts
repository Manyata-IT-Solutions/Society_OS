import type {
  Resident,
  Household,
  HouseholdMember,
  UnitOwnership,
  UnitTenancy,
  UnitOccupancy,
  ResidentImportJob,
  ResidentStatus,
  HouseholdStatus,
  HouseholdRelationshipType,
  HouseholdMemberStatus,
  OwnershipType,
  OwnershipStatus,
  TenancyStatus,
  OccupancyType,
  OccupancyStatus,
  ResidentImportStatus,
  Gender,
} from '@community-os/types';

export interface ResidentSummaryDto {
  id: string;
  organizationId: string;
  communityId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  status: ResidentStatus;
  hasUserLinked: boolean;
  createdAt: string;
}

export interface ResidentDetailDto {
  id: string;
  organizationId: string;
  communityId: string;
  userId: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string;
  displayName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  status: ResidentStatus;
  preferredLanguage: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  ownerships?: OwnershipResponseDto[];
  householdMemberships?: HouseholdMemberResponseDto[];
}

export function toResidentSummaryDto(
  resident: Resident | Record<string, unknown>,
): ResidentSummaryDto {
  const raw = resident as Record<string, unknown>;
  const firstName = raw['firstName'] as string;
  const lastName = raw['lastName'] as string;
  const displayName = (raw['displayName'] as string) || `${firstName} ${lastName}`.trim();

  return {
    id: raw['id'] as string,
    organizationId: raw['organizationId'] as string,
    communityId: raw['communityId'] as string,
    displayName,
    firstName,
    lastName,
    status: raw['status'] as ResidentStatus,
    hasUserLinked: Boolean(raw['userId']),
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
  };
}

export function toResidentDetailDto(
  resident: Resident | Record<string, unknown>,
  includePrivateContact = true,
): ResidentDetailDto {
  const raw = resident as Record<string, unknown>;
  const firstName = raw['firstName'] as string;
  const lastName = raw['lastName'] as string;
  const displayName = (raw['displayName'] as string) || `${firstName} ${lastName}`.trim();

  let phone: string | null = (raw['phone'] as string) || null;
  let email: string | null = (raw['email'] as string) || null;
  let dateOfBirth: string | null = raw['dateOfBirth']
    ? raw['dateOfBirth'] instanceof Date
      ? raw['dateOfBirth'].toISOString().slice(0, 10)
      : String(raw['dateOfBirth']).slice(0, 10)
    : null;

  if (!includePrivateContact) {
    phone = phone ? `${phone.slice(0, 3)}****${phone.slice(-3)}` : null;
    email = email ? `${email.slice(0, 2)}***@***${email.slice(email.indexOf('.'))}` : null;
    dateOfBirth = null;
  }

  return {
    id: raw['id'] as string,
    organizationId: raw['organizationId'] as string,
    communityId: raw['communityId'] as string,
    userId: (raw['userId'] as string) || null,
    firstName,
    middleName: (raw['middleName'] as string) || null,
    lastName,
    displayName,
    phone,
    email,
    dateOfBirth,
    gender: (raw['gender'] as Gender) || null,
    status: raw['status'] as ResidentStatus,
    preferredLanguage: (raw['preferredLanguage'] as string) || 'en',
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
    ownerships: Array.isArray(raw['ownerships'])
      ? raw['ownerships'].map((o) => toOwnershipResponseDto(o))
      : undefined,
    householdMemberships: Array.isArray(raw['householdMembers'])
      ? raw['householdMembers'].map((m) => toHouseholdMemberResponseDto(m))
      : undefined,
  };
}

// --- HOUSEHOLD DTOs ---
export interface HouseholdMemberResponseDto {
  id: string;
  householdId: string;
  residentId: string;
  relationshipType: HouseholdRelationshipType;
  isPrimaryContact: boolean;
  status: HouseholdMemberStatus;
  joinedAt: string;
  leftAt: string | null;
  resident?: ResidentSummaryDto | null;
}

export function toHouseholdMemberResponseDto(
  member: HouseholdMember | Record<string, unknown>,
): HouseholdMemberResponseDto {
  const raw = member as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    householdId: raw['householdId'] as string,
    residentId: raw['residentId'] as string,
    relationshipType: raw['relationshipType'] as HouseholdRelationshipType,
    isPrimaryContact: Boolean(raw['isPrimaryContact']),
    status: raw['status'] as HouseholdMemberStatus,
    joinedAt:
      raw['joinedAt'] instanceof Date
        ? raw['joinedAt'].toISOString().slice(0, 10)
        : String(raw['joinedAt']).slice(0, 10),
    leftAt: raw['leftAt']
      ? raw['leftAt'] instanceof Date
        ? raw['leftAt'].toISOString().slice(0, 10)
        : String(raw['leftAt']).slice(0, 10)
      : null,
    resident: raw['resident']
      ? toResidentSummaryDto(raw['resident'] as Record<string, unknown>)
      : null,
  };
}

export interface HouseholdResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  unitId: string;
  name: string | null;
  status: HouseholdStatus;
  primaryContactResidentId: string | null;
  startDate: string;
  endDate: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  members?: HouseholdMemberResponseDto[];
  primaryContact?: ResidentSummaryDto | null;
  unit?: {
    id: string;
    unitNumber: string;
    displayName: string;
    building?: { id: string; name: string; code: string } | null;
  } | null;
}

export function toHouseholdResponseDto(
  household: Household | Record<string, unknown>,
): HouseholdResponseDto {
  const raw = household as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    organizationId: raw['organizationId'] as string,
    communityId: raw['communityId'] as string,
    unitId: raw['unitId'] as string,
    name: (raw['name'] as string) || null,
    status: raw['status'] as HouseholdStatus,
    primaryContactResidentId: (raw['primaryContactResidentId'] as string) || null,
    startDate:
      raw['startDate'] instanceof Date
        ? raw['startDate'].toISOString().slice(0, 10)
        : String(raw['startDate']).slice(0, 10),
    endDate: raw['endDate']
      ? raw['endDate'] instanceof Date
        ? raw['endDate'].toISOString().slice(0, 10)
        : String(raw['endDate']).slice(0, 10)
      : null,
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
    members: Array.isArray(raw['members'])
      ? raw['members'].map((m) => toHouseholdMemberResponseDto(m))
      : undefined,
    primaryContact: raw['primaryContact']
      ? toResidentSummaryDto(raw['primaryContact'] as Record<string, unknown>)
      : null,
    unit: (raw['unit'] as HouseholdResponseDto['unit']) || null,
  };
}

// --- OWNERSHIP DTOs ---
export interface OwnershipResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  unitId: string;
  residentId: string;
  ownershipShare: number | null;
  ownershipType: OwnershipType;
  isPrimaryOwner: boolean;
  startDate: string;
  endDate: string | null;
  status: OwnershipStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  resident?: ResidentSummaryDto | null;
  unit?: {
    id: string;
    unitNumber: string;
    displayName: string;
  } | null;
}

export function toOwnershipResponseDto(
  ownership: UnitOwnership | Record<string, unknown>,
): OwnershipResponseDto {
  const raw = ownership as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    organizationId: raw['organizationId'] as string,
    communityId: raw['communityId'] as string,
    unitId: raw['unitId'] as string,
    residentId: raw['residentId'] as string,
    ownershipShare:
      raw['ownershipShare'] !== null && raw['ownershipShare'] !== undefined
        ? Number(raw['ownershipShare'])
        : null,
    ownershipType: raw['ownershipType'] as OwnershipType,
    isPrimaryOwner: Boolean(raw['isPrimaryOwner']),
    startDate:
      raw['startDate'] instanceof Date
        ? raw['startDate'].toISOString().slice(0, 10)
        : String(raw['startDate']).slice(0, 10),
    endDate: raw['endDate']
      ? raw['endDate'] instanceof Date
        ? raw['endDate'].toISOString().slice(0, 10)
        : String(raw['endDate']).slice(0, 10)
      : null,
    status: raw['status'] as OwnershipStatus,
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
    resident: raw['resident']
      ? toResidentSummaryDto(raw['resident'] as Record<string, unknown>)
      : null,
    unit: (raw['unit'] as OwnershipResponseDto['unit']) || null,
  };
}

// --- TENANCY DTOs ---
export interface TenancyResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  unitId: string;
  householdId: string;
  startDate: string;
  endDate: string | null;
  status: TenancyStatus;
  agreementReference: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  household?: HouseholdResponseDto | null;
}

export function toTenancyResponseDto(
  tenancy: UnitTenancy | Record<string, unknown>,
): TenancyResponseDto {
  const raw = tenancy as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    organizationId: raw['organizationId'] as string,
    communityId: raw['communityId'] as string,
    unitId: raw['unitId'] as string,
    householdId: raw['householdId'] as string,
    startDate:
      raw['startDate'] instanceof Date
        ? raw['startDate'].toISOString().slice(0, 10)
        : String(raw['startDate']).slice(0, 10),
    endDate: raw['endDate']
      ? raw['endDate'] instanceof Date
        ? raw['endDate'].toISOString().slice(0, 10)
        : String(raw['endDate']).slice(0, 10)
      : null,
    status: raw['status'] as TenancyStatus,
    agreementReference: (raw['agreementReference'] as string) || null,
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
    household: raw['household']
      ? toHouseholdResponseDto(raw['household'] as Record<string, unknown>)
      : null,
  };
}

// --- OCCUPANCY DTOs ---
export interface OccupancyResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  unitId: string;
  householdId: string;
  occupancyType: OccupancyType;
  startDate: string;
  endDate: string | null;
  status: OccupancyStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  household?: HouseholdResponseDto | null;
}

export function toOccupancyResponseDto(
  occupancy: UnitOccupancy | Record<string, unknown>,
): OccupancyResponseDto {
  const raw = occupancy as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    organizationId: raw['organizationId'] as string,
    communityId: raw['communityId'] as string,
    unitId: raw['unitId'] as string,
    householdId: raw['householdId'] as string,
    occupancyType: raw['occupancyType'] as OccupancyType,
    startDate:
      raw['startDate'] instanceof Date
        ? raw['startDate'].toISOString().slice(0, 10)
        : String(raw['startDate']).slice(0, 10),
    endDate: raw['endDate']
      ? raw['endDate'] instanceof Date
        ? raw['endDate'].toISOString().slice(0, 10)
        : String(raw['endDate']).slice(0, 10)
      : null,
    status: raw['status'] as OccupancyStatus,
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
    household: raw['household']
      ? toHouseholdResponseDto(raw['household'] as Record<string, unknown>)
      : null,
  };
}

// --- MOVE-IN / COMPOSITE RESIDENTIAL STATE DTOs ---
export interface MoveInResultDto {
  household: HouseholdResponseDto;
  occupancy: OccupancyResponseDto;
  tenancy?: TenancyResponseDto | null;
  ownership?: OwnershipResponseDto | null;
  primaryResident: ResidentSummaryDto;
  members: HouseholdMemberResponseDto[];
}

export interface UnitResidentialStateDto {
  unitId: string;
  unitNumber: string;
  displayName: string;
  isOccupied: boolean;
  currentOccupancy: OccupancyResponseDto | null;
  currentHousehold: HouseholdResponseDto | null;
  currentOwners: OwnershipResponseDto[];
  currentTenancy: TenancyResponseDto | null;
  occupancyHistory: OccupancyResponseDto[];
  ownershipHistory: OwnershipResponseDto[];
  tenancyHistory: TenancyResponseDto[];
}

// --- RESIDENT IMPORT DTOs ---
export interface ResidentImportValidationResultDto {
  isValid: boolean;
  totalRows: number;
  validRowsCount: number;
  errorRowsCount: number;
  errors: Array<{
    rowNumber: number;
    field: string;
    message: string;
    value?: unknown;
  }>;
  previewRows: Array<Record<string, unknown>>;
}

export interface ResidentImportJobResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  status: ResidentImportStatus;
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors: Record<string, unknown>[];
  sourceFileName: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function toResidentImportJobResponseDto(
  job: ResidentImportJob | Record<string, unknown>,
): ResidentImportJobResponseDto {
  const raw = job as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    organizationId: raw['organizationId'] as string,
    communityId: raw['communityId'] as string,
    status: raw['status'] as ResidentImportStatus,
    totalRows: raw['totalRows'] as number,
    successRows: (raw['successRows'] as number) || 0,
    failedRows: (raw['failedRows'] as number) || 0,
    errors: (raw['errors'] as Record<string, unknown>[]) || [],
    sourceFileName: (raw['sourceFileName'] as string) || null,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    completedAt: raw['completedAt']
      ? raw['completedAt'] instanceof Date
        ? raw['completedAt'].toISOString()
        : String(raw['completedAt'])
      : null,
  };
}
