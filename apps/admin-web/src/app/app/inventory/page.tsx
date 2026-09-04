'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';
import {
  PackageOpen,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  QrCode,
  Layers,
  ArrowRight,
  TrendingDown,
  Warehouse,
  CheckCircle2,
  X,
} from 'lucide-react';
import Link from 'next/link';

export default function InventoryOverviewPage() {
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItemForPolicy, setSelectedItemForPolicy] = useState<any>(null);

  const [form, setForm] = useState({
    name: '',
    itemCode: '',
    description: '',
    categoryId: '',
    baseUomId: '',
    itemType: 'SPARE_PART',
    minStockLevel: '10',
    reorderLevel: '20',
    maxStockLevel: '100',
    isBatchTracked: false,
    isSerialTracked: false,
    isExpiryTracked: false,
  });

  const [policyForm, setPolicyForm] = useState({
    storeId: '',
    minQuantity: '5',
    reorderLevel: '15',
    reorderQuantity: '50',
    maxQuantity: '200',
  });

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [itemRes, catRes, uomRes, storeRes] = await Promise.all([
        api.inventory.items.list({
          organizationId: orgId,
          communityId: commId,
          search: search || undefined,
          categoryId: selectedCategory || undefined,
        }),
        api.inventory.categories.list({
          organizationId: orgId,
          communityId: commId,
        }),
        api.inventory.uoms.list(orgId),
        api.inventory.stores.list({
          organizationId: orgId,
          communityId: commId,
        }),
      ]);
      setItems(itemRes.data || []);
      setCategories(catRes || []);
      setUoms(uomRes || []);
      setStores(storeRes || []);
    } catch (err) {
      console.error('Failed to load inventory data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId, commId, search, selectedCategory]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    try {
      await api.inventory.items.create({
        organizationId: orgId,
        communityId: commId || null,
        name: form.name,
        itemCode: form.itemCode || undefined,
        description: form.description || null,
        categoryId: form.categoryId,
        baseUomId: form.baseUomId,
        itemType: form.itemType,
        minStockLevel: parseFloat(form.minStockLevel) || 0,
        reorderLevel: parseFloat(form.reorderLevel) || 0,
        maxStockLevel: parseFloat(form.maxStockLevel) || 0,
        isBatchTracked: form.isBatchTracked,
        isSerialTracked: form.isSerialTracked,
        isExpiryTracked: form.isExpiryTracked,
      });
      setShowCreateModal(false);
      setForm({
        name: '',
        itemCode: '',
        description: '',
        categoryId: '',
        baseUomId: '',
        itemType: 'SPARE_PART',
        minStockLevel: '10',
        reorderLevel: '20',
        maxStockLevel: '100',
        isBatchTracked: false,
        isSerialTracked: false,
        isExpiryTracked: false,
      });
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to create item');
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForPolicy || !policyForm.storeId) return;
    try {
      await api.inventory.items.updatePolicy(selectedItemForPolicy.id, policyForm.storeId, {
        minQuantity: parseFloat(policyForm.minQuantity) || 0,
        reorderLevel: parseFloat(policyForm.reorderLevel) || 0,
        reorderQuantity: parseFloat(policyForm.reorderQuantity) || 0,
        maxQuantity: parseFloat(policyForm.maxQuantity) || null,
        reorderEnabled: true,
      });
      setSelectedItemForPolicy(null);
      alert('Store policy saved successfully!');
    } catch (err: any) {
      alert(err?.message || 'Failed to save store policy');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory & Spare Parts Master</h1>
          <p className="text-muted text-sm">
            Manage item catalog, tracking policies, minimum reorder thresholds, and store
            allocations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/app/inventory/import"
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-surface-muted transition-colors"
          >
            Bulk Import CSV
          </Link>
          <Link
            href="/app/inventory/scan"
            className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-surface-muted transition-colors flex items-center gap-2"
          >
            <QrCode className="h-4 w-4" /> Scan QR
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted uppercase">Total Catalog Items</span>
            <PackageOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold">{items.length}</div>
          <p className="text-xs text-muted mt-1">Across all categories</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted uppercase">Active Stores</span>
            <Warehouse className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl font-bold">{stores.length}</div>
          <p className="text-xs text-muted mt-1">Stock locations</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted uppercase">Batch Tracked</span>
            <Layers className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold">
            {items.filter((i) => i.isBatchTracked).length}
          </div>
          <p className="text-xs text-muted mt-1">Expiry & lot controlled</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted uppercase">Serial Controlled</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-bold">
            {items.filter((i) => i.isSerialTracked).length}
          </div>
          <p className="text-xs text-muted mt-1">Asset-convertible serialized units</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface p-4 rounded-xl border border-border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search items by code, name, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-56 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.code})
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-muted border-b border-border text-xs uppercase text-muted font-semibold">
              <tr>
                <th className="px-4 py-3">Code & Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">UOM</th>
                <th className="px-4 py-3">Min / Reorder</th>
                <th className="px-4 py-3">Tracking</th>
                <th className="px-4 py-3">Identifiers</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    Loading inventory items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted">
                    No inventory items found. Add your first item above!
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{item.name}</div>
                      <div className="text-xs text-muted font-mono">{item.itemCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface-muted text-muted border border-border">
                        {item.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-muted">{item.itemType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">
                        {item.baseUom?.symbol || item.baseUom?.code}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">
                        Min: <span className="font-medium">{item.minStockLevel ?? '-'}</span> |
                        Reorder:{' '}
                        <span className="font-medium text-amber-500">
                          {item.reorderLevel ?? '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 flex-wrap">
                        {item.isBatchTracked && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 font-medium">
                            Batch
                          </span>
                        )}
                        {item.isSerialTracked && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-500 font-medium">
                            Serial
                          </span>
                        )}
                        {item.isExpiryTracked && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-red-500/10 text-red-500 font-medium">
                            Expiry
                          </span>
                        )}
                        {!item.isBatchTracked && !item.isSerialTracked && !item.isExpiryTracked && (
                          <span className="text-xs text-muted">Standard</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {item.barcodeIdentifier || item.qrIdentifier || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedItemForPolicy(item);
                          setPolicyForm({
                            storeId: stores[0]?.id || '',
                            minQuantity: String(item.minStockLevel || 5),
                            reorderLevel: String(item.reorderLevel || 15),
                            reorderQuantity: '50',
                            maxQuantity: String(item.maxStockLevel || 200),
                          });
                        }}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Set Store Policy
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg font-semibold">Create Inventory Item</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={handleCreateItem}
              className="p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LED Driver 50W"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Item Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={form.itemCode}
                    onChange={(e) => setForm({ ...form, itemCode: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Category *</label>
                  <select
                    required
                    value={form.categoryId}
                    onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Base UOM *</label>
                  <select
                    required
                    value={form.baseUomId}
                    onChange={(e) => setForm({ ...form, baseUomId: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  >
                    <option value="">Select UOM</option>
                    {uoms.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Item Type</label>
                  <select
                    value={form.itemType}
                    onChange={(e) => setForm({ ...form, itemType: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  >
                    <option value="SPARE_PART">Spare Part</option>
                    <option value="CONSUMABLE">Consumable</option>
                    <option value="TOOL">Tool / Equipment</option>
                    <option value="SAFETY_GEAR">Safety Gear</option>
                    <option value="RAW_MATERIAL">Raw Material</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  placeholder="Detailed specifications, manufacturer part number..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Min Stock Level
                  </label>
                  <input
                    type="number"
                    value={form.minStockLevel}
                    onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={form.reorderLevel}
                    onChange={(e) => setForm({ ...form, reorderLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Max Stock Level
                  </label>
                  <input
                    type="number"
                    value={form.maxStockLevel}
                    onChange={(e) => setForm({ ...form, maxStockLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border space-y-2">
                <span className="text-xs font-semibold text-muted uppercase">
                  Advanced Tracking Options
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isBatchTracked}
                      onChange={(e) => setForm({ ...form, isBatchTracked: e.target.checked })}
                      className="rounded border-border text-primary"
                    />
                    <span>Batch / Lot Tracked</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isSerialTracked}
                      onChange={(e) => setForm({ ...form, isSerialTracked: e.target.checked })}
                      className="rounded border-border text-primary"
                    />
                    <span>Serial Controlled</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isExpiryTracked}
                      onChange={(e) => setForm({ ...form, isExpiryTracked: e.target.checked })}
                      className="rounded border-border text-primary"
                    />
                    <span>Expiry Tracked</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Save Item Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedItemForPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div>
                <h3 className="text-base font-semibold">Store Stock Policy</h3>
                <p className="text-xs text-muted">{selectedItemForPolicy.name}</p>
              </div>
              <button
                onClick={() => setSelectedItemForPolicy(null)}
                className="text-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSavePolicy} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted mb-1">Target Store *</label>
                <select
                  required
                  value={policyForm.storeId}
                  onChange={(e) => setPolicyForm({ ...policyForm, storeId: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Min Quantity</label>
                  <input
                    type="number"
                    value={policyForm.minQuantity}
                    onChange={(e) => setPolicyForm({ ...policyForm, minQuantity: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Reorder Level</label>
                  <input
                    type="number"
                    value={policyForm.reorderLevel}
                    onChange={(e) => setPolicyForm({ ...policyForm, reorderLevel: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">
                    Reorder Quantity
                  </label>
                  <input
                    type="number"
                    value={policyForm.reorderQuantity}
                    onChange={(e) =>
                      setPolicyForm({ ...policyForm, reorderQuantity: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted mb-1">Max Quantity</label>
                  <input
                    type="number"
                    value={policyForm.maxQuantity}
                    onChange={(e) => setPolicyForm({ ...policyForm, maxQuantity: e.target.value })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedItemForPolicy(null)}
                  className="px-3 py-1.5 text-xs border border-border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-lg"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
