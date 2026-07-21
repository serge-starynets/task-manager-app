import { type ReactNode } from 'react';
import { sanitizeRichText } from '@/lib/rich-text';
import { cn } from '@/lib/utils';

interface RichTextProps {
  html: string | null | undefined;
  className?: string;
  emptyFallback?: ReactNode;
}

/** Renders sanitized Quill HTML safely */
export default function RichText({
  html,
  className,
  emptyFallback = null,
}: RichTextProps) {
  const clean = sanitizeRichText(html);

  if (!clean) {
    return <>{emptyFallback}</>;
  }

  return (
    <div
      className={cn(
        'rich-text prose dark:prose-invert max-w-none min-w-0 w-full text-sm leading-relaxed',
        'overflow-hidden break-words [overflow-wrap:anywhere]',
        '[&_*]:max-w-full [&_*]:break-words',
        '[&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap',
        '[&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
        '[&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold',
        className,
      )}
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
