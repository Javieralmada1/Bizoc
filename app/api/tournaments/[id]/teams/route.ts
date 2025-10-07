import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Loading teams for tournament:', params.id)

    const { data: teams, error } = await supabaseAdmin
      .from('tournament_teams')
      .select('*')
      .eq('tournament_id', params.id)
      .order('registration_date', { ascending: true })

    if (error) {
      console.error('Error loading teams:', error)
      throw error
    }

    console.log('Teams loaded:', teams?.length || 0)

    return NextResponse.json({ teams: teams || [] })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Error al cargar los equipos',
      teams: []
    }, { status: 500 })
  }
}