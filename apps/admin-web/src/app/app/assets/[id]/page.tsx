'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Cpu,
  Boxes,
  ArrowLeft,
  QrCode,
  Printer,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  Gauge,
  History,
  FileText,
  Calendar,
  Layers,
  Activity,
  Plus,
  ArrowRightLeft,
  X,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';

  const [asset, setAsset] = useState<any>(null);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [meters, setMeters] = useState<any[]>([]);
  const [serviceHistory, setServiceHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'location' | 'warranties' | 'contracts' | 'meters' | 'service'
  >('overview');

  // Modals
  const [showQrModal, setShowQrModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [showReadingModal, setShowReadingModal] = useState(false);
  const [selectedMeter, setSelectedMeter] = useState<any>(null);

  // Form states
  const [moveData, setMoveData] = useState({
    toLocationType: 'BUILDING',
    toBuildingId: '',
    toLocationDescription: '',
    reason: '',
  });
  const [breakdownData, setBreakdownData] = useState({
    reason: 'BREAKDOWN',
    impactLevel: 'FULL_OUTAGE',
    notes: '',
  });
  const [readingData, setReadingData] = useState({ reading: '', notes: '', isReset: false });
  const [actionLoading, setActionLoading] = useState(false);

  const loadAssetData = async () => {
    setLoading(true);
    try {
      const [detailRes, warRes, conRes, metRes, srvRes] = await Promise.all([
        api.assets.getDetail(id),
        api.assetWarranties.listForAsset(id).catch(() => []),
        api.assetContracts
          .list({ organizationId: orgId, communityId: commId })
          .catch(() => ({ items: [] })),
        api.assetMeters.listForAsset(id).catch(() => []),
        api.assets.getServiceHistory(id).catch(() => []),
      ]);

      setAsset(detailRes);
      setWarranties(warRes || []);
      setContracts(conRes?.items || []);
      setMeters(metRes || []);
      setServiceHistory(srvRes || []);
    } catch (err) {
      console.error('Failed to load asset details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadAssetData();
  }, [id]);

  const handleMoveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.assets.moveLocation(id, moveData);
      setShowMoveModal(false);
      await loadAssetData();
    } catch (err: any) {
      alert(err.message || 'Failed to move asset');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReportBreakdown = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.assets.reportBreakdown(id, breakdownData);
      setShowBreakdownModal(false);
      await loadAssetData();
    } catch (err: any) {
      alert(err.message || 'Failed to record breakdown');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveBreakdown = async () => {
    if (!confirm('Mark this asset breakdown as resolved and restore to OPERATIONAL status?'))
      return;
    setActionLoading(true);
    try {
      await api.assets.resolveBreakdown(id);
      await loadAssetData();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve breakdown');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommission = async () => {
    if (!confirm('Commission this asset into active service?')) return;
    setActionLoading(true);
    try {
      await api.assets.commission(id);
      await loadAssetData();
    } catch (err: any) {
      alert(err.message || 'Failed to commission asset');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordReading = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeter) return;
    setActionLoading(true);
    try {
      await api.assetMeters.recordReading(selectedMeter.id, {
        reading: Number(readingData.reading),
        notes: readingData.notes || undefined,
        isReset: readingData.isReset,
      });
      setShowReadingModal(false);
      setReadingData({ reading: '', notes: '', isReset: false });
      await loadAssetData();
    } catch (err: any) {
      alert(err.message || 'Failed to record meter reading');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <p>Loading asset details...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-16 text-center text-muted-foreground">
        <Boxes className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <h2 className="text-lg font-bold text-foreground">Asset Not Found</h2>
        <p className="text-sm mt-1">The requested asset could not be found or has been removed.</p>
        <Link
          href="/app/assets"
          className="inline-flex items-center px-4 py-2 mt-4 text-sm font-medium rounded-lg text-primary-foreground bg-primary"
        >
          Back to Registry
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-start space-x-4">
          <Link
            href="/app/assets"
            className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                {asset.assetCode}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">{asset.name}</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
              <span>
                Category: <strong>{asset.category?.name || '—'}</strong>
              </span>
              <span>•</span>
              <span>
                Manufacturer: <strong>{asset.manufacturer || '—'}</strong>
              </span>
              <span>•</span>
              <span>
                Model: <strong>{asset.modelNumber || '—'}</strong>
              </span>
              <span>•</span>
              <span>
                Serial: <strong className="font-mono">{asset.serialNumber || '—'}</strong>
              </span>
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center px-3 py-2 border border-border shadow-sm text-sm font-medium rounded-lg text-foreground bg-card hover:bg-surface-muted transition-colors"
          >
            <QrCode className="h-4 w-4 mr-2 text-primary" />
            Print QR Label
          </button>

          <button
            onClick={() => setShowMoveModal(true)}
            className="inline-flex items-center px-3 py-2 border border-border shadow-sm text-sm font-medium rounded-lg text-foreground bg-card hover:bg-surface-muted transition-colors"
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Move Location
          </button>

          {asset.lifecycleState === 'REGISTERED' && (
            <button
              onClick={handleCommission}
              disabled={actionLoading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Zap className="h-4 w-4 mr-2" />
              Commission
            </button>
          )}

          {asset.operationalStatus === 'OPERATIONAL' ? (
            <button
              onClick={() => setShowBreakdownModal(true)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-rose-700 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Breakdown
            </button>
          ) : (
            <button
              onClick={handleResolveBreakdown}
              disabled={actionLoading}
              className="inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg text-emerald-700 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Restore Operational
            </button>
          )}
        </div>
      </div>

      {/* Badges Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Lifecycle:</span>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
            {asset.lifecycleState}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Operational Status:</span>
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
              asset.operationalStatus === 'OPERATIONAL'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
            }`}
          >
            {asset.operationalStatus}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Condition:</span>
          <span className="px-2.5 py-0.5 text-xs font-semibold rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {asset.condition}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Criticality:</span>
          <span
            className={`px-2.5 py-0.5 text-xs font-semibold rounded ${
              asset.criticality === 'CRITICAL'
                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300'
                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {asset.criticality}
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto font-mono text-xs text-muted-foreground">
          <QrCode className="h-3.5 w-3.5 text-primary" />
          <span>
            QR: <strong>{asset.qrIdentifier}</strong>
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-border space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'overview'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview & Specs
        </button>

        <button
          onClick={() => setActiveTab('location')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'location'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Location & Movements ({asset.locationHistory?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('warranties')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'warranties'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Warranties ({warranties.length})
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'contracts'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          AMC Contracts ({asset.serviceContractLinks?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('meters')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'meters'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Meters & Readings ({meters.length})
        </button>

        <button
          onClick={() => setActiveTab('service')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'service'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Service History ({serviceHistory.length})
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-base font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Technical Specifications & Metadata
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {asset.description || 'No detailed description recorded.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-3 border-t border-border text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Purchase Date</span>
                  <span className="font-medium text-foreground">
                    {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : '—'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">Installation Date</span>
                  <span className="font-medium text-foreground">
                    {asset.installationDate
                      ? new Date(asset.installationDate).toLocaleDateString()
                      : '—'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">Commissioned At</span>
                  <span className="font-medium text-foreground">
                    {asset.commissionedAt
                      ? new Date(asset.commissionedAt).toLocaleDateString()
                      : '—'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">Expected Life</span>
                  <span className="font-medium text-foreground">
                    {asset.expectedLifeYears ? `${asset.expectedLifeYears} Years` : '—'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">Is Movable</span>
                  <span className="font-medium text-foreground">
                    {asset.isMovable ? 'Yes' : 'Fixed Physical Installation'}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-muted-foreground block">Barcode Identifier</span>
                  <span className="font-mono font-medium text-foreground">
                    {asset.barcodeIdentifier || '—'}
                  </span>
                </div>
              </div>
            </div>

            {asset.model?.specifications && Object.keys(asset.model.specifications).length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-3">
                <h2 className="text-base font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  Catalog Model Specifications ({asset.model.modelName})
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {Object.entries(asset.model.specifications).map(([k, v]) => (
                    <div key={k} className="p-2.5 rounded-lg bg-muted/40 border border-border">
                      <span className="text-muted-foreground block uppercase text-[10px] tracking-wider">
                        {k}
                      </span>
                      <span className="font-semibold text-foreground text-sm">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side Info Cards */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Current Placement
              </h2>

              <div className="text-xs space-y-2 text-foreground">
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="font-medium">{asset.locationType}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-muted-foreground">Building:</span>
                  <span className="font-medium">{asset.building?.name || '—'}</span>
                </div>
                <div className="py-1">
                  <span className="text-muted-foreground block mb-1">Description:</span>
                  <span className="font-medium text-sm text-foreground bg-muted/50 p-2 rounded block">
                    {asset.locationDescription || '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Active Warranty & AMC Protection
              </h2>

              <div className="text-xs space-y-2">
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300">
                  <span className="font-semibold block">Manufacturer Warranty</span>
                  <span className="text-[11px] block mt-0.5">
                    {warranties.length > 0
                      ? `${warranties[0].providerName} (Expires ${new Date(warranties[0].endDate).toLocaleDateString()})`
                      : 'No active warranty registered.'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300">
                  <span className="font-semibold block">Annual Service Contract</span>
                  <span className="text-[11px] block mt-0.5">
                    {asset.serviceContractLinks?.length > 0
                      ? `${asset.serviceContractLinks[0].contract?.name} (${asset.serviceContractLinks[0].contract?.serviceProviderName})`
                      : 'No active AMC linked.'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Location History */}
      {activeTab === 'location' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <History className="h-4 w-4 text-primary" />
              Physical Movement & Placement History
            </h2>
            <button
              onClick={() => setShowMoveModal(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90"
            >
              Move Location
            </button>
          </div>

          {asset.locationHistory?.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No location transfers recorded.
            </p>
          ) : (
            <div className="relative border-l border-border ml-4 space-y-6 py-2">
              {asset.locationHistory?.map((entry: any) => (
                <div key={entry.id} className="relative pl-6">
                  <div className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">
                      Moved to: {entry.toBuilding?.name || entry.toLocationType}
                    </span>
                    <span className="text-xs text-muted-foreground block">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                    {entry.toLocationDescription && (
                      <p className="text-xs text-muted-foreground mt-1 bg-muted/40 p-2 rounded">
                        {entry.toLocationDescription}
                      </p>
                    )}
                    {entry.reason && (
                      <span className="text-xs text-primary block mt-1">
                        Reason: {entry.reason}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Warranties */}
      {activeTab === 'warranties' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Asset Warranties
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {warranties.map((w) => (
              <div
                key={w.id}
                className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{w.providerName}</span>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                    {w.status}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{w.coverageSummary}</p>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
                  <div>
                    <span className="text-muted-foreground block">Start Date</span>
                    <span className="font-medium text-foreground">
                      {new Date(w.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">End Date</span>
                    <span className="font-medium text-foreground">
                      {new Date(w.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: AMC Contracts */}
      {activeTab === 'contracts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Covered Service Contracts (AMC / CMC)
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {asset.serviceContractLinks?.map((link: any) => (
              <div
                key={link.id}
                className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground text-base block">
                      {link.contract?.name}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {link.contract?.contractNumber}
                    </span>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {link.contract?.contractType}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground">{link.contract?.coverageSummary}</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-3 border-t border-border">
                  <div>
                    <span className="text-muted-foreground block">Provider</span>
                    <span className="font-medium text-foreground">
                      {link.contract?.serviceProviderName}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">SLA Response</span>
                    <span className="font-medium text-foreground">
                      {link.contract?.slaResponseHours
                        ? `${link.contract.slaResponseHours} Hours`
                        : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Visits / Year</span>
                    <span className="font-medium text-foreground">
                      {link.contract?.preventiveVisitsPerYear} Visits
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">Validity</span>
                    <span className="font-medium text-foreground">
                      {new Date(link.contract?.endDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Meters & Readings */}
      {activeTab === 'meters' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Gauge className="h-4 w-4 text-primary" />
              Asset Meters & Cumulative Counters
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {meters.map((meter) => (
              <div
                key={meter.id}
                className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                    {meter.meterType}
                  </span>
                  <span className="text-xs text-muted-foreground">{meter.unit}</span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-foreground">{meter.name}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-foreground font-mono">
                      {Number(meter.currentReading).toLocaleString()}
                    </span>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {meter.unit}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">
                    Last:{' '}
                    {meter.lastRecordedAt
                      ? new Date(meter.lastRecordedAt).toLocaleDateString()
                      : '—'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedMeter(meter);
                      setShowReadingModal(true);
                    }}
                    className="px-3 py-1 text-xs font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90"
                  >
                    Log Reading
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Service History */}
      {activeTab === 'service' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" />
            Complete Service, Breakdown & Work Order History
          </h2>

          {serviceHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No service events recorded for this asset.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {serviceHistory.map((s) => (
                <div key={s.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-foreground text-sm block">
                      {s.title || s.serviceType}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.serviceDate || s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-muted text-foreground">
                    {s.serviceType || 'MAINTENANCE'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Printable QR Label */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                Printable Physical Asset Badge
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 bg-white text-slate-900 rounded-xl border-2 border-slate-900 space-y-4 text-center print:border-none">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                  COMMUNITY OS ASSET
                </span>
                <span className="text-xs font-mono font-bold">{asset.assetCode}</span>
              </div>

              <div className="py-2 flex flex-col items-center">
                {/* Mock QR Block */}
                <div className="w-36 h-36 border-4 border-slate-900 p-2 flex flex-col items-center justify-center bg-slate-50 rounded-lg">
                  <QrCode className="w-24 h-24 text-slate-900" />
                  <span className="text-[8px] font-mono text-slate-500 mt-1 truncate max-w-[120px]">
                    {asset.qrIdentifier}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-base leading-tight">{asset.name}</h4>
                <p className="text-xs text-slate-600 mt-1">
                  {asset.building?.name || asset.locationDescription}
                </p>
                <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                  S/N: {asset.serialNumber || 'N/A'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-500">
                <span>
                  Criticality: <strong>{asset.criticality}</strong>
                </span>
                <span>Scan with Community OS App</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Label
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Move Location */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                Transfer Physical Location
              </h3>
              <button
                onClick={() => setShowMoveModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleMoveLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  New Location Type
                </label>
                <select
                  value={moveData.toLocationType}
                  onChange={(e) => setMoveData({ ...moveData, toLocationType: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="COMMUNITY">Community Common Area</option>
                  <option value="BUILDING">Building / Tower</option>
                  <option value="FLOOR">Floor</option>
                  <option value="UNIT">Unit</option>
                  <option value="OTHER">Other / Site Facility</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Location Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tower B Basement 2 Engineering Bay"
                  value={moveData.toLocationDescription}
                  onChange={(e) =>
                    setMoveData({ ...moveData, toLocationDescription: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Reason for Move
                </label>
                <input
                  type="text"
                  placeholder="e.g. Relocated for scheduled overhaul"
                  value={moveData.reason}
                  onChange={(e) => setMoveData({ ...moveData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMoveModal(false)}
                  className="px-4 py-2 border border-border text-sm font-medium rounded-lg text-foreground bg-card hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90"
                >
                  {actionLoading ? 'Updating...' : 'Record Move'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Report Breakdown */}
      {showBreakdownModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                Report Asset Breakdown / Outage
              </h3>
              <button
                onClick={() => setShowBreakdownModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleReportBreakdown} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Outage Reason
                </label>
                <select
                  value={breakdownData.reason}
                  onChange={(e) => setBreakdownData({ ...breakdownData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="BREAKDOWN">Mechanical / Electrical Breakdown</option>
                  <option value="EMERGENCY_REPAIR">Emergency Repair</option>
                  <option value="SCHEDULED_MAINTENANCE">Scheduled Overhaul</option>
                  <option value="POWER_OUTAGE">Power Failure</option>
                  <option value="OTHER">Other Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Impact Level
                </label>
                <select
                  value={breakdownData.impactLevel}
                  onChange={(e) =>
                    setBreakdownData({ ...breakdownData, impactLevel: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="FULL_OUTAGE">
                    Full Outage (Asset completely non-operational)
                  </option>
                  <option value="PARTIAL_DEGRADATION">
                    Partial Degradation (Operating at reduced capacity)
                  </option>
                  <option value="NO_IMPACT">No Immediate Impact</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Incident Notes & Symptoms
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe failure symptoms, alarms, or leakages..."
                  value={breakdownData.notes}
                  onChange={(e) => setBreakdownData({ ...breakdownData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBreakdownModal(false)}
                  className="px-4 py-2 border border-border text-sm font-medium rounded-lg text-foreground bg-card hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-rose-600 hover:bg-rose-700"
                >
                  {actionLoading ? 'Recording...' : 'Record Breakdown'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Meter Reading */}
      {showReadingModal && selectedMeter && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                Log Reading for {selectedMeter.name}
              </h3>
              <button
                onClick={() => setShowReadingModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-muted/40 rounded-lg text-xs flex justify-between">
              <span className="text-muted-foreground">Previous Reading:</span>
              <span className="font-bold text-foreground font-mono">
                {Number(selectedMeter.currentReading).toLocaleString()} {selectedMeter.unit}
              </span>
            </div>

            <form onSubmit={handleRecordReading} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  New Reading ({selectedMeter.unit}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder={`Current reading must be >= ${selectedMeter.currentReading}`}
                  value={readingData.reading}
                  onChange={(e) => setReadingData({ ...readingData, reading: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Routine reading log"
                  value={readingData.notes}
                  onChange={(e) => setReadingData({ ...readingData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReadingModal(false)}
                  className="px-4 py-2 border border-border text-sm font-medium rounded-lg text-foreground bg-card hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90"
                >
                  {actionLoading ? 'Recording...' : 'Save Reading'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
