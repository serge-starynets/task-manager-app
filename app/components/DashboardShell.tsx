'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function DashboardShellInner({
  children,
  navigation,
}: {
  children: React.ReactNode;
  navigation: React.ReactNode;
}) {
  const searchParams = useSearchParams();
  const hasProject = Boolean(searchParams.get('project'));

  if (!hasProject) {
    return (
      <div className="min-h-screen bg-background">
        <main className="min-h-screen">
          <div className="dark:text-white max-w-6xl mx-auto p-4 md:p-8">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {navigation}
      <main className="pl-16 md:pl-64 pt-0 min-h-screen">
        <div className="dark:text-white max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function DashboardShell({
  children,
  navigation,
}: {
  children: React.ReactNode;
  navigation: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background">
          <main className="min-h-screen">
            <div className="dark:text-white max-w-6xl mx-auto p-4 md:p-8">
              {children}
            </div>
          </main>
        </div>
      }
    >
      <DashboardShellInner navigation={navigation}>
        {children}
      </DashboardShellInner>
    </Suspense>
  );
}
