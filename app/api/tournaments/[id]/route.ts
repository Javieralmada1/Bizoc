import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Loading tournament:', params.id)

    const { data: tournament, error } = await supabaseAdmin
      .from('tournaments')
      .select(`
        *,
        clubs!inner(name, city, province)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error loading tournament:', error)
      return NextResponse.json({ 
        error: 'Torneo no encontrado' 
      }, { status: 404 })
    }

    // Contar equipos registrados
    const { count } = await supabaseAdmin
      .from('tournament_teams')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', params.id)

    const tournamentWithTeams = {
      ...tournament,
      club: tournament.clubs,
      registered_teams: count || 0
    }

    return NextResponse.json({ tournament: tournamentWithTeams })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Error al cargar el torneo' 
    }, { status: 500 })
  }
}