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
        className="back-link mb-6 shrink-0"
      >
        <ArrowLeftIcon size={16} className="mr-1" />
        Back to {task.type === 'bug' ? 'Bug' : 'Task'}
      </Link>

      <h1 className="page-title mb-6 shrink-0">
        Edit {task.type === 'bug' ? 'Bug' : 'Task'}
      </h1>

      <div className="surface-panel flex min-h-0 flex-1 flex-col overflow-hidden">
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
