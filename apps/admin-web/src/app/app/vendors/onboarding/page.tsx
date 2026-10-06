'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { UserCheck, Building2, CheckCircle2 } from 'lucide-react';

export default function VendorOnboardingPage() {
  const [legalName, setLegalName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [vendorType, setVendorType] = useState('SUPPLIER');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gstin, setGstin] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const orgId = '00000000-0000-0000-0000-000000000001';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const v = await api.vendors.create({
        organizationId: orgId,
        legalName,
        displayName,
        vendorType,
        primaryEmail: email,
        primaryPhone: phone,
        addresses: [
          {
            addressType: 'REGISTERED',
            addressLine1,
            city,
            state,
            postalCode,
            countryCode: 'IND',
            isPrimary: true,
          },
        ],
        taxRegistrations: gstin
          ? [
              {
                countryCode: 'IND',
                registrationType: 'GSTIN',
                registrationNumber: gstin,
              },
            ]
          : [],
      });

      // Submit and approve
      await api.vendors.submitForReview(v.id, orgId);
      await api.vendors.approve(v.id, orgId);

      alert('Vendor registered and approved successfully!');
      window.location.href = '/app/vendors';
    } catch (err: any) {
      alert(err.message || 'Error onboarding vendor');
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vendor Registration & Onboarding</h1>
        <p className="text-sm text-muted">
          Register a new enterprise supplier, AMC service provider, or facility contractor.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-surface border border-border rounded-xl p-6 space-y-5 shadow-sm"
      >
        <div className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Basic Master Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Apex Electricals"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Legal Entity Name</label>
              <input
                type="text"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Apex Electrical Solutions Pvt Ltd"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Vendor Type</label>
              <select
                value={vendorType}
                onChange={(e) => setVendorType(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
              >
                <option value="SUPPLIER">SUPPLIER</option>
                <option value="SERVICE_PROVIDER">SERVICE_PROVIDER</option>
                <option value="CONTRACTOR">CONTRACTOR</option>
                <option value="AMC_PROVIDER">AMC_PROVIDER</option>
                <option value="CONSULTANT">CONSULTANT</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@apex.com"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Tax & Statutory Registration
          </h3>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">GSTIN Number</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              placeholder="e.g. 29ABCDE1234F1Z5"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm font-mono uppercase"
            />
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Registered Address
          </h3>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Address Line</label>
            <input
              type="text"
              required
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="Building, Street, Area"
              className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">City</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">State</label>
              <input
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Postal Code</label>
              <input
                type="text"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-sm hover:opacity-90"
          >
            Submit & Approve Vendor
          </button>
        </div>
      </form>
    </div>
  );
}
