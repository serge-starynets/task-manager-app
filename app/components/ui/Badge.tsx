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
    'bg-gray-100 text-gray-500 dark:bg-gray-800/60 dark:text-gray-400',
  todo: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  in_progress:
    'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  closed:
    'bg-gray-700 text-gray-100 dark:bg-gray-900 dark:text-gray-300',
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
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    secondary: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    outline:
      'border border-gray-200 text-gray-800 dark:border-dark-border-medium dark:text-gray-300',
    success:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  const colorClass = status
    ? statusStyles[status]
    : variantStyles[getPriorityVariant()];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full',
        colorClass,
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
