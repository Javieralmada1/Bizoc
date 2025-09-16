import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    console.log('Registering team:', body)

    // Validar datos requeridos
    if (!body.teamName || !body.player1Name || !body.player1Email || 
        !body.player2Name || !body.player2Email) {
      return NextResponse.json({ 
        error: 'Todos los campos son obligatorios' 
      }, { status: 400 })
    }

    // Verificar que el torneo existe y está en periodo de inscripción
    const { data: tournament, error: tournamentError } = await supabaseAdmin
      .from('tournaments')
      .select('*')
      .eq('id', params.id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ 
        error: 'Torneo no encontrado' 
      }, { status: 404 })
    }

    if (tournament.status !== 'registration') {
      return NextResponse.json({ 
        error: 'Las inscripciones están cerradas para este torneo' 
      }, { status: 400 })
    }

    // Verificar que no se ha alcanzado el límite de equipos
    const { count } = await supabaseAdmin
      .from('tournament_teams')
      .select('*', { count: 'exact', head: true })
      .eq('tournament_id', params.id)

    if (count && count >= tournament.max_teams) {
      return NextResponse.json({ 
        error: 'El torneo ya está completo' 
      }, { status: 400 })
    }

    // Verificar que el nombre del equipo no existe en este torneo
    const { data: existingTeam } = await supabaseAdmin
      .from('tournament_teams')
      .select('id')
      .eq('tournament_id', params.id)
      .eq('team_name', body.teamName)
      .single()

    if (existingTeam) {
      return NextResponse.json({ 
        error: 'Ya existe un equipo con ese nombre en este torneo' 
      }, { status: 400 })
    }

    // Insertar el nuevo equipo
    const { data: team, error } = await supabaseAdmin
      .from('tournament_teams')
      .insert({
        tournament_id: params.id,
        team_name: body.teamName,
        player1_name: body.player1Name,
        player1_email: body.player1Email,
        player2_name: body.player2Name,
        player2_email: body.player2Email,
        registration_date: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error registering team:', error)
      throw error
    }

    console.log('Team registered successfully:', team)

    return NextResponse.json({ team })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Error al inscribir el equipo' 
    }, { status: 500 })
  }
}