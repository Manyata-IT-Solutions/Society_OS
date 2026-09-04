'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import {
  GitBranch,
  Play,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Copy,
  Layers,
} from 'lucide-react';

export default function WorkflowsPage() {
  const [activeTab, setActiveTab] = useState<'definitions' | 'instances'>('definitions');
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [instances, setInstances] = useState<any[]>([]);
  const [selectedInstance, setSelectedInstance] = useState<any | null>(null);
  const [allowedActions, setAllowedActions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionReason, setActionReason] = useState('');
  const [actionComment, setActionComment] = useState('');
  const [processingAction, setProcessingAction] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      if (activeTab === 'definitions') {
        const res = await api.workflows.listDefinitions();
        setDefinitions(res?.items || []);
      } else {
        const res = await api.workflows.listInstances();
        setInstances(res?.items || []);
      }
    } catch (err: any) {
      setFeedback(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.workflows.publishDefinition(id);
      setFeedback('Workflow definition successfully published and frozen.');
      loadData();
    } catch (err: any) {
      setFeedback(`Failed to publish: ${err.message}`);
    }
  };

  const handleClone = async (id: string) => {
    try {
      await api.workflows.cloneDefinition(id);
      setFeedback('New draft version created.');
      loadData();
    } catch (err: any) {
      setFeedback(`Failed to clone: ${err.message}`);
    }
  };

  const openInstanceDetails = async (inst: any) => {
    setSelectedInstance(inst);
    setActionReason('');
    setActionComment('');
    try {
      const fullInst = await api.workflows.getInstance(inst.id);
      setSelectedInstance(fullInst);
      if (fullInst.status === 'RUNNING') {
        const acts = await api.workflows.getAllowedActions(inst.id);
        setAllowedActions(acts?.items || []);
      } else {
        setAllowedActions([]);
      }
    } catch (err: any) {
      setFeedback(`Failed to load details: ${err.message}`);
    }
  };

  const handleTransition = async (action: string) => {
    if (!selectedInstance) return;
    setProcessingAction(true);
    try {
      const updated = await api.workflows.transitionInstance(selectedInstance.id, {
        action,
        reason: actionReason || undefined,
        comment: actionComment || undefined,
        expectedVersion: selectedInstance.version,
      });
      setFeedback(
        `Action "${action}" executed successfully! State changed to "${updated.currentState}"`,
      );
      await openInstanceDetails(updated);
      const res = await api.workflows.listInstances();
      setInstances(res?.items || []);
    } catch (err: any) {
      setFeedback(`Transition failed: ${err.message}`);
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-primary" />
            Workflow Engine
          </h1>
          <p className="text-sm text-muted">
            Declarative version-controlled state machine workflows with rule guards & approval
            integration.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveTab('definitions');
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'definitions'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-foreground border border-border'
            }`}
          >
            Definitions
          </button>
          <button
            onClick={() => {
              setActiveTab('instances');
            }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'instances'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-foreground border border-border'
            }`}
          >
            Live Instances
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
      ) : activeTab === 'definitions' ? (
        <div className="grid gap-4">
          {definitions.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-8 text-center text-muted">
              No workflow definitions found.
            </div>
          ) : (
            definitions.map((def) => (
              <div
                key={def.id}
                className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground text-base">{def.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                      v{def.version}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        def.status === 'PUBLISHED'
                          ? 'bg-green-500/10 text-green-500'
                          : def.status === 'DRAFT'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-muted/10 text-muted'
                      }`}
                    >
                      {def.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {def.status === 'DRAFT' && (
                      <button
                        onClick={() => handlePublish(def.id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                      >
                        Publish
                      </button>
                    )}
                    {def.status === 'PUBLISHED' && (
                      <button
                        onClick={() => handleClone(def.id)}
                        className="px-3 py-1 bg-surface-muted border border-border text-foreground rounded text-xs font-medium hover:bg-border flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" /> Fork Version
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-xs text-muted font-mono">
                  {def.key} &bull; Entity: {def.entityType}
                </p>
                {def.description && <p className="text-sm text-foreground/80">{def.description}</p>}

                {/* State diagram pipeline preview */}
                <div className="pt-2">
                  <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                    Workflow States
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {def.states?.map((st: any, idx: number) => (
                      <React.Fragment key={st.key}>
                        <div
                          className={`px-3 py-1.5 rounded text-xs font-medium border ${
                            st.key === def.initialStateKey
                              ? 'bg-primary/10 border-primary text-primary'
                              : st.isTerminal
                                ? 'bg-surface-muted border-border text-foreground font-semibold'
                                : 'bg-surface border-border text-foreground'
                          }`}
                        >
                          {st.label || st.key}
                          {st.type === 'APPROVAL' && ' 🔒'}
                        </div>
                        {idx < def.states.length - 1 && (
                          <ArrowRight className="h-3 w-3 text-muted shrink-0" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Instance List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-semibold text-muted uppercase tracking-wider">
              Running & Past Instances
            </h2>
            {instances.length === 0 ? (
              <div className="bg-surface border border-border rounded-lg p-6 text-center text-muted text-sm">
                No workflow instances found.
              </div>
            ) : (
              instances.map((inst) => (
                <div
                  key={inst.id}
                  onClick={() => openInstanceDetails(inst)}
                  className={`p-4 bg-surface border rounded-lg cursor-pointer transition-colors ${
                    selectedInstance?.id === inst.id
                      ? 'border-primary shadow-sm'
                      : 'border-border hover:border-border/80'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-muted">
                      {inst.resourceType}:{inst.resourceId.slice(0, 8)}...
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        inst.status === 'RUNNING'
                          ? 'bg-blue-500/10 text-blue-500'
                          : inst.status === 'COMPLETED'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-muted/10 text-muted'
                      }`}
                    >
                      {inst.status}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-foreground">
                    {inst.workflowDefinitionKey}
                  </div>
                  <div className="mt-2 text-xs text-primary font-semibold flex items-center gap-1">
                    Current State: <span className="underline">{inst.currentState}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Instance Inspector */}
          <div className="lg:col-span-2">
            {selectedInstance ? (
              <div className="bg-surface border border-border rounded-lg p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {selectedInstance.workflowDefinitionKey}
                    </h3>
                    <p className="text-xs text-muted font-mono">
                      ID: {selectedInstance.id} &bull; Resource: {selectedInstance.resourceType}/
                      {selectedInstance.resourceId}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted">Current State</div>
                    <div className="text-base font-bold text-primary">
                      {selectedInstance.currentState}
                    </div>
                  </div>
                </div>

                {/* Transition Action Bar */}
                {selectedInstance.status === 'RUNNING' && (
                  <div className="bg-surface-muted border border-border rounded-lg p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Play className="h-4 w-4 text-primary" /> Available Transitions
                    </h4>
                    {allowedActions.length === 0 ? (
                      <p className="text-xs text-muted">
                        No transitions currently available for your user permissions.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {allowedActions.map((act) => (
                            <button
                              key={act.action}
                              disabled={processingAction}
                              onClick={() => handleTransition(act.action)}
                              className="px-3 py-1.5 bg-primary text-primary-foreground rounded text-xs font-medium hover:bg-primary/90 flex items-center gap-1"
                            >
                              {act.label} &rarr; {act.targetState}
                            </button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <input
                            type="text"
                            placeholder="Reason (required for some actions)"
                            value={actionReason}
                            onChange={(e) => setActionReason(e.target.value)}
                            className="text-xs px-3 py-1.5 rounded border border-border bg-surface text-foreground"
                          />
                          <input
                            type="text"
                            placeholder="Optional comment"
                            value={actionComment}
                            onChange={(e) => setActionComment(e.target.value)}
                            className="text-xs px-3 py-1.5 rounded border border-border bg-surface text-foreground"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Transition History Audit Trail */}
                <div>
                  <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                    Transition History
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedInstance.history?.map((h: any) => (
                      <div
                        key={h.id}
                        className="p-3 bg-surface border border-border rounded text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">
                            {h.fromState} &rarr; <span className="text-primary">{h.toState}</span>
                          </span>
                          <span className="text-muted text-[10px]">
                            {new Date(h.occurredAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-muted">
                          Action: <span className="font-mono text-foreground">{h.action}</span> by
                          user {h.actorId?.slice(0, 8)}...
                        </div>
                        {h.reason && (
                          <div className="text-foreground/80 italic">&ldquo;{h.reason}&rdquo;</div>
                        )}
                        {h.ruleEvaluationSummary && (
                          <div className="text-[10px] bg-surface-muted p-1 rounded font-mono text-muted">
                            Guard Rule {h.ruleEvaluationSummary.ruleKey}:{' '}
                            {h.ruleEvaluationSummary.passed ? 'PASSED' : 'FAILED'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-surface border border-border rounded-lg p-12 text-center text-muted">
                Select a live workflow instance to inspect state machine progress, execute
                transitions, or audit history.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
