'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Badge from '@/app/components/ui/Badge';
import TicketTypeIcon from '@/app/components/tasks/TicketTypeIcon';
import {
  TASK_PRIORITY,
  formatEstimationHours,
} from '@/lib/constants/tasks';
import type { Priority, TaskWithUser } from '@/lib/types';
import { cn } from '@/lib/utils';

function BoardCardContent({
  task,
  className,
}: {
  task: TaskWithUser;
  className?: string;
}) {
  const estimationLabel = formatEstimationHours(task.estimation);

  return (
    <div
      className={cn(
        'rounded-xl border border-black/[0.1] bg-white p-3 shadow-soft dark:border-white/[0.12] dark:bg-dark-high dark:shadow-none',
        className,
      )}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 font-mono text-xs text-gray-500 dark:text-gray-400">
          <TicketTypeIcon type={task.type} size={12} />
          <span className="truncate">{task.taskId}</span>
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {estimationLabel && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold tabular-nums tracking-wide text-gray-600 dark:bg-white/[0.08] dark:text-gray-300">
              {estimationLabel}
            </span>
          )}
          <Badge priority={task.priority as Priority}>
            {TASK_PRIORITY[task.priority as Priority].label}
          </Badge>
        </div>
      </div>
      <Link
        href={`/tasks/${task.id}`}
        target="_blank"
        rel="noopener noreferrer"
        prefetch={false}
        draggable={false}
        className="line-clamp-2 block select-none text-sm font-medium text-gray-900 hover:text-violet-700 dark:text-gray-100 dark:hover:text-violet-300"
        onPointerDown={(event) => event.stopPropagation()}
        onDragStart={(event) => event.preventDefault()}
      >
        {task.title}
      </Link>
    </div>
  );
}

export function BoardCardOverlay({ task }: { task: TaskWithUser }) {
  return (
    <BoardCardContent
      task={task}
      className="cursor-grabbing shadow-lift ring-2 ring-violet-400/40"
    />
  );
}

export default function BoardCard({ task }: { task: TaskWithUser }) {
  // dnd-kit aria ids/attrs differ until the client tree is mounted — gate them
  // so SSR HTML matches the first client render.
  const [dndReady, setDndReady] = useState(false);
  useEffect(() => {
    setDndReady(true);
  }, []);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(task.id),
    data: { type: 'task', status: task.status },
    disabled: !dndReady,
  });

  // Omit role="button" so the title <a> is not nested in a button (invalid HTML).
  const { role: _role, ...dndAttributes } = attributes;

  return (
    <div
      ref={dndReady ? setNodeRef : undefined}
      style={
        dndReady
          ? {
              transform: CSS.Transform.toString(transform),
              transition,
            }
          : undefined
      }
      className={cn(
        'cursor-grab touch-none active:cursor-grabbing',
        isDragging && 'z-10 opacity-30',
      )}
      {...(dndReady ? listeners : {})}
      {...(dndReady ? dndAttributes : {})}
    >
      <BoardCardContent
        task={task}
        className={
          isDragging
            ? 'border-dashed border-violet-300 bg-violet-50/50 shadow-none dark:border-violet-700 dark:bg-violet-950/30'
            : undefined
        }
      />
    </div>
  );
}
