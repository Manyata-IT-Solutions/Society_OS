'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { ShieldAlert, CheckCircle, XCircle, AlertTriangle, Play } from 'lucide-react';

export default function BudgetControlPage() {
  const [entities, setEntities] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('50000');
  const [sourceType, setSourceType] = useState('PURCHASE_REQUISITION');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const ents = await api.finance.getAccountingEntities();
      setEntities(ents || []);
      if (ents && ents.length > 0) {
        setSelectedEntity(ents[0].id);
        const accs = await api.finance.getAccounts(ents[0].id);
        setAccounts(accs || []);
        if (accs && accs.length > 0) {
          const exp = accs.find((a: any) => a.accountType === 'EXPENSE') || accs[0];
          setSelectedAccount(exp.id);
        }
      }
    }
    init();
  }, []);

  const handleCheck = async () => {
    setLoading(true);
    try {
      const res = await api.budgeting.checkControl({
        organizationId: entities[0]?.organizationId || '',
        accountingEntityId: selectedEntity,
        accountId: selectedAccount,
        amount: Number(amount),
        sourceType,
      });
      setResult(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <ShieldAlert className="h-6 w-6 text-warning" />
          Real-Time Budget Availability & Spend Control Engine
        </h1>
        <p className="text-sm text-muted">
          Pre-commit spend control test bench: validates PR, PO, and Supplier Invoices against approved budgets.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-3">
            Spend Check Parameters
          </h2>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Source Type</label>
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground"
            >
              <option value="PURCHASE_REQUISITION">Purchase Requisition (PR Reservation)</option>
              <option value="PURCHASE_ORDER">Purchase Order (PO Commitment)</option>
              <option value="SUPPLIER_INVOICE">Supplier Invoice (Direct Actual)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Ledger Expense Account</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.accountCode} — {a.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted">Requested Amount (₹)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-foreground font-semibold"
            />
          </div>

          <button
            onClick={handleCheck}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors mt-2"
          >
            <Play className="h-4 w-4" /> Run Budget Check
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground border-b border-border pb-3">
            Engine Decision & Availability Breakdown
          </h2>

          {!result ? (
            <div className="py-16 text-center text-xs text-muted">
              Configure parameters and click &quot;Run Budget Check&quot; to evaluate real-time availability.
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              <div
                className={`p-4 rounded-lg border flex items-center gap-3 ${
                  result.decision === 'ALLOWED'
                    ? 'bg-success/10 border-success/20 text-success'
                    : result.decision === 'BLOCKED'
                      ? 'bg-destructive/10 border-destructive/20 text-destructive'
                      : 'bg-warning/10 border-warning/20 text-warning'
                }`}
              >
                {result.decision === 'ALLOWED' && <CheckCircle className="h-6 w-6 shrink-0" />}
                {result.decision === 'BLOCKED' && <XCircle className="h-6 w-6 shrink-0" />}
                {result.decision !== 'ALLOWED' && result.decision !== 'BLOCKED' && (
                  <AlertTriangle className="h-6 w-6 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-sm">DECISION: {result.decision}</div>
                  <div className="text-xs opacity-90">{result.reason}</div>
                </div>
              </div>

              {/* Formula Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-surface-muted/50 border border-border">
                  <div className="text-muted text-[11px]">Approved Budget</div>
                  <div className="font-bold text-foreground text-sm mt-1">
                    ₹{Number(result.currentApprovedBudget || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-surface-muted/50 border border-border">
                  <div className="text-muted text-[11px]">Actual Spend (GL)</div>
                  <div className="font-bold text-info text-sm mt-1">
                    -₹{Number(result.actualYtd || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-surface-muted/50 border border-border">
                  <div className="text-muted text-[11px]">Commitments + Res</div>
                  <div className="font-bold text-warning text-sm mt-1">
                    -₹{(Number(result.commitments || 0) + Number(result.reservations || 0)).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-surface-muted/50 border border-border">
                  <div className="text-muted text-[11px]">Available Budget</div>
                  <div className="font-bold text-success text-sm mt-1">
                    ₹{Number(result.availableBudget || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
