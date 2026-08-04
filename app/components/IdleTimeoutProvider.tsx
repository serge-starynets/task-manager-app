'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { signOutDueToIdle, touchSession } from '@/app/actions/auth';
import {
  SESSION_MAX_AGE_SECONDS,
  SESSION_REFRESH_INTERVAL_SECONDS,
} from '@/lib/auth-constants';

const IDLE_TIMEOUT_MS = SESSION_MAX_AGE_SECONDS * 1000;
const REFRESH_INTERVAL_MS = SESSION_REFRESH_INTERVAL_SECONDS * 1000;

const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
] as const;

/**
 * Tracks user activity and:
 * - refreshes the auth cookie while the user is active (sliding 1h window)
 * - signs out after 1 hour with no activity
 *
 * Safe to mount app-wide: no-ops when there is no session.
 */
export default function IdleTimeoutProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefreshRef = useRef(0);
  const signingOutRef = useRef(false);

  useEffect(() => {
    // Skip idle tracking on auth pages — no session to manage
    if (pathname === '/signin' || pathname === '/signup') {
      return;
    }

    function clearIdleTimer() {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    }

    async function handleIdle() {
      if (signingOutRef.current) return;
      signingOutRef.current = true;

      try {
        const result = await signOutDueToIdle();
        if (result.signedOut) {
          toast('Signed out due to inactivity');
          router.push('/signin');
          router.refresh();
        }
      } finally {
        signingOutRef.current = false;
      }
    }

    function scheduleIdleTimer() {
      clearIdleTimer();
      idleTimerRef.current = setTimeout(() => {
        void handleIdle();
      }, IDLE_TIMEOUT_MS);
    }

    function refreshIfNeeded() {
      const now = Date.now();
      if (now - lastRefreshRef.current < REFRESH_INTERVAL_MS) {
        return;
      }
      lastRefreshRef.current = now;
      void touchSession();
    }

    function onActivity() {
      if (signingOutRef.current) return;
      scheduleIdleTimer();
      refreshIfNeeded();
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        onActivity();
      }
    }

    // Initial schedule + opportunistic refresh for already-open sessions
    scheduleIdleTimer();
    refreshIfNeeded();

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, onActivity, { passive: true });
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearIdleTimer();
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, onActivity);
      }
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pathname, router]);

  return <>{children}</>;
}
