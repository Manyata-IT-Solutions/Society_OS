'use client';
import { useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';

export default function UnifiedSearchPage() {
  const [query, setQuery] = useState('');
  const [results] = useState([
    { type: 'TICKET', id: 'CMP-2026-000101', title: 'Water Seepage in Tower A Basement 1', snippet: 'Plumbing Complaint - Maintenance team dispatched.' },
    { type: 'POLICY', id: 'POL-PARKING-2026', title: 'Estate Visitor Parking Guidelines & Overnight Rules', snippet: 'Visitor vehicles may park up to 4 hours free.' },
    { type: 'ASSET', id: 'AST-LIFT-A1', title: 'Passenger Elevator A1 - Tower A', snippet: 'Schindler 13-passenger traction elevator.' },
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Search className="h-6 w-6 text-violet-500" /> Unified Enterprise Search
        </h1>
        <p className="text-sm text-muted">Global real-time search across all 24 operational modules with strict RBAC permission scoping.</p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search tickets, work orders, invoices, assets, parking rules, residents, compliance certificates..."
          className="w-full px-4 py-3 pl-11 bg-surface border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Search className="h-5 w-5 text-muted absolute left-3.5 top-3.5" />
      </div>

      <div className="border border-border rounded-lg bg-surface divide-y divide-border">
        {results.map((r, idx) => (
          <div key={idx} className="p-4 flex justify-between items-center hover:bg-surface-muted/50 cursor-pointer">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-violet-500/10 text-violet-600 rounded">{r.type}</span>
                <span className="text-xs text-muted font-mono">{r.id}</span>
                <h4 className="font-semibold text-foreground text-sm">{r.title}</h4>
              </div>
              <p className="text-xs text-muted mt-1">{r.snippet}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
