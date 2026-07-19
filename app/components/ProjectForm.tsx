'use client';

import { useActionState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { PROJECT_STATUS } from '@/db/schema';
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
  createProject,
  type ActionResponse,
} from '@/app/actions/projects';

const initialState: ActionResponse = {
  success: false,
  message: '',
  errors: undefined,
};

export default function ProjectForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<
    ActionResponse,
    FormData
  >(async (_prevState: ActionResponse, formData: FormData) => {
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as
        | 'not_started'
        | 'ongoing'
        | 'completed',
    };

    try {
      const result = await createProject(data);

      if (result.success && result.projectId) {
        toast.success(result.message);
        router.push(`/dashboard?project=${result.projectId}`);
      } else if (!result.success) {
        toast.error(result.message);
      }

      return result;
    } catch (err) {
      toast.error('Failed to create project');
      return {
        success: false,
        message: (err as Error).message || 'An error occurred',
        errors: undefined,
      };
    }
  }, initialState);

  const statusOptions = Object.values(PROJECT_STATUS).map(
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
          placeholder="Project title"
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
          placeholder="Describe the project..."
          rows={4}
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

      <FormGroup>
        <FormLabel htmlFor="status">Status</FormLabel>
        <FormSelect
          id="status"
          name="status"
          defaultValue="not_started"
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
          Create Project
        </Button>
      </div>
    </Form>
  );
}
