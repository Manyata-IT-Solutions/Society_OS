'use client';

import React from 'react';
import { User, Mail, Phone, Globe, Shield, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

export default function ProfilePage() {
  const { user, isPlatformAdmin, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-8 text-center text-sm text-muted">Loading profile...</div>;
  }

  if (!user) {
    return <div className="p-8 text-center text-sm text-muted">Not authenticated.</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account Profile</h1>
        <p className="text-sm text-muted mt-1">
          Personal identity credentials and active security parameters.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-2xl shadow-inner">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{user.displayName}</h2>
                {isPlatformAdmin && (
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    Platform Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-muted font-mono mt-0.5">{user.email}</p>
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-border bg-background p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase">
              <Mail className="h-3.5 w-3.5" /> Email Address
            </div>
            <div className="font-mono text-sm">{user.email}</div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase">
              <Phone className="h-3.5 w-3.5" /> Contact Phone
            </div>
            <div className="text-sm">{user.phone || 'No phone registered'}</div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase">
              <Globe className="h-3.5 w-3.5" /> Timezone & Locale
            </div>
            <div className="text-sm">
              {user.timezone} • {user.preferredLocale}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-4 space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted uppercase">
              <Shield className="h-3.5 w-3.5" /> Account Status
            </div>
            <div className="flex items-center gap-1.5 text-sm text-success font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              {user.status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
