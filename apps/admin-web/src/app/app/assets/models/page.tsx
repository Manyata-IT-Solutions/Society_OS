'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cpu, ArrowLeft, Plus, Search, CheckCircle2, RefreshCw, Layers } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/auth-context';

export default function AssetModelsPage() {
  const { user } = useAuth();
  const orgId = '4cd873aa-edbf-4588-a7fc-1d48d536bab7';
  const commId = '06b4a306-af34-466e-85c0-bce5197322f9';
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadModels = async () => {
    setLoading(true);
    try {
      const res = await api.assetModels.list({
        organizationId: orgId,
        communityId: commId,
        limit: 100,
      });
      setModels(res?.items || []);
    } catch (err) {
      console.error('Failed to load models', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center space-x-4 border-b border-border pb-5">
        <Link
          href="/app/assets"
          className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-surface-muted transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Cpu className="h-6 w-6 text-primary" />
            Asset Model Master Catalog
          </h1>
          <p className="text-sm text-muted-foreground">
            Manufacturer specifications, engineering parameters, and standard templates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full p-12 text-center text-muted-foreground">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
            <p>Loading model specifications...</p>
          </div>
        ) : models.length === 0 ? (
          <div className="col-span-full p-12 text-center text-muted-foreground bg-card border border-border rounded-xl">
            <Cpu className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-semibold text-foreground">No Catalog Models Found</p>
          </div>
        ) : (
          models.map((m) => (
            <div
              key={m.id}
              className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-foreground text-base block">{m.modelName}</span>
                  <span className="text-xs text-muted-foreground font-mono">
                    {m.manufacturer} • Model: {m.modelNumber}
                  </span>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                  {m.category?.name || 'GENERIC'}
                </span>
              </div>

              <p className="text-xs text-muted-foreground">{m.description || 'No description.'}</p>

              {m.specifications && Object.keys(m.specifications).length > 0 && (
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
                  {Object.entries(m.specifications)
                    .slice(0, 4)
                    .map(([k, v]) => (
                      <div key={k} className="p-2 rounded bg-muted/40 border border-border">
                        <span className="text-[10px] text-muted-foreground uppercase block">
                          {k}
                        </span>
                        <span className="font-semibold text-foreground">{String(v)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
