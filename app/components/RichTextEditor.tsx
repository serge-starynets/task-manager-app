'use client';

import dynamic from 'next/dynamic';
import { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { isEmptyHtml } from '@/lib/rich-text';
import type { PendingAttachment } from '@/lib/attachments';
import { attachmentFileUrl } from '@/lib/attachments';
import { uploadAttachmentFile } from '@/lib/upload-attachment';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[180px] rounded-md border border-gray-300 bg-gray-50 dark:border-dark-border-medium dark:bg-dark-high animate-pulse" />
  ),
});

interface RichTextEditorProps {
  id?: string;
  name: string;
  defaultValue?: string | null;
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-describedby'?: string;
  /** When set, image/file toolbar actions upload to Blob. */
  uploadContext?: {
    userId: string;
    taskId?: number;
    uploadSessionId?: string;
  };
  onAttachmentUploaded?: (
    attachment: PendingAttachment,
  ) => void | Promise<void>;
}

type QuillLike = {
  getSelection: (focus?: boolean) => { index: number; length: number } | null;
  getLength: () => number;
  getText: (index?: number, length?: number) => string;
  getFormat: (
    range?: { index: number; length: number },
  ) => Record<string, unknown>;
  format: (name: string, value: unknown, source?: string) => void;
  insertEmbed: (
    index: number,
    type: string,
    value: string,
    source?: string,
  ) => void;
  insertText: (
    index: number,
    text: string,
    format: string,
    value: string,
    source?: string,
  ) => void;
  setSelection: (index: number, length: number) => void;
};

export default function RichTextEditor({
  id,
  name,
  defaultValue = '',
  value: controlledValue,
  onChange,
  placeholder = 'Write something...',
  disabled = false,
  className,
  'aria-describedby': ariaDescribedBy,
  uploadContext,
  onAttachmentUploaded,
}: RichTextEditorProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(
    defaultValue ?? '',
  );
  const uploadContextRef = useRef(uploadContext);
  const onAttachmentUploadedRef = useRef(onAttachmentUploaded);

  uploadContextRef.current = uploadContext;
  onAttachmentUploadedRef.current = onAttachmentUploaded;

  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : uncontrolledValue;
  const uploadsEnabled = Boolean(uploadContext);

  function setValue(next: string) {
    if (!isControlled) {
      setUncontrolledValue(next);
    }
    onChange?.(next);
  }

  const modules = useMemo(() => {
    async function uploadAndInsert(
      quill: QuillLike,
      file: File,
      asImage: boolean,
    ) {
      const ctx = uploadContextRef.current;
      if (!ctx) {
        toast.error('Uploads are not available');
        return;
      }

      try {
        toast.loading('Uploading…', { id: 'quill-upload' });
        const uploaded = await uploadAttachmentFile(file, ctx);
        await onAttachmentUploadedRef.current?.(uploaded);

        const range = quill.getSelection(true);
        const index = range?.index ?? quill.getLength();
        const embedUrl = attachmentFileUrl(uploaded.pathname);

        if (asImage) {
          quill.insertEmbed(index, 'image', embedUrl, 'user');
          quill.setSelection(index + 1, 0);
        } else {
          quill.insertText(
            index,
            uploaded.fileName,
            'link',
            embedUrl,
            'user',
          );
          quill.setSelection(index + uploaded.fileName.length, 0);
        }
        toast.success('Inserted', { id: 'quill-upload' });
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Failed to upload file',
          { id: 'quill-upload' },
        );
      }
    }

    function pickFile(
      quill: QuillLike,
      accept: string,
      asImage: boolean,
    ) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept;
      input.onchange = () => {
        const file = input.files?.[0];
        if (file) {
          void uploadAndInsert(quill, file, asImage);
        }
      };
      input.click();
    }

    const mediaControls = uploadsEnabled
      ? (['link', 'image', 'file'] as const)
      : (['link'] as const);

    function normalizeUrl(raw: string) {
      const trimmed = raw.trim();
      if (!trimmed) return null;
      if (/^(https?:|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
      return `https://${trimmed}`;
    }

    return {
      toolbar: {
        // Single row of controls (CSS also forces nowrap)
        container: [
          [
            { header: [1, 2, 3, false] },
            'bold',
            'italic',
            'underline',
            'strike',
            { list: 'ordered' },
            { list: 'bullet' },
            ...mediaControls,
          ],
        ],
        handlers: {
          // Snow's default link tooltip breaks with controlled ReactQuill
          // (selection change immediately hides it). Prompt is reliable.
          link: function (this: { quill: QuillLike }, value: boolean) {
            const quill = this.quill;
            const range = quill.getSelection(true);
            if (!range) return;

            if (!value) {
              quill.format('link', false, 'user');
              return;
            }

            const selectedText =
              range.length > 0 ? quill.getText(range.index, range.length) : '';
            const existingHref = quill.getFormat(range).link;

            let suggested = 'https://';
            if (typeof existingHref === 'string') {
              suggested = existingHref;
            } else if (/^\S+@\S+\.\S+$/.test(selectedText)) {
              suggested = `mailto:${selectedText}`;
            } else if (selectedText.startsWith('http')) {
              suggested = selectedText;
            }

            const raw = window.prompt('Enter link URL', suggested);
            if (raw == null) return;
            const href = normalizeUrl(raw);
            if (!href) return;

            if (range.length === 0) {
              quill.insertText(range.index, href, 'link', href, 'user');
              quill.setSelection(range.index + href.length, 0);
            } else {
              quill.format('link', href, 'user');
            }
          },
          ...(uploadsEnabled
            ? {
                image: function (this: { quill: QuillLike }) {
                  pickFile(
                    this.quill,
                    'image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp',
                    true,
                  );
                },
                file: function (this: { quill: QuillLike }) {
                  pickFile(
                    this.quill,
                    '.pdf,.txt,.csv,.md,.docx,.xlsx,application/pdf,text/plain,text/csv',
                    false,
                  );
                },
              }
            : {}),
        },
      },
    };
  }, [uploadsEnabled]);

  const formats = useMemo(
    () =>
      uploadsEnabled
        ? [
            'header',
            'bold',
            'italic',
            'underline',
            'strike',
            'list',
            'link',
            'image',
          ]
        : [
            'header',
            'bold',
            'italic',
            'underline',
            'strike',
            'list',
            'link',
          ],
    [uploadsEnabled],
  );

  const submittedValue = useMemo(
    () => (isEmptyHtml(value) ? '' : value),
    [value],
  );

  return (
    <div
      className={cn(
        'rich-text-editor rounded-lg border border-gray-300 bg-white dark:border-dark-border-medium dark:bg-dark-elevated focus-within:ring-2 focus-within:ring-purple-500/30 focus-within:border-purple-400',
        disabled && 'opacity-50 pointer-events-none',
        className,
      )}
    >
      <input type="hidden" id={id} name={name} value={submittedValue} />
      <ReactQuill
        theme="snow"
        value={value}
        onChange={setValue}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        aria-describedby={ariaDescribedBy}
      />
    </div>
  );
}
