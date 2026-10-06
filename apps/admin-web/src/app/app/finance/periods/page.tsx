'use client';
import React from 'react';

export default function FiscalPeriodsPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fiscal Years & Accounting Periods</h1>
        <p className="text-slate-500">
          Period closing checklists, Soft Close, Hard Close, and controlled reopen
        </p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-500">
          FY 2026-27: 12 Periods generated (Period 1 active).
        </p>
      </div>
    </div>
  );
}
