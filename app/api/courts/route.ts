// app/api/courts/route.ts
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const clubId = searchParams.get('club_id')
    if (!clubId) return NextResponse.json({ courts: [] })

    const { data, error } = await supabaseAdmin
      .from('courts')
      .select('id,name,club_id,surface_type,hourly_rate,is_active')
      .eq('is_active', true)
      .eq('club_id', clubId)
      .order('name')

    if (error) throw error

    return NextResponse.json({ courts: data ?? [] })
  } catch (e: any) {
    console.error('[courts] GET', e?.message)
    return NextResponse.json({ courts: [] }, { status: 500 })
  }
}
