import DashboardShell from '../components/DashboardShell';
import Navigation from '../components/Navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell navigation={<Navigation />}>{children}</DashboardShell>
  );
}
