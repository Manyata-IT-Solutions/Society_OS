'use client';
import React, { useState } from 'react';

export default function TrialBalancePage() {
  const rows = [
    {
      code: '1110',
      name: 'Primary Operating Bank Account',
      type: 'ASSET',
      opDr: 0,
      opCr: 0,
      perDr: 2450000,
      perCr: 25000,
      clDr: 2425000,
      clCr: 0,
    },
    {
      code: '1200',
      name: 'Accounts Receivable (Maintenance Dues)',
      type: 'ASSET',
      opDr: 0,
      opCr: 0,
      perDr: 0,
      perCr: 0,
      clDr: 0,
      clCr: 0,
    },
    {
      code: '2100',
      name: 'Accounts Payable (Trade Creditors)',
      type: 'LIABILITY',
      opDr: 0,
      opCr: 0,
      perDr: 0,
      perCr: 0,
      clDr: 0,
      clCr: 0,
    },
    {
      code: '3100',
      name: 'General Operating Fund',
      type: 'FUND_BALANCE',
      opDr: 0,
      opCr: 0,
      perDr: 0,
      perCr: 2450000,
      clDr: 0,
      clCr: 2450000,
    },
    {
      code: '5200',
      name: 'Electricity & Utility Bills',
      type: 'EXPENSE',
      opDr: 0,
      opCr: 0,
      perDr: 25000,
      perCr: 0,
      clDr: 25000,
      clCr: 0,
    },
  ];

  const totalClDr = rows.reduce((s, r) => s + r.clDr, 0);
  const totalClCr = rows.reduce((s, r) => s + r.clCr, 0);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trial Balance</h1>
          <p className="text-slate-500">
            Double-entry ledger balance proof: SUM(Debits) == SUM(Credits)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
            ✓ BALANCED (Dr = Cr)
          </span>
          <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="px-6 py-4">Account Code</th>
              <th className="px-6 py-4">Account Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4 text-right">Debit Balance (₹)</th>
              <th className="px-6 py-4 text-right">Credit Balance (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.code} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-mono font-medium text-slate-900">{r.code}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{r.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                    {r.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                  {r.clDr > 0 ? `₹${r.clDr.toLocaleString()}` : '-'}
                </td>
                <td className="px-6 py-4 text-right font-mono font-medium text-slate-900">
                  {r.clCr > 0 ? `₹${r.clCr.toLocaleString()}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t-2 border-slate-300 font-bold text-slate-900">
            <tr>
              <td colSpan={3} className="px-6 py-4 text-right">
                Grand Totals:
              </td>
              <td className="px-6 py-4 text-right font-mono text-indigo-700">
                ₹{totalClDr.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-right font-mono text-indigo-700">
                ₹{totalClCr.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
