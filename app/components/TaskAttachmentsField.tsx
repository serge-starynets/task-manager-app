'use client';

import { useRef, useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  PaperclipIcon,
  XIcon,
} from 'lucide-react';
import type { TaskAttachment } from '@/db/schema';
import {
  deleteDraftBlob,
  deleteTaskAttachment,
  registerTaskAttachment,
} from '@/app/actions/attachments';
import {
  ALLOWED_EXTENSIONS,
  MAX_ATTACHMENT_BYTES,
  attachmentFileUrl,
  formatFileSize,
  isImageContentType,
  type PendingAttachment,
} from '@/lib/attachments';
import { uploadAttachmentFile } from '@/lib/upload-attachment';
import { FormGroup, FormLabel } from './ui/Form';
import Button from './ui/Button';

interface TaskAttachmentsFieldProps {
  userId: string;
  taskId?: number;
  uploadSessionId?: string;
  saved: TaskAttachment[];
  pending: PendingAttachment[];
  onPendingChange: (next: PendingAttachment[]) => void;
  onSavedChange: (next: TaskAttachment[]) => void;
  onRemoveUrls?: (urls: string[]) => void;
  disabled?: boolean;
}

function FileTypeIcon({ contentType }: { contentType: string }) {
  if (isImageContentType(contentType)) {
    return <ImageIcon size={16} className="shrink-0 text-gray-500" />;
  }
  if (contentType === 'application/pdf' || contentType.startsWith('text/')) {
    return <FileTextIcon size={16} className="shrink-0 text-gray-500" />;
  }
  return <FileIcon size={16} className="shrink-0 text-gray-500" />;
}

export default function TaskAttachmentsField({
  userId,
  taskId,
  uploadSessionId,
  saved,
  pending,
  onPendingChange,
  onSavedChange,
  onRemoveUrls,
  disabled = false,
}: TaskAttachmentsFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isMutating, startMutate] = useTransition();

  const accept = ALLOWED_EXTENSIONS.map((ext) => `.${ext}`).join(',');

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        try {
          const uploaded = await uploadAttachmentFile(file, {
            userId,
            taskId,
            uploadSessionId,
          });

          if (taskId != null) {
            const result = await registerTaskAttachment({
              taskId,
              ...uploaded,
            });
            if (result.success && result.attachment) {
              onSavedChange([...saved, result.attachment]);
              toast.success(`Attached ${uploaded.fileName}`);
            } else {
              toast.error(result.message);
            }
          } else {
            onPendingChange([...pending, uploaded]);
            toast.success(`Attached ${uploaded.fileName}`);
          }
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : 'Failed to upload file',
          );
        }
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function removeSaved(attachment: TaskAttachment) {
    startMutate(async () => {
      const result = await deleteTaskAttachment(attachment.id);
      if (result.success) {
        onSavedChange(saved.filter((a) => a.id !== attachment.id));
        onRemoveUrls?.([
          attachmentFileUrl(attachment.pathname),
          attachment.url,
        ]);
        toast.success('Attachment removed');
      } else {
        toast.error(result.message);
      }
    });
  }

  function removePending(item: PendingAttachment) {
    startMutate(async () => {
      if (uploadSessionId) {
        await deleteDraftBlob(item.pathname, uploadSessionId);
      }
      onPendingChange(pending.filter((p) => p.pathname !== item.pathname));
      onRemoveUrls?.([attachmentFileUrl(item.pathname), item.url]);
      toast.success('Attachment removed');
    });
  }

  const busy = disabled || uploading || isMutating;

  return (
    <FormGroup>
      <FormLabel>Attachments</FormLabel>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        Max {formatFileSize(MAX_ATTACHMENT_BYTES)}. Allowed:{' '}
        {ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(', ')}
      </p>

      <div className="space-y-2 mb-3">
        {saved.map((attachment) => (
          <div
            key={attachment.id}
            className="flex items-center gap-2 rounded-md border border-gray-200 dark:border-dark-border-default px-3 py-2 text-sm"
          >
            <FileTypeIcon contentType={attachment.contentType} />
            <a
              href={attachmentFileUrl(attachment.pathname)}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate hover:underline"
            >
              {attachment.fileName}
            </a>
            <span className="shrink-0 text-xs text-gray-400">
              {formatFileSize(attachment.sizeBytes)}
            </span>
            <button
              type="button"
              onClick={() => removeSaved(attachment)}
              disabled={busy}
              className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
              aria-label={`Remove ${attachment.fileName}`}
            >
              <XIcon size={14} />
            </button>
          </div>
        ))}

        {pending.map((item) => (
          <div
            key={item.pathname}
            className="flex items-center gap-2 rounded-md border border-dashed border-gray-300 dark:border-dark-border-medium px-3 py-2 text-sm"
          >
            <FileTypeIcon contentType={item.contentType} />
            <a
              href={attachmentFileUrl(item.pathname)}
              target="_blank"
              rel="noopener noreferrer"
              className="min-w-0 flex-1 truncate hover:underline"
            >
              {item.fileName}
            </a>
            <span className="shrink-0 text-xs text-gray-400">
              {formatFileSize(item.sizeBytes)}
            </span>
            <button
              type="button"
              onClick={() => removePending(item)}
              disabled={busy}
              className="shrink-0 rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50"
              aria-label={`Remove ${item.fileName}`}
            >
              <XIcon size={14} />
            </button>
          </div>
        ))}

        {saved.length === 0 && pending.length === 0 && (
          <p className="text-sm text-gray-500 italic">No attachments yet.</p>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        disabled={busy}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        isLoading={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <span className="flex items-center gap-1.5">
          <PaperclipIcon size={14} />
          Add attachment
        </span>
      </Button>
    </FormGroup>
  );
}

/** Call from Quill / parent when an upload should appear in the list. */
export async function registerUploadedAttachment(opts: {
  uploaded: PendingAttachment;
  taskId?: number;
  pending: PendingAttachment[];
  onPendingChange: (next: PendingAttachment[]) => void;
  onSaved?: (attachment: TaskAttachment) => void;
}): Promise<boolean> {
  const { uploaded, taskId, pending, onPendingChange, onSaved } = opts;

  // Avoid duplicate list entries if the same blob was already registered
  if (pending.some((p) => p.pathname === uploaded.pathname)) {
    return true;
  }

  if (taskId != null) {
    const result = await registerTaskAttachment({
      taskId,
      ...uploaded,
    });
    if (result.success && result.attachment) {
      onSaved?.(result.attachment);
      return true;
    }
    toast.error(result.message);
    return false;
  }

  onPendingChange([...pending, uploaded]);
  return true;
}
