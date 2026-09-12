import DashboardShell from '@/app/components/layout/DashboardShell';
import AppHeader from '@/app/components/layout/AppHeader';
import Navigation from '@/app/components/layout/Navigation';
import { requireUser } from '@/lib/dal';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <DashboardShell header={<AppHeader />} navigation={<Navigation />}>
      {children}
    </DashboardShell>
  );
}
