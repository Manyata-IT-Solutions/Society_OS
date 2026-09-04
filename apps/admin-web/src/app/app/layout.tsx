'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Building,
  Home,
  Users,
  LifeBuoy,
  Wrench,
  Cpu,
  Boxes,
  CalendarDays,
  Car,
  Shield,
  CreditCard,
  Receipt,
  PiggyBank,
  ShoppingCart,
  Truck,
  Vote,
  FileText,
  Droplets,
  Flame,
  Siren,
  Gauge,
  Search,
  Bell,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Sun,
  X,
  ChevronDown,
  CheckCircle2,
  HardHat,
  Award,
  Calendar,
  AlertTriangle,
  AlertCircle,
  FileCheck,
  Zap,
  Bot,
  UserCheck,
  FolderTree,
  DollarSign,
  ScanLine,
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api-client';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[]; // Allowed roles. If undefined, allowed for all except specialized roles
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

type ThemePreference = 'light' | 'dark' | 'system';

const THEME_STORAGE_KEY = 'community_os_theme';

const themeOptions: Array<{
  value: ThemePreference;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Auto', icon: Monitor },
];

function getStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'light' || storedTheme === 'dark' || storedTheme === 'system'
    ? storedTheme
    : 'system';
}

function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolvedTheme = preference === 'system' ? (systemPrefersDark ? 'dark' : 'light') : preference;

  root.classList.remove('light', 'dark');
  root.classList.add(resolvedTheme);

  if (preference === 'system') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = preference;
  }
}

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isTenantMenuOpen, setIsTenantMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<any[]>([]);
  const routerPathname = usePathname();
  const router = useRouter();
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  // Active Tenant Scope state
  const [activeOrg, setActiveOrg] = useState('Northstar Community Management');
  const [activeCommunity, setActiveCommunity] = useState('Green Valley Heights');

  useEffect(() => {
    setPendingPath(null);
  }, [routerPathname]);

  const pathname = pendingPath ?? routerPathname;

  const handleNavClick = (e: React.MouseEvent<HTMLElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/app')) {
        setPendingPath(href);
        setIsSidebarOpen(false);
      }
    }
  };

  const handleNavHover = (e: React.MouseEvent<HTMLElement>) => {
    const anchor = (e.target as HTMLElement).closest('a');
    if (anchor) {
      const href = anchor.getAttribute('href');
      if (href && href.startsWith('/app')) {
        router.prefetch(href);
      }
    }
  };

  const { user, isPlatformAdmin, logout } = useAuth();
  const ActiveThemeIcon = themeOptions.find((option) => option.value === themePreference)?.icon ?? Monitor;

  // Role detection
  const email = (user?.email || '').toLowerCase();
  const isResident = email.startsWith('resident.');
  const isGuard = email.startsWith('guard.');
  const isTech = email.startsWith('tech.');
  const isFinance = email.startsWith('finance.') || email.startsWith('accountant.');
  const isSafety = email.startsWith('safety.');

  // Notification loader
  useEffect(() => {
    async function loadNotifications() {
      try {
        const countRes = await api.notifications.getUnreadCount();
        setUnreadCount(countRes?.count || 0);

        const inboxRes = await api.notifications.getInbox({ limit: 5 });
        setRecentNotifications(inboxRes?.items || []);
      } catch {
        // Safe silent fail
      }
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const storedPreference = getStoredThemePreference();
    setThemePreference(storedPreference);
    applyThemePreference(storedPreference);

    const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = () => {
      if (getStoredThemePreference() === 'system') {
        applyThemePreference('system');
      }
    };

    systemThemeQuery.addEventListener('change', syncSystemTheme);
    return () => systemThemeQuery.removeEventListener('change', syncSystemTheme);
  }, []);

  const handleThemeChange = (preference: ThemePreference) => {
    setThemePreference(preference);
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
    applyThemePreference(preference);
    setIsThemeMenuOpen(false);
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      setUnreadCount((prev) => Math.max(0, prev - 1));
      setRecentNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch {
      // ignore
    }
  };

  // Structured Information Architecture by Domain
  const allNavGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        { label: 'Command Center', href: '/app', icon: LayoutDashboard },
        { label: 'Unified Search', href: '/app/search', icon: Search },
      ],
    },
    {
      title: 'Property & Communities',
      items: [
        { label: 'Communities Master', href: '/app/organizations', icon: Building2 },
        { label: 'Portfolios', href: '/app/portfolios', icon: FolderTree },
        { label: 'Organizations', href: '/app/organizations', icon: Building },
      ],
    },
    {
      title: 'Residents & Households',
      items: [
        { label: 'Residents Roster', href: '/app/organizations', icon: Users },
        { label: 'Households', href: '/app/organizations', icon: Home },
        { label: 'Service Complaints', href: '/app/resident/complaints', icon: LifeBuoy },
      ],
    },
    {
      title: 'Operations & Maintenance',
      items: [
        { label: 'Helpdesk Tickets', href: '/app/helpdesk/tickets', icon: LifeBuoy },
        { label: 'Work Orders', href: '/app/facility/work-orders', icon: Wrench },
        { label: 'Preventive Maintenance', href: '/app/facility/maintenance-plans', icon: CalendarDays },
        { label: 'Physical Assets', href: '/app/assets', icon: Cpu },
        { label: 'Inventory & Spares', href: '/app/inventory/balances', icon: Boxes },
        { label: 'Club Amenities', href: '/app/amenities', icon: Calendar },
        { label: 'Parking Bays', href: '/app/parking/slots', icon: Car },
        { label: 'Workforce Roster', href: '/app/workforce/workers', icon: HardHat },
      ],
    },
    {
      title: 'Security & Gate',
      items: [
        { label: 'Gate Console', href: '/app/security/gate-app', icon: ScanLine },
        { label: 'Visitor Passes', href: '/app/security/visitors', icon: Shield },
        { label: 'Active On-Premise', href: '/app/security/active', icon: UserCheck },
        { label: 'Security Watchlist', href: '/app/security/watchlist', icon: AlertTriangle },
      ],
    },
    {
      title: 'Financial Core ERP',
      items: [
        { label: 'Financial Overview', href: '/app/finance', icon: DollarSign },
        { label: 'Chart of Accounts', href: '/app/finance/accounts', icon: CreditCard },
        { label: 'Journal Vouchers', href: '/app/finance/journals', icon: Receipt },
        { label: 'General Ledger', href: '/app/finance/ledger', icon: FileText },
        { label: 'Trial Balance', href: '/app/finance/trial-balance', icon: CheckCircle2 },
        { label: 'Maintenance Billing', href: '/app/billing/invoices', icon: Receipt },
        { label: 'Collections & Receipts', href: '/app/billing/payments', icon: DollarSign },
        { label: 'Accounts Payable', href: '/app/ap/invoices', icon: CreditCard },
        { label: 'Bank Treasury', href: '/app/treasury/accounts', icon: PiggyBank },
        { label: 'Annual Operating Budget', href: '/app/budgeting', icon: DollarSign },
      ],
    },
    {
      title: 'Procurement & SCM',
      items: [
        { label: 'Procurement Pipeline', href: '/app/procurement', icon: ShoppingCart },
        { label: 'Requisitions (PR)', href: '/app/procurement/requisitions', icon: FileCheck },
        { label: 'Purchase Orders (PO)', href: '/app/procurement/orders', icon: ShoppingCart },
        { label: 'Goods Receipts (GRN)', href: '/app/procurement/receipts', icon: Truck },
        { label: 'Approved Vendors', href: '/app/vendors', icon: Users },
        { label: 'Capital Capex Projects', href: '/app/projects/list', icon: Award },
      ],
    },
    {
      title: 'Society Governance',
      items: [
        { label: 'Managing Committees', href: '/app/governance/committees', icon: Users },
        { label: 'Meetings & Quorum', href: '/app/governance/meetings', icon: CalendarDays },
        { label: 'Secret Ballot Voting', href: '/app/governance/voting', icon: Vote },
        { label: 'Resolutions & Minutes', href: '/app/governance/resolutions', icon: FileCheck },
        { label: 'Estate Policies', href: '/app/governance/policies', icon: FileText },
      ],
    },
    {
      title: 'Utilities & Plant Operations',
      items: [
        { label: 'Utility Command', href: '/app/utilities', icon: Zap },
        { label: 'Meter Registry', href: '/app/utilities/meters', icon: Gauge },
        { label: 'Meter Readings', href: '/app/utilities/readings', icon: FileText },
        { label: 'Water & Tankers', href: '/app/utilities/water', icon: Droplets },
        { label: 'DG Genset Operations', href: '/app/utilities/energy', icon: Flame },
        { label: 'Outages & Restorations', href: '/app/utilities/outages', icon: AlertTriangle },
      ],
    },
    {
      title: 'Safety, SOS & Compliance',
      items: [
        { label: 'Emergency SOS Console', href: '/app/safety/sos', icon: Siren },
        { label: 'Statutory Compliance', href: '/app/safety/compliance', icon: FileCheck },
        { label: 'Hazards & Risk Matrix', href: '/app/safety/hazards-risks', icon: AlertTriangle },
        { label: 'Incidents & CAPA', href: '/app/safety/incidents', icon: AlertCircle },
        { label: 'Evacuation Muster', href: '/app/safety/evacuation', icon: Users },
      ],
    },
    {
      title: 'Analytics & Reporting',
      items: [
        { label: 'Executive BI Dashboard', href: '/app/analytics', icon: Gauge },
        { label: 'Custom Report Builder', href: '/app/analytics/reports', icon: FileSpreadsheetIcon },
      ],
    },
    {
      title: 'System Administration',
      items: [
        { label: 'User Directory', href: '/app/users', icon: Users },
        { label: 'Roles & Permissions', href: '/app/roles', icon: Shield },
        { label: 'Immutable Audit Trail', href: '/app/audit', icon: FileText },
        { label: 'Notifications Center', href: '/app/notifications', icon: Bell },
        { label: 'Notification Templates', href: '/app/notifications/templates', icon: Bell },
        { label: 'Document Library', href: '/app/documents', icon: FileText },
        { label: 'Platform Settings', href: '/app/settings', icon: Award },
      ],
    },
  ];

  // Role-Aware Navigation Filtering
  const filteredNavGroups = React.useMemo(() => {
    if (isResident) {
      return [
        {
          title: 'Resident Portal',
          items: [
            { label: 'My Dashboard', href: '/app', icon: LayoutDashboard },
            { label: 'My Community & Unit', href: '/app/organizations', icon: Home },
            { label: 'Maintenance Invoices', href: '/app/billing/invoices', icon: Receipt },
            { label: 'Service Complaints', href: '/app/resident/complaints', icon: LifeBuoy },
            { label: 'Guest Visitor Passes', href: '/app/security/visitors', icon: Shield },
            { label: 'Club Amenities', href: '/app/amenities', icon: Calendar },
            { label: 'Society Notices', href: '/app/governance/notices', icon: FileText },
            { label: 'Society Documents', href: '/app/documents', icon: FileText },
            { label: 'Utility Consumption', href: '/app/utilities/readings', icon: Droplets },
          ],
        },
      ];
    }

    if (isGuard) {
      return [
        {
          title: 'Gate Security Operations',
          items: [
            { label: 'Guard Post Console', href: '/app/security/gate-app', icon: ScanLine },
            { label: 'Visitor Pass Log', href: '/app/security/visitors', icon: Shield },
            { label: 'Active On-Premise', href: '/app/security/active', icon: UserCheck },
            { label: 'Parking Bays', href: '/app/parking/slots', icon: Car },
            { label: 'Emergency SOS Protocol', href: '/app/safety/sos', icon: Siren },
          ],
        },
      ];
    }

    if (isTech) {
      return [
        {
          title: 'Technician Workstation',
          items: [
            { label: 'My Assigned Work', href: '/app', icon: LayoutDashboard },
            { label: 'Work Orders Queue', href: '/app/facility/work-orders', icon: Wrench },
            { label: 'Preventive Maintenance', href: '/app/facility/maintenance-plans', icon: CalendarDays },
            { label: 'Asset Master', href: '/app/assets', icon: Cpu },
            { label: 'Inventory Spares', href: '/app/inventory/balances', icon: Boxes },
            { label: 'Meter Telemetry', href: '/app/utilities/readings', icon: Gauge },
          ],
        },
      ];
    }

    if (isFinance) {
      return allNavGroups.filter((g) =>
        ['Overview', 'Financial Core ERP', 'Procurement & SCM', 'Analytics & Reporting'].includes(g.title)
      );
    }

    if (isSafety) {
      return allNavGroups.filter((g) =>
        ['Overview', 'Safety, SOS & Compliance', 'Operations & Maintenance', 'Analytics & Reporting'].includes(g.title)
      );
    }

    // Default for Platform Admin / Community GM
    return allNavGroups;
  }, [isResident, isGuard, isTech, isFinance, isSafety, allNavGroups]);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r border-border bg-surface transition-transform duration-200 lg:static lg:translate-x-0 shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Workspace Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link href="/app" className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-extrabold shadow-sm">
              C
            </div>
            <div>
              <span className="font-bold tracking-tight text-sm text-foreground block">
                Community OS
              </span>
              <span className="text-[10px] text-muted block -mt-0.5 font-medium">
                Enterprise Township ERP
              </span>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-muted hover:text-foreground p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Active Tenant Context Card */}
        <div className="p-3 border-b border-border bg-surface-muted/30">
          <button
            onClick={() => setIsTenantMenuOpen(!isTenantMenuOpen)}
            className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs hover:border-primary transition-colors shadow-2xs"
          >
            <div className="flex items-center space-x-2.5 truncate">
              <div className="h-6 w-6 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <div className="truncate">
                <div className="font-semibold truncate text-foreground text-[11px] leading-tight">
                  {activeCommunity}
                </div>
                <div className="text-[10px] text-muted truncate leading-tight mt-0.5">
                  {activeOrg}
                </div>
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-muted shrink-0 ml-1" />
          </button>

          {/* Tenant Switcher Popover */}
          {isTenantMenuOpen && (
            <div className="mt-2 rounded-lg border border-border bg-surface p-1 shadow-lg text-xs space-y-1">
              <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Switch Community Scope
              </div>
              <button
                onClick={() => {
                  setActiveOrg('Northstar Community Management');
                  setActiveCommunity('Green Valley Heights');
                  setIsTenantMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                  activeCommunity === 'Green Valley Heights'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-surface-muted'
                }`}
              >
                <span>Green Valley Heights</span>
                {activeCommunity === 'Green Valley Heights' && <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => {
                  setActiveOrg('Community OS Demo Management Corp');
                  setActiveCommunity('Palm Meadows Villas');
                  setIsTenantMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between ${
                  activeCommunity === 'Palm Meadows Villas'
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-surface-muted'
                }`}
              >
                <span>Palm Meadows Villas</span>
                {activeCommunity === 'Palm Meadows Villas' && <CheckCircle2 className="h-3.5 w-3.5" />}
              </button>
              <Link
                href="/app/organizations"
                onClick={() => setIsTenantMenuOpen(false)}
                className="block text-center text-[10px] text-primary hover:underline pt-1 border-t border-border"
              >
                Manage All Organizations →
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar Nav Items */}
        <nav
          onPointerDown={handleNavClick}
          onMouseOver={handleNavHover}
          className="flex-1 space-y-6 px-3 py-3 overflow-y-auto min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredNavGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted/80">
                {group.title}
              </div>
              {group.items.map((item, iIdx) => {
                const isActive =
                  item.href === '/app'
                    ? pathname === '/app'
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={iIdx}
                    href={item.href}
                    className={`flex items-center space-x-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'text-foreground hover:bg-surface-muted'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary-foreground' : 'text-muted'}`} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Profile Footer */}
        <div className="border-t border-border p-3 bg-surface">
          <div className="flex items-center justify-between">
            <Link
              href="/app/profile"
              className="flex items-center space-x-2.5 rounded-lg p-1.5 transition-colors hover:bg-surface-muted truncate flex-1"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs shrink-0">
                {user ? user.displayName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold truncate leading-tight text-foreground">
                  {user ? user.displayName : 'Administrator'}
                </div>
                <div className="text-[10px] text-muted truncate leading-tight mt-0.5">
                  {isPlatformAdmin ? 'Platform Admin' : isResident ? 'Resident' : isGuard ? 'Security Guard' : 'Staff'}
                </div>
              </div>
            </Link>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="text-muted hover:text-rose-600 transition-colors p-1.5 rounded-lg hover:bg-surface-muted shrink-0"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace Area */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden relative">
        {/* Instant Route Progress Glow */}
        {pendingPath && (
          <div className="absolute top-0 left-0 right-0 z-50 h-[2.5px] bg-primary/20 overflow-hidden pointer-events-none">
            <div className="h-full bg-primary animate-pulse w-full origin-left shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          </div>
        )}

        {/* Top Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-surface px-6 shrink-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-muted hover:text-foreground p-1"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Global Search Input */}
            <Link
              href="/app/search"
              className="hidden sm:flex items-center rounded-lg border border-border bg-surface-muted/50 px-3 py-1.5 text-xs text-muted w-80 justify-between cursor-pointer hover:border-primary hover:bg-surface transition-all shadow-2xs"
            >
              <div className="flex items-center space-x-2 truncate">
                <Search className="h-3.5 w-3.5 text-muted shrink-0" />
                <span className="truncate">Search units, tickets, people, assets...</span>
              </div>
              <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-mono text-muted shrink-0">
                ⌘K
              </kbd>
            </Link>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center space-x-3">
            {/* Scoped Community Pill */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-surface-muted/40 text-[11px] font-medium text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>{activeCommunity}</span>
            </div>

            {/* Theme Selector */}
            <div className="relative">
              <button
                onClick={() => setIsThemeMenuOpen((isOpen) => !isOpen)}
                title="Theme"
                aria-label="Theme"
                aria-haspopup="menu"
                aria-expanded={isThemeMenuOpen}
                className="rounded-lg p-2 text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
              >
                <ActiveThemeIcon className="h-4 w-4" />
              </button>

              {isThemeMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-11 z-50 w-36 rounded-xl border border-border bg-surface p-1 shadow-xl"
                >
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = option.value === themePreference;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isSelected}
                        onClick={() => handleThemeChange(option.value)}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                          isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'text-foreground hover:bg-surface-muted'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          {option.label}
                        </span>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notifications Button */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative rounded-lg p-2 text-muted hover:bg-surface-muted hover:text-foreground transition-colors"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popover */}
              {isNotificationOpen && (
                <div className="absolute right-0 top-11 z-50 w-80 rounded-xl border border-border bg-surface shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between border-b border-border p-3 bg-surface-muted/40">
                    <div className="font-semibold text-xs text-foreground">Notifications</div>
                    <Link
                      href="/app/notifications"
                      onClick={() => setIsNotificationOpen(false)}
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border">
                    {recentNotifications.length === 0 ? (
                      <div className="p-5 text-center text-xs text-muted">No new notifications.</div>
                    ) : (
                      recentNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`p-3 text-xs transition-colors hover:bg-surface-muted cursor-pointer ${
                            !notif.isRead ? 'bg-primary/5 font-medium' : ''
                          }`}
                          onClick={() => handleMarkRead(notif.id)}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground text-xs truncate">
                              {notif.title}
                            </span>
                            {!notif.isRead && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                          <p className="mt-1 text-muted text-[11px] line-clamp-2">{notif.body}</p>
                          <div className="mt-1.5 text-[9px] text-muted">
                            {new Date(notif.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Workspace Content View */}
        <main className="flex-1 overflow-y-auto p-6 min-h-0 bg-background">{children}</main>
      </div>
    </div>
  );
}

// Fallback icon helper
function FileSpreadsheetIcon(props: { className?: string }) {
  return <FileText {...props} />;
}
