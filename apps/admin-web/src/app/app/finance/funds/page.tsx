'use client';
import React from 'react';

export default function FundsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Community Fund Accounting</h1>
        <p className="text-slate-500">
          Statutory ring-fenced funds (General Fund, Sinking Fund, Corpus Fund)
        </p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-500">4 active funds registered.</p>
      </div>
    </div>
  );
}
