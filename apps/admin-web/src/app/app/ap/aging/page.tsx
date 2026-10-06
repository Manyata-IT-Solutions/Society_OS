'use client';
export default function ApAgingPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Accounts Payable Aging Matrix</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">
          Payables breakdown across Not Due, 0-30, 31-60, 61-90, 91-120, and 120+ day buckets.
        </p>
      </div>
    </div>
  );
}
