'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Layers, Plus, ArrowRight } from 'lucide-react';

export default function ProjectListPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [capexList, setCapexList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const orgId = orgList[0].id;
          const list = await api.projects.getProjects({ organizationId: orgId });
          setProjects(list || []);

          const commId = list?.[0]?.communityId;
          if (commId) {
            const capex = await api.budgeting.getCapexInitiatives(commId);
            setCapexList(capex || []);
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

  const handleConvertCapex = async (capexId: string) => {
    try {
      await api.projects.convertFromCapex(capexId);
      alert('Project successfully created from CAPEX Initiative!');
      window.location.reload();
    } catch (err: any) {
      alert(err.message || 'Failed to convert CAPEX initiative');
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="h-6 w-6 text-primary" />
            Projects Master Directory
          </h1>
          <p className="text-sm text-muted">
            Browse all capital projects and convert approved CAPEX initiatives into governed execution containers.
          </p>
        </div>
      </div>

      {/* Capex Conversion Bar */}
      {capexList.length > 0 && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <h3 className="text-sm font-bold text-foreground mb-2">Approved CAPEX Initiatives Ready for Execution</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {capexList.map((c) => (
              <div key={c.id} className="rounded-lg bg-surface border border-border p-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-primary font-mono">{c.code}</span>
                  <div className="text-xs font-bold text-foreground">{c.name}</div>
                  <div className="text-[10px] text-muted">Budget: ₹{Number(c.approvedBudget).toLocaleString('en-IN')}</div>
                </div>
                <button
                  onClick={() => handleConvertCapex(c.id)}
                  className="rounded bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary/90 flex items-center gap-1"
                >
                  Convert <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-muted border-b border-border text-muted uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-3">Project Number</th>
              <th className="px-6 py-3">Project Name</th>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Approved Budget</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {projects.map((prj) => (
              <tr key={prj.id} className="hover:bg-surface-muted/50">
                <td className="px-6 py-4 font-mono font-bold text-primary">{prj.projectNumber}</td>
                <td className="px-6 py-4 font-bold text-foreground">{prj.name}</td>
                <td className="px-6 py-4">{prj.projectType}</td>
                <td className="px-6 py-4">
                  <span className="rounded bg-info/10 text-info px-2 py-0.5 font-semibold">{prj.status}</span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-foreground">
                  ₹{Number(prj.approvedBudget).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 text-right">
                  <a href={`/app/projects/${prj.id}`} className="text-primary font-bold hover:underline">
                    View
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
