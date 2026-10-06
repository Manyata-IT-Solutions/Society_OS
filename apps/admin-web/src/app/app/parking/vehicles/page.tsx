'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Car, Plus, CheckCircle2, XCircle } from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [plate, setPlate] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [isEv, setIsEv] = useState(false);

  const loadVehicles = async () => {
    try {
      const orgs = await api.listOrganizations();
      const orgList = (orgs as any)?.data || (orgs as any) || [];
      if (orgList.length > 0 && orgList[0]?.id) {
        const comms = await api.listCommunitiesForOrganization(orgList[0].id);
        const commList = (comms as any)?.data || (comms as any) || [];
        if (commList.length > 0 && commList[0]?.id) {
          const list = await api.parking.getVehicles(commList[0].id);
          setVehicles(list || []);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleRegister = async () => {
    try {
      const orgs = await api.listOrganizations();
      const orgList = (orgs as any)?.data || (orgs as any) || [];
      const comms = await api.listCommunitiesForOrganization(orgList[0].id);
      const commList = (comms as any)?.data || (comms as any) || [];
      const units = await api.property.listUnits(commList[0].id);
      const unitList = (units as any)?.data || (units as any) || [];

      await api.parking.registerVehicle({
        organizationId: orgList[0].id,
        communityId: commList[0].id,
        registrationNumber: plate,
        make,
        model,
        isEv,
        unitId: unitList[0]?.id,
      });

      setShowRegister(false);
      loadVehicles();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Car className="h-6 w-6 text-primary" /> Resident & Household Vehicle Registry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registered vehicle fleet, ownership verification, and digital permit linking.
          </p>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Register New Vehicle
        </button>
      </div>

      {showRegister && (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4 max-w-lg">
          <h2 className="text-lg font-bold">Register Vehicle</h2>
          <input
            type="text"
            placeholder="Registration Plate (e.g. KA-01-MJ-5520)"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Make (e.g. Honda)"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2"
            />
            <input
              type="text"
              placeholder="Model (e.g. City)"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isEv}
              onChange={(e) => setIsEv(e.target.checked)}
              className="rounded border"
            />
            Electric Vehicle (EV)
          </label>
          <div className="flex gap-2">
            <button
              onClick={handleRegister}
              className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
            >
              Submit Registration
            </button>
            <button
              onClick={() => setShowRegister(false)}
              className="rounded-lg border border-border px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Plate Number</th>
              <th className="p-3">Make / Model</th>
              <th className="p-3">Type</th>
              <th className="p-3">Assigned Unit</th>
              <th className="p-3">Permit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vehicles.map((v) => (
              <tr key={v.id}>
                <td className="p-3 font-mono font-bold">{v.registrationNumber}</td>
                <td className="p-3">{v.make} {v.model} {v.isEv && <span className="text-xs bg-emerald-100 text-emerald-800 rounded px-1.5 py-0.5 ml-1">EV</span>}</td>
                <td className="p-3">{v.vehicleType}</td>
                <td className="p-3">{v.authorizations[0]?.unit?.unitNumber || 'Unassigned'}</td>
                <td className="p-3">
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    {v.permits[0]?.status || 'ACTIVE'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
