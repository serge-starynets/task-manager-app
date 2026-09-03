import { Task } from '@/db/schema';
import { formatRelativeTime } from '@/lib/utils';
import { stripHtml } from '@/lib/rich-text';
import { Priority, Status, TicketType } from '@/lib/types';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/app/components/ui/Card';
import Badge from '@/app/components/ui/Badge';
import TicketTypeIcon from '@/app/components/tasks/TicketTypeIcon';
import {
  TASK_PRIORITY,
  TASK_SEVERITY,
  TASK_STATUS,
} from '@/lib/constants/tasks';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const { id, taskId, title, description, status, priority, createdAt, type } =
    task;
  const descriptionPreview = stripHtml(description);

  return (
    <Link href={`/tasks/${id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <p className="flex items-center gap-1.5 text-xs font-mono text-gray-500 dark:text-gray-400 mb-1">
            <TicketTypeIcon type={type as TicketType} size={12} />
            {taskId}
          </p>
          <CardTitle className="line-clamp-1 text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          {descriptionPreview && (
            <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 mb-3">
              {descriptionPreview}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge status={status as Status}>
              {TASK_STATUS[status as Status].label}
            </Badge>
            <Badge priority={priority as Priority}>
              {TASK_PRIORITY[priority as Priority].label}
            </Badge>
            {type === 'bug' && task.severity && (
              <Badge priority={task.severity as Priority}>
                {TASK_SEVERITY[task.severity].label}
              </Badge>
            )}
          </div>
        </CardContent>
        <CardFooter className="text-xs text-gray-400 dark:text-gray-500">
          {formatRelativeTime(new Date(createdAt))}
        </CardFooter>
      </Card>
    </Link>
  );
}
