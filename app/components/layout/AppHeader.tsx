import Link from 'next/link';
import { CheckSquareIcon, UserIcon } from 'lucide-react';
import { getCurrentUser } from '@/lib/dal';
import ThemeToggle from '@/app/components/ThemeToggler';
import SignOutButton from '@/app/components/auth/SignOutButton';

export default async function AppHeader() {
  const user = await getCurrentUser();
  const displayName = user?.name?.trim() || user?.email || 'User';

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-16 border-b border-gray-200/80 bg-surface-elevated/80 backdrop-blur-md dark:border-dark-border-subtle dark:bg-dark-base/90">
      <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6">
        <Link
          href="/dashboard"
          className="flex min-w-0 items-center gap-2.5 group"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-white shadow-sm">
            <CheckSquareIcon size={16} strokeWidth={2.5} />
          </span>
          <span className="truncate text-base font-semibold tracking-tight text-gray-900 transition-colors group-hover:text-purple-700 dark:text-white dark:group-hover:text-purple-300">
            Task Manager
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <div
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 sm:px-2"
            title="Profile coming soon"
          >
            {user?.image ? (
              // OAuth avatars are remote URLs; img avoids next/image remote config.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-200/70 text-gray-500 dark:bg-dark-high dark:text-gray-400">
                <UserIcon size={16} />
              </span>
            )}
            <span className="hidden max-w-[10rem] truncate text-sm font-medium text-gray-800 dark:text-gray-200 sm:inline md:max-w-[14rem]">
              {displayName}
            </span>
          </div>

          <SignOutButton variant="header" />
        </div>
      </div>
    </header>
  );
}
