import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import duration from 'dayjs/plugin/duration'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isBetween from 'dayjs/plugin/isBetween'

// registrar plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(duration)
dayjs.extend(isSameOrBefore)
dayjs.extend(isBetween)

export type Slot = {
  start: string // ISO
  end: string   // ISO
  available: boolean
}

export function buildDailySlots(opts: {
  date: string // 'YYYY-MM-DD'
  tz?: string  // IANA, ej: 'America/Argentina/Buenos_Aires'
  open: string // 'HH:mm'
  close: string // 'HH:mm'
  slotMinutes: number // 60, 90, etc
  bufferMinutes?: number // 0..n
  reservations: { start_at: string; end_at: string; status: string }[]
}): Slot[] {
  const tz = opts.tz || dayjs.tz.guess()
  const dayStart = dayjs.tz(`${opts.date}T00:00:00`, tz)

  // generar horarios de apertura/cierre
  const openParts = opts.open.split(':').map(Number)
  const closeParts = opts.close.split(':').map(Number)
  const openTs = dayStart.add(openParts[0], 'hour').add(openParts[1] || 0, 'minute')
  const closeTs = dayStart.add(closeParts[0], 'hour').add(closeParts[1] || 0, 'minute')

  const slots: Slot[] = []
  const step = opts.slotMinutes
  const buf = opts.bufferMinutes || 0

  for (let t = openTs; t.isSameOrBefore(closeTs); t = t.add(step, 'minute')) {
    const start = t
    const end = t.add(step - buf, 'minute')
    if (end.isAfter(closeTs)) break

    const overlaps = opts.reservations.some(r => {
      const rs = dayjs(r.start_at)
      const re = dayjs(r.end_at)
      return (
        start.isBefore(re) &&
        end.isAfter(rs) &&
        r.status === 'confirmed'
      )
    })

    slots.push({
      start: start.toISOString(),
      end: end.toISOString(),
      available: !overlaps,
    })
  }

  return slots
}
