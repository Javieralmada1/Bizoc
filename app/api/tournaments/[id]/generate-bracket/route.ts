import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('Generating bracket for tournament:', params.id)

    // Verificar que el torneo existe
    const { data: tournament, error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('id', params.id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }

    // Obtener todos los equipos registrados
    const { data: teams, error: teamsError } = await supabaseAdmin
      .from('tournament_teams')
      .select('*')
      .eq('tournament_id', params.id)
      .eq('status', 'registered')
      .order('registration_date')

    if (teamsError) {
      throw teamsError
    }

    if (!teams || teams.length < 4) {
      return NextResponse.json({ 
        error: 'Se necesitan al menos 4 equipos para generar el bracket' 
      }, { status: 400 })
    }

    // Verificar que no existan partidos ya creados
    const { count: existingMatches } = await supabaseAdmin
      .from('tournament_matches')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', params.id)

    if (existingMatches && existingMatches > 0) {
      return NextResponse.json({ 
        error: 'El bracket ya ha sido generado para este torneo' 
      }, { status: 400 })
    }

    // Mezclar equipos aleatoriamente
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)
    
    // Determinar el tamaño del bracket (potencia de 2 más cercana)
    const bracketSize = getNextPowerOf2(shuffledTeams.length)
    
    // Rellenar con equipos "bye" si es necesario
    while (shuffledTeams.length < bracketSize) {
      shuffledTeams.push(null) // null representa un "bye"
    }

    // Generar partidos de la primera ronda
    const firstRoundMatches = []
    const roundName = getRoundName(bracketSize, bracketSize)

    for (let i = 0; i < shuffledTeams.length; i += 2) {
      const team1 = shuffledTeams[i]
      const team2 = shuffledTeams[i + 1]
      
      // Si uno de los equipos es null (bye), el otro avanza automáticamente
      if (!team1 || !team2) {
        const winnerTeam = team1 || team2
        if (winnerTeam) {
          // Este equipo avanza automáticamente a la siguiente ronda
          continue
        }
      } else {
        firstRoundMatches.push({
          tournament_id: params.id,
          team1_id: team1.id,
          team2_id: team2.id,
          round_name: roundName,
          match_number: (i / 2) + 1,
          status: 'scheduled'
        })
      }
    }

    // Insertar los partidos en la base de datos
    if (firstRoundMatches.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('tournament_matches')
        .insert(firstRoundMatches)

      if (insertError) {
        console.error('Error inserting matches:', insertError)
        throw insertError
      }
    }

    // Actualizar el estado del torneo
    await supabaseAdmin
      .from('tournaments')
      .update({ status: 'in_progress' })
      .eq('id', params.id)

    console.log(`Bracket generated with ${firstRoundMatches.length} matches`)

    return NextResponse.json({ 
      message: 'Bracket generado exitosamente',
      matches_created: firstRoundMatches.length
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Error al generar el bracket' 
    }, { status: 500 })
  }
}

// Función auxiliar para obtener la siguiente potencia de 2
function getNextPowerOf2(num: number): number {
  let power = 1
  while (power < num) {
    power *= 2
  }
  return power
}

// Función auxiliar para obtener el nombre de la ronda
function getRoundName(totalTeams: number, currentRoundSize: number): string {
  if (currentRoundSize === 2) return 'Final'
  if (currentRoundSize === 4) return 'Semifinal'
  if (currentRoundSize === 8) return 'Cuartos de Final'
  if (currentRoundSize === 16) return 'Octavos de Final'
  if (currentRoundSize === 32) return 'Primera Ronda'
  if (currentRoundSize === 64) return 'Primera Ronda'
  
  return `Ronda de ${currentRoundSize}`
}