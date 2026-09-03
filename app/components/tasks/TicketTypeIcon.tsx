import { BugIcon, ListTodoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveTicketType } from '@/lib/constants/tasks';
import type { TicketType } from '@/lib/types';

export default function TicketTypeIcon({
  type,
  size = 14,
  className,
}: {
  type?: TicketType | string | null;
  size?: number;
  className?: string;
}) {
  const ticketType = resolveTicketType(type);
  const Icon = ticketType === 'bug' ? BugIcon : ListTodoIcon;
  return (
    <Icon
      size={size}
      className={cn(
        'shrink-0',
        className,
        ticketType === 'bug'
          ? 'text-red-500 dark:text-red-400'
          : 'text-blue-500 dark:text-blue-400',
      )}
      aria-hidden
    />
  );
}
