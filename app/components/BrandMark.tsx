import { CheckSquareIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const sizes = {
  sm: { box: 'h-7 w-7 rounded-lg', icon: 14, word: 'text-base' },
  md: { box: 'h-8 w-8 rounded-[0.65rem]', icon: 16, word: 'text-[0.95rem]' },
  lg: { box: 'h-11 w-11 rounded-xl', icon: 22, word: 'text-xl' },
} as const;

export default function BrandMark({
  className,
  showWordmark = true,
  size = 'md',
}: {
  className?: string;
  showWordmark?: boolean;
  size?: keyof typeof sizes;
}) {
  const { box, icon, word } = sizes[size];

  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2.5', className)}>
      <span
        className={cn(
          'flex shrink-0 items-center justify-center bg-gradient-to-br from-violet-500 to-violet-700 text-white shadow-[0_1px_2px_rgba(109,40,217,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]',
          box,
        )}
      >
        <CheckSquareIcon size={icon} strokeWidth={2.5} />
      </span>
      {showWordmark ? (
        <span
          className={cn(
            'truncate font-semibold tracking-tight text-gray-900 dark:text-white',
            word,
          )}
        >
          Projenda
        </span>
      ) : (
        <span className="sr-only">Projenda</span>
      )}
    </span>
  );
}
