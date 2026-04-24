import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, DoorOpen, Calendar, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/teachers', icon: Users, label: 'Teachers' },
  { to: '/subjects', icon: BookOpen, label: 'Subjects' },
  { to: '/rooms', icon: DoorOpen, label: 'Rooms' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-gray-900 text-white flex flex-col z-20 transition-all duration-300 overflow-hidden',
        collapsed ? 'w-56 md:w-14' : 'w-56',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      {/* Header */}
      <div className={cn('border-b border-gray-700 py-5 transition-all duration-300', collapsed ? 'md:px-2 px-6' : 'px-6')}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar size={20} className="text-blue-400 shrink-0" />
            <span className={cn('font-semibold text-sm tracking-wide truncate transition-all duration-300', collapsed && 'md:hidden')}>
              ClassSync
            </span>
          </div>
          <div className="flex items-center shrink-0">
            {/* Desktop collapse toggle */}
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
              aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
            {/* Mobile close */}
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors md:hidden"
              aria-label="Close navigation"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        <p className={cn('text-xs text-gray-400 mt-0.5 transition-all duration-300', collapsed && 'md:hidden')}>
          School Scheduler
        </p>
      </div>

      {/* Nav */}
      <nav className={cn('flex-1 py-4 flex flex-col gap-1 transition-all duration-300', collapsed ? 'md:px-1 px-3' : 'px-3')}>
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                collapsed && 'md:justify-center md:px-2',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <Icon size={16} className="shrink-0" />
            <span className={cn('whitespace-nowrap transition-all duration-300', collapsed && 'md:hidden')}>
              {label}
            </span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn('border-t border-gray-700 transition-all duration-300', collapsed ? 'md:px-2 md:py-3 px-6 py-4' : 'px-6 py-4')}>
        <p className={cn('text-xs text-gray-500 truncate transition-all duration-300', collapsed && 'md:hidden')}>
          v1.0 — School Admin
        </p>
      </div>
    </aside>
  )
}
