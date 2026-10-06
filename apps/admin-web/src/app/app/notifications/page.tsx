'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Mail,
  Send,
  CheckCheck,
  Clock,
  AlertCircle,
  FileText,
  RefreshCw,
  Plus,
  X,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { api } from '@/lib/api-client';

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'broadcast' | 'deliveries'>('inbox');
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);

  // Broadcast Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('SYSTEM');
  const [priority, setPriority] = useState('NORMAL');
  const [channels, setChannels] = useState<string[]>(['IN_APP']);
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'inbox') {
        const res = await api.notifications.getInbox();
        setInboxItems(res?.items || []);
        const countRes = await api.notifications.getUnreadCount();
        setUnreadCount(countRes?.count || 0);
      } else if (activeTab === 'deliveries') {
        const res = await api.notifications.listDeliveries();
        setDeliveries(res?.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setInboxItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      setInboxItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');
    try {
      await api.notifications.send({
        title,
        body,
        category,
        priority,
        channels,
        recipients: {
          allCommunityResidents: targetType === 'all',
        },
      });

      setSuccessMessage('Notification broadcast queued successfully!');
      setTitle('');
      setBody('');
      setTimeout(() => {
        setIsBroadcastModalOpen(false);
        setSuccessMessage('');
        loadData();
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch notification.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleChannel = (ch: string) => {
    setChannels((prev) => (prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications & Broadcasts</h1>
          <p className="text-sm text-muted">
            Multi-channel broadcast messaging, in-app alerts, delivery pipelines, and notification
            templates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/notifications/templates"
            className="flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs font-medium hover:bg-surface-muted transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Manage Templates
          </Link>
          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            Broadcast Notification
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border space-x-6 text-sm font-medium">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'inbox'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Mail className="h-4 w-4" />
          <span>My Inbox</span>
          {unreadCount > 0 && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('deliveries')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'deliveries'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Radio className="h-4 w-4" />
          <span>Channel Delivery Logs</span>
        </button>
      </div>

      {/* Tab 1: Inbox */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted">{inboxItems.length} notifications in inbox</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          <div className="rounded-lg border border-border bg-surface divide-y divide-border overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-xs text-muted">Loading inbox...</div>
            ) : inboxItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted">Your inbox is empty.</div>
            ) : (
              inboxItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 transition-colors hover:bg-surface-muted/50 ${
                    !item.isRead ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">{item.title}</span>
                        <span className="rounded bg-surface-muted px-2 py-0.5 text-[10px] text-muted">
                          {item.category}
                        </span>
                        {!item.isRead && (
                          <span className="rounded bg-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                            UNREAD
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted leading-relaxed whitespace-pre-line">
                        {item.body}
                      </p>
                      <div className="text-[10px] text-muted pt-1">
                        {new Date(item.createdAt).toLocaleString()}
                      </div>
                    </div>

                    {!item.isRead && (
                      <button
                        onClick={() => handleMarkRead(item.id)}
                        className="rounded border border-border px-2 py-1 text-[11px] hover:bg-surface-muted transition-colors shrink-0"
                      >
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Delivery Logs */}
      {activeTab === 'deliveries' && (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface-muted/50 text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Channel</th>
                  <th className="px-4 py-3 font-medium">Destination</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Attempts</th>
                  <th className="px-4 py-3 font-medium">Provider Ref</th>
                  <th className="px-4 py-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      Loading delivery logs...
                    </td>
                  </tr>
                ) : deliveries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted">
                      No active or queued deliveries found.
                    </td>
                  </tr>
                ) : (
                  deliveries.map((d) => (
                    <tr key={d.id} className="hover:bg-surface-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-primary text-[10px]">
                          {d.channel}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted">
                        {d.destination || 'In-App Direct'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-green-500/10 px-2 py-0.5 text-green-600 text-[10px] font-medium">
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {d.attemptCount} / {d.maxAttempts}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-muted">
                        {d.providerReference || '—'}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-muted">
                        {new Date(d.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Broadcast Notification Modal */}
      {isBroadcastModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="relative w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                <h3 className="text-base font-semibold">Broadcast Notification</h3>
              </div>
              <button
                onClick={() => setIsBroadcastModalOpen(false)}
                className="rounded p-1 text-muted hover:bg-surface-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {successMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-xs text-green-600 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-foreground mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Scheduled Water Maintenance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-foreground mb-1">Message Body</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Enter notification message details..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-foreground mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  >
                    <option value="SYSTEM">SYSTEM</option>
                    <option value="SECURITY">SECURITY</option>
                    <option value="RESIDENT">RESIDENT</option>
                    <option value="PROPERTY">PROPERTY</option>
                    <option value="GOVERNANCE">GOVERNANCE</option>
                    <option value="MAINTENANCE">MAINTENANCE</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-foreground mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-xs focus:border-primary focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-foreground mb-2">Delivery Channels</label>
                <div className="flex flex-wrap gap-2">
                  {['IN_APP', 'EMAIL', 'SMS', 'PUSH'].map((ch) => (
                    <button
                      type="button"
                      key={ch}
                      onClick={() => toggleChannel(ch)}
                      className={`rounded-md px-3 py-1 text-xs font-medium border transition-colors ${
                        channels.includes(ch)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted hover:text-foreground'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsBroadcastModalOpen(false)}
                  className="rounded-md border border-border px-3 py-2 text-xs font-medium hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {submitting ? 'Dispatching...' : 'Dispatch Notification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
