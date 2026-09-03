/** @deprecated Import from '@/lib/services' instead. */
export {
  createTaskForUser,
  updateTaskForUser,
  updateTaskStatusForUser,
  moveTaskOnBoardForUser,
  deleteTaskForUser,
  deleteBlobsForTask,
  type CreateTaskServiceInput,
} from '@/lib/services/task-service';

export type { ServiceFailure } from '@/lib/services/types';
