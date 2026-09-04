import type { EntityStatus } from './domain.js';

export type BuildingType =
  'TOWER' | 'BLOCK' | 'WING' | 'BUILDING' | 'VILLA_CLUSTER' | 'ROW_HOUSE_BLOCK' | 'OTHER';

export type BuildingStatus = 'PLANNED' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type FloorStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type UnitType =
  'APARTMENT' | 'VILLA' | 'PENTHOUSE' | 'STUDIO' | 'DUPLEX' | 'ROW_HOUSE' | 'OTHER';

export type UnitStatus =
  'PLANNED' | 'UNDER_CONSTRUCTION' | 'READY' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type AreaUnit = 'SQFT' | 'SQM';

export type PropertyImportStatus =
  'PENDING' | 'VALIDATING' | 'READY' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Portfolio {
  id: string;
  organizationId: string;
  name: string;
  code: string;
  slug: string;
  description?: string | null;
  status: EntityStatus;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CommunitySection {
  id: string;
  organizationId: string;
  communityId: string;
  name: string;
  code: string;
  slug: string;
  description?: string | null;
  status: EntityStatus;
  sortOrder: number;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Building {
  id: string;
  organizationId: string;
  communityId: string;
  sectionId?: string | null;
  name: string;
  code: string;
  buildingType: BuildingType;
  status: BuildingStatus;
  numberOfFloors?: number | null;
  sortOrder: number;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Floor {
  id: string;
  organizationId: string;
  communityId: string;
  buildingId: string;
  label: string;
  levelNumber?: number | null;
  sortOrder: number;
  status: FloorStatus;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Unit {
  id: string;
  organizationId: string;
  communityId: string;
  sectionId?: string | null;
  buildingId?: string | null;
  floorId?: string | null;
  unitNumber: string;
  displayName: string;
  unitType: UnitType;
  status: UnitStatus;
  carpetArea?: number | string | null;
  builtUpArea?: number | string | null;
  superBuiltUpArea?: number | string | null;
  areaUnit: AreaUnit;
  bedroomCount?: number | null;
  bathroomCount?: number | null;
  version: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PropertyImportJob {
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
  sourceFileName?: string | null;
  createdBy?: string | null;
  createdAt: Date | string;
  completedAt?: Date | string | null;
}

export interface PropertyTreeNode {
  id: string;
  type: 'COMMUNITY' | 'SECTION' | 'BUILDING' | 'FLOOR' | 'UNIT';
  name: string;
  code?: string;
  status: string;
  parentId?: string | null;
  childrenCount?: {
    sections?: number;
    buildings?: number;
    floors?: number;
    units?: number;
  };
  children?: PropertyTreeNode[];
}
