import Navigation from '../components/Navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="bg-white dark:bg-dark-elevated pl-16 md:pl-64 pt-0 min-h-screen">
        <div className="dark:text-white max-w-6xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
