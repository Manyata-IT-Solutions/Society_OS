'use client';
import React, { useState } from 'react';
import { Shield, Building, MapPin } from 'lucide-react';

export default function DeploymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Operational Station Deployments</h1>
          <p className="text-sm text-muted">Long-term and shift stationing of guards, technicians, and caretakers across gates and facilities.</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors">
          + Deploy Worker to Station
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { station: 'Main Entrance Gate 1', type: 'GATE', worker: 'Ramesh Singh (Guard)', role: 'Lead Access Control Guard', valid: 'Active' },
          { station: 'Substation & DG Yard', type: 'FACILITY', worker: 'Rajesh Kumar (Electrician)', role: 'Senior Plant Operator', valid: 'Active' },
          { station: 'Clubhouse & Sports Arena', type: 'AMENITY', worker: 'Suresh Sharma (Plumber)', role: 'Pool & Facility Technician', valid: 'Active' },
        ].map((dep, idx) => (
          <div key={idx} className="rounded-xl border border-border bg-surface p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded">{dep.type}</span>
              <span className="text-xs font-medium text-emerald-600">{dep.valid}</span>
            </div>
            <div className="font-bold text-base text-foreground">{dep.station}</div>
            <div className="text-xs text-muted">
              <div>Assigned: <span className="font-medium text-foreground">{dep.worker}</span></div>
              <div>Duty: {dep.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
