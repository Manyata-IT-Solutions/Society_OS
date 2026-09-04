'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ApDashboardPage() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accounts Payable Dashboard</h1>
          <p className="text-gray-500">
            Supplier Invoices, 3-Way Matching, Dues Aging & Payment Execution
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/app/ap/invoices"
            className="px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700"
          >
            Supplier Invoices
          </Link>
          <Link
            href="/app/ap/payment-proposals"
            className="px-4 py-2 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700"
          >
            Payment Run
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Outstanding AP</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">₹45,000</p>
          <p className="text-xs text-green-600 mt-1">1 active vendor liability</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Due Within 30 Days</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">₹45,000</p>
          <p className="text-xs text-gray-500 mt-1">Due May 10, 2026</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Match Exceptions</h3>
          <p className="text-3xl font-bold text-amber-600 mt-2">0</p>
          <p className="text-xs text-gray-500 mt-1">All invoices 3-way matched</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Vendor Advances</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">₹5,000</p>
          <p className="text-xs text-gray-500 mt-1">Available for allocation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/app/ap/invoices"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition"
        >
          <h3 className="text-lg font-semibold text-gray-900">Supplier Invoices</h3>
          <p className="text-sm text-gray-500 mt-1">
            Record PO-backed & non-PO invoices, execute 2/3-way matching
          </p>
        </Link>
        <Link
          href="/app/ap/aging"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition"
        >
          <h3 className="text-lg font-semibold text-gray-900">AP Aging Matrix</h3>
          <p className="text-sm text-gray-500 mt-1">
            View payables classified across 0-30, 31-60, 61-90, 90+ buckets
          </p>
        </Link>
        <Link
          href="/app/ap/payments"
          className="p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-500 transition"
        >
          <h3 className="text-lg font-semibold text-gray-900">Vendor Payments & Remittance</h3>
          <p className="text-sm text-gray-500 mt-1">
            Execute payments, allocate dues, generate remittance PDFs
          </p>
        </Link>
      </div>
    </div>
  );
}
