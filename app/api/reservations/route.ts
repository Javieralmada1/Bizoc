import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

type Body = {
  club_id: string
  court_id: string
  start: string // ISO UTC
  end: string   // ISO UTC
  customer_name?: string
  customer_phone?: string
  customer_email?: string
}

function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  return !(aEnd <= bStart || aStart >= bEnd)
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    const { club_id, court_id, start, end } = body

    if (!club_id || !court_id || !start || !end) {
      return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 })
    }

    const { data: existing } = await supabaseAdmin
      .from('reservations')
      .select('start_at,end_at,status')
      .eq('court_id', court_id)
      .neq('status', 'cancelled')
      .gte('start_at', start)
      .lt('end_at', end)

    const conflict = (existing ?? []).some((r) =>
      overlaps(start, end, r.start_at, r.end_at)
    )

    if (conflict) {
      return NextResponse.json(
        { error: 'El horario ya fue reservado' },
        { status: 409 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('reservations')
      .insert({
        club_id,
        court_id,
        start_at: start,
        end_at: end,
        customer_name: body.customer_name ?? null,
        customer_phone: body.customer_phone ?? null,
        customer_email: body.customer_email ?? null,
        status: 'confirmed',
      })
      .select('id')
      .single()

    if (error) throw error

    const booking_reference = `BYZ-${String(data.id).slice(0, 8).toUpperCase()}`
    return NextResponse.json(
      { reservation: { id: data.id }, booking_reference },
      { status: 201 }
    )
  } catch (e: any) {
    console.error('[reservations] POST', e?.message)
    return NextResponse.json(
      { error: 'No se pudo crear la reserva' },
      { status: 500 }
    )
  }
}
