// app/api/schedules/route.ts
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

type ScheduleRow = {
  weekday?: number | null
  day_of_week?: number | null
  slot_minutes?: number | null
  interval_minutes?: number | null
  start_time?: string | null
  end_time?: string | null
  open_time?: string | null
  close_time?: string | null
  active?: boolean | null
  is_active?: boolean | null
}
type ReservationRow = { start_at: string; end_at: string; status: string }
type ScheduleExceptionRow = { open_time?: string | null; close_time?: string | null; is_closed?: boolean | null } | null

function pad(n: number) { return String(n).padStart(2, '0') }
function localToUtcIso(dateStr: string, timeStr: string, tzOffsetMinutes = 180) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  const baseUTC = Date.UTC(y, m - 1, d, hh, mm)
  return new Date(baseUTC + tzOffsetMinutes * 60 * 1000).toISOString()
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const rawCourtId = url.searchParams.get('courtId')
  const courtId = rawCourtId ? rawCourtId.replace(/[<>]/g, '').trim() : null
  const date = url.searchParams.get('date')
  const debugOn = url.searchParams.get('debug') === '1'

  if (!courtId || !date) {
    return NextResponse.json({ slots: [], debug: debugOn ? { reason: 'missing_params', courtId, date } : undefined })
  }

  const weekdayFromDate = new Date(`${date}T00:00:00`).getDay()

  try {
    // ---- EXCEPTION ----
    let ex: ScheduleExceptionRow = null
    try {
      const exResp = await supabaseAdmin
        .from('schedule_exceptions')
        .select('open_time,close_time,is_closed')
        .eq('court_id', courtId)
        .eq('date', date)
        .maybeSingle()
      ex = (exResp.data as ScheduleExceptionRow) ?? null
    } catch {}
    if (ex?.is_closed) return NextResponse.json({ slots: [], debug: debugOn ? { reason: 'closed_by_exception' } : undefined })

    // ---- SCHEDULES: diagnóstico adicional ----
    const countAll = await supabaseAdmin
      .from('schedules')
      .select('id', { count: 'exact', head: true })
      .eq('court_id', courtId)

    const countWeekday = await supabaseAdmin
      .from('schedules')
      .select('id', { count: 'exact', head: true })
      .eq('court_id', courtId)
      .eq('weekday', weekdayFromDate)

    const countDayOfWeek = await supabaseAdmin
      .from('schedules')
      .select('id', { count: 'exact', head: true })
      .eq('court_id', courtId)
      .eq('day_of_week', weekdayFromDate)

    // buscar “por partes” para evitar rarezas
    let sch: ScheduleRow | null = null
    let source: 'weekday' | 'day_of_week' | 'fallback_any' | 'none' = 'none'

    const byWeekday = await supabaseAdmin
      .from('schedules')
      .select('weekday,slot_minutes,start_time,end_time,active,interval_minutes,open_time,close_time,is_active,day_of_week,created_at')
      .eq('court_id', courtId)
      .eq('weekday', weekdayFromDate)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (byWeekday.data) { sch = byWeekday.data as ScheduleRow; source = 'weekday' }

    if (!sch) {
      const byDOW = await supabaseAdmin
        .from('schedules')
        .select('weekday,slot_minutes,start_time,end_time,active,interval_minutes,open_time,close_time,is_active,day_of_week,created_at')
        .eq('court_id', courtId)
        .eq('day_of_week', weekdayFromDate)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (byDOW.data) { sch = byDOW.data as ScheduleRow; source = 'day_of_week' }
    }

    if (!sch) {
      const any = await supabaseAdmin
        .from('schedules')
        .select('weekday,slot_minutes,start_time,end_time,active,interval_minutes,open_time,close_time,is_active,day_of_week,created_at')
        .eq('court_id', courtId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (any.data) { sch = any.data as ScheduleRow; source = 'fallback_any' }
    }

    if (!sch) {
      return NextResponse.json({
        slots: [],
        debug: debugOn ? {
          reason: 'no_schedule_found',
          tried: ['weekday', 'day_of_week', 'fallback_any'],
          weekdayFromDate,
          counts: {
            forCourt_all: countAll.count ?? null,
            forCourt_weekday: countWeekday.count ?? null,
            forCourt_day_of_week: countDayOfWeek.count ?? null,
          },
          envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'unset'
        } : undefined
      })
    }

    const open  = (ex?.open_time ?? sch.open_time ?? sch.start_time ?? null) as string | null
    const close = (ex?.close_time ?? sch.close_time ?? sch.end_time ?? null) as string | null
    const interval = (sch.interval_minutes ?? sch.slot_minutes ?? 60) as number
    const active = (sch.is_active ?? sch.active ?? true) as boolean

    if (!active || !open || !close) {
      return NextResponse.json({ slots: [], debug: debugOn ? { reason: 'inactive_or_missing_times', open, close, interval, source } : undefined })
    }

    // ---- bookings ----
    const dayStartUtc = localToUtcIso(date, '00:00')
    const dayEndUtc   = localToUtcIso(date, '23:59')

    const bookingsResp = await supabaseAdmin
      .from('reservations')
      .select('start_at,end_at,status')
      .eq('court_id', courtId)
      .neq('status', 'cancelled')
      .gte('start_at', dayStartUtc)
      .lte('end_at', dayEndUtc)

    const bookings: ReservationRow[] = Array.isArray(bookingsResp.data) ? bookingsResp.data as ReservationRow[] : []

    // ---- slots ----
    const [oh, om] = open.split(':').map(Number)
    const [ch, cm] = close.split(':').map(Number)

    let curMin = oh * 60 + om
    const endMin = ch * 60 + cm
    const slots: Array<{ start: string; end: string; available: boolean; status: string }> = []

    while (curMin + interval <= endMin) {
      const sh = Math.floor(curMin / 60), sm = curMin % 60
      const eh = Math.floor((curMin + interval) / 60), em = (curMin + interval) % 60
      const startUtc = localToUtcIso(date, `${pad(sh)}:${pad(sm)}`)
      const endUtc   = localToUtcIso(date, `${pad(eh)}:${pad(em)}`)
      const overlaps = bookings.some(b => !(endUtc <= b.start_at || startUtc >= b.end_at))
      slots.push({ start: startUtc, end: endUtc, available: !overlaps, status: overlaps ? 'booked' : 'available' })
      curMin += interval
    }

    return NextResponse.json({
      slots,
      debug: debugOn ? {
        source,
        weekdayFromDate,
        counts: {
          forCourt_all: countAll.count ?? null,
          forCourt_weekday: countWeekday.count ?? null,
          forCourt_day_of_week: countDayOfWeek.count ?? null,
        },
        envUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'unset',
        open, close, interval, bookings: bookings.length
      } : undefined
    })
  } catch (e: any) {
    return NextResponse.json({ slots: [], debug: debugOn ? { reason: 'exception', message: e?.message } : undefined }, { status: 500 })
  }
}
