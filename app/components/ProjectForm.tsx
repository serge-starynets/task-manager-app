'use client';

import { useActionState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Project, PROJECT_STATUS } from '@/db/schema';
import Button from './ui/Button';
import {
  Form,
  FormGroup,
  FormLabel,
  FormInput,
  FormSelect,
  FormDescription,
} from './ui/Form';
import RichTextEditor from './RichTextEditor';
import {
  createProject,
  updateProject,
  type ActionResponse,
} from '@/app/actions/projects';

interface ProjectFormProps {
  project?: Project;
  isEditing?: boolean;
}

const initialState: ActionResponse = {
  success: false,
  message: '',
  errors: undefined,
};

export default function ProjectForm({
  project,
  isEditing = false,
}: ProjectFormProps) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState<
    ActionResponse,
    FormData
  >(async (_prevState: ActionResponse, formData: FormData) => {
    try {
      const result = isEditing
        ? await updateProject(Number(project!.id), {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            status: formData.get('status') as
              | 'not_started'
              | 'ongoing'
              | 'completed',
          })
        : await createProject({
            title: formData.get('title') as string,
            abbreviation: formData.get('abbreviation') as string,
            description: formData.get('description') as string,
            status: formData.get('status') as
              | 'not_started'
              | 'ongoing'
              | 'completed',
          });

      if (result.success) {
        toast.success(result.message);
        const projectId = result.projectId ?? project?.id;
        router.push(
          projectId ? `/dashboard?project=${projectId}` : '/dashboard',
        );
      } else if (!result.success) {
        toast.error(result.message);
      }

      return result;
    } catch (err) {
      toast.error(
        isEditing ? 'Failed to update project' : 'Failed to create project',
      );
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
          defaultValue={project?.title || ''}
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
        <FormLabel htmlFor="abbreviation">Abbreviation</FormLabel>
        <FormInput
          id="abbreviation"
          name={isEditing ? undefined : 'abbreviation'}
          placeholder="e.g. WEB"
          defaultValue={project?.abbreviation || ''}
          required={!isEditing}
          minLength={1}
          maxLength={8}
          pattern="[A-Za-z]{1,8}"
          title="1–8 latin letters only"
          disabled={isPending || isEditing}
          readOnly={isEditing}
          autoCapitalize="characters"
          spellCheck={false}
          aria-describedby="abbreviation-help abbreviation-error"
          className={
            state?.errors?.abbreviation
              ? 'border-red-500 uppercase'
              : 'uppercase'
          }
        />
        <FormDescription id="abbreviation-help">
          {isEditing
            ? 'Abbreviation cannot be changed after the project is created.'
            : '1–8 latin letters. Must be unique among your projects.'}
        </FormDescription>
        {state?.errors?.abbreviation && (
          <p id="abbreviation-error" className="text-sm text-red-500">
            {state.errors.abbreviation[0]}
          </p>
        )}
      </FormGroup>

      <FormGroup>
        <FormLabel htmlFor="description">Description</FormLabel>
        <RichTextEditor
          id="description"
          name="description"
          placeholder="Describe the project..."
          defaultValue={project?.description || ''}
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
          defaultValue={project?.status || 'not_started'}
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
          {isEditing ? 'Update Project' : 'Create Project'}
        </Button>
      </div>
    </Form>
  );
}
