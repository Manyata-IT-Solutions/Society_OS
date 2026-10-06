'use client';
import Link from 'next/link';

export default function TreasuryDashboardPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Treasury & Banking Operations</h1>
          <p className="text-gray-500">
            Bank Accounts, Statement Import, Cash Position & Reconciliation
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/app/treasury/statements/import"
            className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
          >
            Import Bank Statement
          </Link>
          <Link
            href="/app/treasury/reconciliation"
            className="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700"
          >
            Reconciliation Workspace
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Book Bank Balance</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹5,35,000</p>
          <p className="text-xs text-green-600 mt-1">Mapped to GL 1120</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Unreconciled Bank Transactions</h3>
          <p className="text-3xl font-bold text-amber-600 mt-2">1</p>
          <p className="text-xs text-gray-500 mt-1">April Statement</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Reconciliation Difference</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹0.00</p>
          <p className="text-xs text-green-600 mt-1">Balanced with General Ledger</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/app/treasury/accounts"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition"
        >
          <h3 className="text-lg font-semibold text-gray-900">Bank Accounts Master</h3>
          <p className="text-sm text-gray-500 mt-1">
            Configure operating accounts, escrow, and GL account mappings
          </p>
        </Link>
        <Link
          href="/app/treasury/statements/import"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition"
        >
          <h3 className="text-lg font-semibold text-gray-900">Bank Statement Import</h3>
          <p className="text-sm text-gray-500 mt-1">
            Upload CSV statements with fingerprint deduplication protection
          </p>
        </Link>
        <Link
          href="/app/treasury/reconciliation"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition"
        >
          <h3 className="text-lg font-semibold text-gray-900">Reconciliation Workspace</h3>
          <p className="text-sm text-gray-500 mt-1">
            Execute automated matching, manual match, and post bank fees
          </p>
        </Link>
      </div>
    </div>
  );
}
