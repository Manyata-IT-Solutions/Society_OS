'use client';

import React from 'react';
import { Wrench, CheckCircle, FileText } from 'lucide-react';

export default function ServiceReceiptsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Service Entry Sheets & Acceptance</h1>
        <p className="text-sm text-muted">
          Verify delivered service milestones against Service Purchase Orders without stock ledger
          mutations.
        </p>
      </div>
      <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted">
        <Wrench className="h-8 w-8 mx-auto mb-2 text-primary opacity-80" />
        <p>
          Service entry sheets are logged against service PO milestones and verified by facilities
          supervisors.
        </p>
      </div>
    </div>
  );
}
