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
    <div className="w-[70%] mx-auto p-4 md:p-8 h-dvh flex flex-col overflow-hidden">
      <Link
        href={`/tasks/${id}`}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-6 shrink-0"
      >
        <ArrowLeftIcon size={16} className="mr-1" />
        Back to Task
      </Link>

      <h1 className="text-2xl font-bold mb-6 shrink-0">Edit Task</h1>

      <div className="bg-white dark:bg-dark-high border border-gray-200/80 dark:border-dark-border-default rounded-xl shadow-soft dark:shadow-none p-6 md:p-8 flex-1 min-h-0 overflow-y-auto">
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
