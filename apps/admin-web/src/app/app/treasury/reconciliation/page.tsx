'use client';
export default function BankReconciliationWorkspacePage() {
  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Bank Reconciliation Desktop Workspace</h1>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500">
          Two-column reconciliation workbench comparing bank statement items against internal
          payments and journals.
        </p>
      </div>
    </div>
  );
}
