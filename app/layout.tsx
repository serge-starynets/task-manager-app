import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import AppToaster from './components/AppToaster';
import IdleTimeoutProvider from './components/IdleTimeoutProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Task Manager',
  description: 'A modern task tracking application built with Next.js 15',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class">
          <IdleTimeoutProvider>
            <AppToaster />
            {children}
          </IdleTimeoutProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
