import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OrganizationsPage from '@/app/app/organizations/page';
import { apiClient } from '@/lib/api-client';

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    listOrganizations: vi.fn(),
    createOrganization: vi.fn(),
  },
}));

describe('OrganizationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders organizations list with data from API', async () => {
    vi.mocked(apiClient.listOrganizations).mockResolvedValue({
      data: [
        {
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Acme Property Management',
          slug: 'acme-property-mgmt',
          legalName: 'Acme LLC',
          status: 'ACTIVE',
          defaultCurrency: 'INR',
          defaultTimezone: 'Asia/Kolkata',
          defaultLocale: 'en-IN',
          settings: {},
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      meta: {
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    });

    render(<OrganizationsPage />);

    expect(screen.getByText('Organizations & Enterprise Accounts')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Acme Property Management')).toBeInTheDocument();
      expect(screen.getByText('acme-property-mgmt')).toBeInTheDocument();
      expect(screen.getByText('Acme LLC')).toBeInTheDocument();
    });
  });

  it('renders empty state when no organizations exist', async () => {
    vi.mocked(apiClient.listOrganizations).mockResolvedValue({
      data: [],
      meta: {
        pagination: {
          page: 1,
          limit: 10,
          totalItems: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    });

    render(<OrganizationsPage />);

    await waitFor(() => {
      expect(screen.getByText('No organizations found')).toBeInTheDocument();
    });
  });
});
