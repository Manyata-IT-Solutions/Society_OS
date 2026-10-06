'use client';
import React, { useState } from 'react';
import { Calendar, UserCheck, AlertTriangle, Download, CheckCircle2 } from 'lucide-react';

export default function AttendancePage() {
  const [logs] = useState([
    { id: '1', worker: 'Rajesh Kumar', role: 'Electrician', shift: 'Morning (07:00 - 15:30)', inTime: '06:55', outTime: '15:32', status: 'PRESENT' },
    { id: '2', worker: 'Suresh Sharma', role: 'Plumber', shift: 'General (09:00 - 18:00)', inTime: '08:58', outTime: '--', status: 'ON_DUTY' },
    { id: '3', worker: 'Ramesh Singh', role: 'Security Guard', shift: 'Night (22:00 - 06:00)', inTime: '21:50', outTime: '06:05', status: 'PRESENT' },
  ]);
  const [downloaded, setDownloaded] = useState(false);

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Worker,Role,Shift,In Time,Out Time,Status\n"
      + logs.map(e => `"${e.worker}","${e.role}","${e.shift}","${e.inTime}","${e.outTime}","${e.status}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance-register-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance & Shift Punch Logs</h1>
          <p className="text-sm text-muted">Biometric, mobile geo-punch, duty rosters, overtime tracking, and muster roll.</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
        >
          {downloaded ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Download className="h-4 w-4" />}
          {downloaded ? 'Register Exported!' : 'Export Daily Attendance Register'}
        </button>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-border text-left text-sm">
          <thead className="bg-surface-muted text-xs font-semibold uppercase text-muted">
            <tr>
              <th className="px-6 py-3">Staff / Worker</th>
              <th className="px-6 py-3">Role</th>
              <th className="px-6 py-3">Assigned Shift</th>
              <th className="px-6 py-3">In Punch</th>
              <th className="px-6 py-3">Out Punch</th>
              <th className="px-6 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-surface-muted/50 transition-colors">
                <td className="px-6 py-4 font-semibold text-foreground">{l.worker}</td>
                <td className="px-6 py-4 text-xs text-muted">{l.role}</td>
                <td className="px-6 py-4 text-xs font-mono">{l.shift}</td>
                <td className="px-6 py-4 text-xs font-mono text-emerald-600 font-bold">{l.inTime}</td>
                <td className="px-6 py-4 text-xs font-mono text-muted">{l.outTime}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-semibold">{l.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
