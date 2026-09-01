'use client';

import { useActionState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/app/components/ui/Button';
import {
  Form,
  FormGroup,
  FormLabel,
  FormInput,
  FormError,
} from '@/app/components/ui/Form';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { signIn, ActionResponse } from '@/app/actions/auth';
import GoogleSignInButton from '@/app/components/auth/GoogleSignInButton';
import AuthDivider from '@/app/components/auth/AuthDivider';

const initialState: ActionResponse = {
  success: false,
  message: '',
  errors: undefined,
};

export default function SignInPage() {
  const router = useRouter();

  const handleFormSubmit = async (
    prevState: ActionResponse,
    formData: FormData,
  ) => {
    try {
      const result = await signIn(formData);

      // Handle successful submission
      if (result.success) {
        toast.success('Signed in successfully');
        router.push('/dashboard');
        router.refresh();
      }

      return result;
    } catch (err) {
      return {
        success: false,
        message: (err as Error).message || 'An error occurred',
        errors: undefined,
      };
    }
  };

  // Use useActionState hook for the form submission action
  const [state, formAction, isPending] = useActionState<
    ActionResponse,
    FormData
  >(handleFormSubmit, initialState);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Task Manager
        </h1>
        <h2 className="mt-2 text-center text-lg font-medium text-gray-600 dark:text-gray-300">
          Sign in to your account
        </h2>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-dark-high py-8 px-4 shadow-soft sm:rounded-xl sm:px-10 border border-gray-200/80 dark:border-dark-border-default dark:shadow-none">
            <GoogleSignInButton />
            <AuthDivider />

        <Form action={formAction} className="space-y-6">
          {state?.message && !state.success && (
            <FormError>{state.message}</FormError>
          )}

          <FormGroup>
            <FormLabel htmlFor="email">Email</FormLabel>
            <FormInput
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending}
              aria-describedby="email-error"
              className={state?.errors?.email ? 'border-red-500' : ''}
            />
            {state?.errors?.email && (
              <p id="email-error" className="text-sm text-red-500">
                {state.errors.email[0]}
              </p>
            )}
          </FormGroup>

          <FormGroup>
            <FormLabel htmlFor="password">Password</FormLabel>
            <FormInput
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={isPending}
              aria-describedby="password-error"
              className={state?.errors?.password ? 'border-red-500' : ''}
            />
            {state?.errors?.password && (
              <p id="password-error" className="text-sm text-red-500">
                {state.errors.password[0]}
              </p>
            )}
          </FormGroup>

          <div>
            <Button type="submit" className="w-full" isLoading={isPending}>
              Sign in
            </Button>
          </div>
        </Form>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-dark-high py-8 px-4 shadow-soft sm:rounded-xl sm:px-10 border border-gray-200/80 dark:border-dark-border-default dark:shadow-none">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-gray-900 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100"
              >
                Sign up
              </Link>
            </p>
            <p>
              <Link
                href="/"
                className="font-medium text-gray-400 hover:text-gray-200"
              >
                Go to Home Page
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
