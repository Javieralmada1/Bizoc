// app/api/_debug/route.ts
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const rawCourtId = url.searchParams.get('courtId')
  const courtId = rawCourtId ? rawCourtId.replace(/[<>]/g, '').trim() : null

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'unset'
  if (!courtId) {
    return NextResponse.json({
      ok: false,
      reason: 'missing_courtId',
      envUrl,
    })
  }

  try {
    // 1) ¿Existe el court?
    const courtResp = await supabaseAdmin
      .from('courts')
      .select('id, name, club_id')
      .eq('id', courtId)
      .maybeSingle()

    // 2) ¿Cuántos schedules hay para ese court?
    const schAll = await supabaseAdmin
      .from('schedules')
      .select('id, weekday, day_of_week, start_time, end_time, slot_minutes, interval_minutes, active, is_active, created_at')
      .eq('court_id', courtId)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      ok: true,
      envUrl,
      courtId,
      courtFound: !!courtResp.data,
      court: courtResp.data ?? null,
      schedulesCount: Array.isArray(schAll.data) ? schAll.data.length : null,
      schedulesSample: Array.isArray(schAll.data) ? schAll.data.slice(0, 5) : null,
      errorCourt: courtResp.error?.message ?? null,
      errorSchedules: schAll.error?.message ?? null,
    })
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      envUrl,
      courtId,
      reason: 'exception',
      message: e?.message ?? String(e),
    }, { status: 500 })
  }
}
