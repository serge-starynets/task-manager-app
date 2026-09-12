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
        'flex items-center px-2.5 py-2 text-sm font-medium rounded-xl transition-all duration-200 ease-smooth group',
        isActive
          ? 'bg-violet-100/80 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200'
          : 'text-gray-700 hover:bg-black/[0.04] dark:text-gray-300 dark:hover:bg-white/[0.05]'
      )}
    >
      <span
        className={cn(
          'mr-3 shrink-0 transition-colors',
          isActive
            ? 'text-violet-600 dark:text-violet-300'
            : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
        )}
      >
        {icon}
      </span>
      <span className="hidden md:inline truncate">{label}</span>
    </Link>
  )
}
