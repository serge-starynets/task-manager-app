import { BugIcon, ListTodoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TicketType } from '@/lib/types';

export default function TicketTypeIcon({
  type,
  size = 14,
  className,
}: {
  type: TicketType;
  size?: number;
  className?: string;
}) {
  const Icon = type === 'bug' ? BugIcon : ListTodoIcon;
  return (
    <Icon
      size={size}
      className={cn(
        'shrink-0',
        className,
        type === 'bug'
          ? 'text-red-500 dark:text-red-400'
          : 'text-blue-500 dark:text-blue-400',
      )}
      aria-hidden
    />
  );
}
