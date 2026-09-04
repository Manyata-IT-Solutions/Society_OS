'use client';
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState([
    { code: '1000', name: 'Assets & Resources', type: 'ASSET', normal: 'DEBIT', posting: false, status: 'ACTIVE' },
    { code: '1100', name: 'Operating Bank Account (HDFC)', type: 'ASSET', normal: 'DEBIT', posting: true, status: 'ACTIVE', systemKey: 'PRIMARY_BANK' },
    { code: '1110', name: 'Sinking Fund Fixed Deposit (SBI)', type: 'ASSET', normal: 'DEBIT', posting: true, status: 'ACTIVE', systemKey: 'SINKING_FUND_FD' },
    { code: '1200', name: 'Accounts Receivable (Member Dues)', type: 'ASSET', normal: 'DEBIT', posting: true, status: 'ACTIVE', systemKey: 'AR_CONTROL' },
    { code: '2000', name: 'Liabilities & Obligations', type: 'LIABILITY', normal: 'CREDIT', posting: false, status: 'ACTIVE' },
    { code: '2100', name: 'Accounts Payable (Vendor Balances)', type: 'LIABILITY', normal: 'CREDIT', posting: true, status: 'ACTIVE', systemKey: 'AP_CONTROL' },
    { code: '2200', name: 'TDS Payable (Section 194C/194J)', type: 'LIABILITY', normal: 'CREDIT', posting: true, status: 'ACTIVE' },
    { code: '2300', name: 'GST Output Liability (18% RCM/FCM)', type: 'LIABILITY', normal: 'CREDIT', posting: true, status: 'ACTIVE' },
    { code: '3000', name: 'Society Corpus & Reserves', type: 'EQUITY', normal: 'CREDIT', posting: false, status: 'ACTIVE' },
    { code: '3100', name: 'Member Capital Contribution', type: 'EQUITY', normal: 'CREDIT', posting: true, status: 'ACTIVE' },
    { code: '3200', name: 'Accumulated Sinking Fund Reserve', type: 'EQUITY', normal: 'CREDIT', posting: true, status: 'ACTIVE' },
    { code: '4000', name: 'Revenue & Maintenance Income', type: 'INCOME', normal: 'CREDIT', posting: false, status: 'ACTIVE' },
    { code: '4100', name: 'Monthly Resident Maintenance Charges', type: 'INCOME', normal: 'CREDIT', posting: true, status: 'ACTIVE', systemKey: 'MAINTENANCE_INCOME' },
    { code: '5000', name: 'Society Operational Expenses', type: 'EXPENSE', normal: 'DEBIT', posting: false, status: 'ACTIVE' },
    { code: '5100', name: 'Repairs & Maintenance Expenses', type: 'EXPENSE', normal: 'DEBIT', posting: true, status: 'ACTIVE' },
    { code: '5200', name: 'Electricity & Utility Bills', type: 'EXPENSE', normal: 'DEBIT', posting: true, status: 'ACTIVE' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    type: 'EXPENSE',
    normal: 'DEBIT',
    posting: true,
    systemKey: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.name) return;
    setAccounts((prev) => [
      ...prev,
      {
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        normal: form.normal,
        posting: form.posting,
        status: 'ACTIVE',
        systemKey: form.systemKey.trim() || undefined,
      },
    ]);
    setIsModalOpen(false);
    setForm({ code: '', name: '', type: 'EXPENSE', normal: 'DEBIT', posting: true, systemKey: '' });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Chart of Accounts</h1>
          <p className="text-slate-500">
            Hierarchical ledger accounts, system mappings, and posting controls
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Account
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="px-6 py-4">Account Code</th>
              <th className="px-6 py-4">Account Name</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Normal Balance</th>
              <th className="px-6 py-4">Posting Allowed</th>
              <th className="px-6 py-4">System Key</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {accounts.map((acc) => (
              <tr key={acc.code} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-mono font-medium text-slate-900">{acc.code}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{acc.name}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                    {acc.type}
                  </span>
                </td>
                <td className="px-6 py-4">{acc.normal}</td>
                <td className="px-6 py-4">
                  {acc.posting ? (
                    <span className="text-emerald-600 font-medium">Yes</span>
                  ) : (
                    <span className="text-slate-400">Header Only</span>
                  )}
                </td>
                <td className="px-6 py-4 font-mono text-xs text-indigo-600">
                  {acc.systemKey || '-'}
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                    {acc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-slate-900">Add General Ledger Account</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5300"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Landscaping & Garden Expenses"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Account Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => {
                      const t = e.target.value;
                      const norm = (t === 'ASSET' || t === 'EXPENSE') ? 'DEBIT' : 'CREDIT';
                      setForm({ ...form, type: t, normal: norm });
                    }}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="ASSET">ASSET</option>
                    <option value="LIABILITY">LIABILITY</option>
                    <option value="EQUITY">EQUITY</option>
                    <option value="INCOME">INCOME</option>
                    <option value="EXPENSE">EXPENSE</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Normal Balance</label>
                  <select
                    value={form.normal}
                    onChange={(e) => setForm({ ...form, normal: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="DEBIT">DEBIT</option>
                    <option value="CREDIT">CREDIT</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">System Key (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. GARDEN_MAINTENANCE"
                  value={form.systemKey}
                  onChange={(e) => setForm({ ...form, systemKey: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="posting"
                  checked={form.posting}
                  onChange={(e) => setForm({ ...form, posting: e.target.checked })}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="posting" className="text-xs text-slate-700 font-medium">
                  Allow Direct Journal Postings to this Account
                </label>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
