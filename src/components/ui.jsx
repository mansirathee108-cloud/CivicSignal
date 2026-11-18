import React from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { SEVERITY_STYLE, STATUS_STYLE } from '../data/taxonomy';

export function SeverityBadge({ severity }) {
  const s = SEVERITY_STYLE[severity] || SEVERITY_STYLE.Low;
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.pill}`}>{severity}</span>;
}

export function StatusBadge({ status }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_STYLE[status] || ''}`}>{status}</span>;
}

// value: 0..1
export function ConfidenceBar({ value, label, compact = false }) {
  const pct = Math.round(value * 100);
  const color = value >= 0.85 ? 'bg-emerald-500' : value >= 0.75 ? 'bg-brand-500' : 'bg-amber-500';
  return (
    <div className="w-full">
      {!compact && (
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted">{label}</span>
          <span className="font-semibold text-ink">{pct}%</span>
        </div>
      )}
      <div className="h-1.5 rounded-full bg-soft overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label || 'Confidence'}>
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function AiTag({ children = 'AI suggestion (prototype)' }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 dark:bg-brand-500/15 text-brand-700 dark:text-brand-200 px-2.5 py-0.5 text-[11px] font-semibold">
      <Sparkles className="h-3 w-3" /> {children}
    </span>
  );
}

const TONES = {
  blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
  red: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
  teal: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-200',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300',
};

export function IconChip({ icon: Icon, tone = 'blue', className = 'h-11 w-11' }) {
  return (
    <span className={`inline-flex items-center justify-center rounded-full shrink-0 ${TONES[tone]} ${className}`}>
      <Icon className="h-5 w-5" />
    </span>
  );
}

export function StatCard({ icon, tone, label, value, hint, onClick }) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper onClick={onClick} className={`card p-4 flex items-center gap-4 text-left w-full ${onClick ? 'hover:shadow-lift transition-shadow' : ''}`}>
      <IconChip icon={icon} tone={tone} className="h-12 w-12" />
      <div className="min-w-0">
        <p className="text-xs text-muted font-medium">{label}</p>
        <p className="text-2xl font-extrabold text-ink leading-tight">{value}</p>
        {hint && <p className="text-[11px] text-muted mt-0.5">{hint}</p>}
      </div>
    </Wrapper>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">{title}</h1>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function CardHeader({ icon: Icon, title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="flex items-center gap-2 text-sm font-bold text-ink">
        {Icon && <Icon className="h-4 w-4 text-brand-600" />} {title}
      </h2>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="text-center py-12 px-4">
      {Icon && <Icon className="h-10 w-10 text-muted/60 mx-auto mb-3" />}
      <p className="font-semibold text-ink">{title}</p>
      {text && <p className="text-sm text-muted mt-1">{text}</p>}
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 text-sm text-muted">
      <span>Page {page} of {pages}</span>
      <div className="flex gap-2">
        <button className="btn-ghost border border-line !px-3 !py-1.5" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
        <button className="btn-ghost border border-line !px-3 !py-1.5" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

export function Skeleton({ className = 'h-24' }) {
  return <div className={`animate-pulse rounded-2xl bg-soft ${className}`} />;
}
