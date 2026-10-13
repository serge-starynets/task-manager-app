'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

function DashboardShellInner({
  children,
  header,
  navigation,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  navigation: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasProject = Boolean(searchParams.get('project'));
  const isBoardView = searchParams.get('view') === 'board';
  const isNotesView = pathname === '/notes';
  const isWidePane = isBoardView || isNotesView;

  return (
    <div className="atmosphere flex h-dvh flex-col overflow-hidden">
      {header}
      <div className="relative flex min-h-0 flex-1">
        {hasProject ? navigation : null}
        <main
          className={cn(
            'flex min-h-0 flex-1 flex-col',
            isNotesView ? 'overflow-hidden' : 'overflow-y-auto',
            hasProject && 'pl-16 md:pl-64',
          )}
        >
          <div
            className={cn(
              'mx-auto flex min-h-0 w-full flex-1 flex-col dark:text-white',
              isWidePane ? 'p-4 md:p-6' : 'max-w-[86.4rem] p-4 md:p-8',
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function DashboardShell({
  children,
  header,
  navigation,
}: {
  children: React.ReactNode;
  header: React.ReactNode;
  navigation: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="atmosphere flex h-dvh flex-col overflow-hidden">
          {header}
          <div className="relative flex min-h-0 flex-1">
            <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <div className="mx-auto flex min-h-0 w-full max-w-[86.4rem] flex-1 flex-col p-4 md:p-8 dark:text-white">
                {children}
              </div>
            </main>
          </div>
        </div>
      }
    >
      <DashboardShellInner header={header} navigation={navigation}>
        {children}
      </DashboardShellInner>
    </Suspense>
  );
}
