// app/api/recordings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin' // ajustá el path si es necesario

// --- CORS ---
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // en prod: poné tus dominios
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders as any })
}

// GET /api/recordings?status=ready&clubId=1&courtId=2&from=0&limit=50
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status') ?? undefined
    const clubId = url.searchParams.get('clubId') ?? undefined
    const courtId = url.searchParams.get('courtId') ?? undefined
    const from = Number(url.searchParams.get('from') ?? 0)
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 50), 200) // tope

    // Build query
    let query = supabaseAdmin
      .from('recordings')
      .select('*', { count: 'exact' })

    if (status) query = query.eq('status', status)
    if (clubId) query = query.eq('club_id', isNaN(Number(clubId)) ? clubId : Number(clubId))
    if (courtId) query = query.eq('court_id', isNaN(Number(courtId)) ? courtId : Number(courtId))

    // Ordená por created_at si existe; si no, por id desc
    // Intentamos created_at primero; si tu tabla no lo tiene, cambiá a 'id'
    query = query.order('created_at', { ascending: false })

    // Paginación
    const to = from + limit - 1
    const { data, error, count } = await query.range(from, to)

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: corsHeaders as any })
    }

    return NextResponse.json(
      { ok: true, recordings: data ?? [], count: count ?? 0, from, limit },
      { headers: corsHeaders as any }
    )
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'Failed to list recordings' }, { status: 500, headers: corsHeaders as any })
  }
}
