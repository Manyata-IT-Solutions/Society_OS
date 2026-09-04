'use client';
import React from 'react';

export default function GeneralLedgerPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">General Ledger & Account Register</h1>
        <p className="text-slate-500">
          Immutable double-entry transaction history with calculated running balances
        </p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-500">
          Displaying chronological general ledger audit records.
        </p>
      </div>
    </div>
  );
}
