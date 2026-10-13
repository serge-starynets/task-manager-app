'use client';

import { useActionState, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import type { User } from '@/db/schema';
import {
  removeProfileAvatar,
  setProfileAvatar,
  updateProfile,
  type ProfileActionResponse,
} from '@/app/actions/profile';
import UserAvatar from '@/app/components/UserAvatar';
import Button from '@/app/components/ui/Button';
import {
  Form,
  FormDescription,
  FormError,
  FormGroup,
  FormInput,
  FormLabel,
} from '@/app/components/ui/Form';
import { MAX_AVATAR_BYTES, validateAvatarFile } from '@/lib/avatar';
import { resolveUserDisplay } from '@/lib/user-display';
import { uploadAvatarFile } from '@/lib/upload-avatar';
import { MAX_USERNAME_LENGTH } from '@/lib/validations/profile';
import { cn } from '@/lib/utils';

type ProfileFormProps = {
  user: User;
  hasGoogleAccount: boolean;
};

const initialState: ProfileActionResponse = {
  success: false,
  message: '',
};

export default function ProfileForm({
  user,
  hasGoogleAccount,
}: ProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(user.username ?? '');
  const [preferCustom, setPreferCustom] = useState(user.preferCustomProfile);
  const [customImage, setCustomImage] = useState(user.customImage);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

  const previewUser = {
    ...user,
    username,
    preferCustomProfile: preferCustom,
    customImage,
  };
  const preview = resolveUserDisplay(previewUser);

  const [state, formAction, isPending] = useActionState<
    ProfileActionResponse,
    FormData
  >(async (_prev, formData) => {
    const nextUsername = String(formData.get('username') ?? '');
    const nextPrefer = formData.get('preferCustomProfile') === 'true';

    const result = await updateProfile({
      username: nextUsername,
      preferCustomProfile: nextPrefer,
    });

    if (result.success) {
      toast.success(result.message);
      startTransition(() => router.refresh());
    } else {
      toast.error(result.message);
    }
    return result;
  }, initialState);

  async function onPickAvatar(file: File | null) {
    if (!file) return;

    const validation = validateAvatarFile(file);
    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    try {
      const uploaded = await uploadAvatarFile(file, user.id);
      const result = await setProfileAvatar({
        url: uploaded.url,
        pathname: uploaded.pathname,
      });
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setCustomImage(uploaded.url);
      toast.success('Avatar updated');
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload avatar',
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function onRemoveAvatar() {
    setUploading(true);
    try {
      const result = await removeProfileAvatar();
      if (!result.success) {
        toast.error(result.message);
        return;
      }
      setCustomImage(null);
      toast.success('Avatar removed');
      startTransition(() => router.refresh());
    } catch {
      toast.error('Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <UserAvatar
          name={username.trim() || user.name?.trim() || user.email}
          image={customImage}
          size="lg"
        />
        <div className="min-w-0 space-y-2">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Profile photo
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            JPG or PNG, max {Math.round(MAX_AVATAR_BYTES / 1024)} KB. Shown when
            you choose to display your username.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(event) =>
                void onPickAvatar(event.target.files?.[0] ?? null)
              }
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              isLoading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload photo
            </Button>
            {customImage ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={uploading}
                onClick={() => void onRemoveAvatar()}
              >
                Remove
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Form action={formAction}>
        <FormGroup>
          <FormLabel htmlFor="username">Username</FormLabel>
          <FormInput
            id="username"
            name="username"
            value={username}
            maxLength={MAX_USERNAME_LENGTH}
            onChange={(event) =>
              setUsername(event.target.value.slice(0, MAX_USERNAME_LENGTH))
            }
            placeholder="e.g. Alex"
            autoComplete="nickname"
          />
          <FormDescription>
            {username.length}/{MAX_USERNAME_LENGTH} characters
          </FormDescription>
          {state.errors?.username?.[0] ? (
            <FormError>{state.errors.username[0]}</FormError>
          ) : null}
        </FormGroup>

        <FormGroup>
          <FormLabel>Display preference</FormLabel>
          <div className="space-y-2">
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors',
                preferCustom
                  ? 'border-violet-300 bg-violet-50/70 dark:border-violet-700 dark:bg-violet-950/30'
                  : 'border-black/[0.12] hover:bg-black/[0.02] dark:border-white/[0.14] dark:hover:bg-white/[0.03]',
              )}
            >
              <input
                type="radio"
                name="preferCustomProfile"
                value="true"
                checked={preferCustom}
                onChange={() => setPreferCustom(true)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Use my username
                </span>
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                  Show your username and custom avatar everywhere in the app.
                </span>
              </span>
            </label>

            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors',
                !preferCustom
                  ? 'border-violet-300 bg-violet-50/70 dark:border-violet-700 dark:bg-violet-950/30'
                  : 'border-black/[0.12] hover:bg-black/[0.02] dark:border-white/[0.14] dark:hover:bg-white/[0.03]',
                !hasGoogleAccount && 'opacity-70',
              )}
            >
              <input
                type="radio"
                name="preferCustomProfile"
                value="false"
                checked={!preferCustom}
                onChange={() => setPreferCustom(false)}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Use my Google account
                </span>
                <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                  {hasGoogleAccount
                    ? `Show ${user.name?.trim() || 'your Google name'} and Google photo.`
                    : 'Sign in with Google to use your Google name and photo. Your account name will be used for now.'}
                </span>
              </span>
            </label>
          </div>
        </FormGroup>

        <div className="rounded-xl border border-black/[0.1] bg-black/[0.02] px-3 py-3 dark:border-white/[0.12] dark:bg-white/[0.03]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
            Preview
          </p>
          <div className="mt-2 flex items-center gap-2.5">
            <UserAvatar name={preview.name} image={preview.image} size="sm" />
            <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">
              {preview.name}
            </span>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" isLoading={isPending} disabled={uploading}>
            Save profile
          </Button>
        </div>
      </Form>
    </div>
  );
}
