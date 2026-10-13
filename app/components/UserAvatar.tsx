import { UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type UserAvatarProps = {
  name: string;
  image: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizes = {
  sm: 'h-8 w-8 rounded-xl',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-20 w-20 rounded-2xl',
} as const;

const iconSizes = {
  sm: 16,
  md: 18,
  lg: 32,
} as const;

export default function UserAvatar({
  name,
  image,
  size = 'sm',
  className,
}: UserAvatarProps) {
  const frame = sizes[size];

  if (image) {
    return (
      // OAuth / Blob avatars are remote URLs; img avoids next/image remote config.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={image}
        alt={name}
        className={cn(
          frame,
          'object-cover ring-1 ring-black/[0.06] dark:ring-white/[0.1]',
          className,
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        frame,
        'flex shrink-0 items-center justify-center bg-violet-100 text-violet-600 dark:bg-violet-950/60 dark:text-violet-300',
        className,
      )}
      aria-hidden
    >
      <UserIcon size={iconSizes[size]} />
    </span>
  );
}
