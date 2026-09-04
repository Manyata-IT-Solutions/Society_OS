'use client';
import React from 'react';

export default function BalanceSheetPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Balance Sheet</h1>
        <p className="text-slate-500">Assets = Liabilities + Society Reserves & Fund Balances</p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-xl font-bold text-emerald-600">
          Total Assets = Total Liabilities & Funds
        </div>
      </div>
    </div>
  );
}
