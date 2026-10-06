'use client';
import React, { useState } from 'react';
import { CheckSquare, CheckCircle, XCircle } from 'lucide-react';

export default function CorrectionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Attendance Correction Approvals</h1>
        <p className="text-sm text-muted">Audit-safe supervisor approval queue for missed check-ins and check-out adjustments.</p>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-surface-muted text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="px-6 py-3">Worker</th>
              <th className="px-6 py-3">Date</th>
              <th className="px-6 py-3">Requested Check-In/Out</th>
              <th className="px-6 py-3">Reason & Evidence</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            <tr className="hover:bg-surface-muted/50 transition-colors">
              <td className="px-6 py-4 font-semibold text-foreground">Rajesh Kumar (Electrician)</td>
              <td className="px-6 py-4 text-xs text-muted">2026-04-10</td>
              <td className="px-6 py-4 text-xs font-mono">Check-out 14:30 PM (was unlogged)</td>
              <td className="px-6 py-4 text-xs text-muted">Emergency breaker maintenance at Substation Tower A</td>
              <td className="px-6 py-4 space-x-2">
                <button className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700">Approve</button>
                <button className="px-3 py-1 bg-surface-muted text-destructive text-xs font-semibold rounded hover:bg-destructive/10">Reject</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
