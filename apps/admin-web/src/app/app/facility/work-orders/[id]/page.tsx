'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  PackageOpen,
  Boxes,
  ClipboardList,
  ArrowLeft,
  Clock,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Camera,
  CheckSquare,
  ShieldCheck,
  UserCheck,
  Ban,
  Plus,
} from 'lucide-react';

export default function WorkOrderDetailWorkspace() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [workOrder, setWorkOrder] = useState<any>(null);
  const [allowedActions, setAllowedActions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    'scope' | 'tasks' | 'logs' | 'evidence' | 'materials' | 'review'
  >('tasks');
  const [materials, setMaterials] = useState<{ requirements: any[]; consumptions: any[] }>({
    requirements: [],
    consumptions: [],
  });
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqForm, setReqForm] = useState({ itemId: '', requiredQty: '1' });
  const [loading, setLoading] = useState(true);

  // Live Timer State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);

  // Modals
  const [actionModal, setActionModal] = useState<{
    open: boolean;
    action?: string;
    title?: string;
  }>({ open: false });
  const [actionComment, setActionComment] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Completion Modal
  const [completionModal, setCompletionModal] = useState(false);
  const [completionSummary, setCompletionSummary] = useState('');

  // Review Modal
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<'APPROVED' | 'REWORK_REQUESTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');

  // New Task
  const [newTaskTitle, setNewTaskTitle] = useState('');

  async function loadWorkOrder() {
    try {
      setLoading(true);
      const [woRes, actionsRes] = await Promise.all([
        api.facility.workOrders.get(id),
        api.facility.workOrders.getActions(id).catch(() => ({ data: [] })),
      ]);
      setWorkOrder(woRes.data);
      setAllowedActions(actionsRes.data || []);
      try {
        const [reqs, cons, itms] = await Promise.all([
          api.inventory.workOrderMaterials.listRequirements(id).catch(() => []),
          api.inventory.workOrderMaterials.listConsumptions(id).catch(() => []),
          api.inventory.items.list().catch(() => ({ data: [] })),
        ]);
        setMaterials({ requirements: reqs || [], consumptions: cons || [] });
        setCatalogItems(itms.data || []);
      } catch (e) {
        // safe fallback
      }
      setIsTimerRunning(!!woRes.data?.activeTimer);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkOrder();
  }, [id]);

  // Timer Tick
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  async function handleActionExecute(action: string) {
    try {
      setIsSubmittingAction(true);
      await api.facility.workOrders.executeAction(id, action, {
        comment: actionComment || undefined,
        reason: actionReason || undefined,
      });
      setActionModal({ open: false });
      setActionComment('');
      setActionReason('');
      loadWorkOrder();
    } catch (err: any) {
      alert(err.message || 'Error executing action');
    } finally {
      setIsSubmittingAction(false);
    }
  }

  async function handleStartWork() {
    try {
      await api.facility.workOrders.start(id);
      loadWorkOrder();
    } catch (err: any) {
      alert(err.message || 'Error starting work');
    }
  }

  async function handleClaim() {
    try {
      await api.facility.workOrders.claim(id);
      loadWorkOrder();
    } catch (err: any) {
      alert(err.message || 'Error claiming work order');
    }
  }

  async function handleTimerToggle() {
    try {
      if (isTimerRunning) {
        await api.facility.workOrders.stopTimer(id);
        setIsTimerRunning(false);
        setTimerSeconds(0);
      } else {
        await api.facility.workOrders.startTimer(id, { type: 'WORK' });
        setIsTimerRunning(true);
      }
      loadWorkOrder();
    } catch (err: any) {
      alert(err.message || 'Error toggling timer');
    }
  }

  async function handleCompleteSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.facility.workOrders.complete(id, {
        completionSummary,
      });
      setCompletionModal(false);
      setCompletionSummary('');
      loadWorkOrder();
    } catch (err: any) {
      alert(err.message || 'Error submitting completion');
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.facility.workOrders.supervisorReview(id, {
        decision: reviewDecision,
        reviewNotes: reviewNotes || undefined,
      });
      setReviewModal(false);
      setReviewNotes('');
      loadWorkOrder();
    } catch (err: any) {
      alert(err.message || 'Error submitting review');
    }
  }

  async function handleCreateMaterialReq(e: React.FormEvent) {
    e.preventDefault();
    if (!reqForm.itemId) return;
    const itm = catalogItems.find((i) => i.id === reqForm.itemId);
    try {
      await api.inventory.workOrderMaterials.createRequirement(id, {
        itemId: reqForm.itemId,
        requiredQty: parseFloat(reqForm.requiredQty) || 1,
        uomId: itm?.baseUomId,
      });
      setShowReqModal(false);
      setReqForm({ itemId: '', requiredQty: '1' });
      const reqs = await api.inventory.workOrderMaterials.listRequirements(id);
      setMaterials((prev) => ({ ...prev, requirements: reqs || [] }));
    } catch (err: any) {
      alert(err?.message || 'Failed to request material');
    }
  }

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle) return;
    try {
      await api.facility.workOrders.addTask(id, {
        title: newTaskTitle,
        isRequired: true,
      });
      setNewTaskTitle('');
      loadWorkOrder();
    } catch (err: any) {
      alert(err.message || 'Error adding task');
    }
  }

  async function handleTaskToggle(task: any) {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await api.facility.workOrders.updateTask(id, task.id, {
        status: nextStatus,
      });
      loadWorkOrder();
    } catch (err: any) {
      alert(err.message || 'Error updating task');
    }
  }

  async function handleChecklistSubmit(item: any, value: any) {
    try {
      await api.facility.workOrders.submitChecklist(id, {
        itemId: item.itemId,
        itemLabel: item.itemLabel,
        itemType: item.itemType,
        ...value,
      });
      loadWorkOrder();
    } catch (err: any) {
      alert(err.message || 'Error submitting checklist');
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-muted">Loading Work Order workspace...</div>;
  }

  if (!workOrder) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-rose-500 font-semibold">Work Order not found.</div>
        <Link href="/app/facility/work-orders" className="text-primary hover:underline text-sm">
          &larr; Back to Work Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/app/facility/work-orders"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Work Orders
        </Link>

        {/* Live Timer Widget */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTimerToggle}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
              isTimerRunning
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-surface-muted text-foreground hover:bg-surface-elevated border border-border'
            }`}
          >
            {isTimerRunning ? (
              <PauseCircle className="h-4 w-4" />
            ) : (
              <PlayCircle className="h-4 w-4 text-emerald-500" />
            )}
            {isTimerRunning ? 'Stop Timer' : 'Start Timer'}
          </button>
        </div>
      </div>

      {/* Header Card */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-primary">
                {workOrder.workOrderNumber}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary">
                {workOrder.currentState}
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-surface-muted text-muted">
                {workOrder.workType}
              </span>
              {workOrder.reworkCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-600">
                  Rework #{workOrder.reworkCount}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-foreground mt-1">{workOrder.title}</h1>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {!workOrder.primaryAssigneeId && (
              <button
                onClick={handleClaim}
                className="rounded-lg bg-amber-500 text-white px-3 py-1.5 text-xs font-semibold hover:bg-amber-600 transition-colors"
              >
                Self-Claim Work
              </button>
            )}

            {workOrder.currentState === 'ACCEPTED' && (
              <button
                onClick={handleStartWork}
                className="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Start Work
              </button>
            )}

            {workOrder.currentState === 'IN_PROGRESS' && (
              <button
                onClick={() => setCompletionModal(true)}
                className="rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                Submit Completion
              </button>
            )}

            {workOrder.currentState === 'SUPERVISOR_REVIEW' && (
              <button
                onClick={() => setReviewModal(true)}
                className="rounded-lg bg-purple-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-purple-700 transition-colors"
              >
                Supervisor Review
              </button>
            )}

            {allowedActions.map((act) => (
              <button
                key={act.action}
                onClick={() => setActionModal({ open: true, action: act.action, title: act.label })}
                className="rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs font-medium hover:bg-surface-elevated transition-colors"
              >
                {act.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Meta Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-border text-xs text-muted">
          <div>
            <span className="font-medium text-foreground">Priority:</span> {workOrder.priority}
          </div>
          <div>
            <span className="font-medium text-foreground">Assignee:</span>{' '}
            {workOrder.primaryAssigneeName || 'None'}
          </div>
          <div>
            <span className="font-medium text-foreground">Location:</span>{' '}
            {workOrder.buildingName || ''}{' '}
            {workOrder.unitNumber ? `Unit ${workOrder.unitNumber}` : 'Common Area'}
          </div>
          <div>
            <span className="font-medium text-foreground">Due Date:</span>{' '}
            {workOrder.dueAt ? new Date(workOrder.dueAt).toLocaleDateString() : 'None'}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-border flex gap-4 text-sm font-medium">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'tasks'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Tasks & Checklists ({workOrder.tasks?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('scope')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'scope'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Scope & Details
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Labor Logs ({workOrder.workLogs?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'materials'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Materials & Spares ({materials.requirements.length + materials.consumptions.length})
        </button>
        <button
          onClick={() => setActiveTab('evidence')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'evidence'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Evidence & Photos ({workOrder.evidence?.length ?? 0})
        </button>
        <button
          onClick={() => setActiveTab('review')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'review'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          Reviews & History ({workOrder.completionAttempts?.length ?? 0})
        </button>
      </div>

      {/* Tab 1: Tasks & Checklists */}
      {activeTab === 'tasks' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tasks List */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-foreground text-sm flex items-center justify-between">
              <span>Task Breakdown Checklist</span>
              <span className="text-xs text-muted font-normal">
                {workOrder.tasks?.filter((t: any) => t.status === 'COMPLETED').length} /{' '}
                {workOrder.tasks?.length || 0} completed
              </span>
            </h2>

            <form onSubmit={handleAddTask} className="flex gap-2">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Add subtask step..."
                className="flex-1 rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Add
              </button>
            </form>

            <div className="divide-y divide-border">
              {workOrder.tasks?.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted">No subtasks defined.</div>
              ) : (
                workOrder.tasks?.map((t: any) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={t.status === 'COMPLETED'}
                        onChange={() => handleTaskToggle(t)}
                        className="rounded border-border text-primary focus:ring-0"
                      />
                      <span className={t.status === 'COMPLETED' ? 'line-through text-muted' : ''}>
                        {t.title}
                      </span>
                    </label>
                    <span className="text-[10px] text-muted uppercase font-semibold">
                      {t.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Standardized Checklist Runner */}
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4">
            <h2 className="font-semibold text-foreground text-sm flex items-center justify-between">
              <span>Inspection Checklist Items</span>
              <span className="text-xs text-muted font-normal">
                {workOrder.checklistResults?.length || 0} standard items
              </span>
            </h2>

            <div className="space-y-3">
              {workOrder.checklistResults?.length === 0 ? (
                <div className="py-4 text-center text-xs text-muted">
                  No checklist template attached to this work order.
                </div>
              ) : (
                workOrder.checklistResults?.map((c: any) => (
                  <div
                    key={c.itemId}
                    className="p-3 rounded-lg border border-border bg-surface-muted/30 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground">{c.itemLabel}</span>
                      <span className="text-[10px] text-muted uppercase font-mono">
                        {c.itemType}
                      </span>
                    </div>

                    {c.itemType === 'BOOLEAN' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() =>
                            handleChecklistSubmit(c, { valueBoolean: true, isPassed: true })
                          }
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            c.valueBoolean === true
                              ? 'bg-emerald-600 text-white'
                              : 'bg-surface-muted text-muted'
                          }`}
                        >
                          Yes / Verified
                        </button>
                        <button
                          onClick={() =>
                            handleChecklistSubmit(c, { valueBoolean: false, isPassed: false })
                          }
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            c.valueBoolean === false
                              ? 'bg-rose-600 text-white'
                              : 'bg-surface-muted text-muted'
                          }`}
                        >
                          No / Failed
                        </button>
                      </div>
                    )}

                    {c.itemType === 'PASS_FAIL' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleChecklistSubmit(c, { isPassed: true })}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            c.isPassed === true
                              ? 'bg-emerald-600 text-white'
                              : 'bg-surface-muted text-muted'
                          }`}
                        >
                          PASS
                        </button>
                        <button
                          onClick={() => handleChecklistSubmit(c, { isPassed: false })}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            c.isPassed === false
                              ? 'bg-rose-600 text-white'
                              : 'bg-surface-muted text-muted'
                          }`}
                        >
                          FAIL
                        </button>
                      </div>
                    )}

                    {(c.itemType === 'NUMBER' || c.itemType === 'DECIMAL') && (
                      <input
                        type="number"
                        defaultValue={c.valueNumber || c.valueDecimal || ''}
                        onBlur={(e) =>
                          handleChecklistSubmit(c, { valueNumber: Number(e.target.value) })
                        }
                        placeholder="Enter measured value..."
                        className="w-full rounded-md border border-border bg-surface px-3 py-1 text-xs text-foreground focus:outline-none focus:border-primary"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Scope & Details */}
      {activeTab === 'scope' && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-foreground">Operational Scope & Context</h2>
          <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
            {workOrder.description}
          </p>

          <div className="pt-4 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-foreground">Location Scope:</span>{' '}
              {workOrder.locationType}
              <div className="text-muted mt-0.5">
                {workOrder.locationDescription || 'No additional location notes'}
              </div>
            </div>
            <div>
              <span className="font-semibold text-foreground">Originating Source:</span>{' '}
              {workOrder.source}
              {workOrder.maintenancePlanName && (
                <div className="text-primary font-medium mt-0.5">
                  Linked PM Plan: {workOrder.maintenancePlanName}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Labor Logs */}
      {activeTab === 'logs' && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">Technician Labor Logs</h2>
          </div>

          <div className="divide-y divide-border">
            {workOrder.workLogs?.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted">
                No labor time recorded on this work order yet.
              </div>
            ) : (
              workOrder.workLogs?.map((log: any) => (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-medium text-foreground">
                      {log.userName || 'Technician'}
                    </div>
                    <div className="text-muted text-[11px]">
                      {log.type} &bull; {log.notes || 'Routine labor activity'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-foreground">{log.durationMinutes} mins</div>
                    <div className="text-[10px] text-muted">
                      {log.isManual ? 'Manual Entry' : 'Timer Logged'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Evidence & Photos */}
      {activeTab === 'evidence' && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-foreground">Photographic & Document Evidence</h2>
          {workOrder.evidence?.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted">
              No evidence photos attached yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {workOrder.evidence?.map((ev: any) => (
                <div key={ev.id} className="rounded-lg border border-border p-2 space-y-1">
                  <div className="h-32 bg-surface-muted rounded flex items-center justify-center text-muted text-xs">
                    [Photo Evidence]
                  </div>
                  <div className="text-xs font-medium text-foreground truncate">
                    {ev.caption || ev.evidenceType}
                  </div>
                  <div className="text-[10px] text-muted">{ev.uploadedByName}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Reviews & History */}
      {activeTab === 'review' && (
        <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-foreground">
            Completion Submissions & Supervisor Reviews
          </h2>
          {workOrder.completionAttempts?.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted">
              No completion attempts recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {workOrder.completionAttempts?.map((att: any) => (
                <div
                  key={att.id}
                  className="p-4 rounded-lg border border-border bg-surface-muted/30 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-foreground">
                      Attempt #{att.attemptNumber}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        att.reviewOutcome === 'APPROVED' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {att.reviewOutcome}
                    </span>
                  </div>
                  <p className="text-xs text-muted">{att.summary}</p>
                  {att.reviewNotes && (
                    <div className="text-xs text-amber-600 border-l-2 border-amber-500 pl-2">
                      Supervisor Feedback: {att.reviewNotes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Materials & Spares (Phase 11) */}
      {activeTab === 'materials' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Required & Reserved Spare Parts</h3>
                <p className="text-xs text-muted">
                  Spares requested or reserved from stores for this maintenance task.
                </p>
              </div>
              <button
                onClick={() => setShowReqModal(true)}
                className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Request Spare Part
              </button>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted text-muted uppercase">
                  <tr>
                    <th className="p-2.5">Item Name & Code</th>
                    <th className="p-2.5 text-right">Required</th>
                    <th className="p-2.5 text-right">Reserved</th>
                    <th className="p-2.5 text-right">Issued</th>
                    <th className="p-2.5 text-right">Consumed</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {materials.requirements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-muted">
                        No material requirements requested yet.
                      </td>
                    </tr>
                  ) : (
                    materials.requirements.map((r: any) => (
                      <tr key={r.id} className="hover:bg-surface-muted/50">
                        <td className="p-2.5 font-medium">
                          <div>{r.item?.name}</div>
                          <span className="font-mono text-muted text-[10px]">
                            {r.item?.itemCode}
                          </span>
                        </td>
                        <td className="p-2.5 text-right font-bold">
                          {r.requiredQty} {r.uom?.symbol}
                        </td>
                        <td className="p-2.5 text-right text-amber-500 font-semibold">
                          {r.reservedQty}
                        </td>
                        <td className="p-2.5 text-right text-blue-500 font-semibold">
                          {r.issuedQty}
                        </td>
                        <td className="p-2.5 text-right text-emerald-500 font-bold">
                          {r.consumedQty}
                        </td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-muted border border-border">
                            {r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold">Recorded Material Consumptions</h3>
              <p className="text-xs text-muted">
                Actual parts installed or consumables applied to equipment during repair.
              </p>
            </div>

            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted text-muted uppercase">
                  <tr>
                    <th className="p-2.5">Installed Part</th>
                    <th className="p-2.5 text-right">Qty</th>
                    <th className="p-2.5">Batch / Serial</th>
                    <th className="p-2.5">Recorded At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {materials.consumptions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted">
                        No materials consumed yet.
                      </td>
                    </tr>
                  ) : (
                    materials.consumptions.map((c: any) => (
                      <tr key={c.id} className="hover:bg-surface-muted/50">
                        <td className="p-2.5 font-medium">{c.item?.name}</td>
                        <td className="p-2.5 text-right font-bold">
                          {c.quantity} {c.uom?.symbol}
                        </td>
                        <td className="p-2.5 font-mono text-[10px] text-muted">
                          {c.serial?.serialNumber || c.batch?.batchNumber || '-'}
                        </td>
                        <td className="p-2.5 text-muted">
                          {new Date(c.recordedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Request Spare Part Modal */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h3 className="text-base font-bold">Request Spare Part for Work Order</h3>
            <form onSubmit={handleCreateMaterialReq} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Select Item *</label>
                <select
                  required
                  value={reqForm.itemId}
                  onChange={(e) => setReqForm({ ...reqForm, itemId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="">Select Spare Part</option>
                  {catalogItems.map((itm) => (
                    <option key={itm.id} value={itm.id}>
                      {itm.name} ({itm.itemCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Required Quantity *
                </label>
                <input
                  type="number"
                  required
                  value={reqForm.requiredQty}
                  onChange={(e) => setReqForm({ ...reqForm, requiredQty: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="px-4 py-2 text-sm border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {completionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-foreground">Submit Work Order as Completed</h2>
            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Completion Summary
                </label>
                <textarea
                  required
                  rows={4}
                  value={completionSummary}
                  onChange={(e) => setCompletionSummary(e.target.value)}
                  placeholder="Summarize physical work performed, parts replaced, and results achieved..."
                  className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletionModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supervisor Review Modal */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-xl space-y-4">
            <h2 className="text-lg font-bold text-foreground">Supervisor Verification</h2>
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="reviewDecision"
                    checked={reviewDecision === 'APPROVED'}
                    onChange={() => setReviewDecision('APPROVED')}
                  />
                  Approve Completion
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="reviewDecision"
                    checked={reviewDecision === 'REWORK_REQUESTED'}
                    onChange={() => setReviewDecision('REWORK_REQUESTED')}
                  />
                  Request Rework
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Reviewer Notes</label>
                <textarea
                  rows={3}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Provide supervisor approval comments or specific rework instructions..."
                  className="w-full rounded-lg border border-border bg-surface-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewModal(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors shadow-sm"
                >
                  Confirm Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
