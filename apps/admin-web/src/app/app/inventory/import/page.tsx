'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { UploadCloud, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

export default function BulkItemImportPage() {
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [csvContent, setCsvContent] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const sampleCsv = `name,categoryCode,uomCode,itemType,minStockLevel,reorderLevel\nLED Bulb 9W,ELECTRICAL,PCS,SPARE_PART,20,50\nWater Pump Impeller,PLUMBING,PCS,SPARE_PART,5,10\nPVC Pipe 1 inch,PLUMBING,MTR,RAW_MATERIAL,100,200\nMCB 16A Single Pole,ELECTRICAL,PCS,SPARE_PART,15,30`;

  const handlePreview = async () => {
    if (!orgId || !csvContent.trim()) return;
    setLoading(true);
    setImportResult(null);
    try {
      const res = await api.inventory.import.preview(orgId, csvContent);
      setPreviewData(res);
    } catch (err: any) {
      alert(err?.message || 'Failed to preview CSV');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!orgId || !previewData?.preview) return;
    setLoading(true);
    try {
      const res = await api.inventory.import.execute(orgId, commId || null, previewData.preview);
      setImportResult(res);
      setPreviewData(null);
    } catch (err: any) {
      alert(err?.message || 'Import execution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Bulk Inventory Item Import</h1>
        <p className="text-muted text-sm">
          Import spare parts and consumables in bulk via CSV format with validation against Category
          and UOM tables.
        </p>
      </div>

      <div className="p-6 rounded-xl border border-border bg-surface shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase text-muted">Paste CSV Data</label>
          <button
            onClick={() => setCsvContent(sampleCsv)}
            className="text-xs text-primary font-medium hover:underline"
          >
            Load Sample Template
          </button>
        </div>

        <textarea
          rows={8}
          value={csvContent}
          onChange={(e) => setCsvContent(e.target.value)}
          placeholder="name,categoryCode,uomCode,itemType,minStockLevel,reorderLevel"
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={handlePreview}
            disabled={loading || !csvContent.trim()}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            {loading ? 'Validating...' : 'Validate & Preview'}
          </button>
        </div>
      </div>

      {previewData && (
        <div className="p-6 rounded-xl border border-border bg-surface shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold">Import Preview</h3>
              <p className="text-xs text-muted">
                {previewData.validRows} valid rows | {previewData.invalidRows} errors
              </p>
            </div>
            <button
              onClick={handleExecute}
              disabled={loading || previewData.validRows === 0}
              className="px-4 py-2 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Execute Import ({previewData.validRows} Items)
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-surface-muted text-muted uppercase">
                <tr>
                  <th className="p-2">Name</th>
                  <th className="p-2">Category</th>
                  <th className="p-2">UOM</th>
                  <th className="p-2">Type</th>
                  <th className="p-2">Min / Reorder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {previewData.preview.map((row: any, i: number) => (
                  <tr key={i} className="hover:bg-surface-muted/50">
                    <td className="p-2 font-sans font-medium">{row.name}</td>
                    <td className="p-2">{row.categoryCode}</td>
                    <td className="p-2">{row.uomCode}</td>
                    <td className="p-2">{row.itemType}</td>
                    <td className="p-2">
                      {row.minStockLevel || '-'} / {row.reorderLevel || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importResult && (
        <div className="p-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 space-y-2">
          <div className="flex items-center gap-2 font-bold text-base">
            <CheckCircle2 className="h-5 w-5" /> Import Complete!
          </div>
          <p className="text-xs">
            Successfully imported {importResult.successfulRows} items. ({importResult.failedRows}{' '}
            failed)
          </p>
        </div>
      )}
    </div>
  );
}
