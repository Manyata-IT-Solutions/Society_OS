import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HomePage from '@/app/page';

describe('HomePage', () => {
  it('renders the main heading and platform title', () => {
    render(<HomePage />);
    expect(screen.getByText('Community OS')).toBeInTheDocument();
    expect(
      screen.getByText('The Enterprise Operating System for Residential Communities'),
    ).toBeInTheDocument();
  });

  it('contains links to sign in and management console', () => {
    render(<HomePage />);
    expect(screen.getByRole('link', { name: /Sign In to Console/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open Management Console/i })).toBeInTheDocument();
  });
});
