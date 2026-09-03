import type {
  RelationKind,
  TaskPriority,
  TaskSeverity,
  TaskStatus,
  TicketType,
} from '@/lib/validations/task';
import type { UserDto } from '@/lib/dto/user';

export type TaskDto = {
  id: number;
  taskId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  type: TicketType;
  severity: TaskSeverity | null;
  projectId: number | null;
  userId: string;
  user?: UserDto;
  createdAt: string;
  updatedAt: string;
};

export type RelatedTaskDto = {
  id: number;
  taskId: string;
  title: string;
  type: TicketType;
  kind: RelationKind;
};
