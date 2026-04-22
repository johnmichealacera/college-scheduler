import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, DoorOpen, Calendar, X } from 'lucide-react'
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
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full w-56 bg-gray-900 text-white flex flex-col z-20 transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-blue-400" />
            <span className="font-semibold text-sm tracking-wide">ClassSync</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors md:hidden"
            aria-label="Close navigation"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">School Scheduler</p>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-6 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">v1.0 — School Admin</p>
      </div>
    </aside>
  )
}
