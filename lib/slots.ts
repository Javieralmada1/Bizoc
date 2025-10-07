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
  // Usar dayjs.tz para asegurarse de que la fecha se interpreta en la TZ correcta.
  // El T00:00:00 es clave para empezar el día.
  const dayStart = dayjs.tz(`${opts.date}T00:00:00`, tz)

  // generar horarios de apertura/cierre
  const openParts = opts.open.split(':').map(Number)
  const closeParts = opts.close.split(':').map(Number)
  const openTs = dayStart.add(openParts[0], 'hour').add(openParts[1] || 0, 'minute')
  // Manejo de cierre a medianoche (24:00 o 00:00 del día siguiente)
  let closeTs = dayStart.add(closeParts[0], 'hour').add(closeParts[1] || 0, 'minute')
  if (closeTs.isSameOrBefore(openTs)) {
      closeTs = closeTs.add(1, 'day');
  }

  const slots: Slot[] = []
  const step = opts.slotMinutes
  const buf = opts.bufferMinutes || 0
  
  // Asegurarse de que el loop no sea infinito o salte a un día posterior sin querer
  for (let t = openTs; t.isSameOrBefore(closeTs); t = t.add(step, 'minute')) {
    const start = t
    const end = t.add(step, 'minute') // Se incluye el slot completo aquí

    if (end.isAfter(closeTs)) break // Si el slot completo excede el cierre, lo ignoramos

    // Verificar si el slot se solapa con alguna reserva
    const overlaps = opts.reservations.some(r => {
      // Las reservas ya vienen como ISO, solo las parseamos
      const rs = dayjs(r.start_at)
      const re = dayjs(r.end_at)
      
      // Lógica de solapamiento: (A inicia antes que B finalice) AND (B inicia antes que A finalice)
      return (
        start.isBefore(re) &&
        end.isAfter(rs) &&
        r.status === 'confirmed' // Aseguramos que solo el estado 'confirmed' o 'pending' bloquee
      )
    })

    slots.push({
      start: start.toISOString(),
      end: end.toISOString(),
      available: !overlaps,
    })
    
    // Si hay buffer, lo saltamos para el siguiente turno
    if (buf > 0) {
        t = t.add(buf, 'minute');
    }
  }

  return slots
}