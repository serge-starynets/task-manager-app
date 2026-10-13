import Link from 'next/link';
import { getCurrentUser } from '@/lib/dal';
import { resolveUserDisplay } from '@/lib/user-display';
import BrandMark from '@/app/components/BrandMark';
import ThemeToggle from '@/app/components/ThemeToggler';
import SignOutButton from '@/app/components/auth/SignOutButton';
import UserAvatar from '@/app/components/UserAvatar';

export default async function AppHeader() {
  const user = await getCurrentUser();
  const display = user
    ? resolveUserDisplay(user)
    : { name: 'User', image: null as string | null };

  return (
    <header className="relative z-50 flex h-14 shrink-0 items-stretch border-b border-black/[0.1] bg-surface-elevated/90 backdrop-blur-xl dark:border-white/[0.14] dark:bg-dark-base/90">
      <div className="flex w-full items-center justify-between gap-4 px-4 md:px-6">
        <Link href="/dashboard" className="group min-w-0">
          <BrandMark className="transition-opacity group-hover:opacity-80" />
        </Link>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />

          <Link
            href="/profile"
            className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-black/[0.04] sm:px-2 dark:hover:bg-white/[0.06]"
            title="Profile"
          >
            <UserAvatar name={display.name} image={display.image} size="sm" />
            <span className="hidden max-w-[10rem] truncate text-sm font-medium text-gray-800 dark:text-gray-200 sm:inline md:max-w-[14rem]">
              {display.name}
            </span>
          </Link>

          <SignOutButton variant="header" />
        </div>
      </div>
    </header>
  );
}
