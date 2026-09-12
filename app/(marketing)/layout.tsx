import Link from 'next/link';
import { Timestamp } from '../components/Timestamp';
import ThemeToggle from '../components/ThemeToggler';
import DashboardButton from '../components/layout/DashboardButton';
import BrandMark from '../components/BrandMark';

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="atmosphere flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-surface-elevated/70 backdrop-blur-xl dark:border-white/[0.06] dark:bg-dark-base/75">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="transition-opacity hover:opacity-80">
              <BrandMark showWordmark={false} className="sm:hidden" />
              <BrandMark className="hidden sm:inline-flex" />
            </Link>
            <nav className="hidden md:flex gap-1">
              <Link
                href="/features"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-black/[0.04] hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                Features
              </Link>
              <Link
                href="/faq"
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-black/[0.04] hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
              >
                FAQ
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <DashboardButton />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
      <footer className="border-t border-black/[0.06] bg-white/40 dark:border-white/[0.06] dark:bg-dark-elevated/40">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
            <div>
              <BrandMark className="mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                A modern project management tool built with Next.js.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">
                Product
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/features"
                    className="text-sm text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-300"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="text-sm text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-300"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">
                Resources
              </h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://github.com/serge-starynets/task-manager-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-300"
                  >
                    GitHub
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4 text-gray-900 dark:text-white">
                Legal
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-300"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-gray-500 hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-300"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-black/[0.06] pt-8 text-center dark:border-white/[0.06]">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              &copy; <Timestamp /> Serhii Starynets. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
