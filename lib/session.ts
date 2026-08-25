import { cache } from 'react';
import { auth } from '@/auth';

export const getSession = cache(async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    return { userId: session.user.id };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('During prerendering, `headers()` rejects') ||
        error.message.includes('Dynamic server usage'))
    ) {
      return null;
    }

    console.error('Error getting session:', error);
    return null;
  }
});
