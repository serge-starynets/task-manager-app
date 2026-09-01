'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { sanitizeRichText } from '@/lib/rich-text';
import { cn } from '@/lib/utils';

interface RichTextProps {
  html: string | null | undefined;
  className?: string;
  emptyFallback?: React.ReactNode;
}

/** Renders sanitized Quill HTML with interactive description images. */
export default function RichText({
  html,
  className,
  emptyFallback = null,
}: RichTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeImage, setActiveImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);
  const [portalReady, setPortalReady] = useState(false);

  const clean = useMemo(() => sanitizeRichText(html), [html]);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    setActiveImage(null);
  }, [clean]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleImageClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLImageElement)) return;
      if (!container.contains(target)) return;
      event.preventDefault();
      event.stopPropagation();
      setActiveImage({ src: target.src, alt: target.alt || 'Task image' });
    };

    container.addEventListener('click', handleImageClick);
    return () => {
      container.removeEventListener('click', handleImageClick);
    };
  }, [clean]);

  useEffect(() => {
    if (!activeImage) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveImage(null);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [activeImage]);

  if (!clean) {
    return <>{emptyFallback}</>;
  }

  return (
    <>
      <div
        ref={containerRef}
        className={cn(
          'rich-text prose dark:prose-invert max-w-none min-w-0 w-full text-sm leading-relaxed',
          'overflow-hidden break-words [overflow-wrap:anywhere]',
          '[&_*]:max-w-full [&_*]:break-words',
          '[&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap',
          '[&_a]:text-blue-600 [&_a]:underline dark:[&_a]:text-blue-400',
          '[&_img]:my-3 [&_img]:max-h-[480px] [&_img]:rounded-md [&_img]:object-contain',
          '[&_img]:cursor-zoom-in [&_img]:transition-all [&_img]:duration-200 [&_img]:ease-smooth',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
          '[&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold',
          className,
        )}
        dangerouslySetInnerHTML={{ __html: clean }}
      />
      {portalReady &&
        activeImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 md:p-10"
            role="dialog"
            aria-modal="true"
            aria-label="Zoomed image"
            onClick={() => setActiveImage(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.src}
              alt={activeImage.alt}
              className="max-h-[90vh] max-w-[90vw] cursor-zoom-out rounded-lg object-contain shadow-2xl"
            />
          </div>,
          document.body,
        )}
    </>
  );
}
