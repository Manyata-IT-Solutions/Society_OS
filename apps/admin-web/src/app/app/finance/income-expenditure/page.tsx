'use client';
import React from 'react';

export default function IncomeExpenditurePage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Income & Expenditure Statement</h1>
        <p className="text-slate-500">
          Period financial surplus/deficit breakdown for residential societies
        </p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="text-xl font-bold text-slate-800">Net Surplus: ₹238,000.00</div>
      </div>
    </div>
  );
}
