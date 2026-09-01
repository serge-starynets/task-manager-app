import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { auth } from '@/auth';
import './globals.css';
import AppToaster from './components/AppToaster';
import AuthSessionProvider from './components/AuthSessionProvider';
import IdleTimeoutProvider from './components/IdleTimeoutProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'A modern task tracking application built with Next.js 15',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class">
          <AuthSessionProvider session={session}>
            <IdleTimeoutProvider>
              <AppToaster />
              {children}
            </IdleTimeoutProvider>
          </AuthSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
