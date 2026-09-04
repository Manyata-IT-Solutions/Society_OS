'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Play,
  ShieldAlert,
  Check,
} from 'lucide-react';

export default function SlaPage() {
  const [activeTab, setActiveTab] = useState<'instances' | 'policies'>('instances');
  const [policies, setPolicies] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      if (activeTab === 'instances') {
        const res = await api.sla.listInstances();
        setInstances(res?.items || []);
      } else {
        const res = await api.sla.listPolicies();
        setPolicies(res?.items || []);
      }
    } catch (err: any) {
      setFeedback(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishPolicy = async (id: string) => {
    try {
      await api.sla.publishPolicy(id);
      setFeedback('SLA Policy published and active.');
      loadData();
    } catch (err: any) {
      setFeedback(`Failed to publish: ${err.message}`);
    }
  };

  const handleReconcile = async () => {
    setReconciling(true);
    try {
      const res = await api.sla.reconcile();
      setFeedback(
        `SLA Sweeper sweep completed: ${res.warningsProcessed} warnings, ${res.breachesProcessed} breaches processed.`,
      );
      loadData();
    } catch (err: any) {
      setFeedback(`Sweeper failed: ${err.message}`);
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Service Level Agreement (SLA) Engine
          </h1>
          <p className="text-sm text-muted">
            Business calendar-aware deadline calculations, warning milestones (80%), and automated
            breach alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled={reconciling}
            onClick={handleReconcile}
            className="px-3 py-2 bg-surface border border-border rounded-md text-xs font-semibold hover:bg-surface-muted flex items-center gap-1.5"
          >
            {reconciling ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Trigger SLA Sweeper
          </button>
          <button
            onClick={() => setActiveTab('instances')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'instances'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-foreground border border-border'
            }`}
          >
            Active SLAs
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'policies'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-foreground border border-border'
            }`}
          >
            SLA Policies
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-surface-muted border border-border rounded-md text-sm text-foreground flex items-center justify-between">
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-muted hover:text-foreground text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center p-12 text-muted">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </div>
      ) : activeTab === 'instances' ? (
        <div className="space-y-4">
          {instances.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-12 text-center text-muted">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-base font-semibold text-foreground">No Active SLA Instances</p>
              <p className="text-xs text-muted">
                SLAs will activate automatically as workflows transition into monitored states.
              </p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted border-b border-border text-muted uppercase font-semibold">
                  <tr>
                    <th className="p-3">SLA Policy</th>
                    <th className="p-3">Target Resource</th>
                    <th className="p-3">Due Deadline</th>
                    <th className="p-3">Warning Time</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {instances.map((inst) => (
                    <tr key={inst.id} className="hover:bg-surface-muted/50">
                      <td className="p-3 font-semibold text-foreground">{inst.policyKey}</td>
                      <td className="p-3 font-mono text-muted">
                        {inst.resourceType}/{inst.resourceId.slice(0, 8)}...
                      </td>
                      <td className="p-3 font-mono text-foreground">
                        {new Date(inst.dueAt).toLocaleString()}
                      </td>
                      <td className="p-3 font-mono text-muted">
                        {inst.warningAt ? new Date(inst.warningAt).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            inst.status === 'ACTIVE'
                              ? 'bg-blue-500/10 text-blue-500'
                              : inst.status === 'COMPLETED'
                                ? 'bg-green-500/10 text-green-500'
                                : inst.status === 'BREACHED'
                                  ? 'bg-red-500/10 text-red-500'
                                  : 'bg-muted/10 text-muted'
                          }`}
                        >
                          {inst.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {policies.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-8 text-center text-muted">
              No SLA policies found.
            </div>
          ) : (
            policies.map((pol) => (
              <div
                key={pol.id}
                className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground text-base">{pol.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                      v{pol.version}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        pol.status === 'PUBLISHED'
                          ? 'bg-green-500/10 text-green-500'
                          : pol.status === 'DRAFT'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-muted/10 text-muted'
                      }`}
                    >
                      {pol.status}
                    </span>
                  </div>
                  {pol.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublishPolicy(pol.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                    >
                      Publish
                    </button>
                  )}
                </div>

                <p className="text-xs text-muted font-mono">
                  {pol.key} &bull; Metric: {pol.metricType}
                </p>
                {pol.description && <p className="text-sm text-foreground/80">{pol.description}</p>}

                <div className="grid grid-cols-3 gap-2 pt-2 text-xs bg-surface-muted p-3 rounded-md">
                  <div>
                    <span className="text-muted block">Duration</span>
                    <span className="font-semibold text-foreground">
                      {pol.durationMinutes} minutes
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block">Calculation Mode</span>
                    <span className="font-semibold text-foreground">
                      {pol.useBusinessHours ? 'Business Hours Only' : 'Calendar Clock'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted block">Warning Threshold</span>
                    <span className="font-semibold text-foreground">
                      {pol.warningThresholdPercent}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
