'use client';
import { useState } from 'react';
import { Layers, Plus } from 'lucide-react';

export default function PoliciesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Policy & Rule Register</h1>
          <p className="text-sm text-muted">Versioned community policies, effective dates, supersession rules, and resident sign-offs.</p>
        </div>
      </div>
      <div className="p-4 bg-surface border border-border rounded-lg text-sm text-muted">
        Active community policies (Parking, Pet, Renovation, Amenity Rules) will appear here.
      </div>
    </div>
  );
}
