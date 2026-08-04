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
    'bg-gray-100 text-gray-600 dark:bg-dark-elevated dark:text-gray-400 ring-1 ring-inset ring-gray-200/80 dark:ring-dark-border-subtle',
  todo: 'bg-zinc-200/80 text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-200 ring-1 ring-inset ring-zinc-300/60 dark:ring-zinc-600/40',
  in_progress:
    'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 ring-1 ring-inset ring-blue-200/70 dark:ring-blue-800/50',
  qa: 'bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 ring-1 ring-inset ring-amber-200/70 dark:ring-amber-800/50',
  done: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200/70 dark:ring-emerald-800/50',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 ring-1 ring-inset ring-red-200/70 dark:ring-red-800/50',
  closed:
    'bg-gray-700 text-gray-100 dark:bg-gray-900/80 dark:text-gray-300 ring-1 ring-inset ring-gray-600/40',
};

const statusDot: Record<StatusType, string> = {
  backlog: 'bg-gray-400',
  todo: 'bg-zinc-500',
  in_progress: 'bg-blue-500',
  qa: 'bg-amber-500',
  done: 'bg-emerald-500',
  rejected: 'bg-red-500',
  closed: 'bg-gray-400',
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
      'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 ring-1 ring-inset ring-purple-200/70 dark:ring-purple-800/50',
    secondary:
      'bg-gray-100 text-gray-700 dark:bg-dark-elevated dark:text-gray-300 ring-1 ring-inset ring-gray-200/80 dark:ring-dark-border-subtle',
    outline:
      'border border-gray-200 text-gray-700 dark:border-dark-border-medium dark:text-gray-300',
    success:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200/70 dark:ring-emerald-800/50',
    warning:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 ring-1 ring-inset ring-amber-200/70 dark:ring-amber-800/50',
    danger: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300 ring-1 ring-inset ring-red-200/70 dark:ring-red-800/50',
  };

  const colorClass = status
    ? statusStyles[status]
    : variantStyles[getPriorityVariant()];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full tracking-wide',
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
