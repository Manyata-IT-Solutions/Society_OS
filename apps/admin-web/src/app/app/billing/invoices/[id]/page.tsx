'use client';
import { use, useState } from 'react';
import Link from 'next/link';

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [invoice] = useState<any>({
    id,
    invoiceNumber: 'INV-2026-000001',
    billableAccountName: 'Unit A-101 (Mr. Rahul Sharma)',
    unitNumber: 'A-101',
    periodName: 'April 2026',
    invoiceDate: '2026-04-01',
    dueDate: '2026-04-10',
    status: 'PAID',
    subtotal: 3600,
    grandTotal: 3600,
    allocatedAmount: 3600,
    outstandingAmount: 0,
    lines: [
      { id: '1', description: 'Monthly Maintenance (1200 sqft @ ₹2.50)', amount: 3000 },
      { id: '2', description: 'Sinking Fund Contribution (Statutory)', amount: 500 },
      { id: '3', description: 'Covered Parking Slot P-12', amount: 100 },
    ],
  });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <Link href="/app/billing/invoices" className="text-sm text-indigo-600 hover:underline">
            ← Back to Invoices
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Invoice {invoice.invoiceNumber}</h1>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Download PDF
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-6">
        <div className="grid grid-cols-2 gap-4 border-b pb-4">
          <div>
            <div className="text-xs text-gray-500 uppercase">Billed To</div>
            <div className="text-base font-semibold text-gray-900 mt-1">
              {invoice.billableAccountName}
            </div>
            <div className="text-sm text-gray-600">Unit: {invoice.unitNumber}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase">Billing Period</div>
            <div className="text-base font-semibold text-gray-900 mt-1">{invoice.periodName}</div>
            <div className="text-sm text-gray-600">Due: {invoice.dueDate}</div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Itemized Charges</h3>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-500 font-medium">Description</th>
                <th className="px-4 py-2 text-right text-gray-500 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoice.lines.map((l: any) => (
                <tr key={l.id}>
                  <td className="px-4 py-2 text-gray-900">{l.description}</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">
                    ₹{l.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2 text-gray-900">Grand Total</td>
                <td className="px-4 py-2 text-right text-indigo-600">
                  ₹{invoice.grandTotal.toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
