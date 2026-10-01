// frontend/src/components/common/Badge.tsx
import React from 'react';
import { formatStatusLabel } from '../../utils/formatters';

export interface BadgeProps {
  children?: React.ReactNode;
  status?: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
  className?: string;
}

export function getStatusBadgeVariant(status: string): BadgeProps['variant'] {
  const s = (status || '').toUpperCase();
  if (['CONFIRMED', 'PUBLISHED', 'ACTIVE', 'SUCCESS', 'AVAILABLE', 'ISSUED'].includes(s)) return 'success';
  if (['PENDING', 'PENDING_PAYMENT', 'DRAFT', 'HELD'].includes(s)) return 'warning';
  if (['CANCELLED', 'REFUNDED', 'FAILED', 'EXPIRED', 'BLOCKED', 'BOOKED'].includes(s)) return 'danger';
  if (['COMPLETED', 'USED', 'CHECKED_IN'].includes(s)) return 'info';
  return 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  status,
  variant,
  size = 'md',
  dot = false,
  className = '',
}) => {
  const computedVariant: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info' =
    variant || (status ? getStatusBadgeVariant(status) || 'neutral' : 'neutral');
  const computedContent = children !== undefined ? children : status ? formatStatusLabel(status) : '';

  const sizeStyles: Record<'sm' | 'md' | 'lg', string> = {
    sm: 'text-[10px] px-2 py-0.5 font-semibold',
    md: 'text-xs px-2.5 py-1 font-medium',
    lg: 'text-xs px-3 py-1.5 font-bold',
  };

  const variantStyles: Record<'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info', string> = {
    primary: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    success: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    info: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  };

  const dotColors: Record<'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'info', string> = {
    primary: 'bg-indigo-400',
    success: 'bg-emerald-400',
    warning: 'bg-amber-400',
    danger: 'bg-rose-400',
    neutral: 'bg-slate-400',
    info: 'bg-cyan-400',
  };

  const chosenSize = size || 'md';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase ${sizeStyles[chosenSize]} ${variantStyles[computedVariant]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[computedVariant]}`} />}
      {computedContent}
    </span>
  );
};
