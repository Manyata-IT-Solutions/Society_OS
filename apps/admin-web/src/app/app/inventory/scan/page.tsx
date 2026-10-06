'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { ScanLine, Search, Package, AlertCircle } from 'lucide-react';

export default function InventoryScanLookupPage() {
  const [identifier, setIdentifier] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.inventory.items.scan(identifier.trim());
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'No item matched the scanned code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">QR / Barcode Inventory Scanner</h1>
        <p className="text-muted text-sm">
          Scan hardware barcodes, serial numbers, or bin labels for immediate item lookup and
          balance inspection.
        </p>
      </div>

      <form
        onSubmit={handleScan}
        className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-4"
      >
        <div className="relative">
          <ScanLine className="absolute left-3 top-3 h-5 w-5 text-muted" />
          <input
            type="text"
            autoFocus
            required
            placeholder="Scan barcode or enter item code / serial..."
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-lg text-base font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
        >
          <Search className="h-4 w-4" /> {loading ? 'Scanning Catalog...' : 'Lookup Item'}
        </button>
      </form>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {result && (
        <div className="p-6 rounded-xl border border-border bg-surface shadow-sm space-y-4">
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div>
              <span className="font-mono text-xs text-muted uppercase">{result.itemCode}</span>
              <h2 className="text-xl font-bold text-foreground">{result.name}</h2>
              <p className="text-xs text-muted mt-1">
                {result.description || 'No description provided.'}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {result.itemType}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-muted block">Category</span>
              <span className="font-semibold text-foreground">{result.category?.name || '-'}</span>
            </div>
            <div>
              <span className="text-muted block">Base UOM</span>
              <span className="font-semibold text-foreground">
                {result.baseUom?.symbol || result.baseUom?.code}
              </span>
            </div>
            <div>
              <span className="text-muted block">Min Level</span>
              <span className="font-semibold text-foreground">{result.minStockLevel ?? '-'}</span>
            </div>
            <div>
              <span className="text-muted block">Reorder Point</span>
              <span className="font-semibold text-amber-500">{result.reorderLevel ?? '-'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
