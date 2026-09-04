'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { CalendarDays, Clock, CheckCircle2 } from 'lucide-react';

export default function AmenityCalendarPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const comms = await api.listCommunitiesForOrganization(orgList[0].id);
          const commList = (comms as any)?.data || (comms as any) || [];
          if (commList.length > 0 && commList[0]?.id) {
            const list = await api.amenities.getBookings(commList[0].id);
            setBookings(list || []);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" /> Management Schedule & Timeline
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Interactive schedule overview showing confirmed reservations, holds, and maintenance windows.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Booking #</th>
              <th className="p-3">Amenity / Resource</th>
              <th className="p-3">Resident / Unit</th>
              <th className="p-3">Date & Time</th>
              <th className="p-3">Type</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-muted-foreground">No bookings found.</td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id}>
                  <td className="p-3 font-mono font-bold">{b.bookingNumber}</td>
                  <td className="p-3 font-semibold">{b.amenity?.name} ({b.resource?.name || 'All'})</td>
                  <td className="p-3">{b.bookedByResident?.displayName || 'Resident'} (Unit {b.unit?.unitNumber || 'N/A'})</td>
                  <td className="p-3 font-mono text-xs">{new Date(b.startAt).toLocaleString()}</td>
                  <td className="p-3">{b.bookingType}</td>
                  <td className="p-3">
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
