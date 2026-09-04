import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '@/app/login/page';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock useAuth
const mockLogin = vi.fn();
vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    login: mockLogin,
    user: null,
    isLoading: false,
    isAuthenticated: false,
    isPlatformAdmin: false,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form inputs and submit button', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/Corporate Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in to Console/i })).toBeInTheDocument();
  });

  it('handles submission and navigation on success', async () => {
    mockLogin.mockResolvedValueOnce(undefined);

    render(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: /Sign in to Console/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@communityos.io', 'Admin@CommunityOS2026!');
      expect(mockPush).toHaveBeenCalledWith('/app');
    });
  });

  it('displays error message on authentication failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid email or password.'));

    render(<LoginPage />);

    const submitBtn = screen.getByRole('button', { name: /Sign in to Console/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password./i)).toBeInTheDocument();
    });
  });
});
