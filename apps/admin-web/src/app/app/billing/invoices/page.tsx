'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function InvoicesListPage() {
  const [invoices] = useState<any[]>([
    {
      id: 'inv-1',
      invoiceNumber: 'INV-2026-000001',
      unitNumber: 'A-101',
      billableAccountName: 'Unit A-101 (Mr. Rahul Sharma)',
      invoiceDate: '2026-04-01',
      dueDate: '2026-04-10',
      grandTotal: 3600,
      outstandingAmount: 0,
      status: 'PAID',
    },
    {
      id: 'inv-2',
      invoiceNumber: 'INV-2026-000002',
      unitNumber: 'A-102',
      billableAccountName: 'Unit A-102 (Mrs. Priya Patel)',
      invoiceDate: '2026-04-01',
      dueDate: '2026-04-10',
      grandTotal: 3600,
      outstandingAmount: 1600,
      status: 'PARTIALLY_PAID',
    },
    {
      id: 'inv-3',
      invoiceNumber: 'INV-2026-000003',
      unitNumber: 'B-201',
      billableAccountName: 'Unit B-201 (Amit Verma)',
      invoiceDate: '2026-04-01',
      dueDate: '2026-04-10',
      grandTotal: 4100,
      outstandingAmount: 4100,
      status: 'OVERDUE',
    },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices Registry</h1>
          <p className="text-sm text-gray-500">
            Authoritative record of maintenance invoices and dues
          </p>
        </div>
        <Link
          href="/app/billing/runs"
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700"
        >
          + Generate Batch Invoices
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Invoice #</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Unit / Account</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Date</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Due Date</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Amount</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Outstanding</th>
              <th className="px-6 py-3 text-center font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono font-medium text-indigo-600">
                  {inv.invoiceNumber}
                </td>
                <td className="px-6 py-4 text-gray-900">{inv.billableAccountName}</td>
                <td className="px-6 py-4 text-gray-500">{inv.invoiceDate}</td>
                <td className="px-6 py-4 text-gray-500">{inv.dueDate}</td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">
                  ₹{inv.grandTotal.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">
                  ₹{inv.outstandingAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inv.status === 'PARTIALLY_PAID'
                          ? 'bg-amber-100 text-amber-800'
                          : inv.status === 'OVERDUE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/app/billing/invoices/${inv.id}`}
                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
