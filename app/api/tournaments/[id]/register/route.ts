import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    const tournamentId = params.id

    // Verificar autenticación
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Debes estar logueado para inscribirte' }, { status: 401 })
    }

    // Verificar que el torneo existe y acepta inscripciones
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }

    if (tournament.status !== 'registration') {
      return NextResponse.json({ error: 'Este torneo no acepta más inscripciones' }, { status: 400 })
    }

    // Verificar disponibilidad
    if (tournament.registered_teams >= tournament.max_teams) {
      return NextResponse.json({ error: 'Torneo completo' }, { status: 400 })
    }

    // Verificar que no haya pasado la fecha límite
    const deadline = new Date(tournament.registration_deadline)
    const now = new Date()
    if (now > deadline) {
      return NextResponse.json({ error: 'La fecha límite de inscripción ha pasado' }, { status: 400 })
    }

    // Crear inscripción
    const { data: registration, error } = await supabase
      .from('tournament_registrations')
      .insert([{
        tournament_id: tournamentId,
        team_name: body.teamName,
        player1_name: body.player1Name,
        player1_email: body.player1Email,
        player1_phone: body.player1Phone,
        player2_name: body.player2Name,
        player2_email: body.player2Email,
        player2_phone: body.player2Phone,
        notes: body.notes,
        created_by: user.id,
        status: 'approved' // Auto-aprobar por ahora
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Este nombre de equipo ya está registrado en este torneo' }, { status: 400 })
      }
      console.error('Error creating registration:', error)
      throw error
    }

    // Actualizar contador de equipos registrados
    const { error: updateError } = await supabase
      .from('tournaments')
      .update({ 
        registered_teams: tournament.registered_teams + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', tournamentId)

    if (updateError) {
      console.error('Error updating team count:', updateError)
    }

    return NextResponse.json({ 
      registration,
      message: 'Inscripción realizada exitosamente'
    })
  } catch (error) {
    console.error('Error in POST /api/tournaments/[id]/register:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const tournamentId = params.id

    const { data: registrations, error } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('registration_date', { ascending: true })

    if (error) {
      console.error('Error fetching registrations:', error)
      throw error
    }

    return NextResponse.json({ registrations: registrations || [] })
  } catch (error) {
    console.error('Error in GET /api/tournaments/[id]/register:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}