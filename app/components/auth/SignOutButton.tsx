'use client';

import { LogOutIcon } from 'lucide-react';
import { useTransition } from 'react';
import { signOut } from '@/app/actions/auth';
import { cn } from '@/lib/utils';

type SignOutButtonVariant = 'sidebar' | 'header';

export default function SignOutButton({
  variant = 'sidebar',
}: {
  variant?: SignOutButtonVariant;
}) {
  const [isPending, startTransition] = useTransition();

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  const label = isPending ? 'Signing out...' : 'Log Out';

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isPending}
      aria-label={label}
      className={cn(
        'flex items-center text-sm text-gray-700 transition-colors duration-150 disabled:opacity-60 dark:text-gray-300',
        variant === 'header'
          ? 'gap-1.5 rounded-lg border border-gray-200/80 bg-white px-2.5 py-1.5 shadow-soft hover:bg-gray-50 hover:border-gray-300 dark:border-dark-border-default dark:bg-dark-high dark:shadow-none dark:hover:bg-dark-elevated dark:hover:border-dark-border-medium'
          : 'w-full rounded-lg px-2.5 py-2 hover:bg-gray-200/60 dark:hover:bg-dark-high',
      )}
    >
      <LogOutIcon size={variant === 'header' ? 16 : 20} className="shrink-0" />
      <span className={variant === 'header' ? 'hidden sm:inline' : undefined}>
        {label}
      </span>
    </button>
  );
}
