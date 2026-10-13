'use client';

import { useSyncExternalStore } from 'react';
import { format } from 'date-fns';
import { formatRelativeTime, parseAppDate } from '@/lib/utils';

type LocalTimeProps = {
  date: Date | string;
  /** Absolute history-style stamp vs relative/absolute hybrid. */
  variant?: 'relative' | 'absolute';
  className?: string;
};

function formatAbsolute(date: Date | string) {
  return format(parseAppDate(date), 'dd.MM.yyyy:HH:mm');
}

function formatLocal(date: Date | string, variant: 'relative' | 'absolute') {
  return variant === 'absolute' ? formatAbsolute(date) : formatRelativeTime(date);
}

/**
 * Renders timestamps in the browser's local timezone.
 * Avoids SSR (UTC) vs client timezone mismatches.
 */
export default function LocalTime({
  date,
  variant = 'relative',
  className,
}: LocalTimeProps) {
  const iso = parseAppDate(date).toISOString();
  const label = useSyncExternalStore(
    () => () => {},
    () => formatLocal(iso, variant),
    // Stable absolute on the server; client hydrates to local/relative
    () => formatAbsolute(iso),
  );

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {label}
    </time>
  );
}
