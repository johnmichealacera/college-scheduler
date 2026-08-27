import { useState, type ReactNode } from 'react'
import { Plus, Filter, FileDown } from 'lucide-react'
import { useDspcSchedule, useDeleteDspcScheduleEntry } from '../../hooks/useDspcSchedule'
import { useTeachers } from '../../hooks/useTeachers'
import { useRooms } from '../../hooks/useRooms'
import { Button } from '../ui/Button'
import { MultiCombobox } from '../ui/MultiCombobox'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import { DatedTimetable } from './DatedTimetable'
import { DspcScheduleForm } from './DspcScheduleForm'
import { ScheduleViewSwitcher } from './ScheduleViewSwitcher'
import { PageHeader } from '../layout/PageHeader'
import { dspcToScheduleEntry } from '../../lib/dspc'
import {
  CONTEST_CATEGORIES,
  DEFAULT_DIVISION,
  LANGUAGE_LABELS,
  LANGUAGE_OPTIONS,
  LEVEL_LABELS,
  LEVEL_OPTIONS,
} from '../../types'
import type { ContestCategory, DspcScheduleEntry, LanguageOption, LevelOption } from '../../types'

interface Props {
  switcher?: ReactNode
}

export function DspcScheduleView({ switcher = <ScheduleViewSwitcher /> }: Props) {
  const { data: entries = [], isLoading, error } = useDspcSchedule()
  const { data: teachers = [] } = useTeachers()
  const { data: rooms = [] } = useRooms()
  const deleteEntry = useDeleteDspcScheduleEntry()

  const [modal, setModal] = useState<'add' | DspcScheduleEntry | null>(null)
  const [filterFacilitators, setFilterFacilitators] = useState<string[]>([])
  const [filterRooms, setFilterRooms] = useState<string[]>([])
  const [filterContests, setFilterContests] = useState<ContestCategory[]>([])
  const [filterLevels, setFilterLevels] = useState<LevelOption[]>([])
  const [filterLanguages, setFilterLanguages] = useState<LanguageOption[]>([])
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [showVacantInPDF, setShowVacantInPDF] = useState(false)

  const toggleLevel = (level: LevelOption) =>
    setFilterLevels((prev) => prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level])

  const toggleLanguage = (language: LanguageOption) =>
    setFilterLanguages((prev) => prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language])

  const handleDelete = (id: string) => {
    if (confirm('Remove this DSPC contest slot? School class schedules will not be changed.')) deleteEntry.mutate(id)
  }

  const matchesFilters = (e: DspcScheduleEntry) => {
    if (filterLevels.length > 0 && !filterLevels.includes(e.level)) return false
    if (filterLanguages.length > 0 && !filterLanguages.includes(e.language)) return false
    if (filterFacilitators.length > 0 && !filterFacilitators.includes(e.facilitator_id)) return false
    if (filterRooms.length > 0 && !filterRooms.includes(e.room_id)) return false
    if (filterContests.length > 0 && !filterContests.includes(e.contest)) return false
    if (filterDateFrom && e.event_date < filterDateFrom) return false
    if (filterDateTo && e.event_date > filterDateTo) return false
    return true
  }

  const visibleEntries = entries.filter(matchesFilters)

  const conflictCount = entries.filter((e, _, arr) =>
    arr.some(
      (o) =>
        o.id !== e.id &&
        o.event_date === e.event_date &&
        (o.facilitator_id === e.facilitator_id || o.room_id === e.room_id) &&
        e.start_time < o.end_time && o.start_time < e.end_time
    )
  ).length

  const facilitatorOptions = teachers.map((t) => ({ value: t.id, label: t.name }))
  const roomOptions = rooms.map((r) => ({ value: r.id, label: r.name }))
  const contestOptions = CONTEST_CATEGORIES.map((c) => ({ value: c, label: c }))

  const handleExportPDF = async () => {
    const filtered = visibleEntries.map(dspcToScheduleEntry)
    const activeFacilitatorNames =
      filterFacilitators.length > 0
        ? teachers.filter((t) => filterFacilitators.includes(t.id)).map((t) => t.name).join(', ')
        : undefined
    const activeRoomNames =
      filterRooms.length > 0
        ? rooms.filter((r) => filterRooms.includes(r.id)).map((r) => r.name).join(', ')
        : undefined
    const activeContestNames = filterContests.length > 0 ? filterContests.join(', ') : undefined
    const activeLevelNames = filterLevels.length > 0 ? filterLevels.map((l) => LEVEL_LABELS[l]).join(', ') : undefined
    const activeLanguageNames = filterLanguages.length > 0 ? filterLanguages.map((l) => LANGUAGE_LABELS[l]).join(', ') : undefined
    const dateRange = [filterDateFrom, filterDateTo].filter(Boolean).join(' – ') || undefined
    const label = [activeContestNames, activeLanguageNames, activeLevelNames, dateRange, activeFacilitatorNames, activeRoomNames].filter(Boolean).join(' · ')

    const pdfRooms = filterRooms.length > 0 ? rooms.filter((r) => filterRooms.includes(r.id)) : rooms

    const { generateSchedulePDF } = await import('../../lib/generateSchedulePDF')
    generateSchedulePDF(filtered, {
      filterLabel: label || undefined,
      showVacant: showVacantInPDF,
      allEntries: entries.map(dspcToScheduleEntry),
      rooms: pdfRooms,
      reportTitle: `ClassSync — DSPC Contest Schedule (${DEFAULT_DIVISION})`,
      countNoun: 'contest',
      headings: { subject: 'Contest', teacher: 'Facilitator', room: 'Venue' },
      eventDates: true,
    })
  }

  const hasActiveFilters = !!(
    filterFacilitators.length ||
    filterRooms.length ||
    filterContests.length ||
    filterLevels.length ||
    filterLanguages.length ||
    filterDateFrom ||
    filterDateTo
  )

  return (
    <div>
      <PageHeader
        title="DSPC Schedule"
        description={`${DEFAULT_DIVISION} — Division Schools Press Conference`}
        action={
          <div className="flex flex-wrap gap-2 items-center">
            {switcher}
            <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showVacantInPDF}
                onChange={(e) => setShowVacantInPDF(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
              />
              Show vacant
            </label>
            <Button variant="secondary" onClick={handleExportPDF} disabled={entries.length === 0}>
              <FileDown size={16} /> Export PDF
            </Button>
            <Button onClick={() => setModal('add')}>
              <Plus size={16} /> Add Contest Slot
            </Button>
          </div>
        }
      />

      <div className="mb-5 rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
        This view is independent of school class schedules and does not change attendance. Slots use exact calendar dates.
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          DSPC tables are not set up yet. Run <code className="font-mono text-xs">supabase/dspc_migration.sql</code> in the Supabase SQL Editor, then refresh.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{entries.length}</span> scheduled contests
        </div>
        {conflictCount > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-red-600 font-medium bg-red-50 px-3 py-1 rounded-full border border-red-200">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            {conflictCount} conflict{conflictCount > 1 ? 's' : ''} detected
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 mb-5 p-4 bg-white rounded-xl border border-gray-200">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Filter size={14} className="text-gray-400 mb-2" />
            <div className="w-40">
              <Input
                label="From"
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
              />
            </div>
          </div>
          <div className="w-40">
            <Input
              label="To"
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 font-medium w-[72px]">Language:</span>
          {LANGUAGE_OPTIONS.map((language) => {
            const active = filterLanguages.includes(language)
            return (
              <button
                key={language}
                onClick={() => toggleLanguage(language)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-violet-300 hover:text-violet-700'
                }`}
              >
                {LANGUAGE_LABELS[language]}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500 font-medium w-[72px]">Level:</span>
          {LEVEL_OPTIONS.map((level) => {
            const active = filterLevels.includes(level)
            return (
              <button
                key={level}
                onClick={() => toggleLevel(level)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-teal-600 border-teal-600 text-white'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-700'
                }`}
              >
                {LEVEL_LABELS[level]}
              </button>
            )
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-52">
            <MultiCombobox
              placeholder="All Contests"
              noun="contests"
              options={contestOptions}
              values={filterContests}
              onChange={(values) => setFilterContests(values as ContestCategory[])}
            />
          </div>
          <div className="w-full sm:w-44">
            <MultiCombobox
              placeholder="All Facilitators"
              noun="facilitators"
              options={facilitatorOptions}
              values={filterFacilitators}
              onChange={setFilterFacilitators}
            />
          </div>
          <div className="w-full sm:w-44">
            <MultiCombobox
              placeholder="All Venues"
              noun="venues"
              options={roomOptions}
              values={filterRooms}
              onChange={setFilterRooms}
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setFilterFacilitators([])
                setFilterRooms([])
                setFilterContests([])
                setFilterLevels([])
                setFilterLanguages([])
                setFilterDateFrom('')
                setFilterDateTo('')
              }}
              className="text-sm text-blue-600 hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-gray-400">Loading DSPC schedule...</div>
      ) : (
        <DatedTimetable
          entries={visibleEntries}
          conflictEntries={entries}
          onEdit={(e) => setModal(e)}
          onDelete={handleDelete}
        />
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === 'add' ? 'Add DSPC Contest Slot' : 'Edit Contest Slot'}
        className="max-w-lg"
      >
        <DspcScheduleForm
          entry={modal !== 'add' && modal !== null ? modal : undefined}
          allEntries={entries}
          onSuccess={() => setModal(null)}
          onCancel={() => setModal(null)}
        />
      </Modal>
    </div>
  )
}
