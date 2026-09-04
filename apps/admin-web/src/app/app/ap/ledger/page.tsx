'use client';
export default function VendorLedgerPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Vendor Subledger Statement</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">
          Append-only chronological statement of invoices, payments, advances, and running balances.
        </p>
      </div>
    </div>
  );
}
