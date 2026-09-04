'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function SupplierInvoicesPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Supplier Invoices</h1>
          <p className="text-gray-500">
            PO-backed goods & services invoices, matching status & approval queue
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Internal #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Supplier Inv #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Invoice Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Matching
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 text-sm font-medium text-blue-600">APINV-2026-000001</td>
              <td className="px-6 py-4 text-sm text-gray-900">INV-APEX-2026-041</td>
              <td className="px-6 py-4 text-sm text-gray-500">Apex Facilities Management</td>
              <td className="px-6 py-4 text-sm text-gray-500">10 Apr 2026</td>
              <td className="px-6 py-4 text-sm text-gray-500">10 May 2026</td>
              <td className="px-6 py-4 text-sm font-semibold text-gray-900">₹45,000</td>
              <td className="px-6 py-4 text-sm">
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  MATCHED
                </span>
              </td>
              <td className="px-6 py-4 text-sm">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  POSTED
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
