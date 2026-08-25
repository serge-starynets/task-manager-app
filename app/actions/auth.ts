'use server';

import { z } from 'zod';
import { signIn as authSignIn, signOut as authSignOut } from '@/auth';
import { createUser, getUserByEmail } from '@/lib/users';
import { getSession } from '@/lib/session';
import { isRedirectError } from 'next/dist/client/components/redirect-error';

const SignInSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const SignUpSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

export type SignInData = z.infer<typeof SignInSchema>;
export type SignUpData = z.infer<typeof SignUpSchema>;

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

    const user = await getUserByEmail(data.email);
    if (!user) {
      return {
        success: false,
        message: 'Invalid email or password',
        errors: {
          email: ['Invalid email or password'],
        },
      };
    }

    if (!user.password) {
      return {
        success: false,
        message: 'This account uses Google sign-in',
        errors: {
          email: ['Sign in with Google instead'],
        },
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
        message: 'Invalid email or password',
        errors: {
          password: ['Invalid email or password'],
        },
      };
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

    const existingUser = await getUserByEmail(data.email);
    if (existingUser) {
      const message = existingUser.password
        ? 'User with this email already exists'
        : 'This email is registered with Google. Sign in with Google instead.';

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
