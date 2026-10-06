'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { CheckSquare, Inbox, ShieldCheck, Check, X, RefreshCw, AlertCircle } from 'lucide-react';

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'policies'>('inbox');
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [decisionComment, setDecisionComment] = useState('');
  const [processingDecision, setProcessingDecision] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      if (activeTab === 'inbox') {
        const res = await api.approvals.getInbox({ status: 'PENDING' });
        setInboxItems(res?.items || []);
      } else {
        const res = await api.approvals.listPolicies();
        setPolicies(res?.items || []);
      }
    } catch (err: any) {
      setFeedback(`Error loading data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (stepInstanceId: string, decision: 'APPROVE' | 'REJECT') => {
    setProcessingDecision(true);
    try {
      await api.approvals.submitDecision(stepInstanceId, {
        decision,
        comment: decisionComment || undefined,
      });
      setFeedback(`Decision "${decision}" submitted successfully.`);
      setDecisionComment('');
      loadData();
    } catch (err: any) {
      setFeedback(`Failed to submit decision: ${err.message}`);
    } finally {
      setProcessingDecision(false);
    }
  };

  const handlePublishPolicy = async (id: string) => {
    try {
      await api.approvals.publishPolicy(id);
      setFeedback('Approval policy published.');
      loadData();
    } catch (err: any) {
      setFeedback(`Failed to publish policy: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CheckSquare className="h-6 w-6 text-primary" />
            Approval Engine & Decision Inbox
          </h1>
          <p className="text-sm text-muted">
            Multi-step quorum approval chains, Maker-Checker validation, and actionable decision
            queues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'inbox'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-foreground border border-border'
            }`}
          >
            <Inbox className="h-4 w-4" /> My Inbox ({inboxItems.length})
          </button>
          <button
            onClick={() => setActiveTab('policies')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'policies'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface text-foreground border border-border'
            }`}
          >
            <ShieldCheck className="h-4 w-4" /> Policies
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
      ) : activeTab === 'inbox' ? (
        <div className="space-y-4">
          {inboxItems.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-12 text-center text-muted">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-base font-semibold text-foreground">No Pending Approvals</p>
              <p className="text-xs text-muted">
                You are all caught up. No tasks currently await your review.
              </p>
            </div>
          ) : (
            inboxItems.map((item) => (
              <div
                key={item.stepInstanceId}
                className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{item.stepName}</h3>
                    <p className="text-xs text-muted font-mono">
                      Policy: {item.policyKey} &bull; Target: {item.resourceType}/
                      {item.resourceId.slice(0, 8)}...
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-500">
                    PENDING REVIEW
                  </span>
                </div>

                <div className="bg-surface-muted p-3 rounded-md text-xs space-y-1">
                  <div>
                    <strong>Opened At:</strong> {new Date(item.openedAt).toLocaleString()}
                  </div>
                  <div>
                    <strong>Requester:</strong>{' '}
                    {item.requesterId ? `User ${item.requesterId.slice(0, 8)}...` : 'System'}
                  </div>
                  <div>
                    <strong>Step Order:</strong> Step #{item.stepOrder}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
                  <input
                    type="text"
                    placeholder="Decision rationale or comment..."
                    value={decisionComment}
                    onChange={(e) => setDecisionComment(e.target.value)}
                    className="w-full sm:w-80 text-xs px-3 py-2 rounded border border-border bg-surface text-foreground"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      disabled={processingDecision}
                      onClick={() => handleDecision(item.stepInstanceId, 'REJECT')}
                      className="px-4 py-2 bg-red-600/10 text-red-600 border border-red-200 rounded text-xs font-medium hover:bg-red-600 hover:text-white transition-colors flex items-center gap-1"
                    >
                      <X className="h-3 w-3" /> Reject
                    </button>
                    <button
                      disabled={processingDecision}
                      onClick={() => handleDecision(item.stepInstanceId, 'APPROVE')}
                      className="px-4 py-2 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                    >
                      <Check className="h-3 w-3" /> Approve
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {policies.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-8 text-center text-muted">
              No approval policies found.
            </div>
          ) : (
            policies.map((p) => (
              <div
                key={p.id}
                className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground text-base">{p.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono">
                      v{p.version}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'PUBLISHED'
                          ? 'bg-green-500/10 text-green-500'
                          : p.status === 'DRAFT'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-muted/10 text-muted'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                  {p.status === 'DRAFT' && (
                    <button
                      onClick={() => handlePublishPolicy(p.id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700"
                    >
                      Publish
                    </button>
                  )}
                </div>

                <p className="text-xs text-muted font-mono">{p.key}</p>
                {p.description && <p className="text-sm text-foreground/80">{p.description}</p>}

                {/* Steps Overview */}
                <div className="pt-2">
                  <div className="text-xs font-medium text-muted uppercase tracking-wider mb-2">
                    Step Pipeline
                  </div>
                  <div className="space-y-2">
                    {p.steps?.map((st: any) => (
                      <div
                        key={st.order}
                        className="p-3 bg-surface-muted border border-border rounded-md text-xs flex items-center justify-between"
                      >
                        <div>
                          <span className="font-semibold text-foreground">
                            Step #{st.order}: {st.name}
                          </span>
                          <span className="text-muted ml-2">
                            ({st.approverType}: {st.approverValue}, Quorum: {st.quorumMode})
                          </span>
                        </div>
                        <div className="text-[10px] text-muted font-mono">
                          {st.allowSelfApproval
                            ? 'Self-approval permitted'
                            : 'Maker-Checker strictly enforced'}
                        </div>
                      </div>
                    ))}
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
