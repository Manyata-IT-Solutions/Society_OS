'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Building2, ArrowLeft, AlertCircle } from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import type { OrganizationResponseDto } from '@community-os/contracts';

export default function NewCommunityPage() {
  const params = useParams();
  const router = useRouter();
  const orgId = params['id'] as string;

  const [organization, setOrganization] = useState<OrganizationResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    slug: '',
    timezone: 'Asia/Kolkata',
    locale: 'en-IN',
    currency: 'INR',
    addressLine1: '',
    addressLine2: '',
    locality: '',
    city: 'Bengaluru',
    region: 'Karnataka',
    postalCode: '',
    countryCode: 'IN',
  });

  const loadOrg = useCallback(async () => {
    setIsLoading(true);
    try {
      const org = await apiClient.getOrganization(orgId);
      setOrganization(org);
      setFormData((prev) => ({
        ...prev,
        currency: org.defaultCurrency || 'INR',
        timezone: org.defaultTimezone || 'Asia/Kolkata',
        locale: org.defaultLocale || 'en-IN',
      }));
    } catch (err) {
      setError((err as Error).message || 'Failed to load parent organization.');
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    loadOrg();
  }, [loadOrg]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.createCommunity(orgId, {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        slug: formData.slug.trim().toLowerCase(),
        timezone: formData.timezone,
        locale: formData.locale,
        currency: formData.currency,
        address: {
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim() || undefined,
          locality: formData.locality.trim() || undefined,
          city: formData.city.trim(),
          region: formData.region.trim() || undefined,
          postalCode: formData.postalCode.trim(),
          countryCode: formData.countryCode.trim().toUpperCase(),
        },
      });

      router.push(`/app/organizations/${orgId}`);
    } catch (err) {
      setError((err as ApiClientError).message || 'Failed to create community.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted">Loading organization...</div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Top Breadcrumb */}
      <div>
        <Link
          href={`/app/organizations/${orgId}`}
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {organization?.name || 'Organization'}
        </Link>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6">
        <div className="flex items-center space-x-3 border-b border-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Provision New Community</h1>
            <p className="text-xs text-muted">
              Add a residential society or township under{' '}
              <span className="font-semibold text-foreground">{organization?.name}</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          {/* General Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Core Details</h3>
            <div>
              <label className="block text-xs font-semibold mb-1">Community Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Palm Meadows Heights"
                value={formData.name}
                onChange={(e) => {
                  const name = e.target.value;
                  const autoSlug = name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                  const autoCode =
                    name
                      .split(' ')
                      .map((w) => w[0])
                      .join('')
                      .toUpperCase() + '-01';
                  setFormData((prev) => ({
                    ...prev,
                    name,
                    slug: prev.slug === '' ? autoSlug : prev.slug,
                    code: prev.code === '' ? autoCode : prev.code,
                  }));
                }}
                className="w-full rounded-md border border-border bg-background py-2 px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Community Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PMH-01"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 font-mono text-sm uppercase focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <span className="text-[10px] text-muted">Unique code within organization.</span>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Slug Identifier *</label>
                <input
                  type="text"
                  required
                  pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                  placeholder="e.g. palm-meadows-heights"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Regional Settings */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Regional & Financial
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Currency *</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="SGD">SGD (S$)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Timezone *</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="Asia/Dubai">Asia/Dubai</option>
                  <option value="Asia/Singapore">Asia/Singapore</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Locale *</label>
                <select
                  value={formData.locale}
                  onChange={(e) => setFormData({ ...formData, locale: e.target.value })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="en-IN">en-IN</option>
                  <option value="en-US">en-US</option>
                  <option value="en-GB">en-GB</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4 pt-4 border-t border-border">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
              Physical Property Address
            </h3>

            <div>
              <label className="block text-xs font-semibold mb-1">Address Line 1 *</label>
              <input
                type="text"
                required
                placeholder="Street address, survey no, or plot"
                value={formData.addressLine1}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                className="w-full rounded-md border border-border bg-background py-2 px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Address Line 2</label>
                <input
                  type="text"
                  placeholder="Apartment, suite, landmark"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Locality / Sector</label>
                <input
                  type="text"
                  placeholder="e.g. Whitefield"
                  value={formData.locality}
                  onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">City *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bengaluru"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">State / Region</label>
                <input
                  type="text"
                  placeholder="e.g. Karnataka"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Postal Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 560066"
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  className="w-full rounded-md border border-border bg-background py-2 px-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Link
              href={`/app/organizations/${orgId}`}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Provisioning...' : 'Provision Community'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
