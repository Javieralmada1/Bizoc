// app/api/matches/route.ts
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('matches')
      .select('id, title, club_id, video_url, thumb_url, start')
      .order('start', { ascending: false })
      .limit(12)

    if (error) throw error
    return NextResponse.json({ matches: data ?? [] })
  } catch (e: any) {
    console.error('[matches] GET', e?.message)
    return NextResponse.json({ matches: [] }, { status: 500 })
  }
}
