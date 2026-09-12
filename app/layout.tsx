import type { Metadata } from 'next';
import { Instrument_Serif, Plus_Jakarta_Sans } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { auth } from '@/auth';
import './globals.css';
import AppToaster from './components/AppToaster';
import AuthSessionProvider from './components/AuthSessionProvider';
import IdleTimeoutProvider from './components/IdleTimeoutProvider';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Projenda',
  description: 'A calm, modern workspace for personal projects and tasks.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${serif.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
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
