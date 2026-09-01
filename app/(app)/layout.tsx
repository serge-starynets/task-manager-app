import DashboardShell from '@/app/components/layout/DashboardShell';
import Navigation from '@/app/components/layout/Navigation';
import { requireUser } from '@/lib/dal';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <DashboardShell navigation={<Navigation />}>{children}</DashboardShell>
  );
}
