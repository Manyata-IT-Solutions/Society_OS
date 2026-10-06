'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { QrCode, UserCheck } from 'lucide-react';

export default function GateAppPage() {
  const [gates, setGates] = useState<any[]>([]);
  const [selectedGateId, setSelectedGateId] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const comms = await api.listCommunitiesForOrganization(orgList[0].id);
          const commList = (comms as any)?.data || (comms as any) || [];
          if (commList.length > 0 && commList[0]?.id) {
            const gList = await api.security.getGates(commList[0].id);
            setGates(gList || []);
            if (gList && gList.length > 0) setSelectedGateId(gList[0].id);
            const pend = await api.security.getPendingApprovals(commList[0].id);
            setPendingApprovals(pend || []);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  const handleValidatePass = async () => {
    if (!tokenInput || !selectedGateId) return;
    try {
      await api.security.validatePass({
        gateId: selectedGateId,
        rawToken: tokenInput,
      });
      setMessage('✅ Access Granted — Check-in recorded.');
    } catch (err: any) {
      setMessage(`❌ Access Denied: ${err.message || 'Invalid or expired pass'}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Guard Terminal & Rapid Pass Scanner</h1>
          <p className="text-sm text-muted-foreground mt-1">High-contrast rapid pass validation and walk-in check-in.</p>
        </div>
        <select
          value={selectedGateId}
          onChange={(e) => setSelectedGateId(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold"
        >
          {gates.map((g) => (
            <option key={g.id} value={g.id}>
              {g.code} — {g.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border-2 border-primary/30 bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <QrCode className="h-5 w-5 text-primary" /> Scan / Enter QR Pass Token
          </h2>
          <input
            type="text"
            placeholder="e.g. SEC-ABCD1234EF567890..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-4 py-3 font-mono text-lg"
          />
          <button
            onClick={handleValidatePass}
            className="w-full rounded-lg bg-primary py-3 text-lg font-bold text-primary-foreground hover:bg-primary/90"
          >
            Validate & Check In
          </button>
          {message && (
            <div className="rounded-lg bg-muted p-3 text-center font-medium">
              {message}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
            <UserCheck className="h-5 w-5 text-amber-500" /> Pending Resident Approvals ({pendingApprovals.length})
          </h2>
          {pendingApprovals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No visitors currently awaiting resident approval.</p>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((app) => (
                <div key={app.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="font-semibold">{app.visit?.visitor?.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Unit {app.visit?.destinationUnit?.unitNumber} • Host: {app.visit?.hostResident?.displayName}
                    </p>
                  </div>
                  <span className="rounded bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">
                    PENDING
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
