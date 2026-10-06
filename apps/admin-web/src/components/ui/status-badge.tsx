import React from 'react';
import { formatStatus } from './formatters';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  customLabel?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<StatusVariant, { bg: string; text: string; dot: string }> = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
    text: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    text: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  danger: {
    bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
    text: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  info: {
    bg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60',
    text: 'text-sky-700 dark:text-sky-300',
    dot: 'bg-sky-500',
  },
  primary: {
    bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  neutral: {
    bg: 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700',
    text: 'text-slate-700 dark:text-slate-300',
    dot: 'bg-slate-400',
  },
};

export function autoDetectVariant(status: string): StatusVariant {
  const s = status.toUpperCase();
  if (['ACTIVE', 'COMPLETED', 'RESOLVED', 'PAID', 'SUCCESS', 'APPROVED', 'OPEN', 'OPERATIONAL'].some((k) => s.includes(k))) {
    return 'success';
  }
  if (['PENDING', 'WARNING', 'AT_RISK', 'REVIEW', 'IN_PROGRESS', 'DRAFT', 'ASSIGNED'].some((k) => s.includes(k))) {
    return 'warning';
  }
  if (['FAILED', 'OVERDUE', 'DANGER', 'CANCELLED', 'REJECTED', 'BREACHED', 'DOWN', 'OUTAGE', 'CRITICAL'].some((k) => s.includes(k))) {
    return 'danger';
  }
  if (['INFO', 'SCHEDULED', 'DISPATCHED', 'SUBMITTED'].some((k) => s.includes(k))) {
    return 'info';
  }
  return 'neutral';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  customLabel,
  size = 'md',
  className = '',
}) => {
  const resolvedVariant = variant || autoDetectVariant(status);
  const style = variantStyles[resolvedVariant];
  const label = customLabel || formatStatus(status);

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${style.bg} ${style.text} ${sizeClasses} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot} shrink-0`} />
      <span className="truncate">{label}</span>
    </span>
  );
};
