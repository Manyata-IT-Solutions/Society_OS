import type {
  OrganizationResponseDto,
  CommunityResponseDto,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  ChangeOrganizationStatusDto,
  CreateCommunityDto,
  UpdateCommunityDto,
  ChangeCommunityStatusDto,
  LoginRequestDto,
  LoginResponseDto,
  RefreshTokenResponseDto,
  UserResponseDto,
  CreateUserDto,
  UpdateUserDto,
  ChangeUserStatusDto,
  MembershipResponseDto,
  CreateMembershipDto,
  ChangeMembershipStatusDto,
  RoleResponseDto,
  CreateRoleDto,
  UpdateRoleDto,
  RoleAssignmentResponseDto,
  CreateRoleAssignmentDto,
  SessionResponseDto,
  PermissionResponseDto,
} from '@community-os/contracts';
import type { ApiResponse, ApiErrorResponse } from '@community-os/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Array<{ field?: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// Token Storage
export const tokenStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('community_os_access_token');
  },
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('community_os_refresh_token');
  },
  setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('community_os_access_token', accessToken);
    localStorage.setItem('community_os_refresh_token', refreshToken);
  },
  clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('community_os_access_token');
    localStorage.removeItem('community_os_refresh_token');
  },
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      handleAutoLogout();
      return null;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        handleAutoLogout();
        return null;
      }
      const data = body.data !== undefined ? body.data : body;
      const accessToken = data.accessToken || data.tokens?.accessToken;
      const newRefreshToken = data.refreshToken || data.tokens?.refreshToken;
      if (accessToken && newRefreshToken) {
        tokenStorage.setTokens(accessToken, newRefreshToken);
        return accessToken;
      } else if (accessToken) {
        localStorage.setItem('community_os_access_token', accessToken);
        return accessToken;
      }
      handleAutoLogout();
      return null;
    } catch {
      handleAutoLogout();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function handleAutoLogout(): void {
  tokenStorage.clearTokens();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
    window.location.href = '/login?expired=1';
  }
}

async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  let token = tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  let res = await fetch(url, {
    ...init,
    headers,
  });

  // Intercept 401 Token Expired (unless calling auth endpoints directly)
  if (res.status === 401 && !url.includes('/auth/')) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, {
        ...init,
        headers,
      });
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new ApiClientError(
      errorBody.error?.code || errorBody.code || 'API_ERROR',
      errorBody.error?.message || errorBody.message || res.statusText || 'API request failed',
      errorBody.error?.details || errorBody.details,
    );
  }
  const json = await res.json().catch(() => ({}));
  return json.data !== undefined ? json.data : json;
}

async function fetchEnvelope<T>(url: string, init: RequestInit = {}): Promise<T> {
  let token = tokenStorage.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  let res = await fetch(url, {
    cache: 'no-store',
    ...init,
    headers,
  });

  // Intercept 401 Token Expired (unless calling auth endpoints directly)
  if (res.status === 401 && !url.includes('/auth/')) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, {
        cache: 'no-store',
        ...init,
        headers,
      });
    }
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiClientError(
      body.error?.code || body.code || 'API_ERROR',
      body.error?.message || body.message || res.statusText || 'API request failed',
      body.error?.details || body.details,
    );
  }
  return body as T;
}

export const apiClient = {
  auth: {
    async login(input: LoginRequestDto): Promise<LoginResponseDto> {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new ApiClientError(
          body.error?.code || body.code || 'ERROR',
          body.error?.message || body.message || 'Login failed',
          body.error?.details || body.details,
        );
      }
      const data: LoginResponseDto = body.data !== undefined ? body.data : body;
      const accessToken = data.tokens?.accessToken || (data as any).accessToken;
      const refreshToken = data.tokens?.refreshToken || (data as any).refreshToken;
      if (accessToken && refreshToken) {
        tokenStorage.setTokens(accessToken, refreshToken);
      }
      return data;
    },
    async refresh(): Promise<RefreshTokenResponseDto> {
      const refreshToken = tokenStorage.getRefreshToken();
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new ApiClientError(
          body.error?.code || body.code || 'ERROR',
          body.error?.message || body.message || 'Token refresh failed',
          body.error?.details || body.details,
        );
      }
      const data: RefreshTokenResponseDto = body.data !== undefined ? body.data : body;
      const accessToken = data.accessToken || (data as any).tokens?.accessToken;
      const newRefreshToken = data.refreshToken || (data as any).tokens?.refreshToken;
      if (accessToken && newRefreshToken) {
        tokenStorage.setTokens(accessToken, newRefreshToken);
      }
      return data;
    },
    async logout(): Promise<void> {
      try {
        const refreshToken = tokenStorage.getRefreshToken();
        if (refreshToken) {
          await fetch(`${API_BASE}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tokenStorage.getAccessToken()}`,
            },
            body: JSON.stringify({ refreshToken }),
          });
        }
      } finally {
        tokenStorage.clearTokens();
      }
    },
    async getMe(): Promise<{ user: UserResponseDto; isPlatformAdmin?: boolean }> {
      return fetchJson<{ user: UserResponseDto; isPlatformAdmin?: boolean }>(`${API_BASE}/auth/me`);
    },
    async getSessions(): Promise<SessionResponseDto[]> {
      return fetchJson<SessionResponseDto[]>(`${API_BASE}/auth/sessions`);
    },
    async revokeSession(id: string): Promise<void> {
      return fetchJson<void>(`${API_BASE}/auth/sessions/${id}`, { method: 'DELETE' });
    },
  },

  // Organizations
  async listOrganizations(
    params: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
    } = {},
  ): Promise<{ data: OrganizationResponseDto[]; meta?: any }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);

    return fetchEnvelope<{ data: OrganizationResponseDto[]; meta?: any }>(
      `${API_BASE}/organizations?${query.toString()}`,
    );
  },

  async getOrganization(id: string): Promise<OrganizationResponseDto> {
    return fetchJson<OrganizationResponseDto>(`${API_BASE}/organizations/${id}`);
  },

  async createOrganization(input: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    return fetchJson<OrganizationResponseDto>(`${API_BASE}/organizations`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateOrganization(
    id: string,
    input: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return fetchJson<OrganizationResponseDto>(`${API_BASE}/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async changeOrganizationStatus(
    id: string,
    input: ChangeOrganizationStatusDto,
  ): Promise<OrganizationResponseDto> {
    return fetchJson<OrganizationResponseDto>(`${API_BASE}/organizations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  // Communities
  async listCommunitiesForOrganization(
    organizationId: string,
    params: { page?: number; limit?: number; status?: string; search?: string } = {},
  ): Promise<{ data: CommunityResponseDto[]; meta?: any }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);

    return fetchEnvelope<{ data: CommunityResponseDto[]; meta?: any }>(
      `${API_BASE}/organizations/${organizationId}/communities?${query.toString()}`,
    );
  },

  async getCommunity(id: string): Promise<CommunityResponseDto> {
    return fetchJson<CommunityResponseDto>(`${API_BASE}/communities/${id}`);
  },

  async createCommunity(
    organizationId: string,
    input: CreateCommunityDto,
  ): Promise<CommunityResponseDto> {
    return fetchJson<CommunityResponseDto>(
      `${API_BASE}/organizations/${organizationId}/communities`,
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
    );
  },

  async updateCommunity(id: string, input: UpdateCommunityDto): Promise<CommunityResponseDto> {
    return fetchJson<CommunityResponseDto>(`${API_BASE}/communities/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async changeCommunityStatus(
    id: string,
    input: ChangeCommunityStatusDto,
  ): Promise<CommunityResponseDto> {
    return fetchJson<CommunityResponseDto>(`${API_BASE}/communities/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  // IAM: Users
  iam: {
    async listUsers(
      params: { page?: number; limit?: number; status?: string; search?: string } = {},
    ): Promise<{ data: UserResponseDto[]; meta?: any }> {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.status) query.set('status', params.status);
      if (params.search) query.set('search', params.search);

      return fetchEnvelope<{ data: UserResponseDto[]; meta?: any }>(
        `${API_BASE}/users?${query.toString()}`,
      );
    },

    async getUser(id: string): Promise<UserResponseDto> {
      return fetchJson<UserResponseDto>(`${API_BASE}/users/${id}`);
    },

    async createUser(input: CreateUserDto): Promise<UserResponseDto> {
      return fetchJson<UserResponseDto>(`${API_BASE}/users`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async changeUserStatus(id: string, input: ChangeUserStatusDto): Promise<UserResponseDto> {
      return fetchJson<UserResponseDto>(`${API_BASE}/users/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },

    // Memberships
    async listMemberships(
      params: {
        page?: number;
        limit?: number;
        organizationId?: string;
        communityId?: string;
        status?: string;
      } = {},
    ): Promise<{ data: MembershipResponseDto[]; meta?: any }> {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.status) query.set('status', params.status);

      return fetchEnvelope<{ data: MembershipResponseDto[]; meta?: any }>(
        `${API_BASE}/memberships?${query.toString()}`,
      );
    },

    async createMembership(input: CreateMembershipDto): Promise<MembershipResponseDto> {
      return fetchJson<MembershipResponseDto>(`${API_BASE}/memberships`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async changeMembershipStatus(
      id: string,
      input: ChangeMembershipStatusDto,
    ): Promise<MembershipResponseDto> {
      return fetchJson<MembershipResponseDto>(`${API_BASE}/memberships/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },

    // Roles & Permissions
    async listRoles(
      params: {
        page?: number;
        limit?: number;
        isSystem?: boolean;
        scopeType?: string;
        search?: string;
      } = {},
    ): Promise<{ data: RoleResponseDto[]; meta?: any }> {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.isSystem !== undefined) query.set('isSystem', String(params.isSystem));
      if (params.scopeType) query.set('scopeType', params.scopeType);
      if (params.search) query.set('search', params.search);

      return fetchEnvelope<{ data: RoleResponseDto[]; meta?: any }>(
        `${API_BASE}/roles?${query.toString()}`,
      );
    },

    async getRole(id: string): Promise<RoleResponseDto> {
      return fetchJson<RoleResponseDto>(`${API_BASE}/roles/${id}`);
    },

    async createRole(input: CreateRoleDto): Promise<RoleResponseDto> {
      return fetchJson<RoleResponseDto>(`${API_BASE}/roles`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async listPermissions(): Promise<PermissionResponseDto[]> {
      return fetchJson<PermissionResponseDto[]>(`${API_BASE}/permissions`);
    },

    // Role Assignments
    async listRoleAssignments(
      params: {
        page?: number;
        limit?: number;
        userId?: string;
        roleId?: string;
        scopeType?: string;
        status?: string;
      } = {},
    ): Promise<{ data: RoleAssignmentResponseDto[]; meta?: any }> {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.userId) query.set('userId', params.userId);
      if (params.roleId) query.set('roleId', params.roleId);
      if (params.scopeType) query.set('scopeType', params.scopeType);
      if (params.status) query.set('status', params.status);

      return fetchEnvelope<{ data: RoleAssignmentResponseDto[]; meta?: any }>(
        `${API_BASE}/role-assignments?${query.toString()}`,
      );
    },

    async createRoleAssignment(input: CreateRoleAssignmentDto): Promise<RoleAssignmentResponseDto> {
      return fetchJson<RoleAssignmentResponseDto>(`${API_BASE}/role-assignments`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async revokeRoleAssignment(id: string): Promise<RoleAssignmentResponseDto> {
      return fetchJson<RoleAssignmentResponseDto>(`${API_BASE}/role-assignments/${id}`, {
        method: 'DELETE',
      });
    },
  },

  // Property Hierarchy Master
  property: {
    // Portfolios
    async listPortfolios(
      organizationId: string,
      params: { page?: number; limit?: number; status?: string; search?: string } = {},
    ): Promise<{ data: any[]; meta?: any }> {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.status) query.set('status', params.status);
      if (params.search) query.set('search', params.search);

      return fetchEnvelope<{ data: any[]; meta?: any }>(
        `${API_BASE}/organizations/${organizationId}/portfolios?${query.toString()}`,
      );
    },

    async createPortfolio(organizationId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/organizations/${organizationId}/portfolios`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async getPortfolio(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/portfolios/${id}`);
    },

    // Sections
    async listSections(communityId: string): Promise<{ data: any[] }> {
      return fetchEnvelope<{ data: any[] }>(
        `${API_BASE}/communities/${communityId}/sections`,
      );
    },

    async createSection(communityId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/communities/${communityId}/sections`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    // Buildings
    async listBuildings(
      communityId: string,
      params: { sectionId?: string; status?: string } = {},
    ): Promise<{ data: any[] }> {
      const query = new URLSearchParams();
      if (params.sectionId) query.set('sectionId', params.sectionId);
      if (params.status) query.set('status', params.status);

      return fetchEnvelope<{ data: any[] }>(
        `${API_BASE}/communities/${communityId}/buildings?${query.toString()}`,
      );
    },

    async getBuilding(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/buildings/${id}`);
    },

    async createBuilding(communityId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/communities/${communityId}/buildings`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    // Floors
    async listFloors(buildingId: string): Promise<{ data: any[] }> {
      return fetchEnvelope<{ data: any[] }>(
        `${API_BASE}/buildings/${buildingId}/floors`,
      );
    },

    async createFloor(buildingId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/buildings/${buildingId}/floors`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    // Units
    async listUnits(
      communityId: string,
      params: {
        page?: number;
        limit?: number;
        buildingId?: string;
        floorId?: string;
        sectionId?: string;
        unitType?: string;
        status?: string;
        search?: string;
      } = {},
    ): Promise<{ data: any[]; meta?: any }> {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.buildingId) query.set('buildingId', params.buildingId);
      if (params.floorId) query.set('floorId', params.floorId);
      if (params.sectionId) query.set('sectionId', params.sectionId);
      if (params.unitType) query.set('unitType', params.unitType);
      if (params.status) query.set('status', params.status);
      if (params.search) query.set('search', params.search);

      return fetchEnvelope<{ data: any[]; meta?: any }>(
        `${API_BASE}/communities/${communityId}/units?${query.toString()}`,
      );
    },

    async getUnit(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/units/${id}`);
    },

    async createUnit(communityId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/communities/${communityId}/units`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async bulkCreateUnits(communityId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/communities/${communityId}/units/bulk`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    // Hierarchy Tree
    async getPropertyTree(communityId: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/communities/${communityId}/property-tree`);
    },

    // CSV Import / Export
    async validateImport(communityId: string, rows: any[]): Promise<any> {
      return fetchJson<any>(`${API_BASE}/communities/${communityId}/property-import/validate`, {
        method: 'POST',
        body: JSON.stringify({ rows }),
      });
    },

    async commitImport(
      communityId: string,
      data: { rows: any[]; sourceFileName?: string },
    ): Promise<any> {
      return fetchJson<any>(`${API_BASE}/communities/${communityId}/property-import/commit`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    async exportUnitsCsvUrl(communityId: string): Promise<string> {
      return `${API_BASE}/communities/${communityId}/units/export`;
    },
  },

  residents: {
    async listResidents(
      communityId: string,
      params: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
        unitId?: string;
        hasUser?: boolean;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.status) query.set('status', params.status);
      if (params.search) query.set('search', params.search);
      if (params.unitId) query.set('unitId', params.unitId);
      if (params.hasUser !== undefined) query.set('hasUser', String(params.hasUser));

      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/communities/${communityId}/residents?${query.toString()}`,
      );
    },

    async getResident(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/residents/${id}`);
    },

    async createResident(communityId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/communities/${communityId}/residents`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async updateResident(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/residents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },

    async inviteResident(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/residents/${id}/invite`, {
        method: 'POST',
      });
    },

    async linkUser(id: string, userId: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/residents/${id}/link-user`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    },

    async archiveResident(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/residents/${id}`, {
        method: 'DELETE',
      });
    },

    // CSV Import / Export
    async validateImport(communityId: string, rows: any[]): Promise<any> {
      return fetchJson<any>(`${API_BASE}/communities/${communityId}/resident-import/validate`, {
        method: 'POST',
        body: JSON.stringify({ rows }),
      });
    },

    async commitImport(
      communityId: string,
      data: { rows: any[]; sourceFileName?: string },
    ): Promise<any> {
      return fetchJson<any>(`${API_BASE}/communities/${communityId}/resident-import/commit`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    getExportResidentsUrl(communityId: string): string {
      return `${API_BASE}/communities/${communityId}/residents/export`;
    },
  },

  occupancies: {
    async getResidentialState(unitId: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/units/${unitId}/residential-state`);
    },

    async getCurrentOccupancy(unitId: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/units/${unitId}/occupancy/current`);
    },

    async moveIn(unitId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/units/${unitId}/move-in`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async moveOut(occupancyId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/occupancies/${occupancyId}/move-out`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async createOwnership(unitId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/units/${unitId}/ownership`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async transferOwnership(unitId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/units/${unitId}/ownership/transfer`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
  },

  audit: {
    async list(params?: any): Promise<any> {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, String(val));
          }
        });
      }
      return fetchJson<any>(`${API_BASE}/audit?${query.toString()}`);
    },

    async get(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/audit/${id}`);
    },

    getExportUrl(params?: any): string {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, String(val));
          }
        });
      }
      return `${API_BASE}/audit/export?${query.toString()}`;
    },
  },

  notifications: {
    async getInbox(params?: any): Promise<any> {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, String(val));
          }
        });
      }
      return fetchJson<any>(`${API_BASE}/notifications/inbox?${query.toString()}`);
    },

    async getUnreadCount(): Promise<{ count: number }> {
      return fetchJson<{ count: number }>(`${API_BASE}/notifications/inbox/unread-count`);
    },

    async markRead(id: string): Promise<{ success: boolean }> {
      return fetchJson<{ success: boolean }>(`${API_BASE}/notifications/inbox/${id}/read`, {
        method: 'PATCH',
      });
    },

    async markAllRead(): Promise<{ count: number }> {
      return fetchJson<{ count: number }>(`${API_BASE}/notifications/inbox/mark-all-read`, {
        method: 'POST',
      });
    },

    async send(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/notifications/send`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async listDeliveries(): Promise<any> {
      return fetchJson<any>(`${API_BASE}/notifications/deliveries`);
    },

    async listTemplates(params?: { communityId?: string; organizationId?: string }): Promise<any> {
      const query = new URLSearchParams();
      if (params?.communityId) query.append('communityId', params.communityId);
      if (params?.organizationId) query.append('organizationId', params.organizationId);
      return fetchJson<any>(`${API_BASE}/notification-templates?${query.toString()}`);
    },

    async createTemplate(
      input: any,
      params?: { communityId?: string; organizationId?: string },
    ): Promise<any> {
      const query = new URLSearchParams();
      if (params?.communityId) query.append('communityId', params.communityId);
      if (params?.organizationId) query.append('organizationId', params.organizationId);
      return fetchJson<any>(`${API_BASE}/notification-templates?${query.toString()}`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async getTemplate(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/notification-templates/${id}`);
    },

    async updateTemplate(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/notification-templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },

    async getPreferences(): Promise<any> {
      return fetchJson<any>(`${API_BASE}/notification-preferences`);
    },

    async updatePreference(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/notification-preferences`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
  },

  documents: {
    async list(params?: any): Promise<any> {
      const query = new URLSearchParams();
      if (params) {
        Object.entries(params).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            query.append(key, String(val));
          }
        });
      }
      return fetchJson<any>(`${API_BASE}/documents?${query.toString()}`);
    },

    async get(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/documents/${id}`);
    },

    async create(
      organizationId: string,
      communityId: string | null | undefined,
      input: any,
    ): Promise<any> {
      const query = new URLSearchParams();
      query.append('organizationId', organizationId);
      if (communityId) query.append('communityId', communityId);

      return fetchJson<any>(`${API_BASE}/documents?${query.toString()}`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async update(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/documents/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },

    async archive(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/documents/${id}/archive`, {
        method: 'POST',
      });
    },

    async addVersion(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/documents/${id}/versions`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async linkResource(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/documents/${id}/links`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async unlinkResource(id: string, linkId: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/documents/${id}/links/${linkId}`, {
        method: 'DELETE',
      });
    },

    getDownloadUrl(id: string, versionNumber?: number): string {
      const query = versionNumber ? `?version=${versionNumber}` : '';
      return `${API_BASE}/documents/${id}/download${query}`;
    },
  },

  // Configuration (Phase 6)
  configuration: {
    async getRegistry(): Promise<{ items: any[]; total: number }> {
      return fetchJson<{ items: any[]; total: number }>(`${API_BASE}/configuration/registry`);
    },

    async getEffective(
      params: {
        organizationId?: string;
        communityId?: string;
        keys?: string;
        namespace?: string;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.keys) query.set('keys', params.keys);
      if (params.namespace) query.set('namespace', params.namespace);

      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/configuration/effective?${query.toString()}`,
      );
    },

    async getOverrides(
      params: {
        organizationId?: string;
        communityId?: string;
        scopeType?: string;
        namespace?: string;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.scopeType) query.set('scopeType', params.scopeType);
      if (params.namespace) query.set('namespace', params.namespace);

      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/configuration/overrides?${query.toString()}`,
      );
    },

    async setOverride(input: {
      key: string;
      scopeType: string;
      scopeId?: string | null;
      value: any;
      changeReason?: string;
    }): Promise<any> {
      return fetchJson<any>(`${API_BASE}/configuration/overrides`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },

    async deleteOverride(key: string, scopeType: string, scopeId?: string | null): Promise<any> {
      const query = new URLSearchParams();
      query.set('key', key);
      query.set('scopeType', scopeType);
      if (scopeId) query.set('scopeId', scopeId);

      return fetchJson<any>(`${API_BASE}/configuration/overrides?${query.toString()}`, {
        method: 'DELETE',
      });
    },

    async validate(
      key: string,
      value: any,
      scopeType: string,
    ): Promise<{ valid: boolean; validatedValue?: any; error?: string }> {
      return fetchJson<{ valid: boolean; validatedValue?: any; error?: string }>(
        `${API_BASE}/configuration/validate`,
        {
          method: 'POST',
          body: JSON.stringify({ key, value, scopeType }),
        },
      );
    },
  },

  // Feature Flags (Phase 6)
  features: {
    async getDefinitions(): Promise<{ items: any[]; total: number }> {
      return fetchJson<{ items: any[]; total: number }>(`${API_BASE}/features/definitions`);
    },

    async getEffective(
      params: {
        organizationId?: string;
        communityId?: string;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);

      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/features/effective?${query.toString()}`,
      );
    },

    async getOverrides(
      params: {
        organizationId?: string;
        communityId?: string;
        scopeType?: string;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.scopeType) query.set('scopeType', params.scopeType);

      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/features/overrides?${query.toString()}`,
      );
    },

    async setOverride(input: {
      featureKey: string;
      scopeType: string;
      scopeId?: string | null;
      enabled: boolean;
      reason?: string;
    }): Promise<any> {
      return fetchJson<any>(`${API_BASE}/features/overrides`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },

    async deleteOverride(
      featureKey: string,
      scopeType: string,
      scopeId?: string | null,
    ): Promise<any> {
      const query = new URLSearchParams();
      query.set('featureKey', featureKey);
      query.set('scopeType', scopeType);
      if (scopeId) query.set('scopeId', scopeId);

      return fetchJson<any>(`${API_BASE}/features/overrides?${query.toString()}`, {
        method: 'DELETE',
      });
    },
  },

  // Custom Fields (Phase 6)
  customFields: {
    async getDefinitions(
      params: {
        organizationId?: string;
        communityId?: string;
        entityType?: string;
        status?: string;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.entityType) query.set('entityType', params.entityType);
      if (params.status) query.set('status', params.status);

      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/custom-fields/definitions?${query.toString()}`,
      );
    },

    async createDefinition(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/custom-fields/definitions`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async updateDefinition(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/custom-fields/definitions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },

    async archiveDefinition(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/custom-fields/definitions/${id}/archive`, {
        method: 'POST',
      });
    },

    async getEntityValues(
      entityType: string,
      entityId: string,
    ): Promise<{ definitions: any[]; values: any[] }> {
      return fetchJson<{ definitions: any[]; values: any[] }>(
        `${API_BASE}/custom-fields/values/${entityType}/${entityId}`,
      );
    },

    async setEntityValues(
      entityType: string,
      entityId: string,
      input: { values: Array<{ definitionId: string; value: any }> },
    ): Promise<{ items: any[]; total: number }> {
      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/custom-fields/values/${entityType}/${entityId}`,
        {
          method: 'PUT',
          body: JSON.stringify(input),
        },
      );
    },
  },

  // Terminology (Phase 6)
  terminology: {
    async getTerminology(
      params: {
        organizationId?: string;
        communityId?: string;
      } = {},
    ): Promise<{ sectionLabel: string; buildingLabel: string; unitLabel: string }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);

      return fetchJson<{ sectionLabel: string; buildingLabel: string; unitLabel: string }>(
        `${API_BASE}/terminology?${query.toString()}`,
      );
    },
  },

  // Workflows (Phase 7)
  workflows: {
    async listDefinitions(
      params: {
        organizationId?: string;
        communityId?: string;
        entityType?: string;
        status?: string;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.entityType) query.set('entityType', params.entityType);
      if (params.status) query.set('status', params.status);
      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/workflows/definitions?${query.toString()}`,
      );
    },

    async getDefinition(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/workflows/definitions/${id}`);
    },

    async createDefinition(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/workflows/definitions`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async publishDefinition(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/workflows/definitions/${id}/publish`, {
        method: 'POST',
      });
    },

    async cloneDefinition(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/workflows/definitions/${id}/clone`, {
        method: 'POST',
      });
    },

    async listInstances(
      params: {
        organizationId?: string;
        communityId?: string;
        resourceType?: string;
        resourceId?: string;
        status?: string;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.resourceType) query.set('resourceType', params.resourceType);
      if (params.resourceId) query.set('resourceId', params.resourceId);
      if (params.status) query.set('status', params.status);
      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/workflows/instances?${query.toString()}`,
      );
    },

    async getInstance(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/workflows/instances/${id}`);
    },

    async startInstance(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/workflows/instances`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async getAllowedActions(instanceId: string): Promise<{ items: any[] }> {
      return fetchJson<{ items: any[] }>(`${API_BASE}/workflows/instances/${instanceId}/actions`);
    },

    async transitionInstance(instanceId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/workflows/instances/${instanceId}/transition`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async overrideInstance(instanceId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/workflows/instances/${instanceId}/override`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
  },

  // Rules (Phase 7)
  rules: {
    async listDefinitions(
      params: {
        organizationId?: string;
        communityId?: string;
        resourceType?: string;
        status?: string;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.resourceType) query.set('resourceType', params.resourceType);
      if (params.status) query.set('status', params.status);
      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/rules/definitions?${query.toString()}`,
      );
    },

    async getDefinition(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/rules/definitions/${id}`);
    },

    async createDefinition(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/rules/definitions`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async publishDefinition(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/rules/definitions/${id}/publish`, {
        method: 'POST',
      });
    },

    async cloneDefinition(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/rules/definitions/${id}/clone`, {
        method: 'POST',
      });
    },

    async simulateRule(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/rules/simulate`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async listFacts(resourceType?: string): Promise<{ items: any[] }> {
      const query = new URLSearchParams();
      if (resourceType) query.set('resourceType', resourceType);
      return fetchJson<{ items: any[] }>(`${API_BASE}/rules/facts?${query.toString()}`);
    },
  },

  // Approvals (Phase 7)
  approvals: {
    async listPolicies(
      params: {
        organizationId?: string;
        communityId?: string;
        status?: string;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.status) query.set('status', params.status);
      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/approvals/policies?${query.toString()}`,
      );
    },

    async getPolicy(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/approvals/policies/${id}`);
    },

    async createPolicy(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/approvals/policies`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async publishPolicy(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/approvals/policies/${id}/publish`, {
        method: 'POST',
      });
    },

    async getInbox(
      params: {
        organizationId?: string;
        communityId?: string;
        status?: string;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.status) query.set('status', params.status);
      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/approvals/inbox?${query.toString()}`,
      );
    },

    async getInstance(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/approvals/instances/${id}`);
    },

    async submitDecision(stepInstanceId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/approvals/steps/${stepInstanceId}/decisions`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
  },

  // SLA Policies & Business Calendars (Phase 7)
  sla: {
    async listPolicies(
      params: {
        organizationId?: string;
        communityId?: string;
        status?: string;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.status) query.set('status', params.status);
      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/sla/policies?${query.toString()}`,
      );
    },

    async getPolicy(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/sla/policies/${id}`);
    },

    async createPolicy(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/sla/policies`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async publishPolicy(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/sla/policies/${id}/publish`, {
        method: 'POST',
      });
    },

    async listInstances(
      params: {
        organizationId?: string;
        communityId?: string;
        resourceType?: string;
        resourceId?: string;
        workflowInstanceId?: string;
        status?: string;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.resourceType) query.set('resourceType', params.resourceType);
      if (params.resourceId) query.set('resourceId', params.resourceId);
      if (params.workflowInstanceId) query.set('workflowInstanceId', params.workflowInstanceId);
      if (params.status) query.set('status', params.status);
      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/sla/instances?${query.toString()}`,
      );
    },

    async reconcile(): Promise<any> {
      return fetchJson<any>(`${API_BASE}/sla/reconcile`, {
        method: 'POST',
      });
    },
  },

  calendars: {
    async list(
      params: {
        organizationId?: string;
        communityId?: string;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/calendars?${query.toString()}`,
      );
    },

    async get(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/calendars/${id}`);
    },

    async create(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/calendars`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async update(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/calendars/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },
  },

  helpdesk: {
    // Categories
    async listCategories(
      params: {
        organizationId?: string;
        communityId?: string;
        isActive?: boolean;
        parentId?: string | null;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
      if (params.parentId !== undefined && params.parentId !== null)
        query.set('parentId', params.parentId);
      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/helpdesk/categories?${query.toString()}`,
      );
    },

    async getCategoryTree(
      params: { organizationId?: string; communityId?: string } = {},
    ): Promise<any[]> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      return fetchJson<any[]>(`${API_BASE}/helpdesk/categories/tree?${query.toString()}`);
    },

    async getCategory(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/categories/${id}`);
    },

    async createCategory(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/categories`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async updateCategory(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },

    async deleteCategory(id: string): Promise<void> {
      return fetchJson<void>(`${API_BASE}/helpdesk/categories/${id}`, {
        method: 'DELETE',
      });
    },

    // Teams
    async listTeams(
      params: {
        organizationId?: string;
        communityId?: string;
        isActive?: boolean;
      } = {},
    ): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      if (params.organizationId) query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.isActive !== undefined) query.set('isActive', String(params.isActive));
      return fetchJson<{ items: any[]; total: number }>(
        `${API_BASE}/helpdesk/teams?${query.toString()}`,
      );
    },

    async getTeam(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/teams/${id}`);
    },

    async createTeam(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/teams`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async updateTeam(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/teams/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      });
    },

    async addTeamMember(teamId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async removeTeamMember(teamId: string, memberId: string): Promise<void> {
      return fetchJson<void>(`${API_BASE}/helpdesk/teams/${teamId}/members/${memberId}`, {
        method: 'DELETE',
      });
    },

    // Tickets
    async listTickets(
      params: Record<string, any> = {},
    ): Promise<{ items: any[]; total: number; page: number; limit: number }> {
      const query = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
      }
      return fetchJson<{ items: any[]; total: number; page: number; limit: number }>(
        `${API_BASE}/helpdesk/tickets?${query.toString()}`,
      );
    },

    async getTicket(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/tickets/${id}`);
    },

    async createTicket(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/tickets`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async assignTicket(
      id: string,
      input: { teamId?: string | null; userId?: string | null; reason?: string },
    ): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/tickets/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async claimTicket(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/tickets/${id}/claim`, {
        method: 'POST',
      });
    },

    async changePriority(id: string, input: { priority: string; reason?: string }): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/tickets/${id}/priority`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async transitionTicket(
      id: string,
      input: { action: string; reason?: string; comment?: string },
    ): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/tickets/${id}/transition`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async resolveTicket(
      id: string,
      input: { resolutionSummary: string; resolutionCode?: string },
    ): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/tickets/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async closeTicket(id: string, input: { reason?: string } = {}): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/tickets/${id}/close`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async reopenTicket(id: string, input: { reason: string }): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/tickets/${id}/reopen`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async cancelTicket(id: string, input: { reason: string }): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/tickets/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async getComments(id: string): Promise<any[]> {
      return fetchJson<any[]>(`${API_BASE}/helpdesk/tickets/${id}/comments`);
    },

    async addComment(
      id: string,
      input: { type: 'PUBLIC_REPLY' | 'INTERNAL_NOTE'; body: string },
    ): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async getTimeline(id: string): Promise<any[]> {
      return fetchJson<any[]>(`${API_BASE}/helpdesk/tickets/${id}/timeline`);
    },

    async linkRelation(
      id: string,
      input: { targetTicketId: string; relationType: string },
    ): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/tickets/${id}/relations`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async overrideSla(id: string, input: { newDueAt: string; reason: string }): Promise<any> {
      return fetchJson<any>(`${API_BASE}/helpdesk/tickets/${id}/sla-override`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async getKpiMetrics(organizationId: string, communityId?: string): Promise<any> {
      const query = new URLSearchParams({ organizationId });
      if (communityId) query.set('communityId', communityId);
      return fetchJson<any>(`${API_BASE}/helpdesk/analytics/kpi?${query.toString()}`);
    },
  },

  facility: {
    categories: {
      async list(
        params: { organizationId?: string; communityId?: string; status?: string } = {},
      ): Promise<{ data: any[] }> {
        const query = new URLSearchParams();
        if (params.organizationId) query.set('organizationId', params.organizationId);
        if (params.communityId) query.set('communityId', params.communityId);
        if (params.status) query.set('status', params.status);
        return fetchJson<{ data: any[] }>(`${API_BASE}/facility/categories?${query.toString()}`);
      },
      async get(id: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/categories/${id}`);
      },
      async create(input: any): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/categories`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async update(id: string, input: any): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/categories/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        });
      },
    },

    checklists: {
      async list(
        params: {
          organizationId?: string;
          communityId?: string;
          status?: string;
          categoryId?: string;
        } = {},
      ): Promise<{ data: any[] }> {
        const query = new URLSearchParams();
        if (params.organizationId) query.set('organizationId', params.organizationId);
        if (params.communityId) query.set('communityId', params.communityId);
        if (params.status) query.set('status', params.status);
        if (params.categoryId) query.set('categoryId', params.categoryId);
        return fetchJson<{ data: any[] }>(`${API_BASE}/facility/checklists?${query.toString()}`);
      },
      async get(id: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/checklists/${id}`);
      },
      async create(input: any): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/checklists`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async update(id: string, input: any): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/checklists/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        });
      },
    },

    maintenancePlans: {
      async list(params: Record<string, any> = {}): Promise<{ data: any[]; meta: any }> {
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
        }
        return fetchJson<{ data: any[]; meta: any }>(
          `${API_BASE}/facility/maintenance-plans?${query.toString()}`,
        );
      },
      async get(id: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/maintenance-plans/${id}`);
      },
      async create(input: any): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/maintenance-plans`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async update(id: string, input: any): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/maintenance-plans/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        });
      },
      async activate(id: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/maintenance-plans/${id}/activate`, {
          method: 'POST',
        });
      },
      async pause(id: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/maintenance-plans/${id}/pause`, {
          method: 'POST',
        });
      },
      async archive(id: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/maintenance-plans/${id}/archive`, {
          method: 'POST',
        });
      },
      async preview(id: string, count = 10): Promise<{ data: string[] }> {
        return fetchJson<{ data: string[] }>(
          `${API_BASE}/facility/maintenance-plans/${id}/preview`,
          {
            method: 'POST',
            body: JSON.stringify({ count }),
          },
        );
      },
      async generate(id: string, occurrenceDate?: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/maintenance-plans/${id}/generate`, {
          method: 'POST',
          body: JSON.stringify({ occurrenceDate }),
        });
      },
    },

    workOrders: {
      async list(params: Record<string, any> = {}): Promise<{ data: any[]; meta: any }> {
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
        }
        return fetchJson<{ data: any[]; meta: any }>(
          `${API_BASE}/facility/work-orders?${query.toString()}`,
        );
      },
      async get(id: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}`);
      },
      async create(input: any): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async update(id: string, input: any): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        });
      },
      async getActions(id: string): Promise<{ data: any[] }> {
        return fetchJson<{ data: any[] }>(`${API_BASE}/facility/work-orders/${id}/actions`);
      },
      async executeAction(id: string, action: string, body: any = {}): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(
          `${API_BASE}/facility/work-orders/${id}/actions/${action}`,
          {
            method: 'POST',
            body: JSON.stringify(body),
          },
        );
      },
      async assign(
        id: string,
        input: { teamId?: string | null; assigneeId?: string | null; reason?: string },
      ): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/assign`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async claim(id: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/claim`, {
          method: 'POST',
        });
      },
      async start(id: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/start`, {
          method: 'POST',
        });
      },
      async pause(id: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/pause`, {
          method: 'POST',
        });
      },
      async resume(id: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/resume`, {
          method: 'POST',
        });
      },
      async block(
        id: string,
        input: { reason: string; category?: string },
      ): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/block`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async complete(
        id: string,
        input: { completionSummary: string; resolutionCode?: string },
      ): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/complete`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async supervisorReview(
        id: string,
        input: { decision: 'APPROVED' | 'REWORK_REQUESTED'; reviewNotes?: string },
      ): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(
          `${API_BASE}/facility/work-orders/${id}/supervisor-review`,
          {
            method: 'POST',
            body: JSON.stringify(input),
          },
        );
      },
      async cancel(id: string, reason: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/cancel`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        });
      },
      async addTask(id: string, input: any): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/tasks`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async updateTask(id: string, taskId: string, input: any): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/tasks/${taskId}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        });
      },
      async submitChecklist(id: string, input: any): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/checklists`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async startTimer(
        id: string,
        input: { type?: string; notes?: string } = {},
      ): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/logs/timer/start`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async stopTimer(id: string, notes?: string): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/logs/timer/stop`, {
          method: 'POST',
          body: JSON.stringify({ notes }),
        });
      },
      async addManualLog(id: string, input: any): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/logs/manual`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async attachEvidence(
        id: string,
        input: { documentId: string; evidenceType?: string; caption?: string },
      ): Promise<{ data: any }> {
        return fetchJson<{ data: any }>(`${API_BASE}/facility/work-orders/${id}/evidence`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async getKpi(organizationId: string, communityId?: string): Promise<{ data: any }> {
        const query = new URLSearchParams({ organizationId });
        if (communityId) query.set('communityId', communityId);
        return fetchJson<{ data: any }>(
          `${API_BASE}/facility/work-orders/analytics/kpi?${query.toString()}`,
        );
      },
      getExportUrl(organizationId: string, communityId: string): string {
        return `${API_BASE}/facility/work-orders/export/csv?organizationId=${organizationId}&communityId=${communityId}`;
      },
    },
  },

  // ==========================================
  // PHASE 10: ASSET MANAGEMENT
  // ==========================================
  assets: {
    async list(
      params: {
        organizationId?: string;
        communityId?: string;
        categoryId?: string;
        lifecycleState?: string;
        operationalStatus?: string;
        condition?: string;
        criticality?: string;
        locationType?: string;
        buildingId?: string;
        search?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      } = {},
    ): Promise<{ items: any[]; total: number; page: number; limit: number; totalPages: number }> {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          q.set(k, String(v));
        }
      }
      return fetchJson<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`${API_BASE}/assets?${q.toString()}`);
    },

    async getById(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/assets/${id}`);
    },

    async getDetail(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/assets/${id}/detail`);
    },

    async getMetrics(organizationId: string, communityId?: string): Promise<any> {
      const q = new URLSearchParams({ organizationId });
      if (communityId) q.set('communityId', communityId);
      return fetchJson<any>(`${API_BASE}/assets/metrics?${q.toString()}`);
    },

    async create(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/assets`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async update(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/assets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },

    async moveLocation(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/assets/${id}/location`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async commission(id: string, input: any = {}): Promise<any> {
      return fetchJson<any>(`${API_BASE}/assets/${id}/commission`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async decommission(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/assets/${id}/decommission`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async reportBreakdown(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/assets/${id}/breakdown`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async resolveBreakdown(id: string, input: any = {}): Promise<any> {
      return fetchJson<any>(`${API_BASE}/assets/${id}/resolve-breakdown`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async getServiceHistory(id: string): Promise<any[]> {
      return fetchJson<any[]>(`${API_BASE}/assets/${id}/service-history`);
    },

    async getCard(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/assets/${id}/card`);
    },

    async resolveByQr(token: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-identifiers/qr/${encodeURIComponent(token)}`);
    },

    async resolveByBarcode(
      barcode: string,
      organizationId: string,
      communityId?: string,
    ): Promise<any> {
      const q = new URLSearchParams({ barcode, organizationId });
      if (communityId) q.set('communityId', communityId);
      return fetchJson<any>(`${API_BASE}/asset-identifiers/barcode?${q.toString()}`);
    },
  },

  assetCategories: {
    async list(
      params: {
        organizationId?: string;
        communityId?: string;
        status?: string;
        parentId?: string;
        search?: string;
      } = {},
    ): Promise<any[]> {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
      }
      return fetchJson<any[]>(`${API_BASE}/asset-categories?${q.toString()}`);
    },

    async getById(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-categories/${id}`);
    },

    async create(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-categories`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async update(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
  },

  assetModels: {
    async list(
      params: {
        organizationId?: string;
        communityId?: string;
        categoryId?: string;
        manufacturer?: string;
        search?: string;
        page?: number;
        limit?: number;
      } = {},
    ): Promise<{ items: any[]; total: number; page: number; limit: number; totalPages: number }> {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
      }
      return fetchJson<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`${API_BASE}/asset-models?${q.toString()}`);
    },

    async getById(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-models/${id}`);
    },

    async create(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-models`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async update(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-models/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
  },

  assetWarranties: {
    async listForAsset(assetId: string): Promise<any[]> {
      return fetchJson<any[]>(`${API_BASE}/assets/${assetId}/warranties`);
    },

    async create(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-warranties`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async update(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-warranties/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },
  },

  assetContracts: {
    async list(
      params: {
        organizationId?: string;
        communityId?: string;
        contractType?: string;
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
      } = {},
    ): Promise<{ items: any[]; total: number; page: number; limit: number; totalPages: number }> {
      const q = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
      }
      return fetchJson<{
        items: any[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      }>(`${API_BASE}/asset-contracts?${q.toString()}`);
    },

    async getById(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-contracts/${id}`);
    },

    async create(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-contracts`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async update(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-contracts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      });
    },

    async linkAsset(contractId: string, assetId: string, notes?: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-contracts/${contractId}/assets/${assetId}`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });
    },

    async unlinkAsset(contractId: string, assetId: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-contracts/${contractId}/assets/${assetId}`, {
        method: 'DELETE',
      });
    },
  },

  assetMeters: {
    async listForAsset(assetId: string): Promise<any[]> {
      return fetchJson<any[]>(`${API_BASE}/assets/${assetId}/meters`);
    },

    async getById(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-meters/${id}`);
    },

    async create(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-meters`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async recordReading(meterId: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-meters/${meterId}/readings`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async getHistory(meterId: string, limit = 50): Promise<any[]> {
      return fetchJson<any[]>(`${API_BASE}/asset-meters/${meterId}/readings?limit=${limit}`);
    },
  },

  assetImport: {
    async preview(csvContent: string, organizationId: string, communityId: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-import/preview`, {
        method: 'POST',
        body: JSON.stringify({ csvContent, organizationId, communityId }),
      });
    },

    async execute(csvContent: string, organizationId: string, communityId: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/asset-import/execute`, {
        method: 'POST',
        body: JSON.stringify({ csvContent, organizationId, communityId }),
      });
    },
  },

  residentComplaints: {
    async list(
      params: Record<string, any> = {},
    ): Promise<{ items: any[]; total: number; page: number; limit: number }> {
      const query = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
      }
      return fetchJson<{ items: any[]; total: number; page: number; limit: number }>(
        `${API_BASE}/resident/complaints?${query.toString()}`,
      );
    },

    async get(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/resident/complaints/${id}`);
    },

    async create(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/resident/complaints`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async getTimeline(id: string): Promise<any[]> {
      return fetchJson<any[]>(`${API_BASE}/resident/complaints/${id}/timeline`);
    },

    async getComments(id: string): Promise<any[]> {
      return fetchJson<any[]>(`${API_BASE}/resident/complaints/${id}/comments`);
    },

    async addComment(id: string, input: { body: string }): Promise<any> {
      return fetchJson<any>(`${API_BASE}/resident/complaints/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ ...input, type: 'PUBLIC_REPLY' }),
      });
    },

    async submitFeedback(id: string, input: { rating: number; comment?: string }): Promise<any> {
      return fetchJson<any>(`${API_BASE}/resident/complaints/${id}/feedback`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async reopen(id: string, input: { reason: string }): Promise<any> {
      return fetchJson<any>(`${API_BASE}/resident/complaints/${id}/reopen`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async cancel(id: string, input: { reason: string }): Promise<any> {
      return fetchJson<any>(`${API_BASE}/resident/complaints/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
  },

  inventory: {
    items: {
      async list(
        params: Record<string, any> = {},
      ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
        }
        return fetchJson<{ data: any[]; total: number; page: number; limit: number }>(
          `${API_BASE}/inventory-items?${query.toString()}`,
        );
      },
      async get(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-items/${id}`);
      },
      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-items`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async updatePolicy(itemId: string, storeId: string, input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-items/${itemId}/stores/${storeId}/policy`, {
          method: 'PUT',
          body: JSON.stringify(input),
        });
      },
      async scan(identifier: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory/scan/${identifier}`);
      },
    },

    categories: {
      async list(params: { organizationId?: string; communityId?: string } = {}): Promise<any[]> {
        const query = new URLSearchParams();
        if (params.organizationId) query.set('organizationId', params.organizationId);
        if (params.communityId) query.set('communityId', params.communityId);
        return fetchJson<any[]>(`${API_BASE}/inventory-categories?${query.toString()}`);
      },
      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-categories`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
    },

    uoms: {
      async list(organizationId: string): Promise<any[]> {
        return fetchJson<any[]>(`${API_BASE}/units-of-measure?organizationId=${organizationId}`);
      },
      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/units-of-measure`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
    },

    stores: {
      async list(params: { organizationId?: string; communityId?: string } = {}): Promise<any[]> {
        const query = new URLSearchParams();
        if (params.organizationId) query.set('organizationId', params.organizationId);
        if (params.communityId) query.set('communityId', params.communityId);
        return fetchJson<any[]>(`${API_BASE}/inventory-stores?${query.toString()}`);
      },
      async get(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-stores/${id}`);
      },
      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-stores`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async createBin(storeId: string, input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-stores/${storeId}/bins`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async listBins(storeId: string): Promise<any[]> {
        return fetchJson<any[]>(`${API_BASE}/inventory-stores/${storeId}/bins`);
      },
    },

    balances: {
      async list(
        params: Record<string, any> = {},
      ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
        }
        return fetchJson<{ data: any[]; total: number; page: number; limit: number }>(
          `${API_BASE}/stock-balances?${query.toString()}`,
        );
      },
      async getLedger(
        params: Record<string, any> = {},
      ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
        }
        return fetchJson<{ data: any[]; total: number; page: number; limit: number }>(
          `${API_BASE}/stock-balances/ledger?${query.toString()}`,
        );
      },
    },

    receipts: {
      async list(
        params: Record<string, any> = {},
      ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
        }
        return fetchJson<{ data: any[]; total: number; page: number; limit: number }>(
          `${API_BASE}/inventory-receipts?${query.toString()}`,
        );
      },
      async get(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-receipts/${id}`);
      },
      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-receipts`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async reverse(id: string, input: { reason: string }): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-receipts/${id}/reverse`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
    },

    issues: {
      async list(
        params: Record<string, any> = {},
      ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
        }
        return fetchJson<{ data: any[]; total: number; page: number; limit: number }>(
          `${API_BASE}/inventory-issues?${query.toString()}`,
        );
      },
      async get(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-issues/${id}`);
      },
      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-issues`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
    },

    returns: {
      async list(
        params: Record<string, any> = {},
      ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
        }
        return fetchJson<{ data: any[]; total: number; page: number; limit: number }>(
          `${API_BASE}/inventory-returns?${query.toString()}`,
        );
      },
      async get(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-returns/${id}`);
      },
      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-returns`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
    },

    transfers: {
      async list(
        params: Record<string, any> = {},
      ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
        }
        return fetchJson<{ data: any[]; total: number; page: number; limit: number }>(
          `${API_BASE}/stock-transfers?${query.toString()}`,
        );
      },
      async get(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/stock-transfers/${id}`);
      },
      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/stock-transfers`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async receive(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/stock-transfers/${id}/receive`, {
          method: 'POST',
        });
      },
    },

    adjustments: {
      async list(
        params: Record<string, any> = {},
      ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
        }
        return fetchJson<{ data: any[]; total: number; page: number; limit: number }>(
          `${API_BASE}/stock-adjustments?${query.toString()}`,
        );
      },
      async get(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/stock-adjustments/${id}`);
      },
      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/stock-adjustments`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
    },

    counts: {
      async list(
        params: Record<string, any> = {},
      ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
        }
        return fetchJson<{ data: any[]; total: number; page: number; limit: number }>(
          `${API_BASE}/stock-counts?${query.toString()}`,
        );
      },
      async get(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/stock-counts/${id}`);
      },
      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/stock-counts`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async recordLines(id: string, lines: any[]): Promise<any> {
        return fetchJson<any>(`${API_BASE}/stock-counts/${id}/record`, {
          method: 'POST',
          body: JSON.stringify({ lines }),
        });
      },
      async reconcile(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/stock-counts/${id}/reconcile`, {
          method: 'POST',
        });
      },
    },

    batches: {
      async list(
        params: Record<string, any> = {},
      ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
        }
        return fetchJson<{ data: any[]; total: number; page: number; limit: number }>(
          `${API_BASE}/inventory-batches?${query.toString()}`,
        );
      },
      async get(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-batches/${id}`);
      },
      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-batches`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
    },

    serials: {
      async list(
        params: Record<string, any> = {},
      ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
        const query = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
        }
        return fetchJson<{ data: any[]; total: number; page: number; limit: number }>(
          `${API_BASE}/inventory-serials?${query.toString()}`,
        );
      },
      async get(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-serials/${id}`);
      },
      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-serials`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async convertToAsset(id: string, input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory-serials/${id}/convert-to-asset`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
    },

    workOrderMaterials: {
      async listRequirements(workOrderId: string): Promise<any[]> {
        return fetchJson<any[]>(`${API_BASE}/work-orders/${workOrderId}/materials/requirements`);
      },
      async createRequirement(workOrderId: string, input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/work-orders/${workOrderId}/materials/requirements`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async reserve(workOrderId: string, input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/work-orders/${workOrderId}/materials/reservations`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async listConsumptions(workOrderId: string): Promise<any[]> {
        return fetchJson<any[]>(`${API_BASE}/work-orders/${workOrderId}/materials/consumptions`);
      },
      async consume(workOrderId: string, input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/work-orders/${workOrderId}/materials/consumptions`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
      async returnUnused(workOrderId: string, input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/work-orders/${workOrderId}/materials/returns`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
    },

    import: {
      async preview(organizationId: string, csvData: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory/import/preview`, {
          method: 'POST',
          body: JSON.stringify({ organizationId, csvData }),
        });
      },
      async execute(organizationId: string, communityId: string | null, rows: any[]): Promise<any> {
        return fetchJson<any>(`${API_BASE}/inventory/import/execute`, {
          method: 'POST',
          body: JSON.stringify({ organizationId, communityId, rows }),
        });
      },
    },
  },

  // Phase 12: Vendors & Procurement
  vendors: {
    async list(params: {
      organizationId: string;
      communityId?: string;
      status?: string;
      onboardingStatus?: string;
      vendorType?: string;
      search?: string;
      isPreferred?: boolean;
      skip?: number;
      take?: number;
    }): Promise<{ items: any[]; total: number }> {
      const query = new URLSearchParams();
      query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.status) query.set('status', params.status);
      if (params.onboardingStatus) query.set('onboardingStatus', params.onboardingStatus);
      if (params.vendorType) query.set('vendorType', params.vendorType);
      if (params.search) query.set('search', params.search);
      if (params.isPreferred !== undefined) query.set('isPreferred', String(params.isPreferred));
      if (params.skip !== undefined) query.set('skip', String(params.skip));
      if (params.take !== undefined) query.set('take', String(params.take));
      return fetchJson<{ items: any[]; total: number }>(`${API_BASE}/vendors?${query.toString()}`);
    },

    async get(id: string, organizationId?: string): Promise<any> {
      const query = organizationId ? `?organizationId=${organizationId}` : '';
      return fetchJson<any>(`${API_BASE}/vendors/${id}${query}`);
    },

    async create(input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/vendors`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async submitForReview(id: string, organizationId: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/vendors/${id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ organizationId }),
      });
    },

    async approve(id: string, organizationId: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/vendors/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ organizationId }),
      });
    },

    async suspend(id: string, organizationId: string, reason: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/vendors/${id}/suspend`, {
        method: 'POST',
        body: JSON.stringify({ organizationId, reason }),
      });
    },

    async blacklist(id: string, organizationId: string, reason: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/vendors/${id}/blacklist`, {
        method: 'POST',
        body: JSON.stringify({ organizationId, reason }),
      });
    },

    async checkEligibility(
      id: string,
      params: { organizationId: string; communityId?: string; requiredCategoryKey?: string },
    ): Promise<any> {
      const query = new URLSearchParams();
      query.set('organizationId', params.organizationId);
      if (params.communityId) query.set('communityId', params.communityId);
      if (params.requiredCategoryKey) query.set('requiredCategoryKey', params.requiredCategoryKey);
      return fetchJson<any>(`${API_BASE}/vendors/${id}/eligibility?${query.toString()}`);
    },

    async getScorecard(id: string, startDate?: string, endDate?: string): Promise<any> {
      const query = new URLSearchParams();
      if (startDate) query.set('startDate', startDate);
      if (endDate) query.set('endDate', endDate);
      return fetchJson<any>(`${API_BASE}/vendors/${id}/scorecard?${query.toString()}`);
    },

    async addDocument(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/vendors/${id}/documents`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },

    async addRating(id: string, input: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/vendors/${id}/ratings`, {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
  },

  procurement: {
    requisitions: {
      async list(params: {
        organizationId: string;
        communityId?: string;
        status?: string;
        requestType?: string;
        priority?: string;
        sourceType?: string;
        search?: string;
        skip?: number;
        take?: number;
      }): Promise<{ items: any[]; total: number }> {
        const query = new URLSearchParams();
        query.set('organizationId', params.organizationId);
        if (params.communityId) query.set('communityId', params.communityId);
        if (params.status) query.set('status', params.status);
        if (params.requestType) query.set('requestType', params.requestType);
        if (params.priority) query.set('priority', params.priority);
        if (params.sourceType) query.set('sourceType', params.sourceType);
        if (params.search) query.set('search', params.search);
        if (params.skip !== undefined) query.set('skip', String(params.skip));
        if (params.take !== undefined) query.set('take', String(params.take));
        return fetchJson<{ items: any[]; total: number }>(
          `${API_BASE}/procurement/requisitions?${query.toString()}`,
        );
      },

      async get(id: string, organizationId?: string): Promise<any> {
        const query = organizationId ? `?organizationId=${organizationId}` : '';
        return fetchJson<any>(`${API_BASE}/procurement/requisitions/${id}${query}`);
      },

      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/requisitions`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },

      async createFromWorkOrder(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/requisitions/from-work-order`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },

      async createFromReorder(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/requisitions/from-reorder-suggestions`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },

      async submit(id: string, organizationId: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/requisitions/${id}/submit`, {
          method: 'POST',
          body: JSON.stringify({ organizationId }),
        });
      },

      async approve(id: string, organizationId: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/requisitions/${id}/approve`, {
          method: 'POST',
          body: JSON.stringify({ organizationId }),
        });
      },
    },

    rfqs: {
      async list(params: {
        organizationId: string;
        communityId?: string;
        status?: string;
        search?: string;
        skip?: number;
        take?: number;
      }): Promise<{ items: any[]; total: number }> {
        const query = new URLSearchParams();
        query.set('organizationId', params.organizationId);
        if (params.communityId) query.set('communityId', params.communityId);
        if (params.status) query.set('status', params.status);
        if (params.search) query.set('search', params.search);
        if (params.skip !== undefined) query.set('skip', String(params.skip));
        if (params.take !== undefined) query.set('take', String(params.take));
        return fetchJson<{ items: any[]; total: number }>(
          `${API_BASE}/procurement/rfqs?${query.toString()}`,
        );
      },

      async get(id: string, organizationId?: string): Promise<any> {
        const query = organizationId ? `?organizationId=${organizationId}` : '';
        return fetchJson<any>(`${API_BASE}/procurement/rfqs/${id}${query}`);
      },

      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/rfqs`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },

      async extend(
        id: string,
        organizationId: string,
        newDeadline: string,
        reason: string,
      ): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/rfqs/${id}/extend`, {
          method: 'POST',
          body: JSON.stringify({ organizationId, newDeadline, reason }),
        });
      },

      async close(id: string, organizationId: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/rfqs/${id}/close`, {
          method: 'POST',
          body: JSON.stringify({ organizationId }),
        });
      },
    },

    quotations: {
      async record(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/quotations`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },

      async listByRfq(rfqId: string): Promise<any[]> {
        return fetchJson<any[]>(`${API_BASE}/procurement/quotations/by-rfq/${rfqId}`);
      },

      async getComparisonMatrix(rfqId: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/quotations/compare/${rfqId}`);
      },

      async evaluate(id: string, input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/quotations/${id}/evaluate`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },
    },

    awards: {
      async recommend(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/awards`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },

      async approve(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/awards/${id}/approve`, {
          method: 'POST',
        });
      },

      async get(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/awards/${id}`);
      },
    },

    orders: {
      async list(params: {
        organizationId: string;
        communityId?: string;
        vendorId?: string;
        status?: string;
        search?: string;
        skip?: number;
        take?: number;
      }): Promise<{ items: any[]; total: number }> {
        const query = new URLSearchParams();
        query.set('organizationId', params.organizationId);
        if (params.communityId) query.set('communityId', params.communityId);
        if (params.vendorId) query.set('vendorId', params.vendorId);
        if (params.status) query.set('status', params.status);
        if (params.search) query.set('search', params.search);
        if (params.skip !== undefined) query.set('skip', String(params.skip));
        if (params.take !== undefined) query.set('take', String(params.take));
        return fetchJson<{ items: any[]; total: number }>(
          `${API_BASE}/procurement/orders?${query.toString()}`,
        );
      },

      async get(id: string, organizationId?: string): Promise<any> {
        const query = organizationId ? `?organizationId=${organizationId}` : '';
        return fetchJson<any>(`${API_BASE}/procurement/orders/${id}${query}`);
      },

      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/orders`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },

      async createFromAward(awardId: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/orders/from-award/${awardId}`, {
          method: 'POST',
        });
      },

      async approve(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/orders/${id}/approve`, {
          method: 'POST',
        });
      },

      async issue(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/orders/${id}/issue`, {
          method: 'POST',
        });
      },

      async amend(id: string, input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/orders/${id}/amend`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },

      async acknowledge(id: string, input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/orders/${id}/acknowledge`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },

      async shortClose(id: string, reason: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/orders/${id}/short-close`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        });
      },
    },

    receipts: {
      async list(params: {
        organizationId: string;
        communityId?: string;
        purchaseOrderId?: string;
        vendorId?: string;
        storeId?: string;
        status?: string;
        search?: string;
        skip?: number;
        take?: number;
      }): Promise<{ items: any[]; total: number }> {
        const query = new URLSearchParams();
        query.set('organizationId', params.organizationId);
        if (params.communityId) query.set('communityId', params.communityId);
        if (params.purchaseOrderId) query.set('purchaseOrderId', params.purchaseOrderId);
        if (params.vendorId) query.set('vendorId', params.vendorId);
        if (params.storeId) query.set('storeId', params.storeId);
        if (params.status) query.set('status', params.status);
        if (params.search) query.set('search', params.search);
        if (params.skip !== undefined) query.set('skip', String(params.skip));
        if (params.take !== undefined) query.set('take', String(params.take));
        return fetchJson<{ items: any[]; total: number }>(
          `${API_BASE}/procurement/receipts?${query.toString()}`,
        );
      },

      async get(id: string, organizationId?: string): Promise<any> {
        const query = organizationId ? `?organizationId=${organizationId}` : '';
        return fetchJson<any>(`${API_BASE}/procurement/receipts/${id}${query}`);
      },

      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/receipts`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },

      async inspect(id: string, input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/receipts/${id}/inspect`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },

      async postToInventory(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/receipts/${id}/post`, {
          method: 'POST',
        });
      },
    },

    serviceReceipts: {
      async create(input: any): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/service-receipts`, {
          method: 'POST',
          body: JSON.stringify(input),
        });
      },

      async get(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/service-receipts/${id}`);
      },

      async accept(id: string): Promise<any> {
        return fetchJson<any>(`${API_BASE}/procurement/service-receipts/${id}/accept`, {
          method: 'POST',
        });
      },
    },

    analytics: {
      async getKpis(organizationId: string, communityId?: string): Promise<any> {
        const query = new URLSearchParams();
        query.set('organizationId', organizationId);
        if (communityId) query.set('communityId', communityId);
        return fetchJson<any>(`${API_BASE}/procurement/analytics/kpis?${query.toString()}`);
      },
    },
  },

  // ==========================================
  // Phase 14: Resident Maintenance Billing & AR
  // ==========================================
  billing: {
    async getDashboard(communityId: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/analytics/dashboard?communityId=${communityId}`);
    },
    async getAging(communityId: string): Promise<any[]> {
      return fetchJson<any[]>(`${API_BASE}/billing/analytics/aging?communityId=${communityId}`);
    },
    async runPenaltySweep(communityId: string): Promise<{ count: number; totalPenalty: number }> {
      return fetchJson<{ count: number; totalPenalty: number }>(
        `${API_BASE}/billing/analytics/penalties/sweep?communityId=${communityId}`,
        {
          method: 'POST',
        },
      );
    },
    async listInvoices(params: {
      communityId: string;
      billableAccountId?: string;
      billingPeriodId?: string;
      status?: string;
    }): Promise<any[]> {
      const q = new URLSearchParams({ communityId: params.communityId });
      if (params.billableAccountId) q.append('billableAccountId', params.billableAccountId);
      if (params.billingPeriodId) q.append('billingPeriodId', params.billingPeriodId);
      if (params.status) q.append('status', params.status);
      return fetchJson<any[]>(`${API_BASE}/billing/invoices?${q.toString()}`);
    },
    async getInvoice(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/invoices/${id}`);
    },
    async issueInvoice(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/invoices/${id}/issue`, { method: 'POST' });
    },
    async cancelInvoice(id: string, reason: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/invoices/${id}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    async listBillingRuns(params: {
      communityId: string;
      billingPeriodId?: string;
    }): Promise<any[]> {
      const q = new URLSearchParams({ communityId: params.communityId });
      if (params.billingPeriodId) q.append('billingPeriodId', params.billingPeriodId);
      return fetchJson<any[]>(`${API_BASE}/billing/runs?${q.toString()}`);
    },
    async getBillingRun(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/runs/${id}`);
    },
    async previewBillingRun(data: {
      communityId: string;
      billingPeriodId: string;
      billingPlanId: string;
    }): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/runs/preview`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async executeBillingRun(data: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/runs`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async listPayments(params: {
      communityId: string;
      billableAccountId?: string;
    }): Promise<any[]> {
      const q = new URLSearchParams({ communityId: params.communityId });
      if (params.billableAccountId) q.append('billableAccountId', params.billableAccountId);
      return fetchJson<any[]>(`${API_BASE}/billing/payments?${q.toString()}`);
    },
    async getPayment(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/payments/${id}`);
    },
    async recordPayment(data: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/payments`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async reversePayment(id: string, reason: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/payments/${id}/reverse`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    },
    async listReceipts(params: {
      communityId: string;
      billableAccountId?: string;
    }): Promise<any[]> {
      const q = new URLSearchParams({ communityId: params.communityId });
      if (params.billableAccountId) q.append('billableAccountId', params.billableAccountId);
      return fetchJson<any[]>(`${API_BASE}/billing/receipts?${q.toString()}`);
    },
    async getReceipt(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/receipts/${id}`);
    },
    async getResidentLedger(billableAccountId: string): Promise<any[]> {
      return fetchJson<any[]>(`${API_BASE}/billing/ledger/${billableAccountId}`);
    },
    async listBillingPlans(communityId: string): Promise<any[]> {
      return fetchJson<any[]>(`${API_BASE}/billing/plans?communityId=${communityId}`);
    },
    async getBillingPlan(id: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/plans/${id}`);
    },
    async createBillingPlan(data: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/plans`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async addChargeRule(planId: string, data: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/plans/${planId}/rules`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async listChargeDefinitions(organizationId: string): Promise<any[]> {
      return fetchJson<any[]>(`${API_BASE}/billing/charges?organizationId=${organizationId}`);
    },
    async createChargeDefinition(data: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/charges`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async listBillingPeriods(communityId: string): Promise<any[]> {
      return fetchJson<any[]>(`${API_BASE}/billing/periods?communityId=${communityId}`);
    },
    async createBillingPeriod(data: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/periods`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async createWaiverRequest(data: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/waivers`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async approveWaiver(id: string, approved: boolean, rejectionReason?: string): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/waivers/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ approved, rejectionReason }),
      });
    },
    async createCreditNote(data: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/waivers/credit-notes`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    async importOpeningBalances(data: any): Promise<any> {
      return fetchJson<any>(`${API_BASE}/billing/migration/import-opening-balances`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
  },

  ap: {
    getInvoices: (params?: Record<string, any>) =>
      fetchJson<any[]>(
        `${API_BASE}/ap/invoices${params ? `?${new URLSearchParams(params).toString()}` : ''}`,
      ),
    getInvoice: (id: string) => fetchJson<any>(`${API_BASE}/ap/invoices/${id}`),
    createInvoice: (data: any) =>
      fetchJson<any>(`${API_BASE}/ap/invoices`, { method: 'POST', body: JSON.stringify(data) }),
    matchInvoice: (id: string) =>
      fetchJson<any>(`${API_BASE}/ap/invoices/${id}/match`, { method: 'POST' }),
    postInvoice: (id: string) =>
      fetchJson<any>(`${API_BASE}/ap/invoices/${id}/post`, { method: 'POST' }),
    setInvoiceHold: (id: string, data: { hold: boolean; reason?: any; notes?: string }) =>
      fetchJson<any>(`${API_BASE}/ap/invoices/${id}/hold`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    resolveException: (id: string, data: any) =>
      fetchJson<any>(`${API_BASE}/ap/exceptions/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getCreditNotes: (accountingEntityId: string) =>
      fetchJson<any[]>(`${API_BASE}/ap/credit-notes?accountingEntityId=${accountingEntityId}`),
    createCreditNote: (data: any) =>
      fetchJson<any>(`${API_BASE}/ap/credit-notes`, { method: 'POST', body: JSON.stringify(data) }),
    getVendorLedger: (vendorAccountId: string) =>
      fetchJson<any[]>(`${API_BASE}/ap/ledger/${vendorAccountId}`),
    getApAging: (accountingEntityId: string, asOfDate?: string) =>
      fetchJson<any>(
        `${API_BASE}/ap/aging?accountingEntityId=${accountingEntityId}${asOfDate ? `&asOfDate=${asOfDate}` : ''}`,
      ),
    getPaymentProposals: (accountingEntityId: string) =>
      fetchJson<any[]>(`${API_BASE}/ap/payment-proposals?accountingEntityId=${accountingEntityId}`),
    getPaymentProposal: (id: string) => fetchJson<any>(`${API_BASE}/ap/payment-proposals/${id}`),
    createPaymentProposal: (data: any) =>
      fetchJson<any>(`${API_BASE}/ap/payment-proposals`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getPaymentRuns: (accountingEntityId: string) =>
      fetchJson<any[]>(`${API_BASE}/ap/payment-runs?accountingEntityId=${accountingEntityId}`),
    createPaymentRun: (proposalId: string) =>
      fetchJson<any>(`${API_BASE}/ap/payment-runs`, {
        method: 'POST',
        body: JSON.stringify({ proposalId }),
      }),
    executePaymentRun: (id: string) =>
      fetchJson<any>(`${API_BASE}/ap/payment-runs/${id}/execute`, { method: 'POST' }),
    getPayments: (accountingEntityId: string) =>
      fetchJson<any[]>(`${API_BASE}/ap/payments?accountingEntityId=${accountingEntityId}`),
    getPayment: (id: string) => fetchJson<any>(`${API_BASE}/ap/payments/${id}`),
    recordPayment: (data: any) =>
      fetchJson<any>(`${API_BASE}/ap/payments`, { method: 'POST', body: JSON.stringify(data) }),
    reversePayment: (id: string, reason: string) =>
      fetchJson<any>(`${API_BASE}/ap/payments/${id}/reverse`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    getAdvances: (accountingEntityId: string) =>
      fetchJson<any[]>(`${API_BASE}/ap/advances?accountingEntityId=${accountingEntityId}`),
    createAdvance: (data: any) =>
      fetchJson<any>(`${API_BASE}/ap/advances`, { method: 'POST', body: JSON.stringify(data) }),
    allocateAdvance: (id: string, data: { supplierInvoiceId: string; amount: number }) =>
      fetchJson<any>(`${API_BASE}/ap/advances/${id}/allocate`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getDashboard: (accountingEntityId: string) =>
      fetchJson<any>(`${API_BASE}/ap/dashboard?accountingEntityId=${accountingEntityId}`),
  },

  treasury: {
    getBankAccounts: (accountingEntityId: string) =>
      fetchJson<any[]>(`${API_BASE}/treasury/accounts?accountingEntityId=${accountingEntityId}`),
    createBankAccount: (data: any) =>
      fetchJson<any>(`${API_BASE}/treasury/accounts`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    importBankStatement: (data: any) =>
      fetchJson<any>(`${API_BASE}/treasury/statements/import`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getBankStatements: (bankAccountId: string) =>
      fetchJson<any[]>(`${API_BASE}/treasury/statements?bankAccountId=${bankAccountId}`),
    getBankTransactions: (bankAccountId: string, params?: Record<string, any>) =>
      fetchJson<any[]>(
        `${API_BASE}/treasury/transactions?bankAccountId=${bankAccountId}${params ? `&${new URLSearchParams(params).toString()}` : ''}`,
      ),
    createReconciliationSession: (data: any) =>
      fetchJson<any>(`${API_BASE}/treasury/reconciliation/sessions`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getReconciliationSession: (id: string) =>
      fetchJson<any>(`${API_BASE}/treasury/reconciliation/sessions/${id}`),
    autoMatchReconciliation: (sessionId: string) =>
      fetchJson<any>(`${API_BASE}/treasury/reconciliation/sessions/${sessionId}/auto-match`, {
        method: 'POST',
      }),
    manualMatchReconciliation: (data: any) =>
      fetchJson<any>(`${API_BASE}/treasury/reconciliation/matches/manual`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    postBankFee: (data: any) =>
      fetchJson<any>(`${API_BASE}/treasury/reconciliation/bank-fee`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    completeReconciliation: (
      id: string,
      data: { allowDifferenceOverride?: boolean; overrideReason?: string },
    ) =>
      fetchJson<any>(`${API_BASE}/treasury/reconciliation/sessions/${id}/complete`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    reopenReconciliation: (id: string, data: { reason: string }) =>
      fetchJson<any>(`${API_BASE}/treasury/reconciliation/sessions/${id}/reopen`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getDashboard: (accountingEntityId: string) =>
      fetchJson<any>(`${API_BASE}/treasury/dashboard?accountingEntityId=${accountingEntityId}`),
  },


  finance: {
    getAccountingEntities: (organizationId?: string) =>
      fetchJson<any[]>(
        `${API_BASE}/finance/entities${organizationId ? `?organizationId=${organizationId}` : ''}`,
      ),
    getFiscalYears: (accountingEntityId: string) =>
      fetchJson<any[]>(`${API_BASE}/finance/fiscal-years?accountingEntityId=${accountingEntityId}`),
    getAccounts: (accountingEntityId: string) =>
      fetchJson<any[]>(`${API_BASE}/finance/accounts?accountingEntityId=${accountingEntityId}`),
  },


  // ==========================================
  // Phase 17: Enterprise Projects & CAPEX Execution
  // ==========================================
  projects: {
    getProjects: (params?: { organizationId?: string; communityId?: string; status?: string }) =>
      fetchJson<any[]>(
        `${API_BASE}/projects${params ? `?${new URLSearchParams(params as any).toString()}` : ''}`,
      ),
    getProject: (id: string) => fetchJson<any>(`${API_BASE}/projects/${id}`),
    createProject: (data: any) =>
      fetchJson<any>(`${API_BASE}/projects`, { method: 'POST', body: JSON.stringify(data) }),
    convertFromCapex: (capexInitiativeId: string) =>
      fetchJson<any>(`${API_BASE}/projects/convert-capex/${capexInitiativeId}`, { method: 'POST' }),
    submitProject: (id: string) =>
      fetchJson<any>(`${API_BASE}/projects/${id}/submit`, { method: 'POST' }),
    approveProject: (id: string) =>
      fetchJson<any>(`${API_BASE}/projects/${id}/approve`, { method: 'POST' }),

    // BOQ
    getBoqs: (projectId: string) =>
      fetchJson<any[]>(`${API_BASE}/boq?projectId=${projectId}`),
    getBoq: (id: string) => fetchJson<any>(`${API_BASE}/boq/${id}`),
    createBoq: (data: any) =>
      fetchJson<any>(`${API_BASE}/boq`, { method: 'POST', body: JSON.stringify(data) }),
    approveBoq: (id: string) =>
      fetchJson<any>(`${API_BASE}/boq/${id}/approve`, { method: 'POST' }),
    reviseBoq: (data: any) =>
      fetchJson<any>(`${API_BASE}/boq/revise`, { method: 'POST', body: JSON.stringify(data) }),

    // Work Packages
    getWorkPackages: (projectId: string) =>
      fetchJson<any[]>(`${API_BASE}/work-packages?projectId=${projectId}`),
    getWorkPackage: (id: string) =>
      fetchJson<any>(`${API_BASE}/work-packages/${id}`),
    createWorkPackage: (data: any) =>
      fetchJson<any>(`${API_BASE}/work-packages`, { method: 'POST', body: JSON.stringify(data) }),

    // Measurements
    getMeasurements: (projectId: string, workPackageId?: string) =>
      fetchJson<any[]>(
        `${API_BASE}/measurements?projectId=${projectId}${workPackageId ? `&workPackageId=${workPackageId}` : ''}`,
      ),
    submitMeasurement: (data: any) =>
      fetchJson<any>(`${API_BASE}/measurements`, { method: 'POST', body: JSON.stringify(data) }),
    verifyMeasurement: (data: { measurementId: string; approved: boolean; rejectionReason?: string }) =>
      fetchJson<any>(`${API_BASE}/measurements/verify`, { method: 'POST', body: JSON.stringify(data) }),

    // Progress Certificates
    getCertificates: (projectId: string, vendorId?: string) =>
      fetchJson<any[]>(
        `${API_BASE}/progress-certificates?projectId=${projectId}${vendorId ? `&vendorId=${vendorId}` : ''}`,
      ),
    createCertificate: (data: any) =>
      fetchJson<any>(`${API_BASE}/progress-certificates`, { method: 'POST', body: JSON.stringify(data) }),
    approveCertificate: (id: string) =>
      fetchJson<any>(`${API_BASE}/progress-certificates/${id}/approve`, { method: 'POST' }),

    // Variations
    getVariations: (projectId: string) =>
      fetchJson<any[]>(`${API_BASE}/project-variations?projectId=${projectId}`),
    createVariation: (data: any) =>
      fetchJson<any>(`${API_BASE}/project-variations`, { method: 'POST', body: JSON.stringify(data) }),
    approveVariation: (id: string) =>
      fetchJson<any>(`${API_BASE}/project-variations/${id}/approve`, { method: 'POST' }),

    // Snags
    getSnags: (projectId: string) =>
      fetchJson<any[]>(`${API_BASE}/project-snags?projectId=${projectId}`),
    createSnag: (data: any) =>
      fetchJson<any>(`${API_BASE}/project-snags`, { method: 'POST', body: JSON.stringify(data) }),
    resolveSnag: (id: string, resolutionEvidenceDocId?: string) =>
      fetchJson<any>(`${API_BASE}/project-snags/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ resolutionEvidenceDocId }),
      }),

    // Handover
    getHandovers: (projectId: string) =>
      fetchJson<any[]>(`${API_BASE}/project-handover?projectId=${projectId}`),
    initiateHandover: (data: any) =>
      fetchJson<any>(`${API_BASE}/project-handover`, { method: 'POST', body: JSON.stringify(data) }),

    // Dashboard
    getFinancialSummary: (projectId: string) =>
      fetchJson<any>(`${API_BASE}/project-dashboard/summary?projectId=${projectId}`),
    getPortfolioKpis: (organizationId: string) =>
      fetchJson<any>(`${API_BASE}/project-dashboard/kpis?organizationId=${organizationId}`),
  },

  budgeting: {
    // Budgets & AOP
    getBudgets: (accountingEntityId: string, fiscalYearId?: string) =>
      fetchJson<any[]>(
        `${API_BASE}/budgets?accountingEntityId=${accountingEntityId}${fiscalYearId ? `&fiscalYearId=${fiscalYearId}` : ''}`,
      ),
    getBudget: (id: string) => fetchJson<any>(`${API_BASE}/budgets/${id}`),
    createBudget: (data: any) =>
      fetchJson<any>(`${API_BASE}/budgets`, { method: 'POST', body: JSON.stringify(data) }),
    submitBudget: (id: string) =>
      fetchJson<any>(`${API_BASE}/budgets/${id}/submit`, { method: 'POST' }),
    approveBudget: (id: string) =>
      fetchJson<any>(`${API_BASE}/budgets/${id}/approve`, { method: 'POST' }),
    activateBudget: (id: string) =>
      fetchJson<any>(`${API_BASE}/budgets/${id}/activate`, { method: 'POST' }),
    copyBudget: (id: string, data: any) =>
      fetchJson<any>(`${API_BASE}/budgets/${id}/copy`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Templates
    getTemplates: (organizationId: string) =>
      fetchJson<any[]>(`${API_BASE}/budget-templates?organizationId=${organizationId}`),
    createTemplate: (data: any) =>
      fetchJson<any>(`${API_BASE}/budget-templates`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Amendments & Transfers
    getAmendments: (budgetId: string) =>
      fetchJson<any[]>(`${API_BASE}/budget-amendments?budgetId=${budgetId}`),
    createAmendment: (data: any) =>
      fetchJson<any>(`${API_BASE}/budget-amendments`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getTransfers: (budgetLineId: string) =>
      fetchJson<any[]>(`${API_BASE}/budget-transfers?budgetLineId=${budgetLineId}`),
    createTransfer: (data: any) =>
      fetchJson<any>(`${API_BASE}/budget-transfers`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Control & Commitments
    checkControl: (data: any) =>
      fetchJson<any>(`${API_BASE}/budget-control/check`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    executeSpend: (data: any) =>
      fetchJson<any>(`${API_BASE}/budget-control/spend`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getCommitments: (budgetLineId: string) =>
      fetchJson<any[]>(`${API_BASE}/budget-commitments?budgetLineId=${budgetLineId}`),

    // CAPEX Planning
    getCapexInitiatives: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/capex?communityId=${communityId}`),
    createCapexInitiative: (data: any) =>
      fetchJson<any>(`${API_BASE}/capex`, { method: 'POST', body: JSON.stringify(data) }),
    updateCapexProgress: (id: string, data: { progressPercent: number; forecastCost?: number }) =>
      fetchJson<any>(`${API_BASE}/capex/${id}/progress`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Fund Planning
    getFundPlans: (fiscalYearId: string) =>
      fetchJson<any[]>(`${API_BASE}/fund-plans?fiscalYearId=${fiscalYearId}`),
    createOrUpdateFundPlan: (data: any) =>
      fetchJson<any>(`${API_BASE}/fund-plans`, { method: 'POST', body: JSON.stringify(data) }),

    // Forecasting & Variance
    getForecasts: (accountingEntityId: string, fiscalYearId?: string) =>
      fetchJson<any[]>(
        `${API_BASE}/forecasts?accountingEntityId=${accountingEntityId}${fiscalYearId ? `&fiscalYearId=${fiscalYearId}` : ''}`,
      ),
    createForecast: (data: any) =>
      fetchJson<any>(`${API_BASE}/forecasts`, { method: 'POST', body: JSON.stringify(data) }),
    getVarianceReport: (budgetId: string) =>
      fetchJson<any[]>(`${API_BASE}/variance?budgetId=${budgetId}`),
    addVarianceExplanation: (data: any) =>
      fetchJson<any>(`${API_BASE}/variance/explanations`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Dashboard & Reports
    getDashboardKpis: (accountingEntityId: string, fiscalYearId?: string) =>
      fetchJson<any>(
        `${API_BASE}/budget-dashboard/kpis?accountingEntityId=${accountingEntityId}${fiscalYearId ? `&fiscalYearId=${fiscalYearId}` : ''}`,
      ),
    getSpendPipeline: (accountingEntityId: string) =>
      fetchJson<any>(`${API_BASE}/budget-dashboard/spend-pipeline?accountingEntityId=${accountingEntityId}`),
  },
  security: {
    // Gates
    getGates: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/security/gates?communityId=${communityId}`),
    createGate: (data: any) =>
      fetchJson<any>(`${API_BASE}/security/gates`, { method: 'POST', body: JSON.stringify(data) }),

    // Visitors & Invitations
    inviteVisitor: (data: any) =>
      fetchJson<any>(`${API_BASE}/security/visitors/invite`, { method: 'POST', body: JSON.stringify(data) }),
    createWalkIn: (data: any) =>
      fetchJson<any>(`${API_BASE}/security/visitors/walk-in`, { method: 'POST', body: JSON.stringify(data) }),
    revokePass: (id: string) =>
      fetchJson<any>(`${API_BASE}/security/visitors/passes/${id}/revoke`, { method: 'POST' }),

    // Approvals
    getPendingApprovals: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/security/approvals/pending?communityId=${communityId}`),
    decideApproval: (data: { approvalId: string; approved: boolean; decisionReason?: string }) =>
      fetchJson<any>(`${API_BASE}/security/approvals/decide`, { method: 'POST', body: JSON.stringify(data) }),

    // Gate Access
    validatePass: (data: { gateId: string; rawToken?: string; otp?: string }) =>
      fetchJson<any>(`${API_BASE}/security/access/validate-pass`, { method: 'POST', body: JSON.stringify(data) }),
    checkInWalkIn: (data: { visitId: string; gateId: string; vehicleNumber?: string }) =>
      fetchJson<any>(`${API_BASE}/security/access/check-in-walk-in`, { method: 'POST', body: JSON.stringify(data) }),
    checkOut: (data: { visitId: string; gateId: string }) =>
      fetchJson<any>(`${API_BASE}/security/access/check-out`, { method: 'POST', body: JSON.stringify(data) }),
    manualCheckout: (data: { visitId: string; gateId: string; reason: string }) =>
      fetchJson<any>(`${API_BASE}/security/access/manual-checkout`, { method: 'POST', body: JSON.stringify(data) }),

    // Deliveries
    getDeliveries: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/security/deliveries?communityId=${communityId}`),

    // Household Staff
    getHouseholdServices: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/security/household-services?communityId=${communityId}`),
    createHouseholdService: (data: any) =>
      fetchJson<any>(`${API_BASE}/security/household-services`, { method: 'POST', body: JSON.stringify(data) }),

    // Contractors
    getContractors: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/security/contractors?communityId=${communityId}`),
    createContractorAuth: (data: any) =>
      fetchJson<any>(`${API_BASE}/security/contractors`, { method: 'POST', body: JSON.stringify(data) }),

    // Watchlist
    getWatchlist: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/security/watchlist?communityId=${communityId}`),
    createWatchlistEntry: (data: any) =>
      fetchJson<any>(`${API_BASE}/security/watchlist`, { method: 'POST', body: JSON.stringify(data) }),
    createOverride: (data: any) =>
      fetchJson<any>(`${API_BASE}/security/watchlist/override`, { method: 'POST', body: JSON.stringify(data) }),

    // Dashboard
    getKpis: (communityId: string) =>
      fetchJson<any>(`${API_BASE}/security/dashboard/kpis?communityId=${communityId}`),
    getActiveVisits: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/security/dashboard/active-visits?communityId=${communityId}`),
  },
  parking: {
    // Vehicles
    getVehicles: (communityId: string, search?: string) =>
      fetchJson<any[]>(`${API_BASE}/parking/vehicles?communityId=${communityId}${search ? `&search=${search}` : ''}`),
    registerVehicle: (data: any) =>
      fetchJson<any>(`${API_BASE}/parking/vehicles/register`, { method: 'POST', body: JSON.stringify(data) }),
    verifyVehicle: (data: any) =>
      fetchJson<any>(`${API_BASE}/parking/vehicles/verify`, { method: 'POST', body: JSON.stringify(data) }),

    // Inventory & Slots
    getAreas: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/parking/inventory/areas?communityId=${communityId}`),
    createArea: (data: any) =>
      fetchJson<any>(`${API_BASE}/parking/inventory/areas`, { method: 'POST', body: JSON.stringify(data) }),
    getSlots: (communityId: string, areaId?: string, status?: string) =>
      fetchJson<any[]>(`${API_BASE}/parking/inventory/slots?communityId=${communityId}${areaId ? `&areaId=${areaId}` : ''}${status ? `&status=${status}` : ''}`),
    createSlot: (data: any) =>
      fetchJson<any>(`${API_BASE}/parking/inventory/slots`, { method: 'POST', body: JSON.stringify(data) }),
    bulkCreateSlots: (data: any) =>
      fetchJson<any>(`${API_BASE}/parking/inventory/slots/bulk`, { method: 'POST', body: JSON.stringify(data) }),
    blockSlot: (slotId: string, data: any) =>
      fetchJson<any>(`${API_BASE}/parking/inventory/slots/${slotId}/block`, { method: 'POST', body: JSON.stringify(data) }),

    // Rights & Allocations
    getRights: (communityId: string, unitId?: string) =>
      fetchJson<any[]>(`${API_BASE}/parking/rights?communityId=${communityId}${unitId ? `&unitId=${unitId}` : ''}`),
    grantRight: (data: any) =>
      fetchJson<any>(`${API_BASE}/parking/rights`, { method: 'POST', body: JSON.stringify(data) }),
    getAllocations: (communityId: string, unitId?: string) =>
      fetchJson<any[]>(`${API_BASE}/parking/allocations?communityId=${communityId}${unitId ? `&unitId=${unitId}` : ''}`),
    allocateSlot: (data: any) =>
      fetchJson<any>(`${API_BASE}/parking/allocations`, { method: 'POST', body: JSON.stringify(data) }),
    endAllocation: (id: string) =>
      fetchJson<any>(`${API_BASE}/parking/allocations/${id}/end`, { method: 'POST' }),

    // Permits
    getPermits: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/parking/permits?communityId=${communityId}`),
    issuePermit: (data: any) =>
      fetchJson<any>(`${API_BASE}/parking/permits`, { method: 'POST', body: JSON.stringify(data) }),
    revokePermit: (id: string) =>
      fetchJson<any>(`${API_BASE}/parking/permits/${id}/revoke`, { method: 'POST' }),

    // Visitor Sessions
    getVisitorSessions: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/parking/visitor-sessions/active?communityId=${communityId}`),
    evaluateVisitorParking: (data: any) =>
      fetchJson<any>(`${API_BASE}/parking/visitor-sessions/evaluate`, { method: 'POST', body: JSON.stringify(data) }),
    releaseVisitorParking: (visitId: string) =>
      fetchJson<any>(`${API_BASE}/parking/visitor-sessions/release/${visitId}`, { method: 'POST' }),

    // Occupancy
    getOccupancySessions: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/parking/occupancy/active?communityId=${communityId}`),
    recordOccupancy: (data: any) =>
      fetchJson<any>(`${API_BASE}/parking/occupancy/entry`, { method: 'POST', body: JSON.stringify(data) }),
    recordExit: (vehicleId: string, exitGateId?: string) =>
      fetchJson<any>(`${API_BASE}/parking/occupancy/exit/${vehicleId}`, { method: 'POST', body: JSON.stringify({ exitGateId }) }),

    // EV Charging
    getEVSessions: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/parking/ev-charging/sessions?communityId=${communityId}`),
    recordEVSession: (data: any) =>
      fetchJson<any>(`${API_BASE}/parking/ev-charging/sessions`, { method: 'POST', body: JSON.stringify(data) }),

    // Violations
    getViolations: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/parking/violations?communityId=${communityId}`),
    createViolation: (data: any) =>
      fetchJson<any>(`${API_BASE}/parking/violations`, { method: 'POST', body: JSON.stringify(data) }),
    confirmViolation: (id: string, penaltyAmount?: number) =>
      fetchJson<any>(`${API_BASE}/parking/violations/${id}/confirm`, { method: 'POST', body: JSON.stringify({ penaltyAmount }) }),
    appealViolation: (id: string, reason: string) =>
      fetchJson<any>(`${API_BASE}/parking/violations/${id}/appeal`, { method: 'POST', body: JSON.stringify({ reason }) }),
    decideAppeal: (data: any) =>
      fetchJson<any>(`${API_BASE}/parking/violations/appeals/decide`, { method: 'POST', body: JSON.stringify(data) }),

    // Dashboard
    getKpis: (communityId: string) =>
      fetchJson<any>(`${API_BASE}/parking/dashboard/kpis?communityId=${communityId}`),
  },
  amenities: {
    // Amenity Master
    getAmenities: (communityId: string, category?: string) =>
      fetchJson<any[]>(`${API_BASE}/amenities?communityId=${communityId}${category ? `&category=${category}` : ''}`),
    getAmenityById: (id: string) =>
      fetchJson<any>(`${API_BASE}/amenities/${id}`),
    createAmenity: (data: any) =>
      fetchJson<any>(`${API_BASE}/amenities`, { method: 'POST', body: JSON.stringify(data) }),

    // Resources
    getResources: (amenityId: string) =>
      fetchJson<any[]>(`${API_BASE}/amenities/resources?amenityId=${amenityId}`),
    createResource: (data: any) =>
      fetchJson<any>(`${API_BASE}/amenities/resources`, { method: 'POST', body: JSON.stringify(data) }),

    // Schedules
    getSchedules: (amenityId: string) =>
      fetchJson<any>(`${API_BASE}/amenities/schedules?amenityId=${amenityId}`),
    setOperatingSchedule: (data: any) =>
      fetchJson<any>(`${API_BASE}/amenities/schedules/operating`, { method: 'POST', body: JSON.stringify(data) }),
    setSpecialSchedule: (data: any) =>
      fetchJson<any>(`${API_BASE}/amenities/schedules/special`, { method: 'POST', body: JSON.stringify(data) }),

    // Policies
    getPolicies: (amenityId: string) =>
      fetchJson<any>(`${API_BASE}/amenities/policies?amenityId=${amenityId}`),
    setBookingPolicy: (data: any) =>
      fetchJson<any>(`${API_BASE}/amenities/policies/booking`, { method: 'POST', body: JSON.stringify(data) }),
    setPricingPolicy: (data: any) =>
      fetchJson<any>(`${API_BASE}/amenities/policies/pricing`, { method: 'POST', body: JSON.stringify(data) }),

    // Availability
    checkAvailability: (data: any) =>
      fetchJson<any>(`${API_BASE}/amenities/availability/check`, { method: 'POST', body: JSON.stringify(data) }),

    // Bookings
    getBookings: (communityId: string, status?: string) =>
      fetchJson<any[]>(`${API_BASE}/amenities/bookings?communityId=${communityId}${status ? `&status=${status}` : ''}`),
    createBooking: (data: any) =>
      fetchJson<any>(`${API_BASE}/amenities/bookings`, { method: 'POST', body: JSON.stringify(data) }),
    decideApproval: (data: any) =>
      fetchJson<any>(`${API_BASE}/amenities/bookings/approvals/decide`, { method: 'POST', body: JSON.stringify(data) }),
    cancelBooking: (id: string, reason?: string) =>
      fetchJson<any>(`${API_BASE}/amenities/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
    rescheduleBooking: (id: string, data: any) =>
      fetchJson<any>(`${API_BASE}/amenities/bookings/${id}/reschedule`, { method: 'POST', body: JSON.stringify(data) }),

    // Waitlist
    getWaitlist: (amenityId: string) =>
      fetchJson<any[]>(`${API_BASE}/amenities/waitlist?amenityId=${amenityId}`),
    joinWaitlist: (data: any) =>
      fetchJson<any>(`${API_BASE}/amenities/waitlist/join`, { method: 'POST', body: JSON.stringify(data) }),
    acceptOffer: (id: string) =>
      fetchJson<any>(`${API_BASE}/amenities/waitlist/${id}/accept`, { method: 'POST' }),

    // Maintenance Blocks
    getMaintenanceBlocks: (amenityId: string) =>
      fetchJson<any[]>(`${API_BASE}/amenities/maintenance-blocks?amenityId=${amenityId}`),
    createMaintenanceBlock: (data: any) =>
      fetchJson<any>(`${API_BASE}/amenities/maintenance-blocks`, { method: 'POST', body: JSON.stringify(data) }),

    // Check-In
    checkIn: (bookingId: string) =>
      fetchJson<any>(`${API_BASE}/amenities/checkin/${bookingId}`, { method: 'POST' }),
    checkOut: (bookingId: string) =>
      fetchJson<any>(`${API_BASE}/amenities/checkin/${bookingId}/checkout`, { method: 'POST' }),
    processNoShows: (communityId: string) =>
      fetchJson<any>(`${API_BASE}/amenities/checkin/no-shows/process?communityId=${communityId}`, { method: 'POST' }),

    // Damage & Deposits
    getDamageReports: (amenityId?: string) =>
      fetchJson<any[]>(`${API_BASE}/amenities/damage-reports${amenityId ? `?amenityId=${amenityId}` : ''}`),
    reportDamage: (data: any) =>
      fetchJson<any>(`${API_BASE}/amenities/damage-reports`, { method: 'POST', body: JSON.stringify(data) }),
    settleDeposit: (data: any) =>
      fetchJson<any>(`${API_BASE}/amenities/damage-reports/settle`, { method: 'POST', body: JSON.stringify(data) }),

    // Dashboard
    getKpis: (communityId: string) =>
      fetchJson<any>(`${API_BASE}/amenities/dashboard/kpis?communityId=${communityId}`),
  },
  workforce: {
    // Workers
    getWorkers: (organizationId: string, communityId?: string, status?: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/workers?organizationId=${organizationId}${communityId ? `&communityId=${communityId}` : ''}${status ? `&status=${status}` : ''}`),
    getWorkerById: (id: string) =>
      fetchJson<any>(`${API_BASE}/workforce/workers/${id}`),
    createWorker: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/workers`, { method: 'POST', body: JSON.stringify(data) }),
    updateWorker: (id: string, data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/workers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    linkUser: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/workers/link-user`, { method: 'POST', body: JSON.stringify(data) }),
    offboardWorker: (id: string, reason?: string) =>
      fetchJson<any>(`${API_BASE}/workforce/workers/${id}/offboard`, { method: 'POST', body: JSON.stringify({ reason }) }),

    // Engagements
    createEngagement: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/engagements`, { method: 'POST', body: JSON.stringify(data) }),
    getEngagements: (workerId: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/engagements/${workerId}`),

    // Structure (Departments, Roles, Skills, Certifications)
    getDepartments: (organizationId: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/structure/departments?organizationId=${organizationId}`),
    createDepartment: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/structure/departments`, { method: 'POST', body: JSON.stringify(data) }),
    getJobRoles: (organizationId: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/structure/job-roles?organizationId=${organizationId}`),
    createJobRole: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/structure/job-roles`, { method: 'POST', body: JSON.stringify(data) }),
    getSkills: (organizationId: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/structure/skills?organizationId=${organizationId}`),
    createSkill: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/structure/skills`, { method: 'POST', body: JSON.stringify(data) }),
    assignWorkerSkill: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/structure/worker-skills`, { method: 'POST', body: JSON.stringify(data) }),
    createCertification: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/structure/certifications`, { method: 'POST', body: JSON.stringify(data) }),

    // Shifts
    getTemplates: (organizationId: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/shifts/templates?organizationId=${organizationId}`),
    createTemplate: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/shifts/templates`, { method: 'POST', body: JSON.stringify(data) }),
    generateShiftInstances: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/shifts/generate-instances`, { method: 'POST', body: JSON.stringify(data) }),
    getShiftInstances: (communityId: string, startDate?: string, endDate?: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/shifts/instances?communityId=${communityId}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`),

    // Rosters
    getRosters: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/rosters?communityId=${communityId}`),
    createRoster: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/rosters`, { method: 'POST', body: JSON.stringify(data) }),
    publishRoster: (id: string) =>
      fetchJson<any>(`${API_BASE}/workforce/rosters/${id}/publish`, { method: 'POST' }),
    assignShift: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/rosters/assignments`, { method: 'POST', body: JSON.stringify(data) }),
    requestShiftSwap: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/rosters/swaps/request`, { method: 'POST', body: JSON.stringify(data) }),
    approveShiftSwap: (id: string) =>
      fetchJson<any>(`${API_BASE}/workforce/rosters/swaps/${id}/approve`, { method: 'POST' }),

    // Attendance
    getAttendance: (communityId: string, date?: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/attendance?communityId=${communityId}${date ? `&date=${date}` : ''}`),
    checkIn: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/attendance/check-in`, { method: 'POST', body: JSON.stringify(data) }),
    checkOut: (sessionId: string, data?: any) =>
      fetchJson<any>(`${API_BASE}/workforce/attendance/sessions/${sessionId}/check-out`, { method: 'POST', body: JSON.stringify(data || {}) }),
    processMissingCheckouts: (communityId: string) =>
      fetchJson<any>(`${API_BASE}/workforce/attendance/missing-checkouts/process?communityId=${communityId}`, { method: 'POST' }),

    // Corrections
    requestCorrection: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/corrections/request`, { method: 'POST', body: JSON.stringify(data) }),
    decideCorrection: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/corrections/decide`, { method: 'POST', body: JSON.stringify(data) }),
    getPendingCorrections: (communityId?: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/corrections/pending${communityId ? `?communityId=${communityId}` : ''}`),

    // Leave & Overtime
    createLeaveRequest: (data: any, organizationId: string) =>
      fetchJson<any>(`${API_BASE}/workforce/leave-overtime/leave?organizationId=${organizationId}`, { method: 'POST', body: JSON.stringify(data) }),
    decideLeaveRequest: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/leave-overtime/leave/decide`, { method: 'POST', body: JSON.stringify(data) }),
    getLeaveRequests: (organizationId: string, workerId?: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/leave-overtime/leave?organizationId=${organizationId}${workerId ? `&workerId=${workerId}` : ''}`),
    recordOvertime: (data: any, organizationId: string) =>
      fetchJson<any>(`${API_BASE}/workforce/leave-overtime/overtime?organizationId=${organizationId}`, { method: 'POST', body: JSON.stringify(data) }),
    getOvertimeRecords: (organizationId: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/leave-overtime/overtime?organizationId=${organizationId}`),

    // Deployments
    getDeployments: (communityId: string, targetType?: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/deployments?communityId=${communityId}${targetType ? `&targetType=${targetType}` : ''}`),
    createDeployment: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/deployments`, { method: 'POST', body: JSON.stringify(data) }),

    // Technicians
    resolveTechnicians: (communityId: string, trade?: string, skillCode?: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/technicians/resolve?communityId=${communityId}${trade ? `&trade=${trade}` : ''}${skillCode ? `&skillCode=${skillCode}` : ''}`),

    // Timesheets
    logTimesheet: (data: any, organizationId: string) =>
      fetchJson<any>(`${API_BASE}/workforce/timesheets?organizationId=${organizationId}`, { method: 'POST', body: JSON.stringify(data) }),
    getTimesheets: (workerId?: string, organizationId?: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/timesheets?${workerId ? `workerId=${workerId}&` : ''}${organizationId ? `organizationId=${organizationId}` : ''}`),

    // Tasks
    createTask: (data: any) =>
      fetchJson<any>(`${API_BASE}/workforce/tasks`, { method: 'POST', body: JSON.stringify(data) }),
    completeTask: (id: string) =>
      fetchJson<any>(`${API_BASE}/workforce/tasks/${id}/complete`, { method: 'POST' }),
    getTasks: (communityId: string, status?: string) =>
      fetchJson<any[]>(`${API_BASE}/workforce/tasks?communityId=${communityId}${status ? `&status=${status}` : ''}`),

    // Dashboard
    getKpis: (communityId: string) =>
      fetchJson<any>(`${API_BASE}/workforce/dashboard/kpis?communityId=${communityId}`),
    getCoverage: (communityId: string, date: string) =>
      fetchJson<any>(`${API_BASE}/workforce/dashboard/coverage?communityId=${communityId}&date=${date}`),
    auditIntegrity: (communityId: string) =>
      fetchJson<any>(`${API_BASE}/workforce/dashboard/integrity-audit?communityId=${communityId}`),
  },
  // ==========================================
  // Phase 22: Enterprise Governance & Meetings
  // ==========================================
  governance: {
    // Committees & Structure
    getCommittees: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/governance/committees?communityId=${communityId}`),
    getCommitteeById: (id: string) =>
      fetchJson<any>(`${API_BASE}/governance/committees/${id}`),
    createCommittee: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/committees`, { method: 'POST', body: JSON.stringify(data) }),
    createTerm: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/committees/terms`, { method: 'POST', body: JSON.stringify(data) }),
    createPosition: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/committees/positions`, { method: 'POST', body: JSON.stringify(data) }),
    getPositions: (organizationId: string) =>
      fetchJson<any[]>(`${API_BASE}/governance/committees/positions/list?organizationId=${organizationId}`),
    assignMember: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/committees/memberships`, { method: 'POST', body: JSON.stringify(data) }),

    // Meetings, Notices & Live Mode
    getMeetings: (communityId: string, meetingType?: string, status?: string) =>
      fetchJson<any[]>(`${API_BASE}/governance/meetings?communityId=${communityId}${meetingType ? `&meetingType=${meetingType}` : ''}${status ? `&status=${status}` : ''}`),
    getMeetingById: (id: string) =>
      fetchJson<any>(`${API_BASE}/governance/meetings/${id}`),
    createMeeting: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/meetings`, { method: 'POST', body: JSON.stringify(data) }),
    publishMeetingNotice: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/meetings/notices/publish`, { method: 'POST', body: JSON.stringify(data) }),
    startMeeting: (id: string) =>
      fetchJson<any>(`${API_BASE}/governance/meetings/${id}/start`, { method: 'POST' }),
    completeMeeting: (id: string) =>
      fetchJson<any>(`${API_BASE}/governance/meetings/${id}/complete`, { method: 'POST' }),
    adjournMeeting: (id: string, reason?: string) =>
      fetchJson<any>(`${API_BASE}/governance/meetings/${id}/adjourn`, { method: 'POST', body: JSON.stringify({ reason }) }),

    // Agendas
    createAgenda: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/agendas`, { method: 'POST', body: JSON.stringify(data) }),
    getLatestAgenda: (meetingId: string) =>
      fetchJson<any>(`${API_BASE}/governance/agendas/meeting/${meetingId}`),

    // Attendance & Quorum
    checkInAttendance: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/attendance/check-in`, { method: 'POST', body: JSON.stringify(data) }),
    captureEligibility: (meetingId: string) =>
      fetchJson<any>(`${API_BASE}/governance/attendance/eligibility-snapshot/${meetingId}`, { method: 'POST' }),
    evaluateQuorum: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/attendance/quorum/evaluate`, { method: 'POST', body: JSON.stringify(data) }),
    submitProxy: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/attendance/proxies`, { method: 'POST', body: JSON.stringify(data) }),

    // Motions
    proposeMotion: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/motions`, { method: 'POST', body: JSON.stringify(data) }),
    amendMotion: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/motions/amend`, { method: 'POST', body: JSON.stringify(data) }),

    // Voting & Counting
    createVote: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/votes`, { method: 'POST', body: JSON.stringify(data) }),
    issueEntitlement: (voteId: string, residentId: string, weight?: number) =>
      fetchJson<any>(`${API_BASE}/governance/votes/${voteId}/entitlements`, { method: 'POST', body: JSON.stringify({ residentId, weight }) }),
    castBallot: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/votes/cast`, { method: 'POST', body: JSON.stringify(data) }),
    countVoteResult: (voteId: string) =>
      fetchJson<any>(`${API_BASE}/governance/votes/${voteId}/count`, { method: 'POST' }),

    // Polls
    createPoll: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/polls`, { method: 'POST', body: JSON.stringify(data) }),
    submitPollResponse: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/polls/respond`, { method: 'POST', body: JSON.stringify(data) }),
    getPolls: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/governance/polls?communityId=${communityId}`),

    // Resolutions
    adoptResolution: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/resolutions`, { method: 'POST', body: JSON.stringify(data) }),
    getResolutions: (communityId: string, classification?: string) =>
      fetchJson<any[]>(`${API_BASE}/governance/resolutions?communityId=${communityId}${classification ? `&classification=${classification}` : ''}`),

    // Minutes
    generateMinutesDraft: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/minutes/generate-draft`, { method: 'POST', body: JSON.stringify(data) }),
    approveMinutes: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/minutes/approve`, { method: 'POST', body: JSON.stringify(data) }),

    // Actions
    createActionItem: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/actions`, { method: 'POST', body: JSON.stringify(data) }),
    completeActionItem: (id: string) =>
      fetchJson<any>(`${API_BASE}/governance/actions/${id}/complete`, { method: 'POST' }),
    getActionItems: (communityId: string, status?: string) =>
      fetchJson<any[]>(`${API_BASE}/governance/actions?communityId=${communityId}${status ? `&status=${status}` : ''}`),

    // Notices & Acknowledgements
    publishNotice: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/notices`, { method: 'POST', body: JSON.stringify(data) }),
    getNotices: (communityId: string, noticeType?: string) =>
      fetchJson<any[]>(`${API_BASE}/governance/notices?communityId=${communityId}${noticeType ? `&noticeType=${noticeType}` : ''}`),
    recordNoticeRead: (id: string, residentId?: string) =>
      fetchJson<any>(`${API_BASE}/governance/notices/${id}/read`, { method: 'POST', body: JSON.stringify({ residentId }) }),
    acknowledgeNotice: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/notices/acknowledge`, { method: 'POST', body: JSON.stringify(data) }),

    // Policies
    createPolicy: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/policies`, { method: 'POST', body: JSON.stringify(data) }),
    revisePolicy: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/policies/revise`, { method: 'POST', body: JSON.stringify(data) }),
    getEffectivePolicy: (id: string, asOfDate?: string) =>
      fetchJson<any>(`${API_BASE}/governance/policies/${id}/effective${asOfDate ? `?asOfDate=${asOfDate}` : ''}`),
    acknowledgePolicy: (data: any) =>
      fetchJson<any>(`${API_BASE}/governance/policies/acknowledge`, { method: 'POST', body: JSON.stringify(data) }),
    getPolicies: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/governance/policies?communityId=${communityId}`),

    // Dashboard
    getDashboard: (communityId: string) =>
      fetchJson<any>(`${API_BASE}/governance/dashboard?communityId=${communityId}`),
    runAudit: (communityId: string) =>
      fetchJson<any>(`${API_BASE}/governance/dashboard/audit?communityId=${communityId}`),
  },
  // ==========================================
  // Phase 23: Enterprise Utilities & Sustainability
  // ==========================================
  utilities: {
    // Services & Sources
    getServices: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/utilities/services?communityId=${communityId}`),
    createService: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/services`, { method: 'POST', body: JSON.stringify(data) }),
    createSource: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/services/sources`, { method: 'POST', body: JSON.stringify(data) }),

    // Meters & Assignments
    getMeters: (communityId: string, serviceId?: string) =>
      fetchJson<any[]>(`${API_BASE}/utilities/meters?communityId=${communityId}${serviceId ? `&serviceId=${serviceId}` : ''}`),
    getMeterById: (id: string) =>
      fetchJson<any>(`${API_BASE}/utilities/meters/${id}`),
    createMeter: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/meters`, { method: 'POST', body: JSON.stringify(data) }),
    assignMeter: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/meters/assign`, { method: 'POST', body: JSON.stringify(data) }),
    replaceMeter: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/meters/replace`, { method: 'POST', body: JSON.stringify(data) }),

    // Readings
    recordReading: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/readings`, { method: 'POST', body: JSON.stringify(data) }),
    correctReading: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/readings/correct`, { method: 'POST', body: JSON.stringify(data) }),
    estimateReading: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/readings/estimate`, { method: 'POST', body: JSON.stringify(data) }),

    // Consumption & Allocation
    calculateConsumption: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/consumption/calculate`, { method: 'POST', body: JSON.stringify(data) }),
    adjustConsumption: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/consumption/adjust`, { method: 'POST', body: JSON.stringify(data) }),
    allocateCommon: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/consumption/allocate-common`, { method: 'POST', body: JSON.stringify(data) }),

    // Tariffs
    createTariffPlan: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/tariffs`, { method: 'POST', body: JSON.stringify(data) }),
    getEffectiveTariff: (serviceId: string, asOfDate?: string) =>
      fetchJson<any>(`${API_BASE}/utilities/tariffs/effective/${serviceId}${asOfDate ? `?asOfDate=${asOfDate}` : ''}`),

    // Charges & Handoff
    calculateCharge: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/charges/calculate`, { method: 'POST', body: JSON.stringify(data) }),
    handoffToBilling: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/charges/handoff`, { method: 'POST', body: JSON.stringify(data) }),

    // Water, Tankers & STP
    getWaterBalance: (communityId: string, periodStart: string, periodEnd: string) =>
      fetchJson<any>(`${API_BASE}/utilities/water/balance?communityId=${communityId}&periodStart=${periodStart}&periodEnd=${periodEnd}`),
    recordTanker: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/water/tankers`, { method: 'POST', body: JSON.stringify(data) }),
    getTankers: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/utilities/water/tankers?communityId=${communityId}`),
    recordSTPLog: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/water/stp-log`, { method: 'POST', body: JSON.stringify(data) }),

    // Energy, DG & Solar
    getEnergyBalance: (communityId: string, periodStart: string, periodEnd: string) =>
      fetchJson<any>(`${API_BASE}/utilities/energy/balance?communityId=${communityId}&periodStart=${periodStart}&periodEnd=${periodEnd}`),
    recordDGRun: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/energy/dg-runs`, { method: 'POST', body: JSON.stringify(data) }),
    getDGRuns: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/utilities/energy/dg-runs?communityId=${communityId}`),
    recordSolar: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/energy/solar-generation`, { method: 'POST', body: JSON.stringify(data) }),

    // Outages
    reportOutage: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/outages`, { method: 'POST', body: JSON.stringify(data) }),
    restoreOutage: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/outages/restore`, { method: 'POST', body: JSON.stringify(data) }),
    getOutages: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/utilities/outages?communityId=${communityId}`),

    // Anomalies
    detectAnomalies: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/anomalies/detect`, { method: 'POST', body: JSON.stringify(data) }),
    getAnomalies: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/utilities/anomalies?communityId=${communityId}`),

    // Sustainability
    calculateSustainability: (data: any) =>
      fetchJson<any>(`${API_BASE}/utilities/sustainability/calculate`, { method: 'POST', body: JSON.stringify(data) }),

    // Dashboard
    getDashboard: (communityId: string) =>
      fetchJson<any>(`${API_BASE}/utilities/dashboard?communityId=${communityId}`),
    runAudit: (communityId: string) =>
      fetchJson<any>(`${API_BASE}/utilities/dashboard/audit?communityId=${communityId}`),
  },
  // ==========================================
  // Phase 24: Enterprise Emergency, Safety, Risk & Compliance
  // ==========================================
  safetyCompliance: {
    // SOS
    raiseSOS: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/sos/raise`, { method: 'POST', body: JSON.stringify(data) }),
    acknowledgeSOS: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/sos/acknowledge`, { method: 'POST', body: JSON.stringify(data) }),
    getSOSAlerts: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/safety/sos?communityId=${communityId}`),

    // Incidents
    createIncident: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/incidents`, { method: 'POST', body: JSON.stringify(data) }),
    triageIncident: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/incidents/triage`, { method: 'POST', body: JSON.stringify(data) }),
    updateIncidentStatus: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/incidents/status`, { method: 'POST', body: JSON.stringify(data) }),
    getIncidentById: (id: string) =>
      fetchJson<any>(`${API_BASE}/safety/incidents/${id}`),
    getIncidents: (communityId: string, status?: string) =>
      fetchJson<any[]>(`${API_BASE}/safety/incidents?communityId=${communityId}${status ? `&status=${status}` : ''}`),

    // Command & Responders
    activateCommand: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/command/activate`, { method: 'POST', body: JSON.stringify(data) }),
    transferCommand: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/command/transfer`, { method: 'POST', body: JSON.stringify(data) }),
    assignResponder: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/command/responders`, { method: 'POST', body: JSON.stringify(data) }),

    // Actions & Playbooks
    createAction: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/actions`, { method: 'POST', body: JSON.stringify(data) }),
    completeAction: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/actions/complete`, { method: 'POST', body: JSON.stringify(data) }),
    getPlaybook: (communityId: string, incidentType: string) =>
      fetchJson<any>(`${API_BASE}/safety/playbooks/${incidentType}?communityId=${communityId}`),

    // Evacuation & Muster
    createEvacPlan: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/evacuation/plans`, { method: 'POST', body: JSON.stringify(data) }),
    orderEvacuation: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/evacuation/order`, { method: 'POST', body: JSON.stringify(data) }),
    confirmMusterStatus: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/muster/confirm`, { method: 'POST', body: JSON.stringify(data) }),
    residentSelfSafe: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/muster/self-safe`, { method: 'POST', body: JSON.stringify(data) }),
    getMusterSummary: (sessionId: string) =>
      fetchJson<any>(`${API_BASE}/safety/muster/summary/${sessionId}`),

    // Investigations & CAPA
    createInvestigation: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/investigations`, { method: 'POST', body: JSON.stringify(data) }),
    createCAPA: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/capa`, { method: 'POST', body: JSON.stringify(data) }),
    verifyCAPA: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/capa/verify`, { method: 'POST', body: JSON.stringify(data) }),
    getCAPA: (status?: string) =>
      fetchJson<any[]>(`${API_BASE}/safety/capa${status ? `?status=${status}` : ''}`),

    // Hazards & Risks
    reportHazard: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/hazards-risks/hazards`, { method: 'POST', body: JSON.stringify(data) }),
    assessRisk: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/hazards-risks/risks`, { method: 'POST', body: JSON.stringify(data) }),
    getRisks: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/safety/hazards-risks/risks?communityId=${communityId}`),

    // Inspections & Drills
    createInspection: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/inspections`, { method: 'POST', body: JSON.stringify(data) }),
    recordFinding: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/inspections/findings`, { method: 'POST', body: JSON.stringify(data) }),
    planDrill: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/drills/plan`, { method: 'POST', body: JSON.stringify(data) }),
    completeDrill: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/drills/complete`, { method: 'POST', body: JSON.stringify(data) }),

    // Compliance & Credentials
    createRequirement: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/compliance/requirements`, { method: 'POST', body: JSON.stringify(data) }),
    getRequirements: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/safety/compliance/requirements?communityId=${communityId}`),
    createCredential: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/credentials`, { method: 'POST', body: JSON.stringify(data) }),
    renewCredential: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/credentials/renew`, { method: 'POST', body: JSON.stringify(data) }),
    getCredentials: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/safety/credentials?communityId=${communityId}`),

    // Permits & Contacts
    createPermit: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/permits`, { method: 'POST', body: JSON.stringify(data) }),
    approvePermit: (data: any) =>
      fetchJson<any>(`${API_BASE}/safety/permits/approve`, { method: 'POST', body: JSON.stringify(data) }),
    getContacts: (communityId: string) =>
      fetchJson<any[]>(`${API_BASE}/safety/contacts?communityId=${communityId}`),

    // Dashboard
    getCommandCenter: (communityId: string) =>
      fetchJson<any>(`${API_BASE}/safety/dashboard/command-center?communityId=${communityId}`),
    runAudit: (communityId: string) =>
      fetchJson<any>(`${API_BASE}/safety/dashboard/audit?communityId=${communityId}`),
  },
  // ==========================================
  // Phase 25: Enterprise Analytics, BI, Search & AI
  // ==========================================
  analytics: {
    // Executive Command Center & Query
    getExecutiveOverview: (communityId?: string, organizationId?: string) =>
      fetchJson<any>(`${API_BASE}/analytics/dashboards/executive-overview?${communityId ? `communityId=${communityId}` : ''}${organizationId ? `&organizationId=${organizationId}` : ''}`),
    executeQuery: (data: any) =>
      fetchJson<any>(`${API_BASE}/analytics/query`, { method: 'POST', body: JSON.stringify(data) }),

    // Metrics & Targets
    getMetrics: (domain?: string) =>
      fetchJson<any[]>(`${API_BASE}/analytics/metrics${domain ? `?domain=${domain}` : ''}`),
    getMetric: (key: string) =>
      fetchJson<any>(`${API_BASE}/analytics/metrics/${key}`),
    registerMetric: (data: any) =>
      fetchJson<any>(`${API_BASE}/analytics/metrics`, { method: 'POST', body: JSON.stringify(data) }),
    setTarget: (data: any) =>
      fetchJson<any>(`${API_BASE}/analytics/metrics/targets`, { method: 'POST', body: JSON.stringify(data) }),

    // Portfolio
    getPortfolioComparison: (organizationId: string) =>
      fetchJson<any[]>(`${API_BASE}/analytics/portfolio/comparison?organizationId=${organizationId}`),

    // Reports & Schedules
    getReports: (domain?: string) =>
      fetchJson<any[]>(`${API_BASE}/analytics/reports${domain ? `?domain=${domain}` : ''}`),
    createReport: (data: any) =>
      fetchJson<any>(`${API_BASE}/analytics/reports`, { method: 'POST', body: JSON.stringify(data) }),
    scheduleReport: (data: any) =>
      fetchJson<any>(`${API_BASE}/analytics/reports/schedule`, { method: 'POST', body: JSON.stringify(data) }),
    generateSnapshot: (reportId: string) =>
      fetchJson<any>(`${API_BASE}/analytics/reports/snapshots/${reportId}`, { method: 'POST' }),

    // Insights, Anomalies & Alerts
    getInsights: (communityId?: string) =>
      fetchJson<any[]>(`${API_BASE}/analytics/insights/insights${communityId ? `?communityId=${communityId}` : ''}`),
    getAnomalies: (communityId?: string) =>
      fetchJson<any[]>(`${API_BASE}/analytics/insights/anomalies${communityId ? `?communityId=${communityId}` : ''}`),
    getAlerts: (communityId?: string, status?: string) =>
      fetchJson<any[]>(`${API_BASE}/analytics/alerts?${communityId ? `communityId=${communityId}` : ''}${status ? `&status=${status}` : ''}`),
    acknowledgeAlert: (id: string) =>
      fetchJson<any>(`${API_BASE}/analytics/alerts/acknowledge/${id}`, { method: 'POST' }),
  },

  search: {
    globalSearch: (data: any) =>
      fetchJson<any[]>(`${API_BASE}/search`, { method: 'POST', body: JSON.stringify(data) }),
  },

  ai: {
    askAssistant: (data: any) =>
      fetchJson<any>(`${API_BASE}/ai/assistant/query`, { method: 'POST', body: JSON.stringify(data) }),
    askDocumentQA: (data: any) =>
      fetchJson<any>(`${API_BASE}/ai/documents/query`, { method: 'POST', body: JSON.stringify(data) }),
    submitFeedback: (data: any) =>
      fetchJson<any>(`${API_BASE}/ai/feedback`, { method: 'POST', body: JSON.stringify(data) }),
  },
};

export const api = apiClient;
