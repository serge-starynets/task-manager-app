import type { ReactNode } from 'react';
import {
  getAccessibleTask,
  getCurrentUser,
  getRelatedTasks,
  getTaskAttachments,
  getTaskComments,
  getTaskHistory,
  isAdmin,
} from '@/lib/dal';
import { formatRelativeTime } from '@/lib/utils';
import { isEmptyHtml } from '@/lib/rich-text';
import { Priority, Status } from '@/lib/types';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Badge from '@/app/components/ui/Badge';
import Button from '@/app/components/ui/Button';
import RichText from '@/app/components/tasks/RichText';
import TaskAttachmentsList from '@/app/components/tasks/TaskAttachmentsList';
import TaskActivityPanel from '@/app/components/tasks/TaskActivityPanel';
import TicketTypeIcon from '@/app/components/tasks/TicketTypeIcon';
import { ArrowLeftIcon, Edit2Icon, Link2Icon, UserIcon } from 'lucide-react';
import DeleteTaskButton from '@/app/components/tasks/DeleteTaskButton';
import {
  RELATION_KIND,
  TASK_PRIORITY,
  TASK_SEVERITY,
  TASK_STATUS,
  TICKET_TYPE,
  formatEstimationHours,
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
            className="flex items-start gap-2 rounded-xl px-2 py-1.5 text-sm text-gray-800 transition-colors hover:bg-violet-50 dark:text-gray-200 dark:hover:bg-white/[0.05]"
          >
            <TicketTypeIcon type={related.type} className="mt-0.5" />
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

function DetailField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1.5 min-w-0 text-sm font-medium text-gray-900 dark:text-gray-100">
        {children}
      </dd>
    </div>
  );
}

export default async function TaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const taskIdNum = parseInt(id);
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect('/signin');
  }

  const task = await getAccessibleTask(taskIdNum);

  if (!task) {
    notFound();
  }

  const [relatedTickets, attachments, comments, history] = await Promise.all([
    getRelatedTasks(taskIdNum),
    getTaskAttachments(taskIdNum),
    getTaskComments(taskIdNum),
    getTaskHistory(taskIdNum),
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
    estimation,
  } = task;
  const ticketType = resolveTicketType(type);
  const estimationLabel = formatEstimationHours(estimation);
  const relatedTasks = relatedTickets.filter((item) => item.type === 'task');
  const relatedBugs = relatedTickets.filter((item) => item.type === 'bug');

  const backHref = task.projectId
    ? `/dashboard?project=${task.projectId}`
    : '/dashboard';

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8">
        <Link href={backHref} className="back-link mb-4">
          <ArrowLeftIcon size={16} className="mr-1" />
          To Backlog
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
            <h1 className="text-3xl font-semibold tracking-tight break-words">
              {title}
            </h1>
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

      <div className="surface-panel mb-8 overflow-hidden p-6">
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Description
        </h2>
        {!isEmptyHtml(description) ? (
          <RichText html={description} />
        ) : (
          <p className="text-gray-500 italic">No description provided.</p>
        )}
      </div>

      <div className="surface-panel mb-8 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-black/[0.1] px-6 py-4 dark:border-white/[0.12]">
          <UserIcon size={18} className="text-gray-400" />
          <h2 className="text-lg font-semibold tracking-tight">Details</h2>
        </div>
        <dl className="grid grid-cols-1 gap-x-8 gap-y-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label="Assigned to" className="min-w-0 sm:col-span-2 lg:col-span-2">
            <span className="break-all">{user?.email}</span>
          </DetailField>
          <DetailField label="Type">
            <span className="inline-flex items-center gap-1.5">
              <TicketTypeIcon type={ticketType} />
              {TICKET_TYPE[ticketType].label}
            </span>
          </DetailField>
          <DetailField label="Status">
            <Badge status={status as Status}>
              {TASK_STATUS[status as Status].label}
            </Badge>
          </DetailField>
          <DetailField label="Priority">
            <Badge priority={priority as Priority}>
              {TASK_PRIORITY[priority as Priority].label}
            </Badge>
          </DetailField>
          <DetailField label="Estimation">
            <span className="tabular-nums">{estimationLabel ?? '—'}</span>
          </DetailField>
          {ticketType === 'bug' && severity && (
            <DetailField label="Severity">
              <Badge priority={severity as Priority}>
                {TASK_SEVERITY[severity].label}
              </Badge>
            </DetailField>
          )}
          <DetailField label="Created">
            <span className="font-normal text-gray-500 dark:text-gray-400">
              {formatRelativeTime(new Date(createdAt))}
            </span>
          </DetailField>
          <DetailField label="Updated">
            <span className="font-normal text-gray-500 dark:text-gray-400">
              {formatRelativeTime(new Date(updatedAt))}
            </span>
          </DetailField>
        </dl>
      </div>

      <div className="surface-panel mb-8 overflow-hidden p-6">
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

      <div className="mt-8">
        <TaskActivityPanel
          taskId={taskIdNum}
          userId={currentUser.id}
          currentUserId={currentUser.id}
          isAdmin={isAdmin(currentUser)}
          comments={comments}
          history={history}
        />
      </div>
    </div>
  );
}
