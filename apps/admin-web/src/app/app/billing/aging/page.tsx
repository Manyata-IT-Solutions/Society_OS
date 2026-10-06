'use client';
export default function AgingMatrixPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Receivables Aging Matrix</h1>
      <p className="text-sm text-gray-500">
        Multi-dimensional aging analysis (Current, 1-30, 31-60, 61-90, 90+ days)
      </p>
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-600">Aging table.</p>
      </div>
    </div>
  );
}
