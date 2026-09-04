'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  QrCode,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  Boxes,
  Wrench,
  Gauge,
  ChevronRight,
} from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';

export default function MobileAssetScanPage() {
  const router = useRouter();
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [tokenInput, setTokenInput] = useState('');
  const [resolvedAsset, setResolvedAsset] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async (token: string) => {
    if (!token.trim()) return;
    setLoading(true);
    setError(null);
    setResolvedAsset(null);

    try {
      let result = null;
      if (token.startsWith('BC-') || !token.startsWith('ast_qr_')) {
        // Try barcode first
        result = await api.assets.resolveByBarcode(token, orgId, commId);
      } else {
        result = await api.assets.resolveByQr(token);
      }

      setResolvedAsset(result);
    } catch (err: any) {
      setError(err.message || 'Asset not found with the scanned token/barcode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-16">
      <div className="flex items-center space-x-4 border-b border-border pb-4">
        <Link
          href="/app/assets"
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Scanner & Fast Lookup
          </h1>
          <p className="text-xs text-muted-foreground">
            Scan physical QR code or enter asset identifier.
          </p>
        </div>
      </div>

      {/* Simulated Scanner Viewport */}
      <div className="bg-slate-900 rounded-2xl p-6 text-center text-white space-y-4 shadow-xl">
        <div className="w-48 h-48 mx-auto border-2 border-dashed border-primary/80 rounded-2xl flex flex-col items-center justify-center p-4 bg-slate-800/60 relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-1 bg-primary animate-pulse" />
          <QrCode className="w-16 h-16 text-primary mb-2" />
          <span className="text-[10px] text-slate-400">Align QR Code within frame</span>
        </div>

        <div className="space-y-2">
          <span className="text-xs text-slate-300">Or input scanned token directly:</span>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleResolve(tokenInput);
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="e.g. ast_qr_dg01cummins500"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90"
            >
              {loading ? '...' : 'Lookup'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Resolved Asset Card */}
      {resolvedAsset && (
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
              {resolvedAsset.assetCode}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {resolvedAsset.operationalStatus}
            </span>
          </div>

          <div>
            <h3 className="font-bold text-base text-foreground">{resolvedAsset.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {resolvedAsset.locationDescription}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
            <div>
              <span className="text-muted-foreground block text-[10px]">Manufacturer</span>
              <span className="font-medium text-foreground">
                {resolvedAsset.manufacturer || '—'}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground block text-[10px]">Criticality</span>
              <span className="font-medium text-foreground">{resolvedAsset.criticality}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <Link
              href={`/app/assets/${resolvedAsset.id}`}
              className="w-full flex items-center justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              Open Full Asset Passport
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
