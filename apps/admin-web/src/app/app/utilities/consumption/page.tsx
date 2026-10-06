'use client';
import { Layers } from 'lucide-react';

export default function ConsumptionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Consumption Records & Adjustments</h1>
        <p className="text-sm text-muted">Derived periodic consumption, multiplier history, and unbilled recalculations.</p>
      </div>
      <div className="p-4 bg-surface border border-border rounded-lg text-sm text-muted">
        Select a billing cycle to view derived consumption records and common-area allocations.
      </div>
    </div>
  );
}
