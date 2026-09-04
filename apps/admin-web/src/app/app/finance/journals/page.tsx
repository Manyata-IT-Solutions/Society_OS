'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, X } from 'lucide-react';

export default function JournalEntriesPage() {
  const [journals, setJournals] = useState([
    {
      id: '1',
      number: 'JV-2026-000001',
      date: '2026-04-05',
      type: 'GENERAL',
      desc: 'Electricity utility bill payment',
      dr: 25000,
      cr: 25000,
      status: 'POSTED',
    },
    {
      id: '2',
      number: 'OB-2026-000001',
      date: '2026-04-01',
      type: 'OPENING',
      desc: 'Migration Opening Balances FY 2026-27',
      dr: 2450000,
      cr: 2450000,
      status: 'POSTED',
    },
    {
      id: '3',
      number: 'JV-2026-000002',
      date: '2026-04-10',
      type: 'GENERAL',
      desc: 'Security services monthly billing',
      dr: 65000,
      cr: 65000,
      status: 'SUBMITTED',
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    type: 'GENERAL',
    desc: '',
    amount: '',
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(form.amount) || 0;
    if (!form.desc || numAmt <= 0) return;

    const nextId = String(journals.length + 1);
    const nextVoucher = `JV-2026-00000${journals.length + 1}`;

    setJournals((prev) => [
      {
        id: nextId,
        number: nextVoucher,
        date: form.date,
        type: form.type,
        desc: form.desc.trim(),
        dr: numAmt,
        cr: numAmt,
        status: 'SUBMITTED',
      },
      ...prev,
    ]);
    setIsModalOpen(false);
    setForm({ date: new Date().toISOString().slice(0, 10), type: 'GENERAL', desc: '', amount: '' });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Journal Entries</h1>
          <p className="text-slate-500">
            Double-entry accounting journal vouchers and maker-checker approvals
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Journal Voucher
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
            <tr>
              <th className="px-6 py-4">Voucher No</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4 text-right">Debit (INR)</th>
              <th className="px-6 py-4 text-right">Credit (INR)</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {journals.map((j) => (
              <tr key={j.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-mono font-medium text-slate-900">{j.number}</td>
                <td className="px-6 py-4 text-slate-500">{j.date}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700">
                    {j.type}
                  </span>
                </td>
                <td className="px-6 py-4">{j.desc}</td>
                <td className="px-6 py-4 font-mono text-right font-medium">
                  {j.dr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4 font-mono text-right font-medium">
                  {j.cr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      j.status === 'POSTED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {j.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/app/finance/journals/${j.id}`}
                    className="text-indigo-600 hover:text-indigo-900 font-medium"
                  >
                    View Voucher
                  </Link>
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
              <h2 className="text-lg font-bold text-slate-900">Record Journal Voucher</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Voucher Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                  >
                    <option value="GENERAL">GENERAL</option>
                    <option value="ADJUSTMENT">ADJUSTMENT</option>
                    <option value="OPENING">OPENING</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Narration *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Monthly lift AMC maintenance service payment voucher"
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (INR) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 45000"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-600 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Creates balanced dual-sided Debit and Credit entry lines.</span>
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
                  Submit Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
