import { Link } from 'react-router-dom'
import { Users, BookOpen, DoorOpen, Calendar, AlertTriangle, ArrowRight } from 'lucide-react'
import { useTeachers } from '../hooks/useTeachers'
import { useSubjects } from '../hooks/useSubjects'
import { useRooms } from '../hooks/useRooms'
import { useSchedule } from '../hooks/useSchedule'
import { timesOverlap } from '../lib/utils'
import { DayBadge } from '../components/ui/Badge'
import { formatTime } from '../lib/utils'

function StatCard({
  label,
  value,
  icon: Icon,
  to,
  color,
}: {
  label: string
  value: number | undefined
  icon: React.ElementType
  to: string
  color: string
}) {
  return (
    <Link
      to={to}
      className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all group flex items-center gap-4"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div className="flex-1">
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
      <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
    </Link>
  )
}

export function Dashboard() {
  const { data: teachers } = useTeachers()
  const { data: subjects } = useSubjects()
  const { data: rooms } = useRooms()
  const { data: entries = [] } = useSchedule()

  const conflicts = entries.filter((e, _, arr) =>
    arr.some(
      (o) =>
        o.id !== e.id &&
        o.day === e.day &&
        (o.teacher_id === e.teacher_id || o.room_id === e.room_id) &&
        timesOverlap(e.start_time, e.end_time, o.start_time, o.end_time)
    )
  )

  const todayDay = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date()) as string
  const todayEntries = entries.filter((e) => e.day === todayDay).sort((a, b) => a.start_time.localeCompare(b.start_time))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your school schedule</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Teachers" value={teachers?.length} icon={Users} to="/teachers" color="bg-blue-100 text-blue-700" />
        <StatCard label="Subjects" value={subjects?.length} icon={BookOpen} to="/subjects" color="bg-purple-100 text-purple-700" />
        <StatCard label="Rooms" value={rooms?.length} icon={DoorOpen} to="/rooms" color="bg-green-100 text-green-700" />
        <StatCard label="Scheduled Classes" value={entries.length} icon={Calendar} to="/schedule" color="bg-amber-100 text-amber-700" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Conflicts panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Conflicts</h2>
            {conflicts.length > 0 && (
              <span className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded-full">
                <AlertTriangle size={12} />
                {conflicts.length} found
              </span>
            )}
          </div>
          {conflicts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 text-gray-400">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <span className="text-green-600 text-lg">✓</span>
              </div>
              <p className="text-sm">No conflicts detected</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {conflicts.slice(0, 5).map((e) => (
                <li key={e.id} className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-red-800">{e.subject?.name ?? 'Unknown'}</p>
                    <p className="text-red-600 text-xs">{e.teacher?.name} · {e.room?.name} · {e.day} {formatTime(e.start_time)}</p>
                  </div>
                </li>
              ))}
              {conflicts.length > 5 && (
                <p className="text-xs text-gray-400 text-center">+{conflicts.length - 5} more</p>
              )}
            </ul>
          )}
        </div>

        {/* Today's schedule */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Today — {todayDay}</h2>
            <span className="text-xs text-gray-400">{todayEntries.length} classes</span>
          </div>
          {todayEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-28 text-gray-400">
              <Calendar size={24} className="mb-2" />
              <p className="text-sm">No classes today</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {todayEntries.map((e) => (
                <li key={e.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className="text-xs text-gray-500 w-24 shrink-0">
                    {formatTime(e.start_time)} – {formatTime(e.end_time)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.subject?.name}</p>
                    <p className="text-xs text-gray-400 truncate">{e.teacher?.name} · {e.room?.name}</p>
                  </div>
                  <DayBadge day={e.day} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
