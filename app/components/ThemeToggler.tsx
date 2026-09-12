'use client';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { SunIcon, MoonIcon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle color theme"
        className="flex items-center justify-center w-9 h-9 rounded-xl border border-black/[0.06] bg-white/80 text-gray-500 shadow-soft dark:border-white/[0.08] dark:bg-dark-high dark:text-gray-400 dark:shadow-none transition-colors"
      >
        <div className="w-4 h-4 bg-gray-200 dark:bg-dark-border-medium rounded animate-pulse" />
      </button>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex items-center justify-center w-9 h-9 rounded-xl border border-black/[0.06] bg-white/80 text-gray-600 shadow-soft hover:bg-white hover:border-black/[0.12] dark:border-white/[0.08] dark:bg-dark-high dark:text-gray-300 dark:shadow-none dark:hover:bg-dark-elevated dark:hover:border-white/[0.14] transition-all duration-200 ease-smooth"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <SunIcon size={18} className="text-amber-400" />
      ) : (
        <MoonIcon size={18} className="text-gray-600" />
      )}
    </button>
  );
}
