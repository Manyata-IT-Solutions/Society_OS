'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiClientError } from '@/lib/api-client';

interface ResidentSummary {
  id: string;
  organizationId: string;
  communityId: string;
  displayName: string;
  firstName: string;
  lastName: string;
  status: string;
  hasUserLinked: boolean;
  createdAt: string;
}

interface ResidentDetail extends ResidentSummary {
  userId: string | null;
  middleName: string | null;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  preferredLanguage: string;
  ownerships?: Array<{
    id: string;
    unitId: string;
    ownershipShare: number | null;
    ownershipType: string;
    isPrimaryOwner: boolean;
    startDate: string;
    status: string;
    unit?: { id: string; unitNumber: string; displayName: string };
  }>;
  householdMemberships?: Array<{
    id: string;
    householdId: string;
    relationshipType: string;
    isPrimaryContact: boolean;
    status: string;
  }>;
}

export default function CommunityResidentsPage() {
  const params = useParams<{ id: string }>();
  const communityId = params?.id || '';
  const router = useRouter();

  const [community, setCommunity] = useState<any>(null);
  const [residents, setResidents] = useState<ResidentSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Modals
  const [selectedResident, setSelectedResident] = useState<ResidentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMoveInModal, setShowMoveInModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Create Resident Form
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: '',
    preferredLanguage: 'en',
  });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Move-In Wizard Form
  const [units, setUnits] = useState<any[]>([]);
  const [moveInForm, setMoveInForm] = useState({
    unitId: '',
    occupancyType: 'OWNER_OCCUPIED',
    effectiveDate: new Date().toISOString().slice(0, 10),
    householdName: '',
    primaryFirstName: '',
    primaryLastName: '',
    primaryEmail: '',
    primaryPhone: '',
    agreementReference: '',
    leaseEndDate: '',
    sendAppInvitations: true,
  });
  const [moveInLoading, setMoveInLoading] = useState(false);
  const [moveInError, setMoveInError] = useState<string | null>(null);

  // CSV Import State
  const [importCsvText, setImportCsvText] = useState('');
  const [importValidation, setImportValidation] = useState<any>(null);
  const [importing, setImporting] = useState(false);

  // Load Community and Residents
  const loadData = useCallback(async () => {
    if (!communityId) return;
    setLoading(true);
    setError(null);

    try {
      const [commData, resData, unitsData] = await Promise.all([
        api.getCommunity(communityId),
        api.residents.listResidents(communityId, {
          search: search || undefined,
          status: statusFilter || undefined,
          hasUser: userFilter === 'true' ? true : userFilter === 'false' ? false : undefined,
        }),
        api.property.listUnits(communityId, { limit: 100 }),
      ]);

      setCommunity(commData);
      setResidents(resData.items || []);
      setTotal(resData.total || 0);
      setUnits(unitsData.data || []);
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setError(err.message);
      } else {
        setError('Failed to load residents.');
      }
    } finally {
      setLoading(false);
    }
  }, [communityId, search, statusFilter, userFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Single Resident Detail
  const handleViewResident = async (id: string) => {
    setLoadingDetail(true);
    try {
      const detail = await api.residents.getResident(id);
      setSelectedResident(detail);
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Invite Resident
  const handleInvite = async (id: string) => {
    if (!confirm('Invite this resident to create an application login account?')) return;
    try {
      await api.residents.inviteResident(id);
      alert('Invitation sent and user account provisioned.');
      loadData();
      if (selectedResident && selectedResident.id === id) {
        handleViewResident(id);
      }
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  // Create Resident Handler
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    try {
      await api.residents.createResident(communityId, {
        firstName: createForm.firstName,
        lastName: createForm.lastName,
        email: createForm.email || undefined,
        phone: createForm.phone || undefined,
        gender: createForm.gender || undefined,
        preferredLanguage: createForm.preferredLanguage || 'en',
      });
      setShowCreateModal(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        gender: '',
        preferredLanguage: 'en',
      });
      loadData();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setCreateError(err.message);
      } else {
        setCreateError('Failed to create resident.');
      }
    } finally {
      setCreateLoading(false);
    }
  };

  // Move-In Handler
  const handleMoveInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveInForm.unitId) {
      setMoveInError('Please select a unit.');
      return;
    }

    setMoveInLoading(true);
    setMoveInError(null);

    try {
      await api.occupancies.moveIn(moveInForm.unitId, {
        unitId: moveInForm.unitId,
        occupancyType: moveInForm.occupancyType,
        effectiveDate: moveInForm.effectiveDate,
        householdName: moveInForm.householdName || undefined,
        primaryResident: {
          firstName: moveInForm.primaryFirstName,
          lastName: moveInForm.primaryLastName,
          email: moveInForm.primaryEmail || undefined,
          phone: moveInForm.primaryPhone || undefined,
          relationshipType: 'SELF',
        },
        agreementReference: moveInForm.agreementReference || undefined,
        leaseEndDate: moveInForm.leaseEndDate || undefined,
        isNewOwner: moveInForm.occupancyType === 'OWNER_OCCUPIED',
        sendAppInvitations: moveInForm.sendAppInvitations,
      });

      setShowMoveInModal(false);
      setMoveInForm({
        unitId: '',
        occupancyType: 'OWNER_OCCUPIED',
        effectiveDate: new Date().toISOString().slice(0, 10),
        householdName: '',
        primaryFirstName: '',
        primaryLastName: '',
        primaryEmail: '',
        primaryPhone: '',
        agreementReference: '',
        leaseEndDate: '',
        sendAppInvitations: true,
      });
      loadData();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setMoveInError(err.message);
      } else {
        setMoveInError('Move-in execution failed.');
      }
    } finally {
      setMoveInLoading(false);
    }
  };

  // CSV Import Validation Handler
  const handleValidateCsv = async () => {
    if (!importCsvText.trim()) return;
    try {
      const lines = importCsvText.trim().split('\n');
      if (lines.length <= 1) {
        alert('CSV must contain header row and at least 1 data row.');
        return;
      }

      const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const rows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i]!.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 3) continue;

        const rowObj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          rowObj[h] = cols[idx] || '';
        });

        rows.push({
          unitNumber: rowObj['unitNumber'] || rowObj['Unit'] || cols[0],
          buildingCode: rowObj['buildingCode'] || rowObj['Building'] || undefined,
          firstName: rowObj['firstName'] || rowObj['FirstName'] || cols[1] || 'Resident',
          lastName: rowObj['lastName'] || rowObj['LastName'] || cols[2] || 'User',
          phone: rowObj['phone'] || rowObj['Phone'] || undefined,
          email: rowObj['email'] || rowObj['Email'] || undefined,
          roleInUnit: (rowObj['role'] || 'OWNER').toUpperCase(),
          relationshipType: 'SELF',
          isPrimaryContact: true,
        });
      }

      const valResult = await api.residents.validateImport(communityId, rows);
      setImportValidation({ ...valResult, parsedRows: rows });
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  // Commit CSV Import
  const handleCommitCsv = async () => {
    if (!importValidation || !importValidation.parsedRows) return;
    setImporting(true);
    try {
      await api.residents.commitImport(communityId, {
        rows: importValidation.parsedRows,
        sourceFileName: 'resident-bulk-upload.csv',
      });
      alert('Residents imported successfully.');
      setShowImportModal(false);
      setImportCsvText('');
      setImportValidation(null);
      loadData();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
              <Link href="/app/organizations" className="hover:text-indigo-600">
                Organizations
              </Link>
              <span>/</span>
              <Link href={`/app/communities/${communityId}`} className="hover:text-indigo-600">
                {community?.name || 'Community'}
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-medium">Residents & Households</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <span>👥</span> Resident Directory & Master
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/app/communities/${communityId}/property`}
              className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              🏢 Property Units
            </Link>
            <button
              onClick={() => setShowImportModal(true)}
              className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              📥 Import CSV
            </button>
            <a
              href={api.residents.getExportResidentsUrl(communityId)}
              className="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              📤 Export CSV
            </a>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            >
              + Add Resident
            </button>
            <button
              onClick={() => setShowMoveInModal(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition"
            >
              🚚 Move-In Wizard
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-6">
        {/* Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 w-72"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="PENDING">PENDING</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Account States</option>
              <option value="true">Linked User Account</option>
              <option value="false">Unlinked (Profile Only)</option>
            </select>
          </div>

          <div className="text-sm text-slate-500">
            Total Residents: <strong className="text-slate-800">{total}</strong>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Residents Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading residents directory...</div>
          ) : residents.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-lg font-medium text-slate-700 mb-2">No residents found</p>
              <p className="text-sm text-slate-500 mb-4">
                Get started by creating a resident profile or launching the Move-In Wizard.
              </p>
              <button
                onClick={() => setShowMoveInModal(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
              >
                Launch Move-In Wizard
              </button>
            </div>
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Resident</th>
                  <th className="py-3 px-4">Account Link</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {residents.map((res) => (
                  <tr key={res.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{res.displayName}</div>
                      <div className="text-xs text-slate-500 font-mono">{res.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      {res.hasUserLinked ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                          ✓ App User Linked
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                          Profile Only
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          res.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800'
                            : res.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {res.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-xs">
                      {new Date(res.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewResident(res.id)}
                          className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded border border-indigo-200"
                        >
                          View Details
                        </button>
                        {!res.hasUserLinked && (
                          <button
                            onClick={() => handleInvite(res.id)}
                            className="px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-200"
                          >
                            Invite User
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Resident Detail Modal */}
      {selectedResident && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{selectedResident.displayName}</h3>
                <span className="text-xs text-slate-400 font-mono">{selectedResident.id}</span>
              </div>
              <button
                onClick={() => setSelectedResident(null)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-sm">
                  <div>
                    <span className="text-slate-500 block text-xs">Email Address</span>
                    <span className="font-medium text-slate-800">
                      {selectedResident.email || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Phone Number</span>
                    <span className="font-medium text-slate-800">
                      {selectedResident.phone || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Gender</span>
                    <span className="font-medium text-slate-800">
                      {selectedResident.gender || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Preferred Language</span>
                    <span className="font-medium text-slate-800">
                      {selectedResident.preferredLanguage || 'en'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Owned Units */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Legal Property Titles & Ownership
                </h4>
                {selectedResident.ownerships && selectedResident.ownerships.length > 0 ? (
                  <div className="space-y-2">
                    {selectedResident.ownerships.map((own) => (
                      <div
                        key={own.id}
                        className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-between text-sm"
                      >
                        <div>
                          <strong className="text-indigo-950 font-semibold">
                            Unit {own.unit?.unitNumber || own.unitId}
                          </strong>
                          <span className="text-xs text-indigo-700 ml-2">
                            ({own.ownershipType} •{' '}
                            {own.ownershipShare ? `${own.ownershipShare}%` : '100%'})
                          </span>
                        </div>
                        <span className="text-xs text-indigo-600">
                          Since {new Date(own.startDate).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">
                    No legal ownership records on file.
                  </p>
                )}
              </div>

              {/* User Account Link */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Authentication & Login Account
                </h4>
                <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between">
                  {selectedResident.userId ? (
                    <div className="text-sm">
                      <span className="text-emerald-700 font-semibold block">
                        ✓ Connected to User Account
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        User ID: {selectedResident.userId}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm text-slate-600 block">
                        No User authentication account connected.
                      </span>
                      <span className="text-xs text-slate-500">
                        Resident has no active login credentials.
                      </span>
                    </div>
                  )}

                  {!selectedResident.userId && (
                    <button
                      onClick={() => handleInvite(selectedResident.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                    >
                      Provision & Invite
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t pt-4 flex justify-end">
              <button
                onClick={() => setSelectedResident(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Add Resident Profile</h3>

            {createError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone (E.164 format)
                </label>
                <input
                  type="tel"
                  placeholder="+12025550100"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    value={createForm.gender}
                    onChange={(e) => setCreateForm({ ...createForm, gender: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Language</label>
                  <input
                    type="text"
                    value={createForm.preferredLanguage}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, preferredLanguage: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Resident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Move-In Wizard Modal */}
      {showMoveInModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <span>🚚</span> Transactional Move-In Wizard
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Atomically establishes household, residents, ownership/lease, and active occupancy.
            </p>

            {moveInError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {moveInError}
              </div>
            )}

            <form onSubmit={handleMoveInSubmit} className="space-y-4">
              {/* Unit Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Unit *
                </label>
                <select
                  required
                  value={moveInForm.unitId}
                  onChange={(e) => setMoveInForm({ ...moveInForm, unitId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select Unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unitNumber} ({u.displayName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Occupancy Type & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Occupancy Type *
                  </label>
                  <select
                    value={moveInForm.occupancyType}
                    onChange={(e) =>
                      setMoveInForm({ ...moveInForm, occupancyType: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="OWNER_OCCUPIED">Owner Occupied</option>
                    <option value="TENANT_OCCUPIED">Tenant Occupied (Rental)</option>
                    <option value="FAMILY_OCCUPIED">Family Occupied</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Effective Move-In Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={moveInForm.effectiveDate}
                    onChange={(e) =>
                      setMoveInForm({ ...moveInForm, effectiveDate: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Primary Resident Details */}
              <div className="border-t pt-3">
                <h4 className="text-xs font-bold text-slate-600 mb-2 uppercase">
                  Primary Resident & Contact
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={moveInForm.primaryFirstName}
                      onChange={(e) =>
                        setMoveInForm({ ...moveInForm, primaryFirstName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={moveInForm.primaryLastName}
                      onChange={(e) =>
                        setMoveInForm({ ...moveInForm, primaryLastName: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={moveInForm.primaryEmail}
                      onChange={(e) =>
                        setMoveInForm({ ...moveInForm, primaryEmail: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={moveInForm.primaryPhone}
                      onChange={(e) =>
                        setMoveInForm({ ...moveInForm, primaryPhone: e.target.value })
                      }
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Rental Details (if Tenant Occupied) */}
              {moveInForm.occupancyType === 'TENANT_OCCUPIED' && (
                <div className="border-t pt-3 bg-amber-50/50 p-3 rounded-lg border border-amber-200">
                  <h4 className="text-xs font-bold text-amber-900 mb-2 uppercase">
                    Rental Lease Agreement
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Agreement Reference
                      </label>
                      <input
                        type="text"
                        placeholder="LEASE-2026-001"
                        value={moveInForm.agreementReference}
                        onChange={(e) =>
                          setMoveInForm({ ...moveInForm, agreementReference: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Lease Expiration Date
                      </label>
                      <input
                        type="date"
                        value={moveInForm.leaseEndDate}
                        onChange={(e) =>
                          setMoveInForm({ ...moveInForm, leaseEndDate: e.target.value })
                        }
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="sendAppInvitations"
                  checked={moveInForm.sendAppInvitations}
                  onChange={(e) =>
                    setMoveInForm({ ...moveInForm, sendAppInvitations: e.target.checked })
                  }
                  className="h-4 w-4 text-indigo-600 rounded"
                />
                <label htmlFor="sendAppInvitations" className="text-xs text-slate-700 font-medium">
                  Automatically provision User account and send app invitation email
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowMoveInModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={moveInLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {moveInLoading ? 'Executing Move-In...' : 'Confirm Move-In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
              <span>📥</span> Bulk Resident & Household CSV Import
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Paste or upload CSV with columns: `unitNumber`, `firstName`, `lastName`, `email`,
              `phone`, `role` (OWNER/TENANT).
            </p>

            <div className="space-y-4">
              <textarea
                rows={6}
                value={importCsvText}
                onChange={(e) => setImportCsvText(e.target.value)}
                placeholder="unitNumber,firstName,lastName,email,phone,role
101,John,Doe,john@example.com,+12025550101,OWNER
102,Jane,Smith,jane@example.com,+12025550102,TENANT"
                className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              />

              <div className="flex gap-3">
                <button
                  onClick={handleValidateCsv}
                  className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100"
                >
                  1. Validate Data
                </button>
              </div>

              {/* Validation Results */}
              {importValidation && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">Validation Summary:</span>
                    <span
                      className={`font-bold ${importValidation.isValid ? 'text-emerald-600' : 'text-red-600'}`}
                    >
                      {importValidation.isValid
                        ? '✓ All Rows Valid'
                        : '⚠ Validation Errors Detected'}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 grid grid-cols-3 gap-2">
                    <div>Total: {importValidation.totalRows}</div>
                    <div className="text-emerald-600 font-medium">
                      Valid: {importValidation.validRowsCount}
                    </div>
                    <div className="text-red-600 font-medium">
                      Errors: {importValidation.errorRowsCount}
                    </div>
                  </div>

                  {importValidation.errors?.length > 0 && (
                    <div className="max-h-32 overflow-y-auto space-y-1 border-t pt-2">
                      {importValidation.errors.map((err: any, idx: number) => (
                        <div key={idx} className="text-xs text-red-600">
                          Row {err.rowNumber}: [{err.field}] {err.message}
                        </div>
                      ))}
                    </div>
                  )}

                  {importValidation.isValid && (
                    <div className="pt-2">
                      <button
                        onClick={handleCommitCsv}
                        disabled={importing}
                        className="w-full py-2.5 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {importing ? 'Importing Rows...' : '2. Commit and Create Residents'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-4 border-t">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
