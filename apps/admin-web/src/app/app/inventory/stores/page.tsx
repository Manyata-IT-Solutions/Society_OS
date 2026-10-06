'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import { Warehouse, Plus, Layers, MapPin, X } from 'lucide-react';

export default function StoresManagementPage() {
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [selectedStoreForBin, setSelectedStoreForBin] = useState<any>(null);

  const [storeForm, setStoreForm] = useState({
    code: '',
    name: '',
    storeType: 'CENTRAL_WAREHOUSE',
    locationAddress: '',
  });

  const [binForm, setBinForm] = useState({
    code: '',
    name: '',
    aisle: 'A1',
    rack: 'R1',
    shelf: 'S1',
    bin: 'B1',
  });

  const loadStores = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await api.inventory.stores.list({
        organizationId: orgId,
        communityId: commId,
      });
      setStores(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStores();
  }, [orgId, commId]);

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    try {
      await api.inventory.stores.create({
        organizationId: orgId,
        communityId: commId || null,
        code: storeForm.code,
        name: storeForm.name,
        storeType: storeForm.storeType,
        locationAddress: storeForm.locationAddress || null,
      });
      setShowStoreModal(false);
      setStoreForm({ code: '', name: '', storeType: 'CENTRAL_WAREHOUSE', locationAddress: '' });
      loadStores();
    } catch (err: any) {
      alert(err?.message || 'Failed to create store');
    }
  };

  const handleCreateBin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreForBin) return;
    try {
      await api.inventory.stores.createBin(selectedStoreForBin.id, {
        code: binForm.code,
        name: binForm.name,
        aisle: binForm.aisle || null,
        rack: binForm.rack || null,
        shelf: binForm.shelf || null,
        bin: binForm.bin || null,
      });
      setSelectedStoreForBin(null);
      setBinForm({ code: '', name: '', aisle: 'A1', rack: 'R1', shelf: 'S1', bin: 'B1' });
      loadStores();
    } catch (err: any) {
      alert(err?.message || 'Failed to create bin');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Stores & Stock Locations</h1>
          <p className="text-muted text-sm">
            Configure warehouses, site stores, technician van stocks, and rack/shelf bin
            hierarchies.
          </p>
        </div>
        <button
          onClick={() => setShowStoreModal(true)}
          className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Add Store Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-muted">Loading stores...</div>
        ) : stores.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted">
            No stores configured. Add your primary warehouse above!
          </div>
        ) : (
          stores.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-xl border border-border bg-surface shadow-sm space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs text-muted uppercase tracking-wider">
                    {s.code}
                  </span>
                  <h3 className="text-lg font-bold text-foreground">{s.name}</h3>
                </div>
                <span className="px-2 py-1 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {s.storeType}
                </span>
              </div>

              {s.locationAddress && (
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{s.locationAddress}</span>
                </div>
              )}

              <div className="pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase text-muted">
                    Bins & Racks ({s.bins?.length || 0})
                  </span>
                  <button
                    onClick={() => {
                      setSelectedStoreForBin(s);
                      setBinForm({
                        code: s.code + '-A1',
                        name: 'Aisle 1 Rack A',
                        aisle: 'A1',
                        rack: 'R1',
                        shelf: 'S1',
                        bin: 'B1',
                      });
                    }}
                    className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus className="h-3 w-3" /> Add Bin
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {s.bins && s.bins.length > 0 ? (
                    s.bins.map((b: any) => (
                      <span
                        key={b.id}
                        className="px-2 py-1 rounded bg-surface-muted border border-border text-xs font-mono"
                      >
                        {b.code} ({b.name})
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-muted italic">No bins assigned yet.</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showStoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-semibold">Add Store Location</h3>
              <button
                onClick={() => setShowStoreModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateStore} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Store Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WH-MAIN"
                  value={storeForm.code}
                  onChange={(e) =>
                    setStoreForm({ ...storeForm, code: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Engineering Store"
                  value={storeForm.name}
                  onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Store Type</label>
                <select
                  value={storeForm.storeType}
                  onChange={(e) => setStoreForm({ ...storeForm, storeType: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  <option value="CENTRAL_WAREHOUSE">Central Warehouse</option>
                  <option value="SITE_STORE">Site Store</option>
                  <option value="SUB_STORE">Sub Store</option>
                  <option value="TECHNICIAN_VAN">Technician Van / Mobile</option>
                  <option value="TRANSIT_LOCATION">Transit Location</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted mb-1">
                  Physical Address / Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. Basement 1, Maintenance Bay"
                  value={storeForm.locationAddress}
                  onChange={(e) => setStoreForm({ ...storeForm, locationAddress: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowStoreModal(false)}
                  className="px-4 py-2 text-sm border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg"
                >
                  Create Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStoreForBin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-lg font-semibold">Add Bin / Rack Location</h3>
                <p className="text-xs text-muted">{selectedStoreForBin.name}</p>
              </div>
              <button
                onClick={() => setSelectedStoreForBin(null)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateBin} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Bin Code *</label>
                  <input
                    type="text"
                    required
                    value={binForm.code}
                    onChange={(e) => setBinForm({ ...binForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Bin Name *</label>
                  <input
                    type="text"
                    required
                    value={binForm.name}
                    onChange={(e) => setBinForm({ ...binForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="block text-[10px] font-medium text-muted">Aisle</label>
                  <input
                    type="text"
                    value={binForm.aisle}
                    onChange={(e) => setBinForm({ ...binForm, aisle: e.target.value })}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted">Rack</label>
                  <input
                    type="text"
                    value={binForm.rack}
                    onChange={(e) => setBinForm({ ...binForm, rack: e.target.value })}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted">Shelf</label>
                  <input
                    type="text"
                    value={binForm.shelf}
                    onChange={(e) => setBinForm({ ...binForm, shelf: e.target.value })}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted">Bin</label>
                  <input
                    type="text"
                    value={binForm.bin}
                    onChange={(e) => setBinForm({ ...binForm, bin: e.target.value })}
                    className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedStoreForBin(null)}
                  className="px-4 py-2 text-sm border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg"
                >
                  Save Bin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
