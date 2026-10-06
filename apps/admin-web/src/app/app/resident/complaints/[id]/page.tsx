'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api-client';
import {
  Ticket,
  ArrowLeft,
  Clock,
  CheckCircle2,
  Send,
  MessageSquare,
  Star,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';

export default function ResidentComplaintDetailPage() {
  const params = useParams();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [ticketId]);

  const loadData = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const [t, tm, cm] = await Promise.all([
        api.residentComplaints.get(ticketId),
        api.residentComplaints.getTimeline(ticketId),
        api.residentComplaints.getComments(ticketId),
      ]);
      setTicket(t);
      setTimeline(tm);
      setComments(cm);
      if (t.feedback) setFeedbackSuccess(true);
    } catch (err: any) {
      setMsg(`Error loading complaint: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    setSubmittingComment(true);
    try {
      await api.residentComplaints.addComment(ticketId, { body: commentBody.trim() });
      setCommentBody('');
      const [cm, tm] = await Promise.all([
        api.residentComplaints.getComments(ticketId),
        api.residentComplaints.getTimeline(ticketId),
      ]);
      setComments(cm);
      setTimeline(tm);
    } catch (err: any) {
      setMsg(`Failed to send message: ${err.message}`);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    try {
      await api.residentComplaints.reopen(ticketId, { reason: reopenReason.trim() });
      setShowReopenModal(false);
      setReopenReason('');
      await loadData();
      setMsg('Complaint reopened. A supervisor has been notified.');
    } catch (err: any) {
      setMsg(`Failed to reopen: ${err.message}`);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this complaint?')) return;
    try {
      await api.residentComplaints.cancel(ticketId, { reason: 'Cancelled by resident' });
      await loadData();
      setMsg('Complaint cancelled.');
    } catch (err: any) {
      setMsg(`Failed to cancel: ${err.message}`);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      await api.residentComplaints.submitFeedback(ticketId, {
        rating: feedbackRating,
        comment: feedbackComment.trim() || undefined,
      });
      setFeedbackSuccess(true);
      await loadData();
      setMsg('Thank you for rating our resolution!');
    } catch (err: any) {
      setMsg(`Feedback error: ${err.message}`);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  if (loading && !ticket) {
    return (
      <div className="p-8 text-center text-muted">
        <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
        Loading complaint details...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="p-8 text-center text-muted">
        Complaint not found.{' '}
        <Link href="/app/resident/complaints" className="text-primary underline">
          Back to complaints
        </Link>
      </div>
    );
  }

  const isResolvedOrClosed = ticket.currentState === 'RESOLVED' || ticket.currentState === 'CLOSED';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/app/resident/complaints"
          className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to My Complaints</span>
        </Link>
        {msg && (
          <div className="rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs text-primary font-medium">
            {msg}
          </div>
        )}
      </div>

      {/* Main Complaint Header Card */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-primary">{ticket.ticketNumber}</span>
              <span className="rounded-full bg-blue-500/10 text-blue-500 px-2.5 py-0.5 text-xs font-semibold">
                {ticket.currentState}
              </span>
              <span className="text-xs text-muted font-medium">• {ticket.categoryName}</span>
            </div>
            <h1 className="text-xl font-bold mt-1">{ticket.title}</h1>
          </div>

          {/* Resident Actions */}
          <div className="flex items-center gap-2">
            {!isResolvedOrClosed && ticket.currentState !== 'CANCELLED' && (
              <button
                onClick={handleCancel}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition"
              >
                Cancel Request
              </button>
            )}
            {isResolvedOrClosed && (
              <button
                onClick={() => setShowReopenModal(true)}
                className="rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition"
              >
                <RotateCcw className="inline h-3.5 w-3.5 mr-1" />
                Reopen Issue
              </button>
            )}
          </div>
        </div>

        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{ticket.description}</p>

        {ticket.resolutionSummary && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs space-y-1">
            <div className="font-semibold text-emerald-500 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" />
              <span>Resolution Summary</span>
            </div>
            <p className="text-foreground">{ticket.resolutionSummary}</p>
          </div>
        )}
      </div>

      {/* 5-Star CSAT Feedback Form (if resolved) */}
      {isResolvedOrClosed && !ticket.feedback && !feedbackSuccess && (
        <form
          onSubmit={handleSubmitFeedback}
          className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 shadow-sm space-y-4"
        >
          <div>
            <h3 className="font-bold text-base">Rate Your Service Experience</h3>
            <p className="text-xs text-muted">
              Please rate the technician resolution quality to help us improve.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setFeedbackRating(star)}
                className="p-1 text-amber-400 hover:scale-110 transition"
              >
                <Star
                  className={`h-7 w-7 ${star <= feedbackRating ? 'fill-amber-400' : 'text-zinc-300'}`}
                />
              </button>
            ))}
            <span className="ml-2 text-sm font-bold text-amber-500">
              {feedbackRating} / 5 Stars
            </span>
          </div>

          <textarea
            rows={2}
            placeholder="Share feedback on technician promptness and quality (optional)..."
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            className="w-full rounded-md border border-border bg-surface p-2 text-xs"
          />

          <button
            type="submit"
            disabled={submittingFeedback}
            className="rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Submit Feedback
          </button>
        </form>
      )}

      {/* Public Updates Timeline */}
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm uppercase tracking-wider text-muted">
          Public Updates & Progress
        </h3>
        <div className="space-y-3">
          {timeline.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex gap-3 text-xs border-l-2 border-primary/30 pl-3 pb-2"
            >
              <div className="space-y-0.5">
                <div className="font-semibold text-foreground">{item.title}</div>
                {item.description && <p className="text-muted">{item.description}</p>}
                <div className="text-[10px] text-muted">
                  {new Date(item.occurredAt).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resident Reply */}
        <form onSubmit={handleAddComment} className="border-t border-border pt-4 flex gap-2">
          <input
            type="text"
            placeholder="Reply or provide more details to technician..."
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            className="flex-1 rounded-md border border-border bg-surface-muted px-3 py-2 text-xs focus:border-primary focus:outline-none"
          />
          <button
            type="submit"
            disabled={submittingComment || !commentBody.trim()}
            className="flex items-center gap-1 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>

      {/* Reopen Modal */}
      {showReopenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleReopen}
            className="w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-lg space-y-4"
          >
            <h3 className="text-lg font-bold">Reopen Complaint</h3>
            <p className="text-xs text-muted">
              If the issue has recurred or was not resolved to satisfaction, provide reasons for
              reopening.
            </p>
            <div>
              <label className="text-xs font-semibold text-muted">Reason for Reopening *</label>
              <textarea
                rows={3}
                placeholder="Explain why the issue persists..."
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                className="mt-1 w-full rounded-md border border-border bg-surface-muted p-2 text-xs"
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReopenModal(false)}
                className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Reopen Ticket
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
