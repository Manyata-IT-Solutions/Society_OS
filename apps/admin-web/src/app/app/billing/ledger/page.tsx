'use client';
export default function ResidentLedgerPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Resident Subledger</h1>
      <p className="text-sm text-gray-500">Immutable transaction history and running balances</p>
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-600">Ledger entries.</p>
      </div>
    </div>
  );
}
