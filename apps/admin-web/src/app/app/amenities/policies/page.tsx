'use client';

import React from 'react';
import { CreditCard } from 'lucide-react';

export default function AmenityPoliciesPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CreditCard className="h-6 w-6 text-primary" /> Tariffs, Pricing & Security Deposit Policies
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Effective-dated pricing policies, hourly charges, refundable deposits, and cancellation rules.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <h2 className="text-base font-bold">Standard Badminton Arena</h2>
          <p className="text-xs text-muted-foreground">Type: FREE • Resident Quota: 2 active bookings • Slot Duration: 60 mins</p>
          <div className="rounded bg-muted p-3 text-xs font-mono">
            Rate: ₹0 / hr • Deposit: ₹0 • Cancellation: Anytime
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
          <h2 className="text-base font-bold">Grand Clubhouse Party Hall</h2>
          <p className="text-xs text-muted-foreground">Type: FLAT • Approval Required: Yes • Notice: 48 hours</p>
          <div className="rounded bg-muted p-3 text-xs font-mono">
            Rate: ₹5,000 / event • Deposit: ₹10,000 refundable • Turnaround Buffer: 60 mins
          </div>
        </div>
      </div>
    </div>
  );
}
