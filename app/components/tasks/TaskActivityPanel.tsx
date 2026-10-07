'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClockIcon,
  Edit2Icon,
  HistoryIcon,
  MessageSquareIcon,
  Trash2Icon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '@/app/components/ui/Button';
import RichText from '@/app/components/tasks/RichText';
import RichTextEditor from '@/app/components/tasks/RichTextEditor';
import {
  createTaskComment,
  deleteTaskComment,
  updateTaskComment,
} from '@/app/actions/comments';
import { registerTaskAttachment } from '@/app/actions/attachments';
import type { TaskCommentWithUser } from '@/lib/dal/comments';
import type { PendingAttachment } from '@/lib/attachments';
import { formatRelativeTime, cn } from '@/lib/utils';
import { isEmptyHtml } from '@/lib/rich-text';

async function registerCommentUpload(
  taskId: number,
  uploaded: PendingAttachment,
) {
  const result = await registerTaskAttachment({
    taskId,
    url: uploaded.url,
    pathname: uploaded.pathname,
    fileName: uploaded.fileName,
    contentType: uploaded.contentType,
    sizeBytes: uploaded.sizeBytes,
  });
  if (!result.success) {
    throw new Error(result.message || 'Failed to save attachment');
  }
}

type Tab = 'history' | 'comments';

type TaskActivityPanelProps = {
  taskId: number;
  userId: string;
  currentUserId: string;
  isAdmin: boolean;
  comments: TaskCommentWithUser[];
};

function canManageComment(
  comment: TaskCommentWithUser,
  currentUserId: string,
  isAdmin: boolean,
): boolean {
  return isAdmin || comment.userId === currentUserId;
}

function CommentItem({
  comment,
  taskId,
  userId,
  canManage,
}: {
  comment: TaskCommentWithUser;
  taskId: number;
  userId: string;
  canManage: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(comment.body);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const edited =
    new Date(comment.updatedAt).getTime() - new Date(comment.createdAt).getTime() >
    1000;

  const handleSave = () => {
    if (isEmptyHtml(body)) {
      toast.error('Comment cannot be empty');
      return;
    }

    startTransition(async () => {
      const result = await updateTaskComment({
        commentId: comment.id,
        body,
      });
      if (!result.success) {
        toast.error(result.message || 'Failed to update comment');
        return;
      }
      toast.success('Comment updated');
      setEditing(false);
      router.refresh();
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteTaskComment(comment.id);
      if (!result.success) {
        toast.error(result.message || 'Failed to delete comment');
        return;
      }
      toast.success('Comment deleted');
      setConfirmDelete(false);
      router.refresh();
    });
  };

  return (
    <li className="rounded-xl border border-black/[0.05] bg-white/60 p-4 dark:border-white/[0.06] dark:bg-dark-elevated/40">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {comment.user.email}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <ClockIcon size={12} />
            {formatRelativeTime(new Date(comment.createdAt))}
            {edited && <span>· edited</span>}
          </p>
        </div>
        {canManage && !editing && (
          <div className="flex shrink-0 items-center gap-1">
            {confirmDelete ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleDelete}
                  isLoading={isPending}
                >
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setBody(comment.body);
                    setEditing(true);
                  }}
                  aria-label="Edit comment"
                >
                  <Edit2Icon size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete comment"
                >
                  <Trash2Icon size={14} />
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <RichTextEditor
            name={`comment-edit-${comment.id}`}
            value={body}
            onChange={setBody}
            disabled={isPending}
            placeholder="Edit your comment..."
            uploadContext={{ userId, taskId }}
            onAttachmentUploaded={(uploaded) =>
              registerCommentUpload(taskId, uploaded)
            }
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(false);
                setBody(comment.body);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} isLoading={isPending}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <RichText
          html={comment.body}
          emptyFallback={
            <p className="text-sm italic text-gray-500">Empty comment.</p>
          }
        />
      )}
    </li>
  );
}

function CommentComposer({
  taskId,
  userId,
}: {
  taskId: number;
  userId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [body, setBody] = useState('');
  const [editorKey, setEditorKey] = useState(0);

  const handleSubmit = () => {
    if (isEmptyHtml(body)) {
      toast.error('Comment cannot be empty');
      return;
    }

    startTransition(async () => {
      const result = await createTaskComment({ taskId, body });
      if (!result.success) {
        toast.error(result.message || 'Failed to add comment');
        return;
      }
      toast.success('Comment added');
      setBody('');
      setEditorKey((key) => key + 1);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <RichTextEditor
        key={editorKey}
        name="new-comment"
        value={body}
        onChange={setBody}
        disabled={isPending}
        placeholder="Write a comment..."
        uploadContext={{ userId, taskId }}
        onAttachmentUploaded={(uploaded) =>
          registerCommentUpload(taskId, uploaded)
        }
      />
      <div className="flex justify-end">
        <Button size="sm" onClick={handleSubmit} isLoading={isPending}>
          Comment
        </Button>
      </div>
    </div>
  );
}

export default function TaskActivityPanel({
  taskId,
  userId,
  currentUserId,
  isAdmin,
  comments,
}: TaskActivityPanelProps) {
  // Default to Comments so the feature is usable; History is first in the tab order.
  const [tab, setTab] = useState<Tab>('comments');

  return (
    <div className="surface-panel overflow-hidden p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex rounded-xl border border-black/[0.06] bg-white/70 p-0.5 dark:border-white/[0.08] dark:bg-dark-high/70"
          role="tablist"
          aria-label="Activity"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'history'}
            onClick={() => setTab('history')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[0.65rem] px-3 py-1.5 text-xs font-medium transition-colors',
              tab === 'history'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
            )}
          >
            <HistoryIcon size={13} />
            History
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'comments'}
            onClick={() => setTab('comments')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[0.65rem] px-3 py-1.5 text-xs font-medium transition-colors',
              tab === 'comments'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200',
            )}
          >
            <MessageSquareIcon size={13} />
            Comments
            {comments.length > 0 && (
              <span
                className={cn(
                  'rounded-md px-1.5 py-0.5 text-[10px] tabular-nums',
                  tab === 'comments'
                    ? 'bg-white/20'
                    : 'bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-gray-300',
                )}
              >
                {comments.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {tab === 'history' ? (
        <div role="tabpanel" className="py-6 text-center">
          <HistoryIcon
            size={24}
            className="mx-auto mb-3 text-gray-300 dark:text-gray-600"
          />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            History coming soon
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ticket changes will appear here later.
          </p>
        </div>
      ) : (
        <div className="space-y-5" role="tabpanel">
          <CommentComposer taskId={taskId} userId={userId} />
          {comments.length === 0 ? (
            <p className="text-sm italic text-gray-500">No comments yet.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  taskId={taskId}
                  userId={userId}
                  canManage={canManageComment(
                    comment,
                    currentUserId,
                    isAdmin,
                  )}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
