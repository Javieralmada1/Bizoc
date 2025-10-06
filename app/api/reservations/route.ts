// app/api/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
export async function OPTIONS(){ return new NextResponse(null,{status:204, headers:cors as any}) }

/**
 * GET /api/reservations?courtId=1&date=YYYY-MM-DD
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const courtId = Number(url.searchParams.get('courtId'))
  const date = url.searchParams.get('date')
  if (!courtId || !date) return NextResponse.json({ ok:false, error:'courtId y date son requeridos' }, { status:400, headers:cors as any })

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .eq('court_id', courtId)
    .gte('start_at', `${date}T00:00:00+00:00`)
    .lte('start_at', `${date}T23:59:59+00:00`)
    .order('start_at')
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500, headers:cors as any })
  return NextResponse.json({ ok:true, reservations: data }, { headers:cors as any })
}

/**
 * POST /api/reservations
 * body: { courtId:number, start:string(ISO), end:string(ISO), userId?:string }
 */
export async function POST(req: NextRequest) {
  try {
    const { courtId, start, end, userId } = await req.json()
    if (!courtId || !start || !end) {
      return NextResponse.json({ ok:false, error:'courtId, start y end son requeridos' }, { status:400, headers:cors as any })
    }

    // Intentar insertar; si solapa, Postgres rechaza por el constraint
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .insert({ court_id:courtId, start_at:start, end_at:end, user_id:userId })
      .select().single()
    if (error) {
      // Mensaje amistoso si chocó la constraint
      const msg = /no_overlap|overlap/i.test(error.message) ? 'El turno ya fue tomado' : error.message
      return NextResponse.json({ ok:false, error: msg }, { status:409, headers:cors as any })
    }
    return NextResponse.json({ ok:true, reservation: data }, { headers:cors as any })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:e?.message ?? 'create failed' }, { status:500, headers:cors as any })
  }
}

/**
 * DELETE /api/reservations?id=123   (cancela)
 */
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const id = Number(url.searchParams.get('id'))
  if (!id) return NextResponse.json({ ok:false, error:'id requerido' }, { status:400, headers:cors as any })

  const { error } = await supabaseAdmin
    .from('reservations')
    .update({ status:'cancelled' }).eq('id', id)
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500, headers:cors as any })
  return NextResponse.json({ ok:true }, { headers:cors as any })
}
