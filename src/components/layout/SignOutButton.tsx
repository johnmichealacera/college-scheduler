'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { cn } from '../../lib/utils'

export function SignOutButton({ collapsed }: { collapsed?: boolean }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/sign-in' })}
      title={collapsed ? 'Sign out' : undefined}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors',
        collapsed && 'md:justify-center md:px-2'
      )}
    >
      <LogOut size={16} className="shrink-0" />
      <span className={cn('whitespace-nowrap transition-all duration-300', collapsed && 'md:hidden')}>
        Sign out
      </span>
    </button>
  )
}
