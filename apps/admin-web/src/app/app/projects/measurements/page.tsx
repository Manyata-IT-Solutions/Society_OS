'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Ruler, Check, X } from 'lucide-react';

export default function MeasurementsBookPage() {
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const prjs = await api.projects.getProjects({ organizationId: orgList[0].id });
          if (prjs && prjs.length > 0) {
            const list = await api.projects.getMeasurements(prjs[0].id);
            setMeasurements(list || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleVerify = async (measurementId: string, approved: boolean) => {
    try {
      await api.projects.verifyMeasurement({ measurementId, approved });
      alert(approved ? 'Measurement verified!' : 'Measurement rejected.');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Ruler className="h-6 w-6 text-primary" />
          Site Measurement Book & Quantity Verification
        </h1>
        <p className="text-sm text-muted">
          Record and verify actual executed site quantities against approved BOQ lines before interim certification.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-muted border-b border-border text-muted uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-3">MB Number</th>
              <th className="px-6 py-3">BOQ Line</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3 text-right">Measured Quantity</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {measurements.map((m) => (
              <tr key={m.id} className="hover:bg-surface-muted/50">
                <td className="px-6 py-4 font-mono font-bold text-primary">{m.measurementNumber}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-foreground">{m.boqLine?.description}</div>
                  <div className="text-[10px] text-muted">{m.measurementDetails}</div>
                </td>
                <td className="px-6 py-4">{m.location || 'Site Core'}</td>
                <td className="px-6 py-4 text-right font-bold text-foreground">
                  {Number(m.measuredQuantity)} {m.uomName}
                </td>
                <td className="px-6 py-4">
                  <span className={`rounded px-2 py-0.5 font-semibold ${
                    m.status === 'VERIFIED' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                  }`}>
                    {m.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  {m.status === 'SUBMITTED' && (
                    <>
                      <button
                        onClick={() => handleVerify(m.id, true)}
                        className="rounded bg-success/10 text-success px-2 py-1 font-bold hover:bg-success/20"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => handleVerify(m.id, false)}
                        className="rounded bg-danger/10 text-danger px-2 py-1 font-bold hover:bg-danger/20"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
