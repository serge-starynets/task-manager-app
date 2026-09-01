import {
  FileIcon,
  FileTextIcon,
  ImageIcon,
  PaperclipIcon,
} from 'lucide-react';
import type { TaskAttachment } from '@/db/schema';
import {
  formatFileSize,
  isImageContentType,
  attachmentFileUrl,
} from '@/lib/attachments';

function FileTypeIcon({ contentType }: { contentType: string }) {
  if (isImageContentType(contentType)) {
    return <ImageIcon size={16} className="shrink-0 text-gray-500" />;
  }
  if (contentType === 'application/pdf' || contentType.startsWith('text/')) {
    return <FileTextIcon size={16} className="shrink-0 text-gray-500" />;
  }
  return <FileIcon size={16} className="shrink-0 text-gray-500" />;
}

export default function TaskAttachmentsList({
  attachments,
}: {
  attachments: TaskAttachment[];
}) {
  return (
    <div className="bg-white dark:bg-dark-high border border-gray-200/80 dark:border-dark-border-default rounded-xl shadow-soft dark:shadow-none p-6 overflow-hidden">
      <h2 className="text-lg font-semibold tracking-tight mb-4 flex items-center gap-2">
        <PaperclipIcon size={18} className="text-gray-400" />
        Attachments
      </h2>
      {attachments.length > 0 ? (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li key={attachment.id}>
              <a
                href={attachmentFileUrl(attachment.pathname)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-800 hover:underline dark:text-gray-200"
              >
                <FileTypeIcon contentType={attachment.contentType} />
                <span className="min-w-0 truncate break-words">
                  {attachment.fileName}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {formatFileSize(attachment.sizeBytes)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 italic">No attachments.</p>
      )}
    </div>
  );
}
