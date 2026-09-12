'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { Status, TaskWithUser } from '@/lib/types';
import { TASK_STATUS } from '@/lib/constants/tasks';
import { cn } from '@/lib/utils';
import BoardCard from '@/app/components/tasks/BoardCard';

interface BoardColumnProps {
  status: Status;
  tasks: TaskWithUser[];
  isOver: boolean;
}

const statusAccent: Record<Status, string> = {
  backlog: 'bg-gray-400',
  todo: 'bg-zinc-500',
  in_progress: 'bg-blue-500',
  qa: 'bg-amber-500',
  done: 'bg-emerald-500',
  rejected: 'bg-red-500',
  closed: 'bg-gray-500',
};

export default function BoardColumn({ status, tasks, isOver }: BoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
    data: { type: 'column', status },
  });

  const itemIds = tasks.map((task) => String(task.id));

  return (
    <div
      className={cn(
        'flex min-w-[11rem] flex-1 basis-0 flex-col self-stretch overflow-hidden rounded-2xl border border-black/[0.06] bg-gray-50/70 dark:border-white/[0.08] dark:bg-dark-elevated/50',
        isOver &&
          'border-violet-300 ring-2 ring-violet-400/40 dark:border-violet-700',
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-black/[0.05] px-3 py-2.5 dark:border-white/[0.06]">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
          <span
            className={cn('h-1.5 w-1.5 rounded-full', statusAccent[status])}
            aria-hidden
          />
          {TASK_STATUS[status].label}
        </h3>
        <span className="rounded-md bg-white/80 px-1.5 py-0.5 text-xs font-medium tabular-nums text-gray-500 dark:bg-dark-high dark:text-gray-400">
          {tasks.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className="flex min-h-[120px] max-h-[calc(100vh-16rem)] flex-1 flex-col gap-2 overflow-y-auto p-2 scrollbar-thin"
      >
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <BoardCard key={task.id} task={task} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
            Drop a ticket here
          </p>
        )}
      </div>
    </div>
  );
}
