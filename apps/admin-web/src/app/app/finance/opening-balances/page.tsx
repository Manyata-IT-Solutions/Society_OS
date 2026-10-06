'use client';
import React from 'react';

export default function OpeningBalancesPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Opening Balances Migration</h1>
        <p className="text-slate-500">
          Controlled CSV import and posting of balanced migration journals
        </p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-500">Migration wizard ready.</p>
      </div>
    </div>
  );
}
