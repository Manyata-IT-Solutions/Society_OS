'use client';
import { ClipboardList } from 'lucide-react';

export default function InvestigationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Investigations, Root Causes & CAPA</h1>
        <p className="text-sm text-muted">5-Whys analysis, contributing factors, corrective and preventive actions, and verification audit.</p>
      </div>
      <div className="p-4 bg-surface border border-border rounded-lg text-sm text-muted">
        Completed and in-progress incident investigations and CAPA actions will appear here.
      </div>
    </div>
  );
}
