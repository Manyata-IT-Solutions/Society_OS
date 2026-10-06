'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import {
  Settings,
  Sliders,
  Flag,
  Database,
  Type,
  Check,
  RotateCcw,
  Plus,
  Archive,
  Save,
  AlertCircle,
  Eye,
  Lock,
  Layers,
  Building,
  Home,
  Users,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'terminology' | 'general' | 'features' | 'customFields'
  >('terminology');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Terminology state
  const [terminology, setTerminology] = useState({
    sectionLabel: 'Section',
    buildingLabel: 'Building',
    unitLabel: 'Unit',
  });
  const [terminologyOverrides, setTerminologyOverrides] = useState<Record<string, any>>({});

  // General Settings state
  const [effectiveConfig, setEffectiveConfig] = useState<any[]>([]);
  const [configRegistry, setConfigRegistry] = useState<any[]>([]);
  const [editingConfigKey, setEditingConfigKey] = useState<string | null>(null);
  const [configValueInput, setConfigValueInput] = useState<string>('');
  const [configReasonInput, setConfigReasonInput] = useState<string>('');

  // Features state
  const [features, setFeatures] = useState<any[]>([]);
  const [featureDefs, setFeatureDefs] = useState<any[]>([]);

  // Custom Fields state
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('UNIT');
  const [showCreateFieldModal, setShowCreateFieldModal] = useState(false);
  const [newField, setNewField] = useState({
    entityType: 'UNIT',
    key: '',
    label: '',
    description: '',
    fieldType: 'TEXT',
    required: false,
    searchable: true,
    visibility: 'TENANT_INTERNAL',
    options: '',
  });

  // Organization & Community selection
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [communities, setCommunities] = useState<any[]>([]);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string>('');

  const loadAllSettings = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      // 0. Load Organizations & Communities
      const orgsRes = await api.listOrganizations().catch(() => ({ data: [] }));
      const orgList = orgsRes.data || [];
      setOrganizations(orgList);
      const activeOrgId = selectedOrgId || orgList[0]?.id;
      if (activeOrgId && !selectedOrgId) {
        setSelectedOrgId(activeOrgId);
      }

      let commList: any[] = [];
      if (activeOrgId) {
        const commRes = await api
          .listCommunitiesForOrganization(activeOrgId)
          .catch(() => ({ data: [] }));
        commList = commRes.data || [];
        setCommunities(commList);
      }

      const activeCommId = selectedCommunityId || undefined;

      // 1. Terminology
      const termRes = await api.terminology.getTerminology({
        organizationId: activeOrgId,
        communityId: activeCommId,
      });
      setTerminology(termRes);

      // 2. Config & Registry
      const [regRes, effRes, overRes] = await Promise.all([
        api.configuration.getRegistry(),
        api.configuration.getEffective({
          organizationId: activeOrgId,
          communityId: activeCommId,
        }),
        api.configuration.getOverrides({
          organizationId: activeOrgId,
          communityId: activeCommId,
        }),
      ]);
      setConfigRegistry(regRes.items || []);
      setEffectiveConfig(effRes.items || []);

      const overMap: Record<string, any> = {};
      for (const o of overRes.items || []) {
        overMap[o.key] = o;
      }
      setTerminologyOverrides(overMap);

      // 3. Features
      const [featDefRes, featEffRes] = await Promise.all([
        api.features.getDefinitions(),
        api.features.getEffective({
          organizationId: activeOrgId,
          communityId: activeCommId,
        }),
      ]);
      setFeatureDefs(featDefRes.items || []);
      setFeatures(featEffRes.items || []);

      // 4. Custom Fields
      if (activeOrgId) {
        const cfRes = await api.customFields.getDefinitions({
          organizationId: activeOrgId,
          communityId: activeCommId,
        });
        setCustomFields(cfRes.items || []);
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  }, [selectedOrgId, selectedCommunityId]);

  useEffect(() => {
    loadAllSettings();
  }, [loadAllSettings]);

  // Handle Terminology Save
  const handleSaveTerminology = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const scopeType = selectedCommunityId ? 'COMMUNITY' : 'ORGANIZATION';
      const scopeId = selectedCommunityId || selectedOrgId;

      await Promise.all([
        api.configuration.setOverride({
          key: 'community.display.sectionLabel',
          scopeType,
          scopeId,
          value: terminology.sectionLabel,
          changeReason: 'Updated property terminology settings',
        }),
        api.configuration.setOverride({
          key: 'community.display.buildingLabel',
          scopeType,
          scopeId,
          value: terminology.buildingLabel,
          changeReason: 'Updated property terminology settings',
        }),
        api.configuration.setOverride({
          key: 'community.display.unitLabel',
          scopeType,
          scopeId,
          value: terminology.unitLabel,
          changeReason: 'Updated property terminology settings',
        }),
      ]);

      setMessage({ type: 'success', text: 'Property terminology updated successfully.' });
      loadAllSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save terminology' });
    } finally {
      setSaving(false);
    }
  };

  // Reset Terminology Override
  const handleResetTerminology = async (key: string) => {
    setSaving(true);
    try {
      const scopeType = selectedCommunityId ? 'COMMUNITY' : 'ORGANIZATION';
      const scopeId = selectedCommunityId || selectedOrgId;
      await api.configuration.deleteOverride(key, scopeType, scopeId);
      setMessage({ type: 'success', text: `Reset ${key} to inherited default.` });
      loadAllSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to reset setting' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Generic Config Save
  const handleSaveConfig = async (key: string, valueType: string) => {
    setSaving(true);
    try {
      let parsedValue: any = configValueInput;
      if (valueType === 'INTEGER') parsedValue = parseInt(configValueInput, 10);
      else if (valueType === 'DECIMAL') parsedValue = parseFloat(configValueInput);
      else if (valueType === 'BOOLEAN') parsedValue = configValueInput === 'true';
      else if (valueType === 'STRING_LIST')
        parsedValue = configValueInput.split(',').map((s) => s.trim());

      const scopeType = selectedCommunityId ? 'COMMUNITY' : 'ORGANIZATION';
      const scopeId = selectedCommunityId || selectedOrgId;

      await api.configuration.setOverride({
        key,
        scopeType,
        scopeId,
        value: parsedValue,
        changeReason: configReasonInput || 'Settings update',
      });

      setEditingConfigKey(null);
      setMessage({ type: 'success', text: `Updated configuration for "${key}".` });
      loadAllSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update setting' });
    } finally {
      setSaving(false);
    }
  };

  // Toggle Feature Flag
  const handleToggleFeature = async (featureKey: string, currentEnabled: boolean) => {
    setSaving(true);
    try {
      const scopeType = selectedCommunityId ? 'COMMUNITY' : 'ORGANIZATION';
      const scopeId = selectedCommunityId || selectedOrgId;

      await api.features.setOverride({
        featureKey,
        scopeType,
        scopeId,
        enabled: !currentEnabled,
        reason: `Toggled via Admin Settings to ${!currentEnabled}`,
      });

      setMessage({ type: 'success', text: `Feature "${featureKey}" updated.` });
      loadAllSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to toggle feature' });
    } finally {
      setSaving(false);
    }
  };

  // Create Custom Field
  const handleCreateCustomField = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let optionsList: any[] | undefined = undefined;
      if (newField.fieldType === 'SELECT' || newField.fieldType === 'MULTI_SELECT') {
        optionsList = newField.options
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map((line) => {
            const parts = line.split(':');
            const key = parts[0]?.trim() || '';
            const label = parts[1]?.trim() || key;
            return { key, label, isActive: true };
          });
      }

      await api.customFields.createDefinition({
        organizationId: selectedOrgId || undefined,
        communityId: selectedCommunityId || undefined,
        entityType: newField.entityType,
        key: newField.key,
        label: newField.label,
        description: newField.description || undefined,
        fieldType: newField.fieldType,
        required: newField.required,
        searchable: newField.searchable,
        visibility: newField.visibility,
        options: optionsList,
      });

      setShowCreateFieldModal(false);
      setNewField({
        entityType: 'UNIT',
        key: '',
        label: '',
        description: '',
        fieldType: 'TEXT',
        required: false,
        searchable: true,
        visibility: 'TENANT_INTERNAL',
        options: '',
      });
      setMessage({ type: 'success', text: `Custom field "${newField.label}" created.` });
      loadAllSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to create custom field' });
    } finally {
      setSaving(false);
    }
  };

  // Archive Custom Field
  const handleArchiveField = async (id: string, label: string) => {
    if (
      !confirm(
        `Are you sure you want to archive custom field "${label}"? Historical values will remain preserved.`,
      )
    ) {
      return;
    }
    try {
      await api.customFields.archiveDefinition(id);
      setMessage({ type: 'success', text: `Custom field "${label}" archived.` });
      loadAllSettings();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to archive custom field' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enterprise Settings & Extensibility</h1>
          <p className="text-sm text-muted">
            Configure platform behavior, custom terminology, capability feature flags, and tenant
            custom fields.
          </p>
        </div>

        {/* Scope Context Selectors */}
        <div className="flex items-center gap-3 bg-surface p-2 rounded-xl border border-border">
          <div>
            <label className="block text-[10px] uppercase font-bold text-muted mb-0.5">
              Organization
            </label>
            <select
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value);
                setSelectedCommunityId('');
              }}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1 focus:outline-none focus:border-primary"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-muted mb-0.5">
              Community (Optional)
            </label>
            <select
              value={selectedCommunityId}
              onChange={(e) => setSelectedCommunityId(e.target.value)}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1 focus:outline-none focus:border-primary"
            >
              <option value="">-- Entire Organization --</option>
              {communities.map((comm) => (
                <option key={comm.id} value={comm.id}>
                  {comm.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'bg-destructive/10 text-destructive dark:bg-destructive/20'
          }`}
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('terminology')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === 'terminology'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Type className="h-4 w-4" />
          <span>Property Terminology</span>
        </button>

        <button
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === 'general'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>General Settings</span>
        </button>

        <button
          onClick={() => setActiveTab('features')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === 'features'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Flag className="h-4 w-4" />
          <span>Features & Entitlements</span>
        </button>

        <button
          onClick={() => setActiveTab('customFields')}
          className={`flex items-center gap-2 pb-3 border-b-2 transition-colors ${
            activeTab === 'customFields'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Database className="h-4 w-4" />
          <span>Custom Fields</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12 text-sm text-muted">Loading settings...</div>
      ) : (
        <>
          {/* 1. Property Terminology Tab */}
          {activeTab === 'terminology' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="card p-6 bg-surface rounded-xl border border-border">
                  <h2 className="text-lg font-semibold mb-1">Configurable Hierarchy Terminology</h2>
                  <p className="text-xs text-muted mb-6">
                    Customize physical property hierarchy labels displayed throughout the web
                    console and tenant applications without code changes. Internal identifiers
                    remain canonical.
                  </p>

                  <form onSubmit={handleSaveTerminology} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                        Section Level Label
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={terminology.sectionLabel}
                          onChange={(e) =>
                            setTerminology({ ...terminology, sectionLabel: e.target.value })
                          }
                          className="input flex-1"
                          placeholder="e.g. Section, Phase, Sector, Zone"
                        />
                        {terminologyOverrides['community.display.sectionLabel'] && (
                          <button
                            type="button"
                            onClick={() => handleResetTerminology('community.display.sectionLabel')}
                            className="btn btn-outline text-xs flex items-center gap-1"
                            title="Reset to Organization or Platform Default"
                          >
                            <RotateCcw className="h-3 w-3" /> Reset
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-muted mt-1">
                        Applied to property subdivisions, phases, or master plan sections.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                        Building Level Label
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={terminology.buildingLabel}
                          onChange={(e) =>
                            setTerminology({ ...terminology, buildingLabel: e.target.value })
                          }
                          className="input flex-1"
                          placeholder="e.g. Building, Tower, Block, Wing, Cluster"
                        />
                        {terminologyOverrides['community.display.buildingLabel'] && (
                          <button
                            type="button"
                            onClick={() =>
                              handleResetTerminology('community.display.buildingLabel')
                            }
                            className="btn btn-outline text-xs flex items-center gap-1"
                            title="Reset to Organization or Platform Default"
                          >
                            <RotateCcw className="h-3 w-3" /> Reset
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-muted mt-1">
                        Applied to individual structures, towers, or residential blocks.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                        Unit Level Label
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          value={terminology.unitLabel}
                          onChange={(e) =>
                            setTerminology({ ...terminology, unitLabel: e.target.value })
                          }
                          className="input flex-1"
                          placeholder="e.g. Unit, Flat, Apartment, Residence, Villa, Suite"
                        />
                        {terminologyOverrides['community.display.unitLabel'] && (
                          <button
                            type="button"
                            onClick={() => handleResetTerminology('community.display.unitLabel')}
                            className="btn btn-outline text-xs flex items-center gap-1"
                            title="Reset to Organization or Platform Default"
                          >
                            <RotateCcw className="h-3 w-3" /> Reset
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-muted mt-1">
                        Applied to individual occupiable residences, apartments, or flats.
                      </p>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={saving}
                        className="btn btn-primary flex items-center gap-2"
                      >
                        <Save className="h-4 w-4" />
                        <span>{saving ? 'Saving...' : 'Save Terminology'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Live Preview Card */}
              <div>
                <div className="card p-6 bg-surface-muted/50 rounded-xl border border-border space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
                    Live UI Preview
                  </h3>
                  <div className="p-4 bg-surface rounded-lg border border-border space-y-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                      <Layers className="h-4 w-4" />
                      <span>{terminology.sectionLabel}: Phase 1 - Lakeview</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-foreground pl-4">
                      <Building className="h-4 w-4" />
                      <span>{terminology.buildingLabel}: Tower A - Alpine</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted pl-8">
                      <Home className="h-4 w-4" />
                      <span>{terminology.unitLabel} 101 (3 BHK)</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted leading-relaxed">
                    Changes here immediately apply to Property Hierarchy navigation tabs, unit
                    tables, and resident profile breadcrumbs.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. General Settings Tab */}
          {activeTab === 'general' && (
            <div className="card bg-surface rounded-xl border border-border divide-y divide-border">
              <div className="p-6">
                <h2 className="text-lg font-semibold">Typed Configuration Registry & Overrides</h2>
                <p className="text-xs text-muted">
                  Deterministic hierarchy resolution: Platform Default &rarr; Organization Override
                  &rarr; Community Override.
                </p>
              </div>

              {effectiveConfig.map((item) => {
                const regDef = configRegistry.find((r) => r.key === item.key);
                const isEditing = editingConfigKey === item.key;

                return (
                  <div
                    key={item.key}
                    className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{item.key}</span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            item.resolvedFrom === 'COMMUNITY'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                              : item.resolvedFrom === 'ORGANIZATION'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {item.resolvedFrom} {item.isInherited ? '(Inherited)' : '(Override)'}
                        </span>
                        <span className="text-[10px] bg-surface-muted px-2 py-0.5 rounded text-muted font-mono">
                          {item.valueType}
                        </span>
                      </div>
                      <p className="text-xs text-muted">
                        {regDef?.description || 'Platform configuration parameter'}
                      </p>
                      <div className="text-xs font-mono font-medium text-foreground pt-1">
                        Effective Value:{' '}
                        <span className="text-primary">{JSON.stringify(item.value)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex flex-col sm:flex-row gap-2 items-end">
                          <input
                            type="text"
                            value={configValueInput}
                            onChange={(e) => setConfigValueInput(e.target.value)}
                            placeholder="New Value"
                            className="input text-xs"
                          />
                          <button
                            onClick={() => handleSaveConfig(item.key, item.valueType)}
                            disabled={saving}
                            className="btn btn-primary text-xs"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingConfigKey(null)}
                            className="btn btn-outline text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditingConfigKey(item.key);
                              setConfigValueInput(
                                typeof item.value === 'object'
                                  ? JSON.stringify(item.value)
                                  : String(item.value),
                              );
                            }}
                            className="btn btn-outline text-xs"
                          >
                            Override
                          </button>
                          {!item.isInherited && item.resolvedFrom !== 'DEFAULT' && (
                            <button
                              onClick={() => handleResetTerminology(item.key)}
                              className="btn btn-outline text-xs flex items-center gap-1"
                              title="Reset to parent scope value"
                            >
                              <RotateCcw className="h-3 w-3" /> Reset
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. Features & Entitlements Tab */}
          {activeTab === 'features' && (
            <div className="card bg-surface rounded-xl border border-border divide-y divide-border">
              <div className="p-6">
                <h2 className="text-lg font-semibold">Feature Flags & Capability Entitlements</h2>
                <p className="text-xs text-muted">
                  Control capability rollouts per organization and community. Feature enablement is
                  independent of RBAC authorization.
                </p>
              </div>

              {features.map((feat) => {
                const def = featureDefs.find((d) => d.key === feat.key);

                return (
                  <div
                    key={feat.key}
                    className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{def?.name || feat.key}</span>
                        <span className="text-[10px] bg-surface-muted px-2 py-0.5 rounded text-muted font-mono">
                          {feat.key}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            feat.enabled
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {feat.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                        <span className="text-[10px] text-muted">Scope: {feat.resolvedFrom}</span>
                      </div>
                      <p className="text-xs text-muted">{def?.description}</p>
                      {def?.dependencies && def.dependencies.length > 0 && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400">
                          Depends on: {def.dependencies.join(', ')}
                        </div>
                      )}
                      {feat.reason && (
                        <div className="text-[11px] text-muted italic">Reason: {feat.reason}</div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleFeature(feat.key, feat.enabled)}
                        disabled={saving}
                        className={`btn text-xs ${
                          feat.enabled
                            ? 'btn-outline text-destructive hover:bg-destructive/10'
                            : 'btn-primary'
                        }`}
                      >
                        {feat.enabled ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 4. Custom Fields Tab */}
          {activeTab === 'customFields' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    Entity Filter:
                  </span>
                  {['UNIT', 'RESIDENT', 'BUILDING', 'COMMUNITY', 'HOUSEHOLD', 'DOCUMENT'].map(
                    (ent) => (
                      <button
                        key={ent}
                        onClick={() => setSelectedEntityFilter(ent)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          selectedEntityFilter === ent
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-surface-muted text-muted hover:text-foreground'
                        }`}
                      >
                        {ent}
                      </button>
                    ),
                  )}
                </div>

                <button
                  onClick={() => setShowCreateFieldModal(true)}
                  className="btn btn-primary text-xs flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Custom Field</span>
                </button>
              </div>

              {/* Custom Fields List */}
              <div className="card bg-surface rounded-xl border border-border divide-y divide-border">
                {customFields.filter((cf) => cf.entityType === selectedEntityFilter).length ===
                0 ? (
                  <div className="p-8 text-center text-sm text-muted">
                    No custom fields defined for {selectedEntityFilter}. Click &quot;New Custom
                    Field&quot; to create one.
                  </div>
                ) : (
                  customFields
                    .filter((cf) => cf.entityType === selectedEntityFilter)
                    .map((cf) => (
                      <div
                        key={cf.id}
                        className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">{cf.label}</span>
                            <span className="text-[10px] bg-surface-muted font-mono px-2 py-0.5 rounded text-muted">
                              {cf.key}
                            </span>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-semibold">
                              {cf.fieldType}
                            </span>
                            {cf.required && (
                              <span className="text-[10px] bg-destructive/10 text-destructive px-2 py-0.5 rounded font-semibold">
                                REQUIRED
                              </span>
                            )}
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                cf.status === 'ACTIVE'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                              }`}
                            >
                              {cf.status}
                            </span>
                          </div>
                          {cf.description && <p className="text-xs text-muted">{cf.description}</p>}
                          {cf.options && cf.options.length > 0 && (
                            <div className="text-[11px] text-muted">
                              Options: {cf.options.map((o: any) => o.label).join(', ')}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {cf.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleArchiveField(cf.id, cf.label)}
                              className="btn btn-outline text-xs text-muted hover:text-destructive flex items-center gap-1"
                            >
                              <Archive className="h-3 w-3" /> Archive
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Custom Field Modal */}
      {showCreateFieldModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold">Create Custom Field Definition</h2>
            <form onSubmit={handleCreateCustomField} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Target Entity
                </label>
                <select
                  value={newField.entityType}
                  onChange={(e) => setNewField({ ...newField, entityType: e.target.value })}
                  className="input text-xs w-full"
                >
                  <option value="UNIT">Unit</option>
                  <option value="RESIDENT">Resident</option>
                  <option value="BUILDING">Building</option>
                  <option value="COMMUNITY">Community</option>
                  <option value="HOUSEHOLD">Household</option>
                  <option value="DOCUMENT">Document</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Field Label
                  </label>
                  <input
                    type="text"
                    required
                    value={newField.label}
                    onChange={(e) => setNewField({ ...newField, label: e.target.value })}
                    placeholder="e.g. Handover Date"
                    className="input text-xs w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Field Key (Machine ID)
                  </label>
                  <input
                    type="text"
                    required
                    value={newField.key}
                    onChange={(e) => setNewField({ ...newField, key: e.target.value })}
                    placeholder="e.g. handoverDate"
                    className="input text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Field Type
                </label>
                <select
                  value={newField.fieldType}
                  onChange={(e) => setNewField({ ...newField, fieldType: e.target.value })}
                  className="input text-xs w-full"
                >
                  <option value="TEXT">Single Line Text</option>
                  <option value="LONG_TEXT">Multi-Line Text</option>
                  <option value="NUMBER">Integer Number</option>
                  <option value="DECIMAL">Decimal Number</option>
                  <option value="BOOLEAN">Boolean (Yes/No)</option>
                  <option value="DATE">Date</option>
                  <option value="DATETIME">Date & Time</option>
                  <option value="SELECT">Single Select Choice</option>
                  <option value="MULTI_SELECT">Multi-Select Choice</option>
                  <option value="EMAIL">Email Address</option>
                  <option value="PHONE">Phone Number</option>
                  <option value="URL">Web URL</option>
                </select>
              </div>

              {(newField.fieldType === 'SELECT' || newField.fieldType === 'MULTI_SELECT') && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                    Choices (One per line, Format: KEY:Label)
                  </label>
                  <textarea
                    rows={3}
                    value={newField.options}
                    onChange={(e) => setNewField({ ...newField, options: e.target.value })}
                    placeholder="A_POS:A+&#10;B_POS:B+&#10;O_POS:O+"
                    className="input text-xs w-full font-mono"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newField.description}
                  onChange={(e) => setNewField({ ...newField, description: e.target.value })}
                  placeholder="Helper text for field"
                  className="input text-xs w-full"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.required}
                    onChange={(e) => setNewField({ ...newField, required: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span>Mandatory / Required Field</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newField.searchable}
                    onChange={(e) => setNewField({ ...newField, searchable: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span>Searchable</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateFieldModal(false)}
                  className="btn btn-outline text-xs"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary text-xs">
                  {saving ? 'Creating...' : 'Create Field Definition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
