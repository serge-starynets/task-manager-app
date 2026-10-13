import { cn } from '@/lib/utils';
import React from 'react';

type BadgeVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'success'
  | 'warning'
  | 'danger';
type StatusType =
  | 'backlog'
  | 'todo'
  | 'in_progress'
  | 'on_pause'
  | 'qa'
  | 'done'
  | 'rejected'
  | 'closed';
type PriorityType = 'low' | 'medium' | 'high' | 'critical';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  status?: StatusType;
  priority?: PriorityType;
}

const statusStyles: Record<StatusType, string> = {
  backlog:
    'bg-gray-200/90 text-gray-800 dark:bg-white/[0.12] dark:text-gray-100 ring-1 ring-inset ring-black/[0.1] dark:ring-white/[0.16]',
  todo: 'bg-zinc-300/80 text-zinc-800 dark:bg-zinc-600/55 dark:text-zinc-100 ring-1 ring-inset ring-zinc-400/70 dark:ring-zinc-500/50',
  in_progress:
    'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-200 ring-1 ring-inset ring-blue-300/80 dark:ring-blue-700/60',
  on_pause:
    'bg-orange-100 text-orange-900 dark:bg-orange-950/70 dark:text-orange-200 ring-1 ring-inset ring-orange-300/80 dark:ring-orange-700/60',
  qa: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 ring-1 ring-inset ring-amber-300/80 dark:ring-amber-700/60',
  done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 ring-1 ring-inset ring-emerald-300/80 dark:ring-emerald-700/60',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-200 ring-1 ring-inset ring-red-300/80 dark:ring-red-700/60',
  closed:
    'bg-gray-700 text-gray-50 dark:bg-gray-800 dark:text-gray-100 ring-1 ring-inset ring-gray-600/50 dark:ring-gray-500/40',
};

const statusDot: Record<StatusType, string> = {
  backlog: 'bg-gray-500',
  todo: 'bg-zinc-600',
  in_progress: 'bg-blue-600',
  on_pause: 'bg-orange-600',
  qa: 'bg-amber-600',
  done: 'bg-emerald-600',
  rejected: 'bg-red-600',
  closed: 'bg-gray-300',
};

export default function Badge({
  className,
  variant = 'default',
  children,
  status,
  priority,
  ...props
}: BadgeProps) {
  const getPriorityVariant = (): BadgeVariant => {
    if (priority) {
      switch (priority) {
        case 'low':
          return 'secondary';
        case 'medium':
          return 'default';
        case 'high':
          return 'danger';
        case 'critical':
          return 'danger';
        default:
          return 'default';
      }
    }

    return variant;
  };

  const variantStyles = {
    default:
      'bg-violet-100 text-violet-800 dark:bg-violet-950/70 dark:text-violet-200 ring-1 ring-inset ring-violet-300/80 dark:ring-violet-700/60',
    secondary:
      'bg-gray-200/90 text-gray-800 dark:bg-white/[0.12] dark:text-gray-100 ring-1 ring-inset ring-black/[0.1] dark:ring-white/[0.16]',
    outline:
      'border border-black/[0.14] text-gray-800 dark:border-white/[0.18] dark:text-gray-200',
    success:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-200 ring-1 ring-inset ring-emerald-300/80 dark:ring-emerald-700/60',
    warning:
      'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 ring-1 ring-inset ring-amber-300/80 dark:ring-amber-700/60',
    danger: 'bg-red-100 text-red-800 dark:bg-red-950/70 dark:text-red-200 ring-1 ring-inset ring-red-300/80 dark:ring-red-700/60',
  };

  const colorClass = status
    ? statusStyles[status]
    : variantStyles[getPriorityVariant()];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full tracking-wide',
        colorClass,
        className,
      )}
      {...props}
    >
      {status && (
        <span
          className={cn('h-1.5 w-1.5 rounded-full shrink-0', statusDot[status])}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}
