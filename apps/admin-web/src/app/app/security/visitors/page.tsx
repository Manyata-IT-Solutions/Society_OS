'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api-client';
import { UserCheck, Plus } from 'lucide-react';

export default function VisitorsPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [visitorName, setVisitorName] = useState('');
  const [phone, setPhone] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');

  const handleInvite = async () => {
    try {
      const orgs = await api.listOrganizations();
      const orgList = (orgs as any)?.data || (orgs as any) || [];
      if (orgList.length > 0 && orgList[0]?.id) {
        const comms = await api.listCommunitiesForOrganization(orgList[0].id);
        const commList = (comms as any)?.data || (comms as any) || [];
        if (commList.length > 0 && commList[0]?.id) {
          const units = await api.property.listUnits(commList[0].id);
          const unitList = (units as any)?.data || (units as any) || [];
          if (unitList.length > 0) {
            const res = await api.security.inviteVisitor({
              organizationId: orgList[0].id,
              communityId: commList[0].id,
              destinationUnitId: unitList[0].id,
              visitorName,
              phone,
              expectedFrom: new Date().toISOString(),
              expectedUntil: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
            });
            setGeneratedToken(res.rawToken);
          }
        }
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserCheck className="h-6 w-6 text-primary" /> Visitor Invitations & Passes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Pre-approve guests and generate opaque cryptographic QR passes.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Pre-Approve Visitor
        </button>
      </div>

      {generatedToken && (
        <div className="rounded-xl border border-emerald-500 bg-emerald-50 p-5 dark:bg-emerald-950/20 space-y-2">
          <h3 className="font-bold text-emerald-800 dark:text-emerald-300">
            Pass Issued Successfully!
          </h3>
          <p className="text-sm">Share this secure QR Token with your guest:</p>
          <div className="rounded border bg-white p-3 font-mono text-base font-bold text-black dark:bg-black dark:text-white">
            {generatedToken}
          </div>
        </div>
      )}

      {showInviteModal && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-lg">
          <h2 className="text-lg font-bold">Invite New Guest</h2>
          <input
            type="text"
            placeholder="Guest Full Name"
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
          <input
            type="text"
            placeholder="Guest Mobile Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2"
          />
          <div className="flex gap-2">
            <button
              onClick={handleInvite}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
            >
              Generate Pass
            </button>
            <button
              onClick={() => setShowInviteModal(false)}
              className="rounded-lg border border-border px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
