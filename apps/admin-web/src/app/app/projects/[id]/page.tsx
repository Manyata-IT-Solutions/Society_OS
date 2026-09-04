'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api-client';
import { HardHat, FileText, Layers, CheckSquare, Ruler, Receipt, GitPullRequest, AlertCircle, Award } from 'lucide-react';

export default function ProjectWorkspacePage() {
  const params = useParams();
  const id = params?.id as string;

  const [project, setProject] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'boq' | 'packages' | 'milestones' | 'measurements' | 'certificates' | 'variations' | 'snags'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const prj = await api.projects.getProject(id);
        setProject(prj);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading || !project) {
    return <div className="p-8 text-center text-muted">Loading Project Workspace...</div>;
  }

  const boq = project.boqs?.[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold font-mono">
              {project.projectNumber}
            </span>
            <span className="rounded bg-info/10 text-info px-2.5 py-0.5 text-xs font-bold">
              {project.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{project.name}</h1>
          <p className="text-xs text-muted">{project.description}</p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="rounded-lg border border-border bg-surface p-3 text-right">
            <div className="text-[10px] text-muted">Approved Budget</div>
            <div className="text-base font-bold text-foreground">
              ₹{Number(project.approvedBudget).toLocaleString('en-IN')}
            </div>
          </div>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="border-b border-border flex gap-2 overflow-x-auto text-xs font-semibold">
        {[
          { key: 'overview', label: 'Overview & Scope', icon: FileText },
          { key: 'boq', label: 'Bill of Quantities (BOQ)', icon: Layers },
          { key: 'packages', label: 'Work Packages', icon: HardHat },
          { key: 'milestones', label: 'Milestones & Schedule', icon: CheckSquare },
          { key: 'measurements', label: 'Site Measurements', icon: Ruler },
          { key: 'certificates', label: 'Certificates (RA Bills)', icon: Receipt },
          { key: 'variations', label: 'Change Orders', icon: GitPullRequest },
          { key: 'snags', label: 'Snag List', icon: AlertCircle },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === t.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Project Scope Definition</h3>
            <div className="text-xs text-muted space-y-2">
              <p><strong>Scope Summary:</strong> {project.scopes?.[0]?.scopeSummary || 'Standard execution scope'}</p>
              <p><strong>Objectives:</strong> {project.scopes?.[0]?.objectives || 'Modernization & Lifecycle Replacement'}</p>
              <p><strong>In Scope:</strong> {project.scopes?.[0]?.inScope || 'Full equipment supply and commissioning'}</p>
              <p><strong>Acceptance Criteria:</strong> {project.scopes?.[0]?.acceptanceCriteria || 'Zero safety defects and CEIG clearance'}</p>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Project Team & Governance</h3>
            <div className="divide-y divide-border text-xs">
              {project.teamMembers?.map((m: any) => (
                <div key={m.id} className="py-2 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-foreground">{m.name}</div>
                    <div className="text-[10px] text-muted">{m.companyName || 'Internal'}</div>
                  </div>
                  <span className="rounded bg-surface-muted px-2 py-0.5 font-semibold text-muted">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'boq' && (
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <div className="border-b border-border px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">{boq?.name || 'BOQ Master'}</h3>
              <span className="text-xs text-muted">Revision {boq?.revisionNumber || 1} • Status: {boq?.status}</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-muted">Total Estimate: </span>
              <span className="text-sm font-bold text-foreground">₹{Number(boq?.totalEstimate || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-surface-muted border-b border-border text-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-2">Item Code</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2 text-right">BOQ Qty</th>
                <th className="px-4 py-2 text-right">Rate</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-right">Measured</th>
                <th className="px-4 py-2 text-right">Certified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {boq?.lines?.map((l: any) => (
                <tr key={l.id} className="hover:bg-surface-muted/50">
                  <td className="px-4 py-3 font-mono font-bold text-primary">{l.itemCode || l.sectionCode}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-foreground">{l.description}</div>
                    <div className="text-[10px] text-muted">{l.specification}</div>
                  </td>
                  <td className="px-4 py-3 text-right">{Number(l.quantity)} {l.uomName}</td>
                  <td className="px-4 py-3 text-right">₹{Number(l.estimatedRate).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">₹{Number(l.estimatedAmount).toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-bold text-warning">{Number(l.measuredQuantity)}</td>
                  <td className="px-4 py-3 text-right font-bold text-success">{Number(l.certifiedQuantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'packages' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.workPackages?.map((wp: any) => (
            <div key={wp.id} className="rounded-xl border border-border bg-surface p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-primary font-mono">{wp.packageNumber}</span>
                  <h4 className="text-sm font-bold text-foreground mt-0.5">{wp.name}</h4>
                  <p className="text-xs text-muted">{wp.scope}</p>
                </div>
                <span className="rounded bg-info/10 text-info px-2 py-0.5 text-xs font-semibold">{wp.status}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-xs">
                <div>
                  <div className="text-[10px] text-muted">Contractor</div>
                  <div className="font-bold text-foreground">{wp.vendor?.displayName || 'Direct'}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted">Contract Value</div>
                  <div className="font-bold text-foreground">₹{Number(wp.contractValue).toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'milestones' && (
        <div className="space-y-3">
          {project.milestones?.map((m: any) => (
            <div key={m.id} className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-primary font-mono">{m.code}</span>
                <h4 className="text-sm font-bold text-foreground">{m.name}</h4>
                <div className="text-xs text-muted">Weight: {m.weightPercent}% • Target: {new Date(m.plannedDate).toLocaleDateString()}</div>
              </div>
              <span className="rounded bg-success/10 text-success px-2.5 py-1 text-xs font-semibold">{m.status}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'measurements' && (
        <div className="rounded-xl border border-border bg-surface shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-muted border-b border-border text-muted uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-2">MB Number</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Location</th>
                <th className="px-4 py-2 text-right">Measured Quantity</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {project.measurements?.map((meas: any) => (
                <tr key={meas.id}>
                  <td className="px-4 py-3 font-mono font-bold text-primary">{meas.measurementNumber}</td>
                  <td className="px-4 py-3">{new Date(meas.measurementDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{meas.location}</td>
                  <td className="px-4 py-3 text-right font-bold text-foreground">{Number(meas.measuredQuantity)} {meas.uomName}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-success/10 text-success px-2 py-0.5 font-semibold">{meas.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'certificates' && (
        <div className="space-y-3">
          {project.certificates?.map((c: any) => (
            <div key={c.id} className="rounded-xl border border-border bg-surface p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-primary font-mono">{c.certificateNumber}</span>
                <div className="text-sm font-bold text-foreground mt-0.5">Gross Certified: ₹{Number(c.grossCertifiedAmount).toLocaleString('en-IN')}</div>
                <div className="text-xs text-muted">Retention: ₹{Number(c.retentionAmount).toLocaleString('en-IN')} (5%) • Net Payable: ₹{Number(c.netCertifiedAmount).toLocaleString('en-IN')}</div>
              </div>
              <span className="rounded bg-success/10 text-success px-2.5 py-1 text-xs font-semibold">{c.status}</span>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'variations' && (
        <div className="space-y-3">
          {project.variations?.map((v: any) => (
            <div key={v.id} className="rounded-xl border border-border bg-surface p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-primary font-mono">{v.variationNumber}</span>
                <h4 className="text-sm font-bold text-foreground mt-0.5">{v.reason}</h4>
                <p className="text-xs text-muted">{v.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-foreground">₹{Number(v.estimatedCostImpact).toLocaleString('en-IN')}</div>
                <span className="rounded bg-info/10 text-info px-2 py-0.5 text-xs font-semibold">{v.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'snags' && (
        <div className="space-y-3">
          {project.snags?.map((s: any) => (
            <div key={s.id} className="rounded-xl border border-border bg-surface p-4 flex items-center justify-between">
              <div>
                <span className="rounded bg-warning/10 text-warning px-2 py-0.5 text-[10px] font-bold">{s.severity}</span>
                <h4 className="text-sm font-bold text-foreground mt-1">{s.title}</h4>
                <p className="text-xs text-muted">{s.description}</p>
              </div>
              <span className="rounded bg-surface-muted text-muted px-2.5 py-1 text-xs font-semibold">{s.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
