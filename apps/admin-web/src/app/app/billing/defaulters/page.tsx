'use client';
export default function DefaultersPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Defaulter Management &amp; Collections</h1>
      <p className="text-sm text-gray-500">
        Track overdue accounts, send reminders, and record promises to pay
      </p>
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <p className="text-sm text-gray-600">Defaulters queue.</p>
      </div>
    </div>
  );
}
