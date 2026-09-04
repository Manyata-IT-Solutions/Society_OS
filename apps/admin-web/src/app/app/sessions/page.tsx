'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Laptop,
  Smartphone,
  Globe,
  RefreshCw,
  AlertCircle,
  XCircle,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import type { SessionResponseDto } from '@community-os/contracts';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.auth.getSessions();
      setSessions(data || []);
    } catch (err) {
      setError((err as Error).message || 'Failed to load active sessions.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevoke = async (sessionId: string) => {
    if (!window.confirm('Are you sure you want to terminate this login session?')) return;
    try {
      await apiClient.auth.revokeSession(sessionId);
      loadSessions();
    } catch (err) {
      alert((err as ApiClientError).message || 'Failed to revoke session.');
    }
  };

  const getDeviceIcon = (ua?: string | null) => {
    if (!ua) return <Globe className="h-5 w-5 text-muted" />;
    const lower = ua.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <Smartphone className="h-5 w-5 text-primary" />;
    }
    return <Laptop className="h-5 w-5 text-primary" />;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Active Sessions & Security</h1>
          <p className="text-sm text-muted mt-1">
            Server-side revocable session tokens across web and mobile access points.
          </p>
        </div>
        <button
          onClick={() => loadSessions()}
          className="rounded-md border border-border p-2 text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
          title="Refresh active sessions"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted rounded-xl border border-border bg-surface">
            <RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
            Loading active sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-12 text-center rounded-xl border border-border bg-surface">
            <ShieldCheck className="mx-auto h-12 w-12 text-muted/50 mb-3" />
            <h3 className="text-base font-semibold">No active sessions</h3>
            <p className="text-sm text-muted mt-1">
              You are currently logged in via stateless token.
            </p>
          </div>
        ) : (
          sessions.map((s) => (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-border bg-surface p-5 shadow-sm"
            >
              <div className="flex items-start space-x-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted border border-border">
                  {getDeviceIcon(s.userAgent)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {s.userAgent || 'Web Browser Session'}
                    </span>
                    {s.isCurrent && (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                        Current Session
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted font-mono mt-1">
                    IP: {s.ipAddress || '127.0.0.1'} • Session ID: {s.id.slice(0, 8)}...
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted mt-1">
                    <Clock className="h-3 w-3" />
                    Last Active: {new Date(s.lastActiveAt).toLocaleString()} • Expires:{' '}
                    {new Date(s.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {!s.isCurrent && (
                <button
                  onClick={() => handleRevoke(s.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <XCircle className="h-4 w-4" />
                  Revoke Device
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
