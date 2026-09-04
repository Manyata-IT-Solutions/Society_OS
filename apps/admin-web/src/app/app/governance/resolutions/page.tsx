'use client';
import { useState } from 'react';
import { Award, Plus } from 'lucide-react';

export default function ResolutionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Governance Resolution Register</h1>
          <p className="text-sm text-muted">Searchable memory of adopted resolutions, effective dates, and downstream authorizations.</p>
        </div>
      </div>
      <div className="p-4 bg-surface border border-border rounded-lg text-sm text-muted">
        Search resolutions by number, keyword, category, or decision year.
      </div>
    </div>
  );
}
