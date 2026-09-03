'use client';

import { useActionState, useCallback, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { nanoid } from 'nanoid';
import {
  Task,
  type RelatedTaskSummary,
  type TaskAttachment,
} from '@/db/schema';
import { TASK_STATUS, TASK_PRIORITY, TASK_SEVERITY } from '@/lib/constants/tasks';
import type { TicketType } from '@/lib/types';
import Button from '@/app/components/ui/Button';
import {
  Form,
  FormGroup,
  FormLabel,
  FormInput,
  FormSelect,
} from '@/app/components/ui/Form';
import RichTextEditor from '@/app/components/tasks/RichTextEditor';
import RelatedTasksPicker from '@/app/components/tasks/RelatedTasksPicker';
import TaskAttachmentsField, {
  registerUploadedAttachment,
} from '@/app/components/tasks/TaskAttachmentsField';
import {
  createTask,
  updateTask,
  type ActionResponse,
} from '@/app/actions/tasks';
import {
  deleteDraftBlob,
  deleteTaskAttachment,
} from '@/app/actions/attachments';
import {
  attachmentFileUrl,
  findRemovedImageAttachmentUrls,
  stripAttachmentUrlsFromHtml,
  sumAttachmentBytes,
  validateTaskAttachmentBudget,
  type PendingAttachment,
} from '@/lib/attachments';

interface TaskFormProps {
  task?: Task;
  userId: string;
  projectId?: number;
  isEditing?: boolean;
  ticketType?: TicketType;
  relatedTasks?: RelatedTaskSummary[];
  initialAttachments?: TaskAttachment[];
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
  ticketType,
  relatedTasks = [],
  initialAttachments = [],
}: TaskFormProps) {
  const router = useRouter();
  const type: TicketType = task?.type ?? ticketType ?? 'task';
  const noun = type === 'bug' ? 'Bug' : 'Task';
  const nounLower = type === 'bug' ? 'bug' : 'task';
  const relatedTaskLinks = relatedTasks.filter((item) => item.type === 'task');
  const relatedBugLinks = relatedTasks.filter((item) => item.type === 'bug');
  const uploadSessionId = useMemo(
    () => (isEditing ? undefined : nanoid()),
    [isEditing],
  );

  const [description, setDescription] = useState(task?.description ?? '');
  const [relatedTaskDraft, setRelatedTaskDraft] = useState<RelatedTaskSummary[]>(
    [],
  );
  const [relatedBugDraft, setRelatedBugDraft] = useState<RelatedTaskSummary[]>(
    [],
  );
  const [pending, setPending] = useState<PendingAttachment[]>([]);
  const [savedAttachments, setSavedAttachments] =
    useState<TaskAttachment[]>(initialAttachments);
  const descriptionRef = useRef(description);
  const savedAttachmentsRef = useRef(savedAttachments);
  const pendingRef = useRef(pending);

  descriptionRef.current = description;
  savedAttachmentsRef.current = savedAttachments;
  pendingRef.current = pending;

  const uploadContext = useMemo(
    () => ({
      userId,
      taskId: isEditing ? task?.id : undefined,
      uploadSessionId,
    }),
    [userId, isEditing, task?.id, uploadSessionId],
  );

  const handleRemoveUrls = useCallback((urls: string[]) => {
    setDescription((prev) => stripAttachmentUrlsFromHtml(prev, urls));
  }, []);

  const removeAttachmentsForImageUrls = useCallback(
    async (urls: string[]) => {
      for (const url of urls) {
        const savedMatch = savedAttachmentsRef.current.find(
          (attachment) =>
            attachmentFileUrl(attachment.pathname) === url ||
            attachment.url === url,
        );

        if (savedMatch) {
          const result = await deleteTaskAttachment(savedMatch.id);
          if (result.success) {
            setSavedAttachments((prev) =>
              prev.filter((attachment) => attachment.id !== savedMatch.id),
            );
          } else {
            toast.error(result.message);
          }
          continue;
        }

        const pendingMatch = pendingRef.current.find(
          (item) =>
            attachmentFileUrl(item.pathname) === url || item.url === url,
        );

        if (pendingMatch) {
          if (uploadSessionId) {
            await deleteDraftBlob(pendingMatch.pathname, uploadSessionId);
          }
          setPending((prev) =>
            prev.filter((item) => item.pathname !== pendingMatch.pathname),
          );
        }
      }
    },
    [uploadSessionId],
  );

  const handleDescriptionChange = useCallback(
    (next: string) => {
      const prev = descriptionRef.current;
      const removedUrls = findRemovedImageAttachmentUrls(prev, next);
      setDescription(next);
      if (removedUrls.length > 0) {
        void removeAttachmentsForImageUrls(removedUrls);
      }
    },
    [removeAttachmentsForImageUrls],
  );

  const handleAttachmentUploaded = useCallback(
    async (uploaded: PendingAttachment) => {
      if (isEditing && task?.id) {
        const result = await registerUploadedAttachment({
          uploaded,
          taskId: task.id,
          saved: savedAttachments,
          pending: [],
          onPendingChange: () => {},
          onSaved: (attachment) => {
            setSavedAttachments((prev) => {
              if (prev.some((a) => a.id === attachment.id)) return prev;
              return [...prev, attachment];
            });
          },
        });
        if (!result) {
          throw new Error('Failed to register attachment');
        }
        return;
      }

      const budgetCheck = validateTaskAttachmentBudget(
        sumAttachmentBytes(savedAttachments) + sumAttachmentBytes(pending),
        uploaded.sizeBytes,
      );
      if (!budgetCheck.ok) {
        toast.error(budgetCheck.error);
        throw new Error(budgetCheck.error);
      }

      setPending((prev) => {
        if (prev.some((p) => p.pathname === uploaded.pathname)) return prev;
        return [...prev, uploaded];
      });
    },
    [isEditing, task?.id, savedAttachments, pending],
  );

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
        | 'qa'
        | 'done'
        | 'rejected'
        | 'closed',
      priority: formData.get('priority') as
        | 'low'
        | 'medium'
        | 'high'
        | 'critical',
      type,
      severity:
        type === 'bug'
          ? (formData.get('severity') as
              | 'low'
              | 'medium'
              | 'high'
              | 'critical')
          : null,
      userId,
      projectId: projectId ?? null,
    };

    try {
      const relations = [...relatedTaskDraft, ...relatedBugDraft].map(
        (item) => ({
          targetId: item.id,
          kind: item.kind,
        }),
      );
      const result = isEditing
        ? await updateTask(Number(task!.id), data)
        : await createTask({
            ...data,
            pendingAttachmentsJson: formData.get(
              'pendingAttachments',
            ) as string,
            uploadSessionId: formData.get('uploadSessionId') as string,
            relations,
          });

      if (result.success) {
        toast.success(result.message);
        if (!isEditing) {
          if (result.taskId) {
            router.push(`/tasks/${result.taskId}`);
          } else {
            const redirectProjectId = result.projectId ?? projectId;
            router.push(
              redirectProjectId
                ? `/dashboard?project=${redirectProjectId}`
                : '/dashboard',
            );
          }
        } else {
          router.push(`/tasks/${task!.id}`);
        }
      }

      return result;
    } catch (err) {
      toast.error(`Failed to update ${noun}`);
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

  const severityOptions = Object.values(TASK_SEVERITY).map(
    ({ label, value }) => ({
      label,
      value,
    }),
  );

  return (
    <Form action={formAction}>
      {!isEditing && uploadSessionId && (
        <>
          <input type="hidden" name="uploadSessionId" value={uploadSessionId} />
          <input
            type="hidden"
            name="pendingAttachments"
            value={JSON.stringify(pending)}
          />
        </>
      )}

      <FormGroup>
        <FormLabel htmlFor="title">Title</FormLabel>
        <FormInput
          id="title"
          name="title"
          placeholder={`${noun} title`}
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
        <RichTextEditor
          id="description"
          name="description"
          placeholder={`Describe the ${nounLower}...`}
          value={description}
          onChange={handleDescriptionChange}
          disabled={isPending}
          uploadContext={uploadContext}
          onAttachmentUploaded={handleAttachmentUploaded}
          aria-describedby="description-error"
          className={
            state?.errors?.description
              ? 'rich-text-editor--tall border-red-500'
              : 'rich-text-editor--tall'
          }
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

        {type === 'bug' && (
          <FormGroup>
            <FormLabel htmlFor="severity">Severity</FormLabel>
            <FormSelect
              id="severity"
              name="severity"
              defaultValue={task?.severity || 'medium'}
              options={severityOptions}
              disabled={isPending}
              required
              aria-describedby="severity-error"
              className={state?.errors?.severity ? 'border-red-500' : ''}
            />
            {state?.errors?.severity && (
              <p id="severity-error" className="text-sm text-red-500">
                {state.errors.severity[0]}
              </p>
            )}
          </FormGroup>
        )}
      </div>

      {isEditing && task ? (
        <>
          <RelatedTasksPicker
            mode="edit"
            taskId={task.id}
            initialRelated={relatedTaskLinks}
            targetType="task"
            label="Related tasks"
          />
          {type === 'task' && (
            <RelatedTasksPicker
              mode="edit"
              taskId={task.id}
              initialRelated={relatedBugLinks}
              targetType="bug"
              label="Related bugs"
            />
          )}
        </>
      ) : (
        <>
          <RelatedTasksPicker
            mode="create"
            projectId={projectId ?? null}
            selected={relatedTaskDraft}
            onSelectedChange={setRelatedTaskDraft}
            targetType="task"
            label="Related tasks"
          />
          {type === 'task' && (
            <RelatedTasksPicker
              mode="create"
              projectId={projectId ?? null}
              selected={relatedBugDraft}
              onSelectedChange={setRelatedBugDraft}
              targetType="bug"
              label="Related bugs"
            />
          )}
        </>
      )}

      <TaskAttachmentsField
        userId={userId}
        taskId={isEditing ? task?.id : undefined}
        uploadSessionId={uploadSessionId}
        saved={savedAttachments}
        pending={pending}
        onPendingChange={setPending}
        onSavedChange={setSavedAttachments}
        onRemoveUrls={handleRemoveUrls}
        disabled={isPending}
      />

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
          {isEditing ? `Update ${noun}` : `Create ${noun}`}
        </Button>
      </div>
    </Form>
  );
}
