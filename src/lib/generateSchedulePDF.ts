import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatTime } from './utils'
import type { ScheduleEntry } from '../types'

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

export function generateSchedulePDF(entries: ScheduleEntry[], filterLabel?: string) {
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
