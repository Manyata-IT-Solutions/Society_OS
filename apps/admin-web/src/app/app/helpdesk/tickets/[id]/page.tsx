'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  Ticket,
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Send,
  MessageSquare,
  Lock,
  User,
  Building,
  RefreshCw,
  Plus,
  Link as LinkIcon,
  Star,
  Activity,
  UserCheck,
} from 'lucide-react';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'comments' | 'timeline' | 'relations'>('comments');
  const [commentBody, setCommentBody] = useState('');
  const [commentType, setCommentType] = useState<'PUBLIC_REPLY' | 'INTERNAL_NOTE'>('PUBLIC_REPLY');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [resolutionCode, setResolutionCode] = useState('FIXED');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTeamId, setAssignTeamId] = useState('');
  const [assignUserId, setAssignUserId] = useState('');
  const [teams, setTeams] = useState<any[]>([]);

  // Priority modal state
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [newPriority, setNewPriority] = useState('NORMAL');

  // SLA override modal state
  const [showSlaModal, setShowSlaModal] = useState(false);
  const [newSlaDueAt, setNewSlaDueAt] = useState('');
  const [slaReason, setSlaReason] = useState('');

  useEffect(() => {
    loadTicketData();
    loadTeams();
  }, [ticketId]);

  const loadTicketData = async () => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      const [t, tm, cm] = await Promise.all([
        api.helpdesk.getTicket(ticketId),
        api.helpdesk.getTimeline(ticketId),
        api.helpdesk.getComments(ticketId),
      ]);
      setTicket(t);
      setTimeline(tm);
      setComments(cm);
      setNewPriority(t.priority);
    } catch (err: any) {
      setFeedbackMsg(`Error loading ticket: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTeams = async () => {
    try {
      const res = await api.helpdesk.listTeams();
      setTeams(res.items || []);
    } catch {
      // ignore
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      await api.helpdesk.addComment(ticketId, {
        type: commentType,
        body: commentBody.trim(),
      });
      setCommentBody('');
      const [cm, tm] = await Promise.all([
        api.helpdesk.getComments(ticketId),
        api.helpdesk.getTimeline(ticketId),
      ]);
      setComments(cm);
      setTimeline(tm);
      setFeedbackMsg('Comment added successfully.');
    } catch (err: any) {
      setFeedbackMsg(`Error adding comment: ${err.message}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleWorkflowAction = async (action: string) => {
    setActionInProgress(true);
    setFeedbackMsg(null);
    try {
      if (action === 'resolve') {
        await api.helpdesk.resolveTicket(ticketId, {
          resolutionSummary: actionReason || 'Issue resolved successfully by technician.',
          resolutionCode,
        });
      } else if (action === 'close') {
        await api.helpdesk.closeTicket(ticketId, {
          reason: actionReason || 'Closed and verified.',
        });
      } else if (action === 'reopen') {
        if (!actionReason) {
          setFeedbackMsg('A reason is required to reopen a ticket.');
          setActionInProgress(false);
          return;
        }
        await api.helpdesk.reopenTicket(ticketId, { reason: actionReason });
      } else if (action === 'cancel') {
        if (!actionReason) {
          setFeedbackMsg('A reason is required to cancel a ticket.');
          setActionInProgress(false);
          return;
        }
        await api.helpdesk.cancelTicket(ticketId, { reason: actionReason });
      } else {
        await api.helpdesk.transitionTicket(ticketId, {
          action,
          reason: actionReason || `Transitioned to ${action}`,
        });
      }
      setActionReason('');
      await loadTicketData();
      setFeedbackMsg(`Ticket updated: ${action}`);
    } catch (err: any) {
      setFeedbackMsg(`Action failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleClaim = async () => {
    setActionInProgress(true);
    try {
      await api.helpdesk.claimTicket(ticketId);
      await loadTicketData();
      setFeedbackMsg('You have claimed this ticket.');
    } catch (err: any) {
      setFeedbackMsg(`Failed to claim: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionInProgress(true);
    try {
      await api.helpdesk.assignTicket(ticketId, {
        teamId: assignTeamId || null,
        userId: assignUserId || null,
        reason: actionReason || 'Reassigned by operator',
      });
      setShowAssignModal(false);
      setActionReason('');
      await loadTicketData();
      setFeedbackMsg('Ticket reassigned successfully.');
    } catch (err: any) {
      setFeedbackMsg(`Failed to assign: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handlePrioritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionInProgress(true);
    try {
      await api.helpdesk.changePriority(ticketId, {
        priority: newPriority,
        reason: actionReason || 'Priority updated',
      });
      setShowPriorityModal(false);
      setActionReason('');
      await loadTicketData();
      setFeedbackMsg('Priority changed successfully.');
    } catch (err: any) {
      setFeedbackMsg(`Failed to change priority: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleSlaOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlaDueAt || !slaReason) {
      setFeedbackMsg('New due date and reason are required.');
      return;
    }
    setActionInProgress(true);
    try {
      await api.helpdesk.overrideSla(ticketId, {
        newDueAt: new Date(newSlaDueAt).toISOString(),
        reason: slaReason,
      });
      setShowSlaModal(false);
      setSlaReason('');
      await loadTicketData();
      setFeedbackMsg('SLA deadline adjusted successfully.');
    } catch (err: any) {
      setFeedbackMsg(`SLA override failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  if (loading && !ticket) {
    return (
      <div className="p-8 text-center text-muted">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
        Loading ticket details...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center text-muted">
        Ticket not found.{' '}
        <Link href="/app/helpdesk/tickets" className="text-primary underline">
          Back to tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button & Feedback */}
      <div className="flex items-center justify-between">
        <Link
          href="/app/helpdesk/tickets"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tickets</span>
        </Link>
        {feedbackMsg && (
          <div className="rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs text-primary font-medium">
            {feedbackMsg}
          </div>
        )}
      </div>

      {/* Main Ticket Header Card */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-bold text-primary">{ticket.ticketNumber}</span>
              <span className="rounded-full bg-blue-500/10 text-blue-500 px-2.5 py-0.5 text-xs font-semibold">
                {ticket.currentState}
              </span>
              <span className="rounded-full border border-border bg-surface-muted px-2.5 py-0.5 text-xs font-semibold">
                {ticket.priority} Priority
              </span>
              {ticket.slaStatus && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    ticket.slaStatus === 'BREACHED'
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}
                >
                  SLA: {ticket.slaStatus}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold">{ticket.title}</h1>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleClaim}
              disabled={actionInProgress || Boolean(ticket.assignedUserId)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted disabled:opacity-50"
            >
              <UserCheck className="inline h-3.5 w-3.5 mr-1" />
              Claim
            </button>
            <button
              onClick={() => setShowAssignModal(true)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
            >
              Assign
            </button>
            <button
              onClick={() => setShowPriorityModal(true)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
            >
              Priority
            </button>
            <button
              onClick={() => setShowSlaModal(true)}
              className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface-muted"
            >
              SLA Override
            </button>
          </div>
        </div>

        {/* Dynamic Workflow Transition Actions Bar */}
        {ticket.allowedActions && ticket.allowedActions.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Workflow Transition Actions:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {ticket.allowedActions.map((act: any) => (
                <button
                  key={act.action}
                  onClick={() => handleWorkflowAction(act.action)}
                  disabled={actionInProgress}
                  className="rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition disabled:opacity-50"
                >
                  {act.label || act.action} → {act.toState}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Context Meta + Comments / Timeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Metadata & Property Details */}
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Ticket Context
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">Category:</span>
                <span className="font-medium">{ticket.categoryName || 'General'}</span>
              </div>
              {ticket.subcategoryName && (
                <div className="flex justify-between">
                  <span className="text-muted">Subcategory:</span>
                  <span className="font-medium">{ticket.subcategoryName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">Location Type:</span>
                <span className="font-medium">{ticket.locationType}</span>
              </div>
              {ticket.unitNumber && (
                <div className="flex justify-between">
                  <span className="text-muted">Unit:</span>
                  <span className="font-medium">Unit {ticket.unitNumber}</span>
                </div>
              )}
              {ticket.buildingName && (
                <div className="flex justify-between">
                  <span className="text-muted">Building:</span>
                  <span className="font-medium">{ticket.buildingName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">Reported By:</span>
                <span className="font-medium">{ticket.reportedByName || 'Resident'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Assigned Team:</span>
                <span className="font-medium">{ticket.assignedTeamName || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Assigned Tech:</span>
                <span className="font-medium">{ticket.assignedUserName || 'Unassigned'}</span>
              </div>
              {ticket.slaDueAt && (
                <div className="flex justify-between">
                  <span className="text-muted">SLA Due At:</span>
                  <span className="font-medium">{new Date(ticket.slaDueAt).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted">Created:</span>
                <span className="font-medium">{new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Resident Feedback Card if Available */}
          {ticket.feedback && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-500">
                  Resident Feedback
                </span>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="h-4 w-4 fill-amber-400" />
                  <span className="font-bold text-sm">{ticket.feedback.rating} / 5</span>
                </div>
              </div>
              {ticket.feedback.comment && (
                <p className="text-xs text-foreground italic">
                  &ldquo;{ticket.feedback.comment}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Tabbed Activity & Communications */}
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex border-b border-border text-sm font-medium">
            <button
              onClick={() => setActiveTab('comments')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
                activeTab === 'comments'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Comments & Notes ({comments.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 transition ${
                activeTab === 'timeline'
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              <Activity className="h-4 w-4" />
              <span>Lifecycle Timeline ({timeline.length})</span>
            </button>
          </div>

          {/* Tab 1: Comments & Notes Thread */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {comments.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted">No comments yet.</div>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-lg p-3.5 text-xs space-y-1 ${
                        c.type === 'INTERNAL_NOTE'
                          ? 'border border-amber-500/20 bg-amber-500/5'
                          : 'border border-border bg-surface-muted/40'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span className="flex items-center gap-1.5">
                          {c.type === 'INTERNAL_NOTE' && (
                            <Lock className="h-3 w-3 text-amber-500" />
                          )}
                          <span
                            className={
                              c.type === 'INTERNAL_NOTE' ? 'text-amber-500' : 'text-primary'
                            }
                          >
                            {c.authorName || 'Staff'}
                          </span>
                          <span className="text-[10px] text-muted font-normal">
                            ({c.type === 'INTERNAL_NOTE' ? 'Internal Note' : 'Public Reply'})
                          </span>
                        </span>
                        <span className="text-[10px] text-muted">
                          {new Date(c.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-foreground whitespace-pre-wrap">{c.body}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Box */}
              <form onSubmit={handleAddComment} className="border-t border-border pt-3 space-y-2">
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="commentType"
                      checked={commentType === 'PUBLIC_REPLY'}
                      onChange={() => setCommentType('PUBLIC_REPLY')}
                    />
                    <span>Public Reply (Visible to Resident)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-amber-500">
                    <input
                      type="radio"
                      name="commentType"
                      checked={commentType === 'INTERNAL_NOTE'}
                      onChange={() => setCommentType('INTERNAL_NOTE')}
                    />
                    <span>Internal Staff Note (Confidential)</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    placeholder={
                      commentType === 'INTERNAL_NOTE'
                        ? 'Write an internal staff note...'
                        : 'Reply to resident...'
                    }
                    value={commentBody}
                    onChange={(e) => setCommentBody(e.target.value)}
                    className="flex-1 rounded-md border border-border bg-surface-muted p-2 text-xs focus:border-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentBody.trim()}
                    className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 2: Audit Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {timeline.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="flex gap-3 text-xs border-l-2 border-primary/30 pl-3 pb-3"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-foreground">{item.title}</div>
                    {item.description && <p className="text-muted">{item.description}</p>}
                    <div className="text-[10px] text-muted">
                      {new Date(item.occurredAt).toLocaleString()}{' '}
                      {item.actorName ? `• by ${item.actorName}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Assignment */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleAssignSubmit}
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg space-y-4"
          >
            <h3 className="text-lg font-bold">Assign Ticket</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-muted">Operational Team</label>
                <select
                  value={assignTeamId}
                  onChange={(e) => setAssignTeamId(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                >
                  <option value="">-- Select Team --</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted">Reason / Instructions</label>
                <input
                  type="text"
                  placeholder="e.g. Assigned to plumbing team for pipe inspection"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionInProgress}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Assign
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Change Priority */}
      {showPriorityModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handlePrioritySubmit}
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg space-y-4"
          >
            <h3 className="text-lg font-bold">Change Ticket Priority</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-muted">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Resident escalated due to water leakage"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPriorityModal(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionInProgress}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: SLA Override */}
      {showSlaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleSlaOverrideSubmit}
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg space-y-4"
          >
            <h3 className="text-lg font-bold">Override SLA Due Date</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs font-semibold text-muted">New Due Date & Time</label>
                <input
                  type="datetime-local"
                  value={newSlaDueAt}
                  onChange={(e) => setNewSlaDueAt(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted">Justification Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Spare parts shipment delayed by supplier"
                  value={slaReason}
                  onChange={(e) => setSlaReason(e.target.value)}
                  className="mt-1 w-full rounded-md border border-border bg-surface-muted px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSlaModal(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionInProgress}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Save Override
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
