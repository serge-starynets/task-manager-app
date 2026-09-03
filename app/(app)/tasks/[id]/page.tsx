import {
  getAccessibleTask,
  getRelatedTasks,
  getTaskAttachments,
} from '@/lib/dal';
import { formatRelativeTime } from '@/lib/utils';
import { isEmptyHtml } from '@/lib/rich-text';
import { Priority, Status } from '@/lib/types';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import RichText from '@/app/components/tasks/RichText';
import TaskAttachmentsList from '@/app/components/tasks/TaskAttachmentsList';
import TicketTypeIcon from '@/app/components/tasks/TicketTypeIcon';
import { ArrowLeftIcon, Edit2Icon, Link2Icon, UserIcon } from 'lucide-react';
import DeleteTaskButton from '@/app/components/tasks/DeleteTaskButton';
import {
  RELATION_KIND,
  TASK_PRIORITY,
  TASK_SEVERITY,
  TASK_STATUS,
  TICKET_TYPE,
  resolveTicketType,
} from '@/lib/constants/tasks';
import type { RelatedTaskSummary } from '@/db/schema';

function RelatedTicketList({
  items,
  emptyMessage,
}: {
  items: RelatedTaskSummary[];
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return <p className="text-gray-500 italic">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((related) => (
        <li key={`${related.kind}-${related.id}`}>
          <Link
            href={`/tasks/${related.id}`}
            className="flex items-start gap-2 text-sm text-gray-800 hover:underline dark:text-gray-200"
          >
            <TicketTypeIcon
              type={related.type}
              className="mt-0.5"
            />
            <span>
              <span className="text-gray-500 dark:text-gray-400">
                {RELATION_KIND[related.kind].label}
              </span>
              <span className="mx-2 font-mono text-gray-500 dark:text-gray-400">
                {related.taskId}
              </span>
              <span className="mx-1 text-gray-300 dark:text-gray-600">·</span>
              <span className="break-words">{related.title}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const taskIdNum = parseInt(id);
  const task = await getAccessibleTask(taskIdNum);

  if (!task) {
    notFound();
  }

  const [relatedTickets, attachments] = await Promise.all([
    getRelatedTasks(taskIdNum),
    getTaskAttachments(taskIdNum),
  ]);

  const {
    title,
    description,
    status,
    priority,
    createdAt,
    updatedAt,
    user,
    taskId,
    type,
    severity,
  } = task;
  const ticketType = resolveTicketType(type);
  const relatedTasks = relatedTickets.filter((item) => item.type === 'task');
  const relatedBugs = relatedTickets.filter((item) => item.type === 'bug');

  const backHref = task.projectId
    ? `/dashboard?project=${task.projectId}`
    : '/dashboard';

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <Link
          href={backHref}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeftIcon size={16} className="mr-1" />
          Back to Tasks
        </Link>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 flex items-center gap-2 text-sm font-mono text-gray-500 dark:text-gray-400">
              <TicketTypeIcon type={ticketType} />
              <span>{taskId}</span>
              <span className="font-sans text-gray-400">
                {TICKET_TYPE[ticketType].label}
              </span>
            </p>
            <h1 className="text-3xl font-bold break-words">{title}</h1>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <Link href={`/tasks/${id}/edit`}>
              <Button variant="outline" size="sm">
                <span className="flex items-center">
                  <Edit2Icon size={16} className="mr-1" />
                  Edit
                </span>
              </Button>
            </Link>
            <DeleteTaskButton id={taskIdNum} projectId={task.projectId} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-high border border-gray-200/80 dark:border-dark-border-default rounded-xl shadow-soft dark:shadow-none p-6 mb-8 overflow-hidden">
        <div className="flex flex-wrap gap-3 mb-6">
          <Badge status={status as Status}>
            {TASK_STATUS[status as Status].label}
          </Badge>
          <Badge priority={priority as Priority}>
            {TASK_PRIORITY[priority as Priority].label}
          </Badge>
          {ticketType === 'bug' && severity && (
            <Badge priority={severity as Priority}>
              {TASK_SEVERITY[severity].label}
            </Badge>
          )}
        </div>

        {!isEmptyHtml(description) ? (
          <RichText html={description} />
        ) : (
          <p className="text-gray-500 italic">No description provided.</p>
        )}
      </div>

      <div className="bg-white dark:bg-dark-high border border-gray-200/80 dark:border-dark-border-default rounded-xl shadow-soft dark:shadow-none p-6 mb-8 overflow-hidden">
        <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
          <UserIcon size={18} className="text-gray-400" />
          Details
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-500 mb-1">
              Assigned to
            </p>
            <p className="break-words">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Type</p>
            <p className="flex items-center gap-1.5">
              <TicketTypeIcon type={ticketType} />
              {TICKET_TYPE[ticketType].label}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
            <Badge status={status as Status}>
              {TASK_STATUS[status as Status].label}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Priority</p>
            <Badge priority={priority as Priority}>
              {TASK_PRIORITY[priority as Priority].label}
            </Badge>
          </div>
          {ticketType === 'bug' && severity && (
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Severity
              </p>
              <Badge priority={severity as Priority}>
                {TASK_SEVERITY[severity].label}
              </Badge>
            </div>
          )}
          <div className="flex gap-8">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Created</p>
              <p className="text-xs text-gray-400">
                {formatRelativeTime(new Date(createdAt))}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Updated</p>
              <p className="text-xs text-gray-400">
                {formatRelativeTime(new Date(updatedAt))}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-dark-high border border-gray-200/80 dark:border-dark-border-default rounded-xl shadow-soft dark:shadow-none p-6 mb-8 overflow-hidden">
        <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
          <Link2Icon size={18} className="text-gray-400" />
          Related tickets
        </h2>
        {ticketType === 'task' ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Related tasks
              </h3>
              <RelatedTicketList
                items={relatedTasks}
                emptyMessage="No related tasks."
              />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">
                Related bugs
              </h3>
              <RelatedTicketList
                items={relatedBugs}
                emptyMessage="No related bugs."
              />
            </div>
          </div>
        ) : (
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">
              Related tasks
            </h3>
            <RelatedTicketList
              items={relatedTasks}
              emptyMessage="No related tasks."
            />
          </div>
        )}
      </div>

      <TaskAttachmentsList attachments={attachments} />
    </div>
  );
}
