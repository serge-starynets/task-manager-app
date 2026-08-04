'use client';

import { Toaster, ToastBar, toast } from 'react-hot-toast';
import {
  CheckCircle2Icon,
  InfoIcon,
  Loader2Icon,
  XCircleIcon,
  XIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function ToastIcon({ type }: { type: string }) {
  switch (type) {
    case 'success':
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <CheckCircle2Icon size={18} strokeWidth={2} />
        </span>
      );
    case 'error':
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400">
          <XCircleIcon size={18} strokeWidth={2} />
        </span>
      );
    case 'loading':
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-300">
          <Loader2Icon size={18} strokeWidth={2} className="animate-spin" />
        </span>
      );
    default:
      return (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-dark-elevated dark:text-gray-300">
          <InfoIcon size={18} strokeWidth={2} />
        </span>
      );
  }
}

export default function AppToaster() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      containerStyle={{ top: 16, right: 16 }}
      toastOptions={{
        duration: 4000,
        success: { duration: 3500 },
        error: { duration: 5000 },
      }}
    >
      {(t) => (
        <ToastBar
          toast={t}
          style={{
            padding: 0,
            background: 'transparent',
            boxShadow: 'none',
            maxWidth: 380,
          }}
        >
          {({ message }) => (
            <div
              className={cn(
                'pointer-events-auto flex w-full min-w-[280px] max-w-[380px] items-start gap-3 rounded-xl border p-3.5',
                'bg-white/95 backdrop-blur-md shadow-lift',
                'border-gray-200/80 dark:border-dark-border-default dark:bg-dark-high/95 dark:shadow-none',
                t.type === 'success' &&
                  'border-l-[3px] border-l-emerald-500 dark:border-l-emerald-400',
                t.type === 'error' &&
                  'border-l-[3px] border-l-red-500 dark:border-l-red-400',
                t.type === 'loading' &&
                  'border-l-[3px] border-l-purple-500 dark:border-l-purple-400',
                t.type === 'blank' &&
                  'border-l-[3px] border-l-gray-400 dark:border-l-gray-500',
              )}
              role="status"
              aria-live="polite"
            >
              <ToastIcon type={t.type} />
              <div className="min-w-0 flex-1 pt-0.5 text-sm font-medium leading-snug text-gray-800 dark:text-gray-100 [&_*]:!m-0 [&_*]:!justify-start">
                {message}
              </div>
              {t.type !== 'loading' && (
                <button
                  type="button"
                  onClick={() => toast.dismiss(t.id)}
                  className={cn(
                    'shrink-0 rounded-lg p-1 transition-colors',
                    'text-gray-400 hover:bg-gray-100 hover:text-gray-700',
                    'dark:text-gray-500 dark:hover:bg-dark-elevated dark:hover:text-gray-200',
                  )}
                  aria-label="Dismiss"
                >
                  <XIcon size={14} />
                </button>
              )}
            </div>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
}
