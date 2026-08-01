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
    'inline-flex items-center justify-center font-medium transition-all duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]'

  const variants = {
    primary:
      'bg-purple-600 text-white shadow-sm hover:bg-purple-700 hover:shadow-md active:bg-purple-800',
    secondary:
      'bg-gray-200/80 text-gray-900 hover:bg-gray-300 dark:bg-dark-high dark:text-gray-100 dark:hover:bg-dark-border-medium dark:border dark:border-dark-border-default',
    outline:
      'border border-gray-300 bg-white/60 backdrop-blur-sm hover:bg-white hover:border-gray-400 dark:border-dark-border-medium dark:bg-dark-high/50 dark:hover:bg-dark-high dark:hover:border-dark-border-strong dark:text-gray-100',
    ghost:
      'bg-transparent hover:bg-gray-200/70 dark:hover:bg-dark-high dark:text-gray-100',
    danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md',
  }

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-lg gap-1.5',
    md: 'h-10 px-4 py-2 text-sm rounded-lg gap-2',
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
