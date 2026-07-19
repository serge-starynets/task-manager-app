'use client';

import { useActionState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Task, TASK_STATUS, TASK_PRIORITY } from '@/db/schema';
import Button from './ui/Button';
import {
  Form,
  FormGroup,
  FormLabel,
  FormInput,
  FormTextarea,
  FormSelect,
} from './ui/Form';
import {
  createTask,
  updateTask,
  type ActionResponse,
} from '@/app/actions/tasks';

interface TaskFormProps {
  task?: Task;
  userId: string;
  projectId?: number;
  isEditing?: boolean;
}

const initialState: ActionResponse = {
  success: false,
  message: '',
  errors: undefined,
};

export default function TaskForm({
  task,
  userId,
  projectId,
  isEditing = false,
}: TaskFormProps) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<
    ActionResponse,
    FormData
  >(async (_prevState: ActionResponse, formData: FormData) => {
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as
        | 'backlog'
        | 'todo'
        | 'in_progress'
        | 'done'
        | 'rejected'
        | 'closed',
      priority: formData.get('priority') as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical',
      userId,
      projectId: projectId ?? null,
    };

    try {
      const result = isEditing
        ? await updateTask(Number(task!.id), data)
        : await createTask(data);

      if (result.success) {
        toast.success(result.message);
        if (!isEditing) {
          const redirectProjectId = result.projectId ?? projectId;
          router.push(
            redirectProjectId
              ? `/dashboard?project=${redirectProjectId}`
              : '/dashboard',
          );
        } else {
          router.push(`/tasks/${task!.id}`);
        }
      }

      return result;
    } catch (err) {
      toast.error('Failed to update Task');
      return {
        success: false,
        message: (err as Error).message || 'An error occurred',
        errors: undefined,
      };
    }
  }, initialState);

  const statusOptions = Object.values(TASK_STATUS).map(({ label, value }) => ({
    label,
    value,
  }));

  const priorityOptions = Object.values(TASK_PRIORITY).map(
    ({ label, value }) => ({
      label,
      value,
    }),
  );

  return (
    <Form action={formAction}>
      <FormGroup>
        <FormLabel htmlFor="title">Title</FormLabel>
        <FormInput
          id="title"
          name="title"
          placeholder="Task title"
          defaultValue={task?.title || ''}
          required
          minLength={3}
          maxLength={100}
          disabled={isPending}
          aria-describedby="title-error"
          className={state?.errors?.title ? 'border-red-500' : ''}
        />
        {state?.errors?.title && (
          <p id="title-error" className="text-sm text-red-500">
            {state.errors.title[0]}
          </p>
        )}
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="description">Description</FormLabel>
        <FormTextarea
          id="description"
          name="description"
          placeholder="Describe the task..."
          rows={4}
          defaultValue={task?.description || ''}
          disabled={isPending}
          aria-describedby="description-error"
          className={state?.errors?.description ? 'border-red-500' : ''}
        />
        {state?.errors?.description && (
          <p id="description-error" className="text-sm text-red-500">
            {state.errors.description[0]}
          </p>
        )}
      </FormGroup>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormGroup>
          <FormLabel htmlFor="status">Status</FormLabel>
          <FormSelect
            id="status"
            name="status"
            defaultValue={task?.status || 'backlog'}
            options={statusOptions}
            disabled={isPending}
            required
            aria-describedby="status-error"
            className={state?.errors?.status ? 'border-red-500' : ''}
          />
          {state?.errors?.status && (
            <p id="status-error" className="text-sm text-red-500">
              {state.errors.status[0]}
            </p>
          )}
        </FormGroup>

        <FormGroup>
          <FormLabel htmlFor="priority">Priority</FormLabel>
          <FormSelect
            id="priority"
            name="priority"
            defaultValue={task?.priority || 'medium'}
            options={priorityOptions}
            disabled={isPending}
            required
            aria-describedby="priority-error"
            className={state?.errors?.priority ? 'border-red-500' : ''}
          />
          {state?.errors?.priority && (
            <p id="priority-error" className="text-sm text-red-500">
              {state.errors.priority[0]}
            </p>
          )}
        </FormGroup>
      </div>

      {state?.errors?.projectId && (
        <p className="text-sm text-red-500 mt-2">{state.errors.projectId[0]}</p>
      )}

      <div className="flex justify-end gap-2 mt-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" isLoading={isPending}>
          {isEditing ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </Form>
  );
}
