import type {
  Portfolio,
  CommunitySection,
  Building,
  Floor,
  Unit,
  PropertyImportJob,
  PropertyTreeNode,
  BuildingType,
  BuildingStatus,
  FloorStatus,
  UnitType,
  UnitStatus,
  AreaUnit,
  PropertyImportStatus,
  EntityStatus,
} from '@community-os/types';

export interface PortfolioResponseDto {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  slug: string;
  description: string | null;
  status: EntityStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export function toPortfolioResponseDto(
  portfolio: Portfolio | Record<string, unknown>,
): PortfolioResponseDto {
  const raw = portfolio as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    organizationId: raw['organizationId'] as string,
    name: raw['name'] as string,
    code: raw['code'] as string,
    slug: raw['slug'] as string,
    description: (raw['description'] as string) ?? null,
    status: raw['status'] as EntityStatus,
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
  };
}

export interface SectionResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  name: string;
  code: string;
  slug: string;
  description: string | null;
  status: EntityStatus;
  sortOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export function toSectionResponseDto(
  section: CommunitySection | Record<string, unknown>,
): SectionResponseDto {
  const raw = section as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    organizationId: raw['organizationId'] as string,
    communityId: raw['communityId'] as string,
    name: raw['name'] as string,
    code: raw['code'] as string,
    slug: raw['slug'] as string,
    description: (raw['description'] as string) ?? null,
    status: raw['status'] as EntityStatus,
    sortOrder: (raw['sortOrder'] as number) ?? 0,
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
  };
}

export interface BuildingResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  sectionId: string | null;
  name: string;
  code: string;
  buildingType: BuildingType;
  status: BuildingStatus;
  numberOfFloors: number | null;
  sortOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  section?: SectionResponseDto | null;
  floorsCount?: number;
  unitsCount?: number;
}

export function toBuildingResponseDto(
  building: Building | Record<string, unknown>,
): BuildingResponseDto {
  const raw = building as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    organizationId: raw['organizationId'] as string,
    communityId: raw['communityId'] as string,
    sectionId: (raw['sectionId'] as string) ?? null,
    name: raw['name'] as string,
    code: raw['code'] as string,
    buildingType: raw['buildingType'] as BuildingType,
    status: raw['status'] as BuildingStatus,
    numberOfFloors: (raw['numberOfFloors'] as number) ?? null,
    sortOrder: (raw['sortOrder'] as number) ?? 0,
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
    section: raw['section']
      ? toSectionResponseDto(raw['section'] as Record<string, unknown>)
      : null,
    floorsCount: (raw['_count'] as Record<string, number>)?.floors ?? undefined,
    unitsCount: (raw['_count'] as Record<string, number>)?.units ?? undefined,
  };
}

export interface FloorResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  buildingId: string;
  label: string;
  levelNumber: number | null;
  sortOrder: number;
  status: FloorStatus;
  version: number;
  createdAt: string;
  updatedAt: string;
  unitsCount?: number;
}

export function toFloorResponseDto(floor: Floor | Record<string, unknown>): FloorResponseDto {
  const raw = floor as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    organizationId: raw['organizationId'] as string,
    communityId: raw['communityId'] as string,
    buildingId: raw['buildingId'] as string,
    label: raw['label'] as string,
    levelNumber: (raw['levelNumber'] as number) ?? null,
    sortOrder: (raw['sortOrder'] as number) ?? 0,
    status: raw['status'] as FloorStatus,
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
    unitsCount: (raw['_count'] as Record<string, number>)?.units ?? undefined,
  };
}

export interface UnitResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  sectionId: string | null;
  buildingId: string | null;
  floorId: string | null;
  unitNumber: string;
  displayName: string;
  unitType: UnitType;
  status: UnitStatus;
  carpetArea: number | null;
  builtUpArea: number | null;
  superBuiltUpArea: number | null;
  areaUnit: AreaUnit;
  bedroomCount: number | null;
  bathroomCount: number | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  path?: string;
  building?: { id: string; name: string; code: string } | null;
  floor?: { id: string; label: string } | null;
  section?: { id: string; name: string; code: string } | null;
}

export function toUnitResponseDto(
  unit: Unit | Record<string, unknown>,
  calculatedPath?: string,
): UnitResponseDto {
  const raw = unit as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    organizationId: raw['organizationId'] as string,
    communityId: raw['communityId'] as string,
    sectionId: (raw['sectionId'] as string) ?? null,
    buildingId: (raw['buildingId'] as string) ?? null,
    floorId: (raw['floorId'] as string) ?? null,
    unitNumber: raw['unitNumber'] as string,
    displayName: (raw['displayName'] as string) || (raw['unitNumber'] as string),
    unitType: raw['unitType'] as UnitType,
    status: raw['status'] as UnitStatus,
    carpetArea: raw['carpetArea'] != null ? Number(raw['carpetArea']) : null,
    builtUpArea: raw['builtUpArea'] != null ? Number(raw['builtUpArea']) : null,
    superBuiltUpArea: raw['superBuiltUpArea'] != null ? Number(raw['superBuiltUpArea']) : null,
    areaUnit: (raw['areaUnit'] as AreaUnit) || 'SQFT',
    bedroomCount: (raw['bedroomCount'] as number) ?? null,
    bathroomCount: (raw['bathroomCount'] as number) ?? null,
    version: raw['version'] as number,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    updatedAt:
      raw['updatedAt'] instanceof Date ? raw['updatedAt'].toISOString() : String(raw['updatedAt']),
    path: calculatedPath,
    building: raw['building'] as { id: string; name: string; code: string } | null,
    floor: raw['floor'] as { id: string; label: string } | null,
    section: raw['section'] as { id: string; name: string; code: string } | null,
  };
}

export interface BulkCreateUnitsResultDto {
  totalGenerated: number;
  createdUnits: UnitResponseDto[];
}

export interface PropertyImportValidationResultDto {
  isValid: boolean;
  totalRows: number;
  validRowsCount: number;
  errorRowsCount: number;
  errors: Array<{
    rowNumber: number;
    field?: string;
    message: string;
    data?: Record<string, unknown>;
  }>;
  previewRows: Array<Record<string, unknown>>;
}

export interface PropertyImportJobResponseDto {
  id: string;
  organizationId: string;
  communityId: string;
  status: PropertyImportStatus;
  totalRows: number;
  successRows: number;
  failedRows: number;
  errors: Array<{
    rowNumber: number;
    field?: string;
    message: string;
    data?: Record<string, unknown>;
  }>;
  sourceFileName: string | null;
  createdBy: string | null;
  createdAt: string;
  completedAt: string | null;
}

export function toImportJobResponseDto(
  job: PropertyImportJob | Record<string, unknown>,
): PropertyImportJobResponseDto {
  const raw = job as Record<string, unknown>;
  return {
    id: raw['id'] as string,
    organizationId: raw['organizationId'] as string,
    communityId: raw['communityId'] as string,
    status: raw['status'] as PropertyImportStatus,
    totalRows: (raw['totalRows'] as number) ?? 0,
    successRows: (raw['successRows'] as number) ?? 0,
    failedRows: (raw['failedRows'] as number) ?? 0,
    errors: (raw['errors'] as Array<{ rowNumber: number; message: string }>) || [],
    sourceFileName: (raw['sourceFileName'] as string) ?? null,
    createdBy: (raw['createdBy'] as string) ?? null,
    createdAt:
      raw['createdAt'] instanceof Date ? raw['createdAt'].toISOString() : String(raw['createdAt']),
    completedAt: raw['completedAt']
      ? raw['completedAt'] instanceof Date
        ? raw['completedAt'].toISOString()
        : String(raw['completedAt'])
      : null,
  };
}

export interface PropertyTreeResponseDto {
  root: PropertyTreeNode;
}
