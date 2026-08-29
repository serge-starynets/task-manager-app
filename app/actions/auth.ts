'use server';

import { headers } from 'next/headers';
import { signIn as authSignIn, signOut as authSignOut } from '@/auth';
import { createUser, getUserByEmail, normalizeEmail } from '@/lib/users';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSession } from '@/lib/session';
import { SignInSchema, SignUpSchema } from '@/lib/validations/auth';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

export type { SignInData, SignUpData } from '@/lib/validations/auth';

const AUTH_RATE_LIMIT = 10; // attempts
const AUTH_RATE_WINDOW_MS = 15 * 60 * 1000;

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headerList.get('x-real-ip') ?? 'unknown';
}

/** Throttle by IP and by target email so neither can be brute-forced alone. */
async function checkAuthRateLimit(
  scope: 'signin' | 'signup',
  email: string,
): Promise<boolean> {
  const ip = await getClientIp();
  const ipResult = checkRateLimit(
    `${scope}:ip:${ip}`,
    AUTH_RATE_LIMIT,
    AUTH_RATE_WINDOW_MS,
  );
  const emailResult = checkRateLimit(
    `${scope}:email:${normalizeEmail(email)}`,
    AUTH_RATE_LIMIT,
    AUTH_RATE_WINDOW_MS,
  );
  return ipResult.ok && emailResult.ok;
}

const RATE_LIMITED_RESPONSE: ActionResponse = {
  success: false,
  message: 'Too many attempts. Please try again later.',
  error: 'Rate limited',
};

const GENERIC_SIGNIN_FAILURE: ActionResponse = {
  success: false,
  message: 'Invalid email or password',
  errors: {
    email: ['Invalid email or password'],
  },
};

export type ActionResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
};

export async function signIn(formData: FormData): Promise<ActionResponse> {
  try {
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const validationResult = SignInSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      };
    }

    const allowed = await checkAuthRateLimit('signin', data.email);
    if (!allowed) {
      return RATE_LIMITED_RESPONSE;
    }

    // One generic failure for every case (unknown email, OAuth-only account,
    // wrong password) so responses don't reveal account state.
    const user = await getUserByEmail(data.email);
    if (!user?.password) {
      return GENERIC_SIGNIN_FAILURE;
    }

    const result = await authSignIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      return GENERIC_SIGNIN_FAILURE;
    }

    return {
      success: true,
      message: 'Signed in successfully',
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      message: 'An error occurred while signing in',
      error: 'Failed to sign in',
    };
  }
}

export async function signUp(formData: FormData): Promise<ActionResponse> {
  try {
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    const validationResult = SignUpSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
      };
    }

    const allowed = await checkAuthRateLimit('signup', data.email);
    if (!allowed) {
      return RATE_LIMITED_RESPONSE;
    }

    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      // Same message for credential and OAuth accounts — don't reveal how
      // (or whether) the email signed up.
      const message =
        'This email cannot be used. If you already have an account, sign in instead.';

      return {
        success: false,
        message,
        errors: {
          email: [message],
        },
      };
    }

    const user = await createUser(data.email, data.password);
    if (!user) {
      return {
        success: false,
        message: 'Failed to create user',
        error: 'Failed to create user',
      };
    }

    const result = await authSignIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      return {
        success: false,
        message: 'Account created but sign-in failed. Please sign in manually.',
        error: result.error,
      };
    }

    return {
      success: true,
      message: 'Account created successfully',
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      message: 'An error occurred while creating your account',
      error: 'Failed to create account',
    };
  }
}

export async function signOut(): Promise<void> {
  try {
    await authSignOut({ redirectTo: '/signin' });
  } catch (error) {
    // Auth.js signs out by calling Next.js `redirect()`, which throws.
    if (isRedirectError(error)) throw error;
    console.error('Sign out error:', error);
    throw new Error('Failed to sign out');
  }
}

/** Extend the session while the user is active (sliding idle window). */
export async function touchSession(): Promise<{ ok: boolean }> {
  try {
    const session = await getSession();
    return { ok: Boolean(session) };
  } catch (error) {
    console.error('Touch session error:', error);
    return { ok: false };
  }
}

/**
 * Clear the session after client-side idle timeout.
 * Does not redirect when there is no session (e.g. public pages).
 */
export async function signOutDueToIdle(): Promise<{ signedOut: boolean }> {
  try {
    const session = await getSession();
    if (!session) {
      return { signedOut: false };
    }
    await authSignOut({ redirect: false });
    return { signedOut: true };
  } catch (error) {
    console.error('Idle sign out error:', error);
    return { signedOut: false };
  }
}
