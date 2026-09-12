import Link from 'next/link';
import { UserIcon } from 'lucide-react';
import { getCurrentUser } from '@/lib/dal';
import BrandMark from '@/app/components/BrandMark';
import ThemeToggle from '@/app/components/ThemeToggler';
import SignOutButton from '@/app/components/auth/SignOutButton';

export default async function AppHeader() {
  const user = await getCurrentUser();
  const displayName = user?.name?.trim() || user?.email || 'User';

  return (
    <header className="relative z-50 flex h-14 shrink-0 items-stretch border-b border-black/[0.06] bg-surface-elevated/75 backdrop-blur-xl dark:border-white/[0.06] dark:bg-dark-base/80">
      <div className="flex w-full items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/dashboard" className="group min-w-0">
          <BrandMark className="transition-opacity group-hover:opacity-80" />
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <div
            className="flex items-center gap-2 rounded-xl px-1.5 py-1 sm:px-2"
            title="Profile coming soon"
          >
            {user?.image ? (
              // OAuth avatars are remote URLs; img avoids next/image remote config.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt=""
                className="h-8 w-8 rounded-xl object-cover ring-1 ring-black/[0.06] dark:ring-white/[0.1]"
              />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300">
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
