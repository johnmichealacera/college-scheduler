import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatTime, timeToMinutes } from './utils'
import type { ScheduleEntry, Room } from '../types'

const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const DAY_COLORS: Record<string, [number, number, number]> = {
  Monday:    [37,  99,  235],
  Tuesday:   [124, 58,  237],
  Wednesday: [5,   150, 105],
  Thursday:  [217, 119, 6],
  Friday:    [220, 38,  38],
  Saturday:  [71,  85,  105],
  Sunday:    [71,  85,  105],
}

function minsToAMPM(mins: number): string {
  const h = Math.floor(mins / 60)
  const m = mins % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h
  return `${displayH}:${m.toString().padStart(2, '0')} ${period}`
}

function computeVacantSlots(roomId: string, day: string, allEntries: ScheduleEntry[]): string {
  const roomDayEntries = allEntries
    .filter((e) => e.room_id === roomId && e.day === day)
    .sort((a, b) => timeToMinutes(a.start_time.slice(0, 5)) - timeToMinutes(b.start_time.slice(0, 5)))

  let current = 7 * 60
  const endOfDay = 21 * 60
  const slots: { start: number; end: number }[] = []

  for (const entry of roomDayEntries) {
    const entryStart = timeToMinutes(entry.start_time.slice(0, 5))
    const entryEnd = timeToMinutes(entry.end_time.slice(0, 5))
    if (entryStart > current) slots.push({ start: current, end: entryStart })
    current = Math.max(current, entryEnd)
  }

  if (current < endOfDay) slots.push({ start: current, end: endOfDay })

  if (slots.length === 0) return ''
  if (slots.length === 1 && slots[0].start === 7 * 60 && slots[0].end === 21 * 60) {
    return 'All day (7:00 AM – 9:00 PM)'
  }
  return slots.map((s) => `${minsToAMPM(s.start)} – ${minsToAMPM(s.end)}`).join('\n')
}

interface PDFOptions {
  filterLabel?: string
  showVacant?: boolean
  allEntries?: ScheduleEntry[]
  rooms?: Room[]
}

export function generateSchedulePDF(rawEntries: ScheduleEntry[], options?: PDFOptions) {
  const { filterLabel, showVacant, allEntries, rooms } = options ?? {}

  // Strip any entries outside the allowed 7 AM – 9 PM window before rendering
  const entries = rawEntries.filter((e) => {
    const start = timeToMinutes(e.start_time.slice(0, 5))
    const end = timeToMinutes(e.end_time.slice(0, 5))
    return start >= 7 * 60 && end <= 21 * 60
  })

  const vacancySource = allEntries ?? entries

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const pageW = doc.internal.pageSize.getWidth()
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageW, 22, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('ClassSync — Class Schedule Report', 14, 10)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const subtitle = filterLabel ? `Filter: ${filterLabel}` : 'All Classes'
  doc.text(`${subtitle}   ·   Generated ${now}`, 14, 17)

  // total count top-right
  doc.setFontSize(9)
  doc.text(`${entries.length} class${entries.length !== 1 ? 'es' : ''}`, pageW - 14, 10, { align: 'right' })

  // ── Summary chips ────────────────────────────────────────────────────────
  const days = DAY_ORDER.filter((d) => entries.some((e) => e.day === d))
  let chipX = 14
  const chipY = 28
  doc.setFontSize(8)
  for (const day of days) {
    const count = entries.filter((e) => e.day === day).length
    const label = `${day}: ${count}`
    const w = doc.getTextWidth(label) + 6
    const [r, g, b] = DAY_COLORS[day]
    doc.setFillColor(r, g, b)
    doc.roundedRect(chipX, chipY - 4, w, 6, 1.5, 1.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.text(label, chipX + 3, chipY)
    chipX += w + 3
  }

  // ── One table per day ────────────────────────────────────────────────────
  let startY = 38

  for (const day of days) {
    const dayEntries = entries
      .filter((e) => e.day === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))

    const [r, g, b] = DAY_COLORS[day]

    // Day heading
    doc.setFillColor(r, g, b)
    doc.roundedRect(14, startY, pageW - 28, 7, 1.5, 1.5, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(`${day.toUpperCase()}  (${dayEntries.length} class${dayEntries.length !== 1 ? 'es' : ''})`, 18, startY + 4.8)

    startY += 8

    const rows = dayEntries.map((e, i) => [
      String(i + 1),
      `${formatTime(e.start_time)} – ${formatTime(e.end_time)}`,
      e.subject?.name ?? '—',
      e.teacher?.name ?? '—',
      e.room?.name ?? '—',
    ])

    autoTable(doc, {
      startY,
      margin: { left: 14, right: 14 },
      head: [['#', 'Time', 'Subject', 'Teacher', 'Room']],
      body: rows,
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [71, 85, 105],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },
        1: { cellWidth: 42 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 35 },
      },
      tableLineColor: [226, 232, 240],
      tableLineWidth: 0.2,
      styles: { cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 1) {
          data.cell.styles.textColor = [r, g, b]
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })

    startY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

    // Page break if needed
    if (startY > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage()
      startY = 14
    }
  }

  // ── Vacant room schedule ─────────────────────────────────────────────────
  if (showVacant) {
    const vacancyRooms: Room[] =
      rooms && rooms.length > 0
        ? rooms
        : [
            ...new Map(
              vacancySource
                .filter((e) => e.room)
                .map((e) => [e.room!.id, { id: e.room!.id, name: e.room!.name, created_at: '' }])
            ).values(),
          ]

    if (vacancyRooms.length > 0) {
      // Section separator — start on new page if close to bottom
      if (startY > doc.internal.pageSize.getHeight() - 50) {
        doc.addPage()
        startY = 14
      } else {
        startY += 6
      }

      doc.setFillColor(71, 85, 105)
      doc.roundedRect(14, startY, pageW - 28, 8, 1.5, 1.5, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('VACANT ROOM SCHEDULE', 18, startY + 5.5)
      startY += 12

      // Determine which days to show: same days as occupied section, or all days
      const vacantDays = DAY_ORDER.filter(
        (d) => vacancyRooms.some((room) => computeVacantSlots(room.id, d, vacancySource) !== '')
      )

      for (const day of vacantDays) {
        const [r, g, b] = DAY_COLORS[day]

        // Day heading
        doc.setFillColor(r, g, b)
        doc.roundedRect(14, startY, pageW - 28, 7, 1.5, 1.5, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'bold')
        doc.text(`${day.toUpperCase()} — Available Rooms`, 18, startY + 4.8)
        startY += 8

        const vacantRows = vacancyRooms
          .map((room, i) => {
            const slots = computeVacantSlots(room.id, day, vacancySource)
            return slots ? [String(i + 1), room.name, slots] : null
          })
          .filter((row): row is string[] => row !== null)

        if (vacantRows.length === 0) {
          doc.setFontSize(8)
          doc.setFont('helvetica', 'normal')
          doc.setTextColor(148, 163, 184)
          doc.text('All rooms are fully booked on this day.', 18, startY + 4)
          startY += 12
        } else {
          autoTable(doc, {
            startY,
            margin: { left: 14, right: 14 },
            head: [['#', 'Room', 'Available Time Slots']],
            body: vacantRows,
            headStyles: {
              fillColor: [248, 250, 252],
              textColor: [71, 85, 105],
              fontStyle: 'bold',
              fontSize: 8,
            },
            bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            columnStyles: {
              0: { cellWidth: 8, halign: 'center' },
              1: { cellWidth: 50 },
              2: { cellWidth: 'auto' },
            },
            tableLineColor: [226, 232, 240],
            tableLineWidth: 0.2,
            styles: { cellPadding: 2.5, lineColor: [226, 232, 240], lineWidth: 0.2 },
            didParseCell(data) {
              if (data.section === 'body' && data.column.index === 2) {
                data.cell.styles.textColor = [5, 150, 105]
              }
            },
          })

          startY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
        }

        if (startY > doc.internal.pageSize.getHeight() - 20) {
          doc.addPage()
          startY = 14
        }
      }
    }
  }

  // ── Footer on every page ─────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(7.5)
    doc.setTextColor(148, 163, 184)
    doc.setFont('helvetica', 'normal')
    doc.text(`ClassSync  ·  Page ${p} of ${totalPages}`, pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' })
  }

  const filename = `schedule-${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(filename)
}
