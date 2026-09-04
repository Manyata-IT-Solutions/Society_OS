'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Building2,
  Cpu,
  Layers,
  FileText,
  Save,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';

export default function NewAssetPage() {
  const router = useRouter();
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';

  const [categories, setCategories] = useState<any[]>([]);
  const [models, setModels] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assetCategoryId: '',
    assetModelId: '',
    serialNumber: '',
    manufacturer: '',
    modelNumber: '',
    criticality: 'MEDIUM',
    condition: 'GOOD',
    locationType: 'BUILDING',
    buildingId: '',
    locationDescription: '',
    isMovable: false,
    purchaseDate: '',
    installationDate: '',
    expectedLifeYears: '',
  });

  useEffect(() => {
    async function loadMeta() {
      setLoading(true);
      try {
        const [catRes, modRes, bldRes] = await Promise.all([
          api.assetCategories.list({ organizationId: orgId, communityId: commId }),
          api.assetModels.list({ organizationId: orgId, communityId: commId, limit: 100 }),
          api.property
            .listBuildings(commId)
            .then((res: any) => res.data || [])
            .catch(() => []),
        ]);
        setCategories(catRes || []);
        setModels(modRes?.items || []);
        setBuildings(Array.isArray(bldRes) ? bldRes : []);
      } catch (err) {
        console.error('Failed to load metadata', err);
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  const handleModelChange = (modelId: string) => {
    const selected = models.find((m) => m.id === modelId);
    if (selected) {
      setFormData((prev) => ({
        ...prev,
        assetModelId: modelId,
        assetCategoryId: selected.categoryId || prev.assetCategoryId,
        manufacturer: selected.manufacturer || prev.manufacturer,
        modelNumber: selected.modelNumber || prev.modelNumber,
        expectedLifeYears: selected.expectedLifeYears
          ? String(selected.expectedLifeYears)
          : prev.expectedLifeYears,
      }));
    } else {
      setFormData((prev) => ({ ...prev, assetModelId: modelId }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.assetCategoryId) {
      setError('Name and Asset Category are required');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        organizationId: orgId,
        communityId: commId,
        name: formData.name,
        description: formData.description || undefined,
        assetCategoryId: formData.assetCategoryId,
        assetModelId: formData.assetModelId || undefined,
        serialNumber: formData.serialNumber || undefined,
        manufacturer: formData.manufacturer || undefined,
        modelNumber: formData.modelNumber || undefined,
        criticality: formData.criticality,
        condition: formData.condition,
        locationType: formData.locationType,
        buildingId: formData.buildingId || undefined,
        locationDescription: formData.locationDescription || undefined,
        isMovable: formData.isMovable,
        purchaseDate: formData.purchaseDate
          ? new Date(formData.purchaseDate).toISOString()
          : undefined,
        installationDate: formData.installationDate
          ? new Date(formData.installationDate).toISOString()
          : undefined,
        expectedLifeYears: formData.expectedLifeYears
          ? Number(formData.expectedLifeYears)
          : undefined,
      };

      const result = await api.assets.create(payload);
      router.push(`/app/assets/${result.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create asset');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-4">
        <Link
          href="/app/assets"
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Boxes className="h-6 w-6 text-primary" />
            Register Physical Asset
          </h1>
          <p className="text-sm text-muted-foreground">
            Onboard a new physical item into the asset registry with automated sequence code &
            opaque QR token generation.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Classification */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            1. Classification & Model
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Asset Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Primary Backup Diesel Generator (DG-01)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Asset Category <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.assetCategoryId}
                onChange={(e) => setFormData({ ...formData, assetCategoryId: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="">Select Category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Asset Model Specification (Optional)
              </label>
              <select
                value={formData.assetModelId}
                onChange={(e) => handleModelChange(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
              >
                <option value="">None / Custom Non-Catalog Asset</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.modelName} ({m.manufacturer} - {m.modelNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Serial Number
              </label>
              <input
                type="text"
                placeholder="e.g. CUM-2024-DG500-0194"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm font-mono focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Manufacturer
              </label>
              <input
                type="text"
                placeholder="e.g. Cummins India Ltd"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Model Number
              </label>
              <input
                type="text"
                placeholder="e.g. C500D5P"
                value={formData.modelNumber}
                onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Description & Operational Scope
            </label>
            <textarea
              rows={2}
              placeholder="Detailed technical description and functional role in the property..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Location & Placement */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            2. Location & Placement
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Location Hierarchy Type
              </label>
              <select
                value={formData.locationType}
                onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
              >
                <option value="COMMUNITY">Community Common Area</option>
                <option value="BUILDING">Building / Tower</option>
                <option value="FLOOR">Floor</option>
                <option value="UNIT">Unit</option>
                <option value="OTHER">Other / Site Facility</option>
              </select>
            </div>

            {formData.locationType === 'BUILDING' && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Target Building
                </label>
                <select
                  value={formData.buildingId}
                  onChange={(e) => setFormData({ ...formData, buildingId: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="">Select Building...</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Specific Location Description
              </label>
              <input
                type="text"
                placeholder="e.g. Tower A Basement 1 — Heavy Engineering Room 01"
                value={formData.locationDescription}
                onChange={(e) => setFormData({ ...formData, locationDescription: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
              />
            </div>
          </div>
        </div>

        {/* Operational Attributes & Lifecycle */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            3. Criticality & Lifecycle
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Criticality
              </label>
              <select
                value={formData.criticality}
                onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm font-medium"
              >
                <option value="CRITICAL">CRITICAL (Failure causes immediate severe outage)</option>
                <option value="HIGH">HIGH (Essential property service)</option>
                <option value="MEDIUM">MEDIUM (Standard utility)</option>
                <option value="LOW">LOW (Non-critical / aesthetic)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Initial Condition
              </label>
              <select
                value={formData.condition}
                onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
              >
                <option value="GOOD">GOOD (New / Perfect working order)</option>
                <option value="FAIR">FAIR (Normal operational wear)</option>
                <option value="POOR">POOR (Requires maintenance / servicing)</option>
                <option value="CRITICAL">CRITICAL (Degraded / at risk)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Expected Useful Life (Years)
              </label>
              <input
                type="number"
                placeholder="e.g. 15"
                value={formData.expectedLifeYears}
                onChange={(e) => setFormData({ ...formData, expectedLifeYears: e.target.value })}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Link
            href="/app/assets"
            className="px-4 py-2 border border-border text-sm font-medium rounded-lg text-foreground bg-card hover:bg-surface-muted transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-5 py-2 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {submitting ? 'Registering...' : 'Register Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}
