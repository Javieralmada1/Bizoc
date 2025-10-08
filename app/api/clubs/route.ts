// app/api/clubs/route.ts
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('clubs')
      .select('id,name,province,city,address,phone,logo_url,is_active')
      .eq('is_active', true)
      .order('province')
      .order('city')
      .order('name')

    if (error) throw error

    return NextResponse.json({ clubs: data ?? [] })
  } catch (e: any) {
    console.error('[clubs] GET', e?.message)
    return NextResponse.json({ clubs: [] }, { status: 500 })
  }
}
