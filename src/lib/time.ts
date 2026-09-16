export function timeStringToDate(hms: string): Date {
  const full = hms.length === 5 ? `${hms}:00` : hms
  return new Date(`1970-01-01T${full}Z`)
}

export function dateToTimeString(d: Date): string {
  return d.toISOString().slice(11, 19) // "HH:MM:SS"
}

export function isoDateToDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`)
}

export function dateToIsoDateString(d: Date): string {
  return d.toISOString().slice(0, 10) // "YYYY-MM-DD"
}
