'use client';
export default function BankStatementImportPage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bank Statement Import</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">
          Upload bank statement files (CSV/XLSX) with automatic duplicate detection.
        </p>
      </div>
    </div>
  );
}
