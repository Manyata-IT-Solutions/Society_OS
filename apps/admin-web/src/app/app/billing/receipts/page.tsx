'use client';
export default function ReceiptsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Official Receipts</h1>
          <p className="text-sm text-gray-500">Payment receipts and PDF archives</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-600">Official receipt history.</p>
      </div>
    </div>
  );
}
