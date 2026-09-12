import {
  getAccessibleTask,
  getRelatedTasks,
  getTaskAttachments,
} from '@/lib/dal';
import TaskForm from '@/app/components/tasks/TaskForm';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const taskId = parseInt(id);

  const task = await getAccessibleTask(taskId);

  if (!task) {
    notFound();
  }

  const [relatedTasks, attachments] = await Promise.all([
    getRelatedTasks(taskId),
    getTaskAttachments(taskId),
  ]);

  return (
    <div className="mx-auto flex min-h-0 w-[91%] flex-1 flex-col overflow-hidden">
      <Link
        href={`/tasks/${id}`}
        className="mb-6 inline-flex shrink-0 items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeftIcon size={16} className="mr-1" />
        Back to {task.type === 'bug' ? 'Bug' : 'Task'}
      </Link>

      <h1 className="mb-6 shrink-0 text-2xl font-bold">
        Edit {task.type === 'bug' ? 'Bug' : 'Task'}
      </h1>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-soft dark:border-dark-border-default dark:bg-dark-high dark:shadow-none">
        <TaskForm
          userId={task.userId}
          task={task}
          isEditing
          relatedTasks={relatedTasks}
          initialAttachments={attachments}
        />
      </div>
    </div>
  );
}
