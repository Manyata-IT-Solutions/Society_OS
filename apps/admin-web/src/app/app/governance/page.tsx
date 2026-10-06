'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { ShieldCheck, Calendar, CheckSquare, Award, Bell, Layers, Users, Clock } from 'lucide-react';

export default function GovernanceDashboardPage() {
  const [summary, setSummary] = useState<any>({
    upcomingMeetings: 1,
    openVotes: 1,
    openActionItems: 2,
    publishedNotices: 4,
    activePolicies: 3,
    totalResolutions: 5,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Enterprise Governance & Meetings</h1>
        <p className="text-sm text-muted">Apex committee management, AGM/EGM lifecycles, quorum tracking, formal voting, and policy registers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Upcoming Meetings</span>
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.upcomingMeetings}</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Open Votes</span>
            <CheckSquare className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.openVotes}</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Open Action Items</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.openActionItems}</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Published Notices</span>
            <Bell className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.publishedNotices}</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Active Policies</span>
            <Layers className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.activePolicies}</div>
        </div>
        <div className="p-4 bg-surface rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted font-medium">Resolutions Adopted</span>
            <Award className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-foreground">{summary.totalResolutions}</div>
        </div>
      </div>
    </div>
  );
}
