'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { Building, Plus, Users, Clock, Tag } from 'lucide-react';

export default function AmenityCatalogPage() {
  const [amenities, setAmenities] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const orgs = await api.listOrganizations();
        const orgList = (orgs as any)?.data || (orgs as any) || [];
        if (orgList.length > 0 && orgList[0]?.id) {
          const comms = await api.listCommunitiesForOrganization(orgList[0].id);
          const commList = (comms as any)?.data || (comms as any) || [];
          if (commList.length > 0 && commList[0]?.id) {
            const list = await api.amenities.getAmenities(commList[0].id);
            setAmenities(list || []);
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
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building className="h-6 w-6 text-primary" /> Amenity Catalog & Resources
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Community bookable facilities, sports courts, banquet halls, pools, and guest accommodations.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {amenities.map((a) => (
          <div key={a.id} className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                {a.category}
              </span>
              <span className="text-xs font-mono font-semibold text-muted-foreground">{a.code}</span>
            </div>
            <h2 className="text-lg font-bold">{a.name}</h2>
            <p className="text-xs text-muted-foreground line-clamp-2">{a.description || 'No description provided.'}</p>
            <div className="border-t border-border pt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> Cap: {a.capacity}</span>
              <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {a.isPaid ? 'Paid Tier' : 'Free / Complimentary'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
