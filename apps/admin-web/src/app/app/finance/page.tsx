'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function FinanceDashboardPage() {
  const [kpis, setKpis] = useState<any>({
    cashAndBankBalance: 2450000,
    currentPeriodIncome: 380000,
    currentPeriodExpense: 142000,
    currentPeriodSurplus: 238000,
    activeFundsCount: 4,
    unpostedJournalsCount: 2,
    pendingApprovalsCount: 1,
    currentPeriodName: '2026-04',
    currentPeriodStatus: 'OPEN',
  });

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Enterprise Finance & Accounting</h1>
          <p className="text-slate-500">
            General Ledger, Double-Entry Journals, Fund Accounting, and Financial Statements
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/app/finance/journals"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            + New Journal Entry
          </Link>
          <Link
            href="/app/finance/trial-balance"
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium"
          >
            View Trial Balance
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Cash & Bank Position</div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ₹{kpis.cashAndBankBalance.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-600 mt-1">● Reconciled GL balance</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Current Period Income</div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            ₹{kpis.currentPeriodIncome.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">{kpis.currentPeriodName} Revenue</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Current Period Expenses</div>
          <div className="text-2xl font-bold text-rose-600 mt-2">
            ₹{kpis.currentPeriodExpense.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">{kpis.currentPeriodName} Outflow</div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-sm font-medium text-slate-500">Current Period Net Surplus</div>
          <div className="text-2xl font-bold text-indigo-600 mt-2">
            ₹{kpis.currentPeriodSurplus.toLocaleString()}
          </div>
          <div className="text-xs text-emerald-600 mt-1">Operating margin positive</div>
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Pending Approvals</h3>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Manual Journals Awaiting Approval</span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
              {kpis.pendingApprovalsCount}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-slate-600">Draft Journals</span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-800 rounded-full">
              {kpis.unpostedJournalsCount}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Fiscal Period Control</h3>
          <div className="flex justify-between items-center py-2 border-b border-slate-100">
            <span className="text-sm text-slate-600">Active Fiscal Period</span>
            <span className="font-mono text-sm font-semibold text-slate-800">
              {kpis.currentPeriodName}
            </span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-slate-600">Period Status</span>
            <span className="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
              {kpis.currentPeriodStatus}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">Financial Reports</h3>
          <div className="space-y-2 text-sm">
            <Link
              href="/app/finance/trial-balance"
              className="block text-indigo-600 hover:underline"
            >
              → Trial Balance (Debit = Credit)
            </Link>
            <Link
              href="/app/finance/income-expenditure"
              className="block text-indigo-600 hover:underline"
            >
              → Income & Expenditure Statement
            </Link>
            <Link
              href="/app/finance/balance-sheet"
              className="block text-indigo-600 hover:underline"
            >
              → Balance Sheet
            </Link>
            <Link href="/app/finance/integrity" className="block text-indigo-600 hover:underline">
              → Autonomous Integrity Audit
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
