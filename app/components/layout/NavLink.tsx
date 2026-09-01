import { cn } from '@/lib/utils'
import Link from 'next/link'

interface NavLinkProps {
  href: string
  icon: React.ReactNode
  label: string
  isActive?: boolean
}

export default function NavLink({ href, icon, label, isActive }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center px-2.5 py-2 text-sm font-medium rounded-lg transition-all duration-200 ease-smooth group',
        isActive
          ? 'bg-purple-100/80 text-purple-700 shadow-sm dark:bg-purple-950/60 dark:text-purple-200 dark:shadow-none'
          : 'text-gray-700 hover:bg-gray-200/60 dark:text-gray-300 dark:hover:bg-dark-high'
      )}
    >
      <span
        className={cn(
          'mr-3 shrink-0 transition-colors',
          isActive
            ? 'text-purple-600 dark:text-purple-300'
            : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
        )}
      >
        {icon}
      </span>
      <span className="hidden md:inline truncate">{label}</span>
    </Link>
  )
}
