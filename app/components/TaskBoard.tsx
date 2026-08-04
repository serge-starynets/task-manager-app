'use client';

import { useMemo, useState, useOptimistic, useTransition } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import toast from 'react-hot-toast';
import { updateTaskStatus } from '@/app/actions/tasks';
import { BOARD_STATUSES } from '@/db/schema';
import type { Status, TaskWithUser } from '@/lib/types';
import BoardColumn from './BoardColumn';
import { BoardCardOverlay } from './BoardCard';

const STATUS_ORDER = BOARD_STATUSES as readonly Status[];

interface TaskBoardProps {
  tasks: TaskWithUser[];
}

type OptimisticAction = {
  taskId: number;
  status: Status;
};

export default function TaskBoard({ tasks: initialTasks }: TaskBoardProps) {
  const [activeTask, setActiveTask] = useState<TaskWithUser | null>(null);
  const [, startTransition] = useTransition();

  const [optimisticTasks, applyOptimistic] = useOptimistic(
    initialTasks,
    (current: TaskWithUser[], action: OptimisticAction) =>
      current.map((task) =>
        task.id === action.taskId ? { ...task, status: action.status } : task,
      ),
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const tasksByStatus = useMemo(() => {
    const grouped = Object.fromEntries(
      STATUS_ORDER.map((status) => [status, [] as TaskWithUser[]]),
    ) as Record<Status, TaskWithUser[]>;

    for (const task of optimisticTasks) {
      const status = task.status as Status;
      if (grouped[status]) {
        grouped[status].push(task);
      }
    }
    return grouped;
  }, [optimisticTasks]);

  function resolveDropStatus(overId: string | number): Status | null {
    const id = String(overId);
    if (STATUS_ORDER.includes(id as Status)) {
      return id as Status;
    }
    const overTask = optimisticTasks.find((t) => String(t.id) === id);
    return overTask ? (overTask.status as Status) : null;
  }

  function handleDragStart(event: DragStartEvent) {
    const task = optimisticTasks.find((t) => String(t.id) === String(event.active.id));
    setActiveTask(task ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = Number(active.id);
    const task = optimisticTasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus = resolveDropStatus(over.id);
    if (!newStatus || newStatus === task.status) return;

    startTransition(async () => {
      applyOptimistic({ taskId, status: newStatus });
      const result = await updateTaskStatus(taskId, newStatus);
      if (!result.success) {
        toast.error(result.message || 'Failed to update task status');
      }
    });
  }

  function handleDragCancel() {
    setActiveTask(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex w-full gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {STATUS_ORDER.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={tasksByStatus[status]}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask ? <BoardCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
