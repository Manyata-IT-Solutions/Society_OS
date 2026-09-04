'use client';
import { useState } from 'react';
import { FolderTree, Plus } from 'lucide-react';

export default function AgendasPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Meeting Agendas & Discussions</h1>
          <p className="text-sm text-muted">Versioned agenda builder, discussion summaries, and source object linking.</p>
        </div>
      </div>
      <div className="p-4 bg-surface border border-border rounded-lg text-sm text-muted">
        Select a meeting to view published agendas and proposed discussion items.
      </div>
    </div>
  );
}
