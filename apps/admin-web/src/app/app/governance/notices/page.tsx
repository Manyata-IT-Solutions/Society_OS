'use client';
import { useState } from 'react';
import { Bell, Plus } from 'lucide-react';

export default function NoticesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Official Notices & Circulars</h1>
          <p className="text-sm text-muted">Estate broadcasts, emergency alerts, building-targeted distribution, and read receipts.</p>
        </div>
      </div>
      <div className="p-4 bg-surface border border-border rounded-lg text-sm text-muted">
        Published estate notices and acknowledgment statuses will appear here.
      </div>
    </div>
  );
}
