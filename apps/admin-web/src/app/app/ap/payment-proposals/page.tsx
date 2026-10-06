'use client';
export default function PaymentProposalsPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Payment Proposals & Runs</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">
          Automated payment proposal generator based on due dates, payment methods, and credit
          netting.
        </p>
      </div>
    </div>
  );
}
