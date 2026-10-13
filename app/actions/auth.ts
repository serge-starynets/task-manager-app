'use server';

import { AuthError } from 'next-auth';
import { signIn as authSignIn, signOut as authSignOut } from '@/auth';
import { createUser, getUserByEmail } from '@/lib/users';
import { checkAuthRateLimit } from '@/lib/auth/rate-limit';
import { verifyPassword } from '@/lib/password';
import { getSession } from '@/lib/session';
import { SignInSchema, SignUpSchema } from '@/lib/validations/auth';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

export type { SignInData, SignUpData } from '@/lib/validations/auth';

const RATE_LIMITED_RESPONSE: ActionResponse = {
  success: false,
  message: 'Too many attempts. Please try again later.',
  error: 'Rate limited',
};

const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password.';

function genericSignInFailure(email?: string): ActionResponse {
  return {
    success: false,
    message: INVALID_CREDENTIALS_MESSAGE,
    errors: {
      email: [INVALID_CREDENTIALS_MESSAGE],
    },
    fields: email ? { email } : undefined,
  };
}

function isCredentialsFailure(error: unknown): boolean {
  return (
    error instanceof AuthError &&
    (error.type === 'CredentialsSignin' || error.name === 'CredentialsSignin')
  );
}

export type ActionResponse = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  error?: string;
  /** Preserve non-sensitive fields across failed submissions. */
  fields?: { email?: string };
};

export async function signIn(formData: FormData): Promise<ActionResponse> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  try {
    const data = { email, password };

    const validationResult = SignInSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
        fields: { email },
      };
    }

    const allowed = await checkAuthRateLimit('signin', data.email);
    if (!allowed) {
      return { ...RATE_LIMITED_RESPONSE, fields: { email: data.email } };
    }

    // One generic failure for every case (unknown email, OAuth-only account,
    // wrong password) so responses don't reveal account state.
    const user = await getUserByEmail(data.email);
    if (!user?.password) {
      return genericSignInFailure(data.email);
    }

    const passwordOk = await verifyPassword(data.password, user.password);
    if (!passwordOk) {
      return genericSignInFailure(data.email);
    }

    await authSignIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    return {
      success: true,
      message: 'Signed in successfully',
    };
  } catch (error) {
    if (isCredentialsFailure(error)) {
      return genericSignInFailure(email);
    }
    console.error('Sign in error:', error);
    return {
      success: false,
      message: 'An error occurred while signing in',
      error: 'Failed to sign in',
      fields: email ? { email } : undefined,
    };
  }
}

export async function signUp(formData: FormData): Promise<ActionResponse> {
  const email = String(formData.get('email') ?? '');

  try {
    const data = {
      email,
      password: formData.get('password') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    };

    const validationResult = SignUpSchema.safeParse(data);
    if (!validationResult.success) {
      return {
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.flatten().fieldErrors,
        fields: { email },
      };
    }

    const allowed = await checkAuthRateLimit('signup', data.email);
    if (!allowed) {
      return { ...RATE_LIMITED_RESPONSE, fields: { email: data.email } };
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
        fields: { email: data.email },
      };
    }

    const user = await createUser(data.email, data.password);
    if (!user) {
      return {
        success: false,
        message: 'Failed to create user',
        error: 'Failed to create user',
        fields: { email: data.email },
      };
    }

    try {
      await authSignIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });
    } catch (signInError) {
      if (isCredentialsFailure(signInError)) {
        return {
          success: false,
          message: 'Account created but sign-in failed. Please sign in manually.',
          error: 'CredentialsSignin',
          fields: { email: data.email },
        };
      }
      throw signInError;
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
      fields: email ? { email } : undefined,
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
