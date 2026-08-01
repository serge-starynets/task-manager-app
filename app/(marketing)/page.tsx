import Link from 'next/link';
import { ArrowRightIcon, CheckSquareIcon } from 'lucide-react';
import { Timestamp } from '../components/Timestamp';
import Button from '../components/ui/Button';

export default async function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="text-center">
            <div className="mx-auto mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-lift">
              <CheckSquareIcon size={28} strokeWidth={2.25} />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Task tracking <br className="hidden sm:block" />
              <span className="text-purple-600 dark:text-purple-400">
                simplified
              </span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-gray-600 dark:text-gray-300">
              A minimal and elegant task tracking tool for modern teams. Manage
              your projects with ease.
            </p>
            <div className="mt-10">
              <Link href="/signup">
                <Button size="lg">
                  Get Started
                  <ArrowRightIcon size={18} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200/80 dark:border-dark-border-subtle">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              © <Timestamp /> Task Manager.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
