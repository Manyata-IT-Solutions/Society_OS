'use client';
import React, { use } from 'react';
import Link from 'next/link';

export default function JournalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">Journal Voucher JV-2026-000001</h1>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
              POSTED
            </span>
          </div>
          <p className="text-slate-500">General Journal Voucher • Posted on 2026-04-05</p>
        </div>
        <Link
          href="/app/finance/journals"
          className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
        >
          ← Back to Journals
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <h3 className="font-semibold text-slate-800">Double-Entry Journal Lines</h3>
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Fund / Cost Center</th>
              <th className="px-4 py-3 text-right">Debit (₹)</th>
              <th className="px-4 py-3 text-right">Credit (₹)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-4 py-3">1</td>
              <td className="px-4 py-3 font-medium text-slate-900">
                5200 - Electricity & Utility Bills
              </td>
              <td className="px-4 py-3">Main Pump House BESCOM charges</td>
              <td className="px-4 py-3 text-xs text-slate-500">General Fund • Common Area</td>
              <td className="px-4 py-3 text-right font-mono font-medium">₹25,000.00</td>
              <td className="px-4 py-3 text-right font-mono text-slate-400">₹0.00</td>
            </tr>
            <tr>
              <td className="px-4 py-3">2</td>
              <td className="px-4 py-3 font-medium text-slate-900">
                1110 - Primary Operating Bank Account
              </td>
              <td className="px-4 py-3">NEFT Payment to BESCOM</td>
              <td className="px-4 py-3 text-xs text-slate-500">General Fund</td>
              <td className="px-4 py-3 text-right font-mono text-slate-400">₹0.00</td>
              <td className="px-4 py-3 text-right font-mono font-medium">₹25,000.00</td>
            </tr>
          </tbody>
          <tfoot className="border-t-2 border-slate-200 font-semibold text-slate-900">
            <tr>
              <td colSpan={4} className="px-4 py-3 text-right">
                Total:
              </td>
              <td className="px-4 py-3 text-right font-mono">₹25,000.00</td>
              <td className="px-4 py-3 text-right font-mono">₹25,000.00</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
