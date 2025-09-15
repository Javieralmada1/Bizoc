import { supabaseAdmin } from '@/lib/supabaseServer'

function buildLocalDayRange(dateStr: string) {
  const [y,m,d] = dateStr.split('-').map(Number)
  const start = new Date(y, m-1, d, 0,0,0,0)
  const end = new Date(y, m-1, d, 23,59,59,999)
  return { start, end }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const courtId = searchParams.get('court_id')
  const date = searchParams.get('date')
  if (!courtId || !date) return Response.json({ error: 'court_id y date requeridos' }, { status: 400 })

  const jsDate = new Date(date + 'T00:00:00')
  const weekday = (jsDate.getDay() + 6) % 7  // 0=Lunes

  const { data: scheduleRows, error } = await supabaseAdmin
    .from('schedules')
    .select('*')
    .eq('court_id', courtId)
    .eq('weekday', weekday)
    .eq('active', true)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (!scheduleRows?.length) return Response.json({ slots: [] })

  const template = scheduleRows[0]
  const slotMinutes = template.slot_minutes
  const [hStart, mStart] = template.start_time.split(':').map(Number)
  const [hEnd, mEnd] = template.end_time.split(':').map(Number)
  const base = new Date(date + 'T00:00:00')
  const startMillis = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hStart, mStart).getTime()
  const endMillis = new Date(base.getFullYear(), base.getMonth(), base.getDate(), hEnd, mEnd).getTime()

  const slots: { start: string; end: string; available: boolean }[] = []
  for (let t = startMillis; t + slotMinutes*60000 <= endMillis; t += slotMinutes*60000) {
    const slotStart = new Date(t)
    const slotEnd = new Date(t + slotMinutes*60000)
    slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString(), available: true })
  }

  const { start, end } = buildLocalDayRange(date)
  const { data: reservations, error: rErr } = await supabaseAdmin
    .from('reservations')
    .select('start_timestamp,end_timestamp')
    .eq('court_id', courtId)
    .gte('start_timestamp', start.toISOString())
    .lt('start_timestamp', end.toISOString())

  if (rErr) return Response.json({ error: rErr.message }, { status: 500 })

  slots.forEach(s => {
    if (reservations?.some(r =>
      !(new Date(r.end_timestamp) <= new Date(s.start) || new Date(r.start_timestamp) >= new Date(s.end))
    )) s.available = false
  })

  return Response.json({ slots, slotMinutes })
}

export async function POST(req: Request) {
  const body = await req.json()
  const { court_id, weekday, start_time, end_time, slot_minutes } = body
  if (!court_id || weekday === undefined || !start_time || !end_time || !slot_minutes)
    return Response.json({ error: 'Campos requeridos' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('schedules')
    .upsert({
      court_id,
      weekday,
      start_time,
      end_time,
      slot_minutes,
      active: true
    }, { onConflict: 'court_id,weekday' })
    .select()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ schedule: data?.[0] })
}
