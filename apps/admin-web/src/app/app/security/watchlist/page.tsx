'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { AlertCircle } from 'lucide-react';

export default function WatchlistPage() {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const comms = await api.listCommunitiesForOrganization(orgList[0].id);
          const commList = (comms as any)?.data || (comms as any) || [];
          if (commList.length > 0 && commList[0]?.id) {
            const list = await api.security.getWatchlist(commList[0].id);
            setEntries(list || []);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <AlertCircle className="h-6 w-6 text-primary" /> Security Watchlist & Restriction Rules
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Governance and alerts for banned or supervisor-review subjects.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Type</th>
              <th className="p-3">Identifier</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Action</th>
              <th className="p-3">Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="p-3 font-semibold">{e.subjectType}</td>
                <td className="p-3 font-mono font-bold">{e.subjectIdentifier}</td>
                <td className="p-3">
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-800">
                    {e.severity}
                  </span>
                </td>
                <td className="p-3 font-semibold">{e.action}</td>
                <td className="p-3 text-muted-foreground">{e.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
