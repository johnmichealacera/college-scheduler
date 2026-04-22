import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, BookOpen, DoorOpen, Calendar } from 'lucide-react'
import { cn } from '../../lib/utils'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/teachers', icon: Users, label: 'Teachers' },
  { to: '/subjects', icon: BookOpen, label: 'Subjects' },
  { to: '/rooms', icon: DoorOpen, label: 'Rooms' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
]

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-full w-56 bg-gray-900 text-white flex flex-col z-20">
      <div className="px-6 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Calendar size={20} className="text-blue-400" />
          <span className="font-semibold text-sm tracking-wide">ClassSync</span>
        </div>
        <p className="text-xs text-gray-400 mt-0.5">School Scheduler</p>
      </div>
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
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
