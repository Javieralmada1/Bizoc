import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Loading matches for tournament:', params.id)

    const { data: matches, error } = await supabaseAdmin
      .from('tournament_matches')
      .select(`
        *,
        team1:tournament_teams!tournament_matches_team1_id_fkey(*),
        team2:tournament_teams!tournament_matches_team2_id_fkey(*),
        winner:tournament_teams!tournament_matches_winner_id_fkey(*)
      `)
      .eq('tournament_id', params.id)
      .order('round_name')
      .order('match_number')

    if (error) {
      console.error('Error loading matches:', error)
      throw error
    }

    console.log('Matches loaded:', matches?.length || 0)

    return NextResponse.json({ matches: matches || [] })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Error al cargar los partidos',
      matches: []
    }, { status: 500 })
  }
}