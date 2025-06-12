'use client';

import { useActionState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Issue, ISSUE_STATUS, ISSUE_PRIORITY } from '@/db/schema';
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
  createIssue,
  updateIssue,
  type ActionResponse,
} from '@/app/actions/issues';

interface IssueFormProps {
  issue?: Issue;
  userId: string;
  isEditing?: boolean;
}

const initialState: ActionResponse = {
  success: false,
  message: '',
  errors: undefined,
};

export default function IssueForm({
  issue,
  userId,
  isEditing = false,
}: IssueFormProps) {
  const router = useRouter();

  // Use useActionState hook for the form submission action
  const [state, formAction, isPending] = useActionState<
    ActionResponse,
    FormData
  >(async (prevState: ActionResponse, formData: FormData) => {
    // Extract data from form
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as
        | 'backlog'
        | 'todo'
        | 'in_progress'
        | 'done',
      priority: formData.get('priority') as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical',
      userId,
    };

    try {
      // Call the appropriate action based on whether we're editing or creating
      const result = isEditing
        ? await updateIssue(Number(issue!.id), data)
        : await createIssue(data);

      // Handle successful submission
      if (result.success) {
        toast.success(result.message);
        if (!isEditing) {
          router.push('/dashboard');
        } else {
          router.push(`/issues/${issue!.id}`);
        }
      }

      return result;
    } catch (err) {
      toast.error('Failed to update Issue');
      return {
        success: false,
        message: (err as Error).message || 'An error occurred',
        errors: undefined,
      };
    }
  }, initialState);

  const statusOptions = Object.values(ISSUE_STATUS).map(({ label, value }) => ({
    label,
    value,
  }));

  const priorityOptions = Object.values(ISSUE_PRIORITY).map(
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
          placeholder="Issue title"
          defaultValue={issue?.title || ''}
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
          placeholder="Describe the issue..."
          rows={4}
          defaultValue={issue?.description || ''}
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
            defaultValue={issue?.status || 'backlog'}
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
            defaultValue={issue?.priority || 'medium'}
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
          {isEditing ? 'Update Issue' : 'Create Issue'}
        </Button>
      </div>
    </Form>
  );
}
