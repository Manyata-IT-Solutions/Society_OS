'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Calendar, Clock, Globe, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function CalendarsPage() {
  const [calendars, setCalendars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    loadCalendars();
  }, []);

  const loadCalendars = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await api.calendars.list();
      setCalendars(res?.items || []);
    } catch (err: any) {
      setFeedback(`Error loading calendars: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Business Working Calendars
          </h1>
          <p className="text-sm text-muted">
            Configure working days, operating hours intervals, timezones, and holiday calendars for
            accurate business SLA tracking.
          </p>
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
      ) : (
        <div className="grid gap-4">
          {calendars.length === 0 ? (
            <div className="bg-surface border border-border rounded-lg p-8 text-center text-muted">
              No business calendars found.
            </div>
          ) : (
            calendars.map((cal) => (
              <div
                key={cal.id}
                className="bg-surface border border-border rounded-lg p-5 shadow-sm space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-foreground text-base">{cal.name}</span>
                    {cal.isDefault && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Default Calendar
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-muted flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" /> {cal.timezone}
                  </span>
                </div>

                <p className="text-xs text-muted font-mono">{cal.key}</p>
                {cal.description && <p className="text-sm text-foreground/80">{cal.description}</p>}

                {/* Working Days & Hours Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="bg-surface-muted p-3 rounded-md text-xs space-y-2">
                    <span className="text-muted font-semibold uppercase tracking-wider block text-[10px]">
                      Working Days
                    </span>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                        const isWorking = cal.workingDays?.includes(dayIdx);
                        return (
                          <span
                            key={dayIdx}
                            className={`px-2 py-1 rounded text-[10px] font-semibold ${
                              isWorking
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-surface border border-border text-muted'
                            }`}
                          >
                            {dayNames[dayIdx]}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-surface-muted p-3 rounded-md text-xs space-y-1">
                    <span className="text-muted font-semibold uppercase tracking-wider block text-[10px] flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Operating Hours
                    </span>
                    <div className="font-semibold text-foreground text-sm pt-1">
                      {cal.workingHours?.start} &ndash; {cal.workingHours?.end} ({cal.timezone})
                    </div>
                  </div>

                  <div className="bg-surface-muted p-3 rounded-md text-xs space-y-1">
                    <span className="text-muted font-semibold uppercase tracking-wider block text-[10px]">
                      Holidays Declared
                    </span>
                    <div className="text-foreground pt-1">
                      {cal.holidays?.length > 0
                        ? `${cal.holidays.length} statutory holidays`
                        : 'None specified'}
                    </div>
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
