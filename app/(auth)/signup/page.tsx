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
import { signUp, ActionResponse } from '@/app/actions/auth';
import GoogleSignInButton from '@/app/components/auth/GoogleSignInButton';
import AuthDivider from '@/app/components/auth/AuthDivider';
import BrandMark from '@/app/components/BrandMark';
import ThemeToggle from '@/app/components/ThemeToggler';

const initialState: ActionResponse = {
  success: false,
  message: '',
  errors: undefined,
};

export default function SignUpPage() {
  const router = useRouter();

  const handleFormSubmit = async (
    prevState: ActionResponse,
    formData: FormData,
  ) => {
    try {
      const result = await signUp(formData);
      if (result.success) {
        toast.success('Account created successfully');
        router.push('/dashboard');
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
    <div className="atmosphere relative flex min-h-screen flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="mb-6 flex justify-center">
          <BrandMark size="lg" />
        </Link>
        <h2 className="text-center text-lg font-medium text-gray-600 dark:text-gray-300">
          Create a new account
        </h2>

        <div className="mt-8">
          <div className="rounded-2xl border border-black/[0.06] bg-white/90 px-4 py-8 shadow-lift dark:border-white/[0.08] dark:bg-dark-high dark:shadow-none sm:px-10">
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
                  autoComplete="new-password"
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

              <FormGroup>
                <FormLabel htmlFor="confirmPassword">Confirm Password</FormLabel>
                <FormInput
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={isPending}
                  aria-describedby="confirmPassword-error"
                  className={
                    state?.errors?.confirmPassword ? 'border-red-500' : ''
                  }
                />
                {state?.errors?.confirmPassword && (
                  <p id="confirmPassword-error" className="text-sm text-red-500">
                    {state.errors.confirmPassword[0]}
                  </p>
                )}
              </FormGroup>

              <div>
                <Button type="submit" className="w-full" isLoading={isPending}>
                  Sign up
                </Button>
              </div>
            </Form>

            <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                href="/signin"
                className="font-semibold text-violet-700 hover:text-violet-800 dark:text-violet-300 dark:hover:text-violet-200"
              >
                Sign in
              </Link>
            </p>
            <p className="mt-2 text-center">
              <Link
                href="/"
                className="text-sm font-medium text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
