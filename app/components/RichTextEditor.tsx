'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { isEmptyHtml } from '@/lib/rich-text';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="min-h-[180px] rounded-md border border-gray-300 bg-gray-50 dark:border-dark-border-medium dark:bg-dark-high animate-pulse" />
  ),
});

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'link',
];

interface RichTextEditorProps {
  id?: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  'aria-describedby'?: string;
}

export default function RichTextEditor({
  id,
  name,
  defaultValue = '',
  placeholder = 'Write something...',
  disabled = false,
  className,
  'aria-describedby': ariaDescribedBy,
}: RichTextEditorProps) {
  const [value, setValue] = useState(defaultValue ?? '');

  const submittedValue = useMemo(
    () => (isEmptyHtml(value) ? '' : value),
    [value],
  );

  return (
    <div
      className={cn(
        'rich-text-editor rounded-md border border-gray-300 bg-white dark:border-dark-border-medium dark:bg-dark-high overflow-hidden focus-within:ring-2 focus-within:ring-gray-800 focus-within:border-transparent',
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
