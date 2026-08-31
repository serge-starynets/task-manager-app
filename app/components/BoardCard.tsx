'use client';

import Link from 'next/link';
import { useDraggable } from '@dnd-kit/core';
import Badge from './ui/Badge';
import { TASK_PRIORITY } from '@/lib/constants/tasks';
import type { Priority, TaskWithUser } from '@/lib/types';
import { cn } from '@/lib/utils';

function BoardCardContent({
  task,
  className,
}: {
  task: TaskWithUser;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200/80 bg-white p-3 shadow-soft dark:border-dark-border-default dark:bg-dark-high dark:shadow-none',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
          {task.taskId}
        </span>
        <Badge priority={task.priority as Priority} className="shrink-0">
          {TASK_PRIORITY[task.priority as Priority].label}
        </Badge>
      </div>
      <Link
        href={`/tasks/${task.id}`}
        className="block text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-purple-700 dark:hover:text-purple-300 line-clamp-2"
        onPointerDown={(e) => e.stopPropagation()}
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
      className="shadow-lg ring-2 ring-purple-400/40 cursor-grabbing"
    />
  );
}

export default function BoardCard({ task }: { task: TaskWithUser }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(task.id),
    data: { status: task.status, task },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'touch-none cursor-grab active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
      {...listeners}
      {...attributes}
    >
      <BoardCardContent task={task} />
    </div>
  );
}
