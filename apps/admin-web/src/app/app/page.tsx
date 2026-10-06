import { CheckCircle2, Server, Database, ShieldAlert, Cpu } from 'lucide-react';

export default function AppDashboardPlaceholderPage() {
  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Command Center</h1>
        <p className="text-sm text-muted mt-1">Phase 0 Engineering Bootstrap & Platform Baseline</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase">Platform Status</span>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </div>
          <div className="text-xl font-bold mt-2">Operational</div>
          <p className="text-xs text-muted mt-1">All bootstrap platform layers active</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase">Multi-Tenancy</span>
            <Cpu className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold mt-2">Hierarchy Ready</div>
          <p className="text-xs text-muted mt-1">Org → Community → Block → Unit</p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase">Security Baseline</span>
            <ShieldAlert className="h-4 w-4 text-primary" />
          </div>
          <div className="text-xl font-bold mt-2">Hardened</div>
          <p className="text-xs text-muted mt-1">Strict headers, CORS, sanitized logs</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold mb-4">Infrastructure & Service Topology</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-surface-muted/30">
            <div className="flex items-center space-x-3">
              <Server className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium">NestJS Modular API Engine</div>
                <div className="text-xs text-muted">
                  Running on port 4000 (/api/v1) • OpenAPI Swagger enabled
                </div>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
              Active
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-surface-muted/30">
            <div className="flex items-center space-x-3">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium">PostgreSQL Primary System of Record</div>
                <div className="text-xs text-muted">
                  PostgreSQL 16 with UUID PKs & UTC Timestamps
                </div>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
              Configured
            </span>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-surface-muted/30">
            <div className="flex items-center space-x-3">
              <Cpu className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-medium">Redis In-Memory Cache & Job Queue</div>
                <div className="text-xs text-muted">
                  Redis 7 for rate-limiting, ephemeral sessions & BullMQ
                </div>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
              Configured
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
