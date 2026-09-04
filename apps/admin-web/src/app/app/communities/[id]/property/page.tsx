'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import {
  Building2,
  Layers,
  Home,
  Plus,
  Search,
  Upload,
  Download,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  ArrowLeft,
  CheckCircle,
  FileSpreadsheet,
  Grid,
  List,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { CustomFieldsRenderer } from '@/components/custom-fields-renderer';

export default function CommunityPropertyHubPage() {
  const params = useParams();
  const router = useRouter();
  const communityId = params?.id as string;

  const [activeTab, setActiveTab] = useState<'EXPLORER' | 'BUILDINGS' | 'UNITS'>('EXPLORER');
  const [community, setCommunity] = useState<any>(null);
  const [propertyTree, setPropertyTree] = useState<any>(null);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [terminology, setTerminology] = useState({
    sectionLabel: 'Section',
    buildingLabel: 'Building',
    unitLabel: 'Unit',
  });
  const [unitCustomDefs, setUnitCustomDefs] = useState<any[]>([]);
  const [unitCustomValues, setUnitCustomValues] = useState<Record<string, any>>({});
  const [isSavingCustomFields, setIsSavingCustomFields] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Units Search & Filters
  const [unitSearch, setUnitSearch] = useState('');
  const [selectedBuildingFilter, setSelectedBuildingFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Modals
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedUnitForDetail, setSelectedUnitForDetail] = useState<any>(null);

  // New Building Form State
  const [buildingForm, setBuildingForm] = useState({
    name: '',
    code: '',
    buildingType: 'TOWER',
    sectionId: '',
    numberOfFloors: 10,
  });

  // Bulk Generator State
  const [bulkForm, setBulkForm] = useState({
    buildingId: '',
    floorStart: 1,
    floorEnd: 5,
    unitSuffixes: '01, 02, 03, 04',
    unitType: 'APARTMENT',
    carpetArea: 1200,
    areaUnit: 'SQFT',
    bedroomCount: 3,
    bathroomCount: 2,
  });

  // CSV Import State
  const [csvRawText, setCsvRawText] = useState('');
  const [importValidation, setImportValidation] = useState<any>(null);
  const [isValidatingImport, setIsValidatingImport] = useState(false);
  const [isCommittingImport, setIsCommittingImport] = useState(false);

  // Expanded Tree Nodes
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const loadData = useCallback(async () => {
    if (!communityId) return;
    try {
      setIsLoading(true);
      const [commRes, treeRes, bldgRes, secRes, unitRes, termRes, cfRes] = await Promise.all([
        api.getCommunity(communityId),
        api.property.getPropertyTree(communityId).catch(() => null),
        api.property.listBuildings(communityId),
        api.property.listSections(communityId),
        api.property.listUnits(communityId, {
          search: unitSearch.trim() || undefined,
          buildingId: selectedBuildingFilter || undefined,
          status: selectedStatusFilter || undefined,
          limit: 100,
        }),
        api.terminology.getTerminology({ communityId }).catch(() => ({
          sectionLabel: 'Section',
          buildingLabel: 'Building',
          unitLabel: 'Unit',
        })),
        api.customFields
          .getDefinitions({ communityId, entityType: 'UNIT' })
          .catch(() => ({ items: [] })),
      ]);

      setCommunity(commRes);
      if (treeRes) setPropertyTree(treeRes.root);
      setBuildings(bldgRes.data || []);
      setSections(secRes.data || []);
      setUnits(unitRes.data || []);
      setTerminology(termRes);
      setUnitCustomDefs(cfRes?.items || []);
      setErrorMessage('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load property data.');
    } finally {
      setIsLoading(false);
    }
  }, [communityId, unitSearch, selectedBuildingFilter, selectedStatusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Building Creation
  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.property.createBuilding(communityId, {
        name: buildingForm.name,
        code: buildingForm.code,
        buildingType: buildingForm.buildingType,
        sectionId: buildingForm.sectionId || undefined,
        numberOfFloors: Number(buildingForm.numberOfFloors),
      });

      setShowBuildingModal(false);
      setBuildingForm({
        name: '',
        code: '',
        buildingType: 'TOWER',
        sectionId: '',
        numberOfFloors: 10,
      });
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create building.');
    }
  };

  // Handle Bulk Units Creation
  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const suffixes = bulkForm.unitSuffixes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const floors = [];
      for (let f = bulkForm.floorStart; f <= bulkForm.floorEnd; f++) {
        floors.push({ floorLabel: String(f), levelNumber: f });
      }

      await api.property.bulkCreateUnits(communityId, {
        buildingId: bulkForm.buildingId || undefined,
        floors,
        unitSuffixes: suffixes,
        unitType: bulkForm.unitType,
        carpetArea: Number(bulkForm.carpetArea) || undefined,
        areaUnit: bulkForm.areaUnit,
        bedroomCount: Number(bulkForm.bedroomCount) || undefined,
        bathroomCount: Number(bulkForm.bathroomCount) || undefined,
      });

      setShowBulkModal(false);
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to bulk generate units.');
    }
  };

  // Handle CSV Validation & Import
  const handleValidateCsv = async () => {
    if (!csvRawText.trim()) return;
    setIsValidatingImport(true);
    try {
      const lines = csvRawText.trim().split('\n');
      const headers = lines[0]!.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

      const rows = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i]!.trim();
        if (!line) continue;
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
        const rowObj: Record<string, any> = {};

        headers.forEach((h, idx) => {
          const val = values[idx] || '';
          if (h.toLowerCase().includes('unit')) rowObj['unitNumber'] = val;
          else if (h.toLowerCase().includes('building')) rowObj['buildingCode'] = val;
          else if (h.toLowerCase().includes('floor')) rowObj['floorLabel'] = val;
          else if (h.toLowerCase().includes('section')) rowObj['sectionCode'] = val;
          else if (h.toLowerCase().includes('area'))
            rowObj['carpetArea'] = Number(val) || undefined;
          else if (h.toLowerCase().includes('type')) rowObj['unitType'] = val || 'APARTMENT';
        });

        if (!rowObj['unitNumber']) rowObj['unitNumber'] = values[0] || `U-${i}`;
        rows.push(rowObj);
      }

      const res = await api.property.validateImport(communityId, rows);
      setImportValidation({ ...res, parsedRows: rows });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse CSV.');
    } finally {
      setIsValidatingImport(false);
    }
  };

  const handleCommitImport = async () => {
    if (!importValidation?.parsedRows) return;
    setIsCommittingImport(true);
    try {
      await api.property.commitImport(communityId, {
        rows: importValidation.parsedRows,
        sourceFileName: 'property-master.csv',
      });
      setShowImportModal(false);
      setImportValidation(null);
      setCsvRawText('');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to commit CSV import.');
    } finally {
      setIsCommittingImport(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      const url = await api.property.exportUnitsCsvUrl(communityId);
      const token = localStorage.getItem('community_os_access_token');
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${community?.slug || 'community'}-units.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to download CSV.');
    }
  };

  const openUnitDetail = async (unit: any) => {
    setSelectedUnitForDetail(unit);
    try {
      const res = await api.customFields.getEntityValues('UNIT', unit.id);
      const valMap: Record<string, any> = {};
      for (const item of res.values || []) {
        valMap[item.definitionId] = item.value;
      }
      setUnitCustomValues(valMap);
    } catch {
      setUnitCustomValues({});
    }
  };

  const handleSaveUnitCustomFields = async () => {
    if (!selectedUnitForDetail) return;
    setIsSavingCustomFields(true);
    try {
      const payload = Object.entries(unitCustomValues).map(([definitionId, value]) => ({
        definitionId,
        value,
      }));
      await api.customFields.setEntityValues('UNIT', selectedUnitForDetail.id, { values: payload });
      await openUnitDetail(selectedUnitForDetail);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save custom fields.');
    } finally {
      setIsSavingCustomFields(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs & Header */}
      <div>
        <button
          onClick={() => router.push(`/app/communities/${communityId}`)}
          className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {community?.name || 'Community'}</span>
        </button>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Property Master & Hierarchy</h1>
              <span className="font-mono text-xs text-muted bg-surface-muted px-2 py-0.5 rounded">
                {community?.code}
              </span>
            </div>
            <p className="text-sm text-muted mt-0.5">
              Manage sections, towers, floors, and residential units for {community?.name}.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-muted shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-muted shadow-sm"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Import CSV</span>
            </button>

            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 text-primary px-3 py-2 text-xs font-medium hover:bg-primary/20 shadow-sm"
            >
              <Grid className="h-3.5 w-3.5" />
              <span>Bulk Generate Units</span>
            </button>

            <button
              onClick={() => setShowBuildingModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Building</span>
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
          {errorMessage}
        </div>
      )}

      {/* Property Overview Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted text-xs font-medium">
            <Layers className="h-4 w-4 text-primary" />
            <span>Sections / Phases</span>
          </div>
          <div className="text-2xl font-bold mt-1.5">{sections.length}</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted text-xs font-medium">
            <Building2 className="h-4 w-4 text-blue-500" />
            <span>Buildings & Towers</span>
          </div>
          <div className="text-2xl font-bold mt-1.5">{buildings.length}</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted text-xs font-medium">
            <Home className="h-4 w-4 text-emerald-500" />
            <span>Total Units</span>
          </div>
          <div className="text-2xl font-bold mt-1.5">{units.length}</div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted text-xs font-medium">
            <CheckCircle className="h-4 w-4 text-purple-500" />
            <span>Active Status</span>
          </div>
          <div className="text-2xl font-bold mt-1.5">{community?.status || 'ACTIVE'}</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border flex space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('EXPLORER')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'EXPLORER'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Hierarchy Tree Explorer</span>
        </button>

        <button
          onClick={() => setActiveTab('BUILDINGS')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'BUILDINGS'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Buildings & Towers ({buildings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('UNITS')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'UNITS'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <List className="h-4 w-4" />
          <span>Units Inventory ({units.length})</span>
        </button>
      </div>

      {/* TAB 1: Hierarchy Tree Explorer */}
      {activeTab === 'EXPLORER' && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold">Community Structural Tree</h2>
              <p className="text-xs text-muted">
                Expand nodes to browse hierarchical relations from Sections to Units.
              </p>
            </div>
            <button
              onClick={loadData}
              className="text-xs text-muted hover:text-foreground flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reload Tree</span>
            </button>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8 text-muted">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </div>
          ) : !propertyTree ? (
            <div className="text-sm text-muted text-center py-8">No structural data found.</div>
          ) : (
            <div className="border border-border/70 rounded-lg p-4 bg-background/50 font-sans text-sm space-y-2">
              {/* Root Community Node */}
              <div className="flex items-center gap-2 font-semibold text-primary">
                <Building2 className="h-4 w-4" />
                <span>{propertyTree.name}</span>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono">
                  {propertyTree.code}
                </span>
              </div>

              {/* Children Nodes */}
              <div className="pl-6 border-l border-border/80 ml-2 space-y-2 mt-2">
                {propertyTree.children?.map((child: any) => (
                  <div key={child.id} className="space-y-1">
                    <div
                      onClick={() => toggleNode(child.id)}
                      className="flex items-center gap-2 py-1 px-2 rounded hover:bg-surface-muted cursor-pointer group"
                    >
                      {child.children && child.children.length > 0 ? (
                        expandedNodes[child.id] ? (
                          <ChevronDown className="h-4 w-4 text-muted" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted" />
                        )
                      ) : (
                        <div className="w-4" />
                      )}
                      {child.type === 'SECTION' && <Layers className="h-4 w-4 text-amber-500" />}
                      {child.type === 'BUILDING' && <Building2 className="h-4 w-4 text-blue-500" />}
                      {child.type === 'UNIT' && <Home className="h-4 w-4 text-emerald-500" />}
                      <span className="font-medium text-xs">{child.name}</span>
                      {child.code && (
                        <span className="text-[10px] text-muted font-mono bg-surface-muted px-1.5 rounded">
                          {child.code}
                        </span>
                      )}
                      {child.children && (
                        <span className="text-[10px] text-muted ml-auto">
                          {child.children.length}{' '}
                          {child.type === 'SECTION' ? 'Buildings' : 'Floors/Units'}
                        </span>
                      )}
                    </div>

                    {/* Level 2 Children */}
                    {expandedNodes[child.id] && child.children && (
                      <div className="pl-6 border-l border-border/80 ml-4 space-y-1">
                        {child.children.map((subChild: any) => (
                          <div key={subChild.id} className="space-y-1">
                            <div
                              onClick={() => toggleNode(subChild.id)}
                              className="flex items-center gap-2 py-1 px-2 rounded hover:bg-surface-muted cursor-pointer text-xs"
                            >
                              {subChild.children && subChild.children.length > 0 ? (
                                expandedNodes[subChild.id] ? (
                                  <ChevronDown className="h-3.5 w-3.5 text-muted" />
                                ) : (
                                  <ChevronRight className="h-3.5 w-3.5 text-muted" />
                                )
                              ) : (
                                <div className="w-3.5" />
                              )}
                              {subChild.type === 'BUILDING' && (
                                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                              )}
                              {subChild.type === 'FLOOR' && (
                                <Layers className="h-3.5 w-3.5 text-purple-500" />
                              )}
                              {subChild.type === 'UNIT' && (
                                <Home className="h-3.5 w-3.5 text-emerald-500" />
                              )}
                              <span>{subChild.name}</span>
                              {subChild.children && (
                                <span className="text-[10px] text-muted ml-auto">
                                  {subChild.children.length} Units
                                </span>
                              )}
                            </div>

                            {/* Level 3 Children (Units on Floor) */}
                            {expandedNodes[subChild.id] && subChild.children && (
                              <div className="pl-6 border-l border-border/80 ml-4 space-y-1">
                                {subChild.children.map((unitNode: any) => (
                                  <div
                                    key={unitNode.id}
                                    className="flex items-center gap-2 py-0.5 px-2 text-xs text-muted hover:text-foreground"
                                  >
                                    <Home className="h-3 w-3 text-emerald-500" />
                                    <span>{unitNode.name}</span>
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1 rounded ml-auto">
                                      {unitNode.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Buildings & Towers Directory */}
      {activeTab === 'BUILDINGS' && (
        <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Towers & Building Master</h2>
            <button
              onClick={() => setShowBuildingModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Building</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-6 py-3 font-semibold">Building / Tower</th>
                  <th className="px-6 py-3 font-semibold">Code</th>
                  <th className="px-6 py-3 font-semibold">Type</th>
                  <th className="px-6 py-3 font-semibold">Section</th>
                  <th className="px-6 py-3 font-semibold">Floors</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {buildings.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-muted/50">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>{b.name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted">{b.code}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-surface-muted px-2 py-0.5 rounded font-medium">
                        {b.buildingType}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted">
                      {b.section?.name || 'Standalone'}
                    </td>
                    <td className="px-6 py-4 text-xs">{b.numberOfFloors || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Units Master */}
      {activeTab === 'UNITS' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                type="text"
                placeholder="Search unit number (e.g. 101, B-304)..."
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-background pl-9 pr-4 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={selectedBuildingFilter}
                onChange={(e) => setSelectedBuildingFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
              >
                <option value="">All Buildings</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs focus:border-primary focus:outline-none"
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="READY">READY</option>
                <option value="UNDER_CONSTRUCTION">UNDER_CONSTRUCTION</option>
                <option value="PLANNED">PLANNED</option>
              </select>
            </div>
          </div>

          {/* Units Table */}
          <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Unit Number</th>
                    <th className="px-6 py-3 font-semibold">Display Label</th>
                    <th className="px-6 py-3 font-semibold">Building / Tower</th>
                    <th className="px-6 py-3 font-semibold">Floor</th>
                    <th className="px-6 py-3 font-semibold">Type</th>
                    <th className="px-6 py-3 font-semibold">Area</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {units.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted">
                        No units found matching criteria.
                      </td>
                    </tr>
                  ) : (
                    units.map((u) => (
                      <tr
                        key={u.id}
                        onClick={() => openUnitDetail(u)}
                        className="hover:bg-surface-muted/50 cursor-pointer"
                      >
                        <td className="px-6 py-3.5 font-mono text-xs font-semibold text-primary">
                          {u.unitNumber}
                        </td>
                        <td className="px-6 py-3.5 text-xs font-medium">{u.displayName}</td>
                        <td className="px-6 py-3.5 text-xs text-muted">
                          {u.building?.name || 'Standalone / Villa'}
                        </td>
                        <td className="px-6 py-3.5 text-xs text-muted">
                          {u.floor?.label ? `Floor ${u.floor.label}` : '-'}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs bg-surface-muted px-2 py-0.5 rounded font-medium">
                            {u.unitType}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-muted">
                          {u.carpetArea ? `${u.carpetArea} ${u.areaUnit}` : 'N/A'}
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                            {u.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: Create Building Modal */}
      {showBuildingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-1">Create Building / Tower</h2>
            <p className="text-xs text-muted mb-4">
              Add a residential tower, wing, or villa block to this community.
            </p>

            <form onSubmit={handleCreateBuilding} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Building Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tower A - Alpine"
                  value={buildingForm.name}
                  onChange={(e) => setBuildingForm({ ...buildingForm, name: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Building Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TWR-A"
                  value={buildingForm.code}
                  onChange={(e) =>
                    setBuildingForm({ ...buildingForm, code: e.target.value.toUpperCase() })
                  }
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Type</label>
                  <select
                    value={buildingForm.buildingType}
                    onChange={(e) =>
                      setBuildingForm({ ...buildingForm, buildingType: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="TOWER">TOWER</option>
                    <option value="BLOCK">BLOCK</option>
                    <option value="WING">WING</option>
                    <option value="VILLA_CLUSTER">VILLA_CLUSTER</option>
                    <option value="ROW_HOUSE_BLOCK">ROW_HOUSE_BLOCK</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Number of Floors
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={200}
                    value={buildingForm.numberOfFloors}
                    onChange={(e) =>
                      setBuildingForm({
                        ...buildingForm,
                        numberOfFloors: Number(e.target.value),
                      })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              {sections.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Section / Zone (Optional)
                  </label>
                  <select
                    value={buildingForm.sectionId}
                    onChange={(e) =>
                      setBuildingForm({ ...buildingForm, sectionId: e.target.value })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  >
                    <option value="">None (Standalone)</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBuildingModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Create Building
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Bulk Unit Generator Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-1">Bulk Generate Units</h2>
            <p className="text-xs text-muted mb-4">
              Quickly create repetitive floor/unit matrices across a building structure.
            </p>

            <form onSubmit={handleBulkGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Target Building <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={bulkForm.buildingId}
                  onChange={(e) => setBulkForm({ ...bulkForm, buildingId: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Select a Building</option>
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Floor Range Start
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={bulkForm.floorStart}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, floorStart: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Floor Range End
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={bulkForm.floorEnd}
                    onChange={(e) => setBulkForm({ ...bulkForm, floorEnd: Number(e.target.value) })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Unit Suffix Patterns (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="01, 02, 03, 04"
                  value={bulkForm.unitSuffixes}
                  onChange={(e) => setBulkForm({ ...bulkForm, unitSuffixes: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:border-primary focus:outline-none"
                />
                <span className="text-[11px] text-muted mt-1 block">
                  e.g., Floor 1 + 01, 02 =&gt; creates 101, 102 ... Floor 12 + 01 =&gt; 1201
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Carpet Area</label>
                  <input
                    type="number"
                    value={bulkForm.carpetArea}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, carpetArea: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={bulkForm.bedroomCount}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, bedroomCount: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={bulkForm.bathroomCount}
                    onChange={(e) =>
                      setBulkForm({ ...bulkForm, bathroomCount: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Generate Units Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: CSV Import & Preview Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Import Property Master CSV</h2>
            </div>
            <p className="text-xs text-muted mb-4">
              Paste or upload CSV text containing Buildings, Floors, and Units.
            </p>

            <div className="space-y-4 flex-1 overflow-y-auto">
              {!importValidation ? (
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Paste CSV Data (Header row required)
                  </label>
                  <textarea
                    rows={8}
                    placeholder="Unit Number,Building Code,Floor,Carpet Area&#10;101,TWR-A,1,1200&#10;102,TWR-A,1,1200&#10;201,TWR-A,2,1450"
                    value={csvRawText}
                    onChange={(e) => setCsvRawText(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background p-3 font-mono text-xs focus:border-primary focus:outline-none"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className={`rounded-lg p-3 text-xs flex items-center gap-2 ${
                      importValidation.isValid
                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-600 border border-red-500/20'
                    }`}
                  >
                    {importValidation.isValid ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    <span>
                      {importValidation.isValid
                        ? `All ${importValidation.totalRows} rows are valid and ready to commit.`
                        : `Validation failed: ${importValidation.errorRowsCount} errors found.`}
                    </span>
                  </div>

                  {importValidation.errors?.length > 0 && (
                    <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 max-h-40 overflow-y-auto text-xs text-red-600 space-y-1">
                      {importValidation.errors.map((err: any, idx: number) => (
                        <div key={idx}>
                          Row {err.rowNumber}: {err.message}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-xs font-semibold text-muted">Previewing Parsed Rows:</div>
                  <div className="border border-border rounded-lg overflow-x-auto max-h-48 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-surface-muted border-b border-border">
                        <tr>
                          <th className="p-2">Unit</th>
                          <th className="p-2">Building</th>
                          <th className="p-2">Floor</th>
                          <th className="p-2">Area</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {importValidation.parsedRows?.slice(0, 10).map((r: any, idx: number) => (
                          <tr key={idx}>
                            <td className="p-2 font-mono">{r.unitNumber}</td>
                            <td className="p-2 font-mono">{r.buildingCode || '-'}</td>
                            <td className="p-2">{r.floorLabel || '-'}</td>
                            <td className="p-2">{r.carpetArea || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportValidation(null);
                }}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
              >
                Cancel
              </button>

              {!importValidation ? (
                <button
                  type="button"
                  disabled={!csvRawText.trim() || isValidatingImport}
                  onClick={handleValidateCsv}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {isValidatingImport ? 'Validating...' : 'Validate CSV Rows'}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!importValidation.isValid || isCommittingImport}
                  onClick={handleCommitImport}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isCommittingImport ? 'Importing Batch...' : 'Confirm & Import Units'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Unit Structural Details */}
      {selectedUnitForDetail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-md h-full bg-surface border-l border-border p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-lg font-bold">Unit {selectedUnitForDetail.unitNumber}</h3>
                  <p className="text-xs text-muted">{selectedUnitForDetail.displayName}</p>
                </div>
                <button
                  onClick={() => setSelectedUnitForDetail(null)}
                  className="text-xs text-muted hover:text-foreground font-semibold"
                >
                  Close
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-muted block mb-0.5">Hierarchy Path</span>
                  <span className="font-medium bg-surface-muted p-2 rounded block">
                    {selectedUnitForDetail.path ||
                      `${community?.name} / ${selectedUnitForDetail.building?.name || 'Standalone'} / Unit ${selectedUnitForDetail.unitNumber}`}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-muted block mb-0.5">Building</span>
                    <span className="font-medium">
                      {selectedUnitForDetail.building?.name || 'Standalone Villa'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block mb-0.5">Floor</span>
                    <span className="font-medium">
                      {selectedUnitForDetail.floor?.label
                        ? `Floor ${selectedUnitForDetail.floor.label}`
                        : 'Ground Level'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-muted block mb-0.5">Unit Type</span>
                    <span className="font-medium">{selectedUnitForDetail.unitType}</span>
                  </div>
                  <div>
                    <span className="text-muted block mb-0.5">Status</span>
                    <span className="font-medium text-emerald-600">
                      {selectedUnitForDetail.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                  <div>
                    <span className="text-muted block mb-0.5">Carpet Area</span>
                    <span className="font-medium">
                      {selectedUnitForDetail.carpetArea
                        ? `${selectedUnitForDetail.carpetArea} ${selectedUnitForDetail.areaUnit}`
                        : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block mb-0.5">Bedrooms</span>
                    <span className="font-medium">{selectedUnitForDetail.bedroomCount || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted block mb-0.5">Bathrooms</span>
                    <span className="font-medium">
                      {selectedUnitForDetail.bathroomCount || '-'}
                    </span>
                  </div>
                </div>

                {/* Dynamic Custom Metadata Fields */}
                <CustomFieldsRenderer
                  definitions={unitCustomDefs}
                  values={unitCustomValues}
                  onChange={(defId, val) =>
                    setUnitCustomValues((prev) => ({ ...prev, [defId]: val }))
                  }
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between">
              {unitCustomDefs.length > 0 && (
                <button
                  type="button"
                  disabled={isSavingCustomFields}
                  onClick={handleSaveUnitCustomFields}
                  className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{isSavingCustomFields ? 'Saving...' : 'Save Custom Fields'}</span>
                </button>
              )}
              <button
                onClick={() => setSelectedUnitForDetail(null)}
                className="rounded-lg border border-border px-4 py-1.5 text-xs font-medium hover:bg-surface-muted ml-auto"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
