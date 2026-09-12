import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export default function Button({
  className,
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]'

  const variants = {
    primary:
      'bg-gradient-to-b from-violet-500 to-violet-600 text-white shadow-[0_1px_2px_rgba(109,40,217,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] hover:from-violet-600 hover:to-violet-700 hover:shadow-glow',
    secondary:
      'bg-gray-200/80 text-gray-900 hover:bg-gray-300 dark:bg-dark-high dark:text-gray-100 dark:hover:bg-dark-border-medium dark:border dark:border-dark-border-default',
    outline:
      'border border-black/[0.08] bg-white/70 backdrop-blur-sm hover:bg-white hover:border-black/[0.14] dark:border-white/[0.1] dark:bg-dark-high/50 dark:hover:bg-dark-high dark:hover:border-white/[0.16] dark:text-gray-100',
    ghost:
      'bg-transparent hover:bg-black/[0.05] dark:hover:bg-white/[0.06] dark:text-gray-100',
    danger:
      'bg-gradient-to-b from-red-500 to-red-600 text-white shadow-[0_1px_2px_rgba(185,28,28,0.3)] hover:from-red-600 hover:to-red-700',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
    md: 'h-10 px-4 py-2 text-sm rounded-xl gap-2',
    lg: 'h-12 px-6 py-3 text-base rounded-xl gap-2',
  }

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        isLoading && 'opacity-70 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  )
}
