'use client';
export default function AllocatePaymentPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payment Allocation Engine</h1>
      <p className="text-sm text-gray-500">
        Smart allocation across outstanding invoices and advance credits
      </p>
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-600">Allocation matrix.</p>
      </div>
    </div>
  );
}
