'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api-client';

export default function BillingDashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Default mock or API fetch
    setLoading(false);
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Resident Maintenance Billing & Receivables
          </h1>
          <p className="text-sm text-gray-500">
            Enterprise billing cycles, invoice generation, receipts, and receivables aging
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/app/billing/runs"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
          >
            + New Billing Run
          </Link>
          <Link
            href="/app/billing/payments"
            className="px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700"
          >
            Record Payment
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Total Invoiced (Current Period)
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">₹1,850,000</div>
          <div className="text-xs text-indigo-600 mt-1">600 Residential Units</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase">Collected Dues</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">₹1,480,000</div>
          <div className="text-xs text-emerald-700 mt-1">80.0% Collection Rate</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Outstanding Receivables
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">₹370,000</div>
          <div className="text-xs text-amber-700 mt-1">94 Units Pending</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 uppercase">
            Overdue (&gt; 30 Days)
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">₹95,000</div>
          <div className="text-xs text-rose-700 mt-1">12 Defaulter Accounts</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <Link
              href="/app/billing/invoices"
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-sm"
            >
              <div className="font-semibold text-gray-900">Invoices</div>
              <div className="text-xs text-gray-500 mt-1">View, issue and filter monthly bills</div>
            </Link>
            <Link
              href="/app/billing/payments"
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-sm"
            >
              <div className="font-semibold text-gray-900">Payments</div>
              <div className="text-xs text-gray-500 mt-1">Record bank transfers, UPI & cheques</div>
            </Link>
            <Link
              href="/app/billing/receipts"
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-sm"
            >
              <div className="font-semibold text-gray-900">Receipts</div>
              <div className="text-xs text-gray-500 mt-1">Official PDF receipts & archives</div>
            </Link>
            <Link
              href="/app/billing/aging"
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-sm"
            >
              <div className="font-semibold text-gray-900">Aging Matrix</div>
              <div className="text-xs text-gray-500 mt-1">Receivables by 0-30, 31-60, 90+ days</div>
            </Link>
            <Link
              href="/app/billing/defaulters"
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-sm"
            >
              <div className="font-semibold text-gray-900">Defaulters & Collections</div>
              <div className="text-xs text-gray-500 mt-1">Follow-ups, notices and promises</div>
            </Link>
            <Link
              href="/app/billing/plans"
              className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-sm"
            >
              <div className="font-semibold text-gray-900">Tariffs & Plans</div>
              <div className="text-xs text-gray-500 mt-1">Configure ₹/sqft & fixed rules</div>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Receivables Aging</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Current (Not Due)</span>
                <span>₹275,000</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '74%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>1–30 Days Overdue</span>
                <span>₹45,000</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-amber-500 h-2 rounded-full" style={{ width: '12%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>31–60 Days Overdue</span>
                <span>₹30,000</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '8%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>90+ Days Overdue</span>
                <span>₹20,000</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-rose-500 h-2 rounded-full" style={{ width: '6%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
