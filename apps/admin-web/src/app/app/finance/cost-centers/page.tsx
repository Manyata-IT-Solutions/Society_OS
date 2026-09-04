'use client';
import React from 'react';

export default function CostCentersPage() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cost Centers & Allocations</h1>
        <p className="text-slate-500">Departmental and operational cost breakdown</p>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <p className="text-sm text-slate-500">6 Cost Centers configured.</p>
      </div>
    </div>
  );
}
