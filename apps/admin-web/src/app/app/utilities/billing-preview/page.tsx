'use client';
import { FileText } from 'lucide-react';

export default function BillingPreviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Utility Billing Handoff & Preview</h1>
        <p className="text-sm text-muted">Pre-billing exception checks and idempotent handoff to Phase 14 Billing.</p>
      </div>
      <div className="p-4 bg-surface border border-border rounded-lg text-sm text-muted">
        Run billing previews to inspect calculated charges before committing to resident invoices.
      </div>
    </div>
  );
}
