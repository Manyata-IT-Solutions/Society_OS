import Link from 'next/link';
import { Building2, ShieldCheck, Layers, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg">
              C
            </div>
            <span className="text-xl font-bold tracking-tight">Community OS</span>
          </div>
          <nav className="flex items-center space-x-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Sign In to Console
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-6 py-20 text-center">
          <div className="inline-flex items-center rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-muted uppercase tracking-wider mb-6">
            Phase 0 Foundation • Enterprise Architecture
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl max-w-4xl mx-auto leading-tight">
            The Enterprise Operating System for Residential Communities
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted">
            Modular Monolith, Domain-Driven Design, Multi-Tenant by default. Built for small
            societies, premium gated communities, and large-scale townships.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-base font-medium text-primary-foreground hover:bg-primary-hover shadow-sm transition-all"
            >
              Open Management Console
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="http://localhost:4000/api/docs"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-border bg-surface px-6 py-3 text-base font-medium text-foreground hover:bg-surface-muted transition-all"
            >
              View OpenAPI Specs
            </a>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-muted text-primary mb-4">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Multi-Property SaaS</h3>
              <p className="text-sm text-muted">
                Engineered from day one for portfolios, multi-society management companies, and
                townships with strict tenant isolation.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-muted text-primary mb-4">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Configure, Not Customize</h3>
              <p className="text-sm text-muted">
                Core workflow engine, dynamic policies, and rule-driven approval chains without code
                modifications per client.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-muted text-primary mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
              <p className="text-sm text-muted">
                Zero-trust tenant scoping, fine-grained RBAC + ABAC permissions, automated audit
                trails, and data encryption.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-surface px-6 py-6 text-center text-sm text-muted">
        Community OS Platform Architecture Foundation • Phase 0 Bootstrap
      </footer>
    </div>
  );
}
