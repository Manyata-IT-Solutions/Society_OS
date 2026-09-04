'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Receipt, Check, X, QrCode } from 'lucide-react';

export default function AmenityBookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);

  const loadBookings = async () => {
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
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await api.amenities.decideApproval({ bookingId: id, approved });
      loadBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCheckIn = async (id: string) => {
    try {
      await api.amenities.checkIn(id);
      loadBookings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-border pb-5">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" /> Bookings, Approvals & Check-In Operations
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Approve pending party halls, manage attendance check-ins, and handle cancellation workflows.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Booking #</th>
              <th className="p-3">Amenity</th>
              <th className="p-3">Resident</th>
              <th className="p-3">Start Time</th>
              <th className="p-3">Price / Deposit</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bookings.map((b) => (
              <tr key={b.id}>
                <td className="p-3 font-mono font-bold">{b.bookingNumber}</td>
                <td className="p-3 font-semibold">{b.amenity?.name}</td>
                <td className="p-3">{b.bookedByResident?.displayName || 'Resident'}</td>
                <td className="p-3 text-xs font-mono">{new Date(b.startAt).toLocaleString()}</td>
                <td className="p-3">₹{Number(b.basePrice).toFixed(0)} {b.depositAmount > 0 ? `(+₹${Number(b.depositAmount).toFixed(0)} dep)` : ''}</td>
                <td className="p-3">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {b.status}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  {b.status === 'PENDING_APPROVAL' && (
                    <>
                      <button
                        onClick={() => handleApprove(b.id, true)}
                        className="rounded bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(b.id, false)}
                        className="rounded bg-rose-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {b.status === 'CONFIRMED' && (
                    <button
                      onClick={() => handleCheckIn(b.id)}
                      className="inline-flex items-center gap-1 rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <QrCode className="h-3.5 w-3.5" /> Check-In
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
