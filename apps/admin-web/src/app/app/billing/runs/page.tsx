'use client';
import { useState } from 'react';

export default function BillingRunsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Batch Billing Runs</h1>
          <p className="text-sm text-gray-500">
            Execute mass monthly/quarterly invoice generation with preview and validation
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">New Billing Run Generator</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              Billing Period
            </label>
            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm">
              <option>April 2026 (2026-04-01 to 2026-04-30)</option>
              <option>May 2026 (2026-05-01 to 2026-05-31)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 uppercase">
              Billing Tariff Plan
            </label>
            <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border text-sm">
              <option>Standard Residential Plan (₹2.50/sqft + Sinking Fund)</option>
              <option>Commercial Unit Plan</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
              Run Preview &amp; Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
