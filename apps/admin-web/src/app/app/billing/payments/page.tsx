'use client';
export default function PaymentsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments Register</h1>
          <p className="text-sm text-gray-500">
            Record and track offline and online resident payments
          </p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-600">
          Active payment records and cheque clearing statuses.
        </p>
      </div>
    </div>
  );
}
