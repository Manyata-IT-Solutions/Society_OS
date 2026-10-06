'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Upload, ArrowLeft, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';

export default function AssetImportPage() {
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [csvContent, setCsvContent] = useState('');
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [executeResult, setExecuteResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleCsv = `name,categoryCode,manufacturer,modelNumber,serialNumber,criticality,locationType,locationDescription
Main Chiller Pump 01,PLUMB,Grundfos,CR-90,GRN-CH01-2024,HIGH,BUILDING,Tower A Chiller Plant
Fire Jockey Pump 02,FIRE,Kirloskar,JOK-15,KIR-FP02-2024,CRITICAL,BUILDING,Basement Pump Room
Elevator B Motor,ELEV,OTIS,GEN2-MTR,OTIS-MTR-882,HIGH,BUILDING,Tower A Lift Motor Room`;

  const handlePreview = async () => {
    if (!csvContent.trim()) {
      setError('Please paste CSV content');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.assetImport.preview(csvContent, orgId, commId);
      setPreviewResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to preview CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.assetImport.execute(csvContent, orgId, commId);
      setExecuteResult(res);
      setPreviewResult(null);
    } catch (err: any) {
      setError(err.message || 'Failed to execute import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center space-x-4 border-b border-border pb-5">
        <Link
          href="/app/assets"
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Upload className="h-6 w-6 text-primary" />
            Bulk Asset Onboarding & CSV Import
          </h1>
          <p className="text-sm text-muted-foreground">
            Batch onboard physical assets with automatic sequence codes and QR token allocation.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {executeResult && (
        <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-300 space-y-2">
          <h3 className="font-bold flex items-center gap-2 text-base">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            Successfully Imported {executeResult.successCount} Assets!
          </h3>
          <p className="text-sm">
            Assets are now available in the registry with allocated QR codes.
          </p>
          <Link
            href="/app/assets"
            className="inline-flex items-center px-4 py-2 mt-2 text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700"
          >
            View Asset Registry
          </Link>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">Paste CSV Data</label>
          <button
            onClick={() => setCsvContent(sampleCsv)}
            className="text-xs text-primary hover:underline"
          >
            Insert Sample CSV Template
          </button>
        </div>

        <textarea
          rows={8}
          placeholder="name,categoryCode,manufacturer,modelNumber,serialNumber,criticality,locationType,locationDescription..."
          value={csvContent}
          onChange={(e) => setCsvContent(e.target.value)}
          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground font-mono text-xs focus:ring-2 focus:ring-primary"
        />

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium rounded-lg text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? 'Validating...' : 'Validate & Preview'}
          </button>
        </div>
      </div>

      {previewResult && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Validation Results ({previewResult.validRowsCount} Valid / {previewResult.totalRows}{' '}
            Total)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted border-b border-border">
                  <th className="p-2">Name</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">Serial</th>
                  <th className="p-2">Criticality</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {previewResult.rows?.map((r: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-2 font-medium">{r.name}</td>
                    <td className="p-2 font-mono">{r.categoryCode}</td>
                    <td className="p-2 font-mono">{r.serialNumber || '—'}</td>
                    <td className="p-2">{r.criticality}</td>
                    <td className="p-2">
                      {r.errors?.length > 0 ? (
                        <span className="text-rose-500 font-semibold">{r.errors.join(', ')}</span>
                      ) : (
                        <span className="text-emerald-500 font-semibold">Valid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              onClick={handleExecute}
              disabled={loading || previewResult.validRowsCount === 0}
              className="px-5 py-2 text-sm font-medium rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              Confirm & Import {previewResult.validRowsCount} Assets
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
