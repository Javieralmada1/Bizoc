import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const tournamentId = params.id

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select(`
        *,
        club:clubs(name, city, province),
        tournament_registrations(
          id, team_name, player1_name, player2_name, registration_date, status
        )
      `)
      .eq('id', tournamentId)
      .single()

    if (error) {
      console.error('Error fetching tournament:', error)
      return NextResponse.json({ error: 'Torneo no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error('Error in GET /api/tournaments/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const tournamentId = params.id
    const body = await request.json()

    // Verificar autenticación
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario sea el dueño del torneo (a través del club)
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        *,
        club:clubs!inner(owner_id)
      `)
      .eq('id', tournamentId)
      .eq('club.owner_id', user.id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'No tienes permisos para editar este torneo' }, { status: 403 })
    }

    // Actualizar torneo
    const { data: updatedTournament, error } = await supabase
      .from('tournaments')
      .update(body)
      .eq('id', tournamentId)
      .select()
      .single()

    if (error) {
      console.error('Error updating tournament:', error)
      throw error
    }

    return NextResponse.json({ tournament: updatedTournament })
  } catch (error) {
    console.error('Error in PUT /api/tournaments/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const tournamentId = params.id

    // Verificar autenticación
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar permisos y eliminar
    const { data: tournament, error: tournamentError } = await supabase
      .from('tournaments')
      .select(`
        *,
        club:clubs!inner(owner_id)
      `)
      .eq('id', tournamentId)
      .eq('club.owner_id', user.id)
      .single()

    if (tournamentError || !tournament) {
      return NextResponse.json({ error: 'No tienes permisos para eliminar este torneo' }, { status: 403 })
    }

    // En lugar de eliminar, marcamos como cancelado si ya tiene inscripciones
    if (tournament.registered_teams > 0) {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: 'cancelled' })
        .eq('id', tournamentId)

      if (error) throw error
      
      return NextResponse.json({ message: 'Torneo cancelado correctamente' })
    } else {
      // Si no tiene inscripciones, lo eliminamos completamente
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId)

      if (error) throw error
      
      return NextResponse.json({ message: 'Torneo eliminado correctamente' })
    }
  } catch (error) {
    console.error('Error in DELETE /api/tournaments/[id]:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}