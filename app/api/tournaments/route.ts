import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get('status')
    
    console.log('Loading tournaments with filter:', statusFilter)

    let query = supabaseAdmin
      .from('tournaments')
      .select(`
        *,
        clubs!inner(name, city, province)
      `)

    // Aplicar filtro de status si existe
    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data: tournaments, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading tournaments:', error)
      throw error
    }

    // Contar equipos registrados para cada torneo
    const tournamentsWithTeams = await Promise.all(
      (tournaments || []).map(async (tournament) => {
        const { count } = await supabaseAdmin
          .from('tournament_teams')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id)

        return {
          ...tournament,
          club: tournament.clubs,
          registered_teams: count || 0
        }
      })
    )

    console.log('Tournaments loaded:', tournamentsWithTeams.length)

    return NextResponse.json({ tournaments: tournamentsWithTeams })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Error al cargar los torneos',
      tournaments: []
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Creating tournament:', body)

    // Validar datos requeridos
    if (!body.name || !body.startDate || !body.registrationDeadline) {
      return NextResponse.json({ 
        error: 'Faltan campos obligatorios: name, startDate, registrationDeadline' 
      }, { status: 400 })
    }

    // Por ahora, usar el primer club disponible (temporal)
    const { data: clubs, error: clubError } = await supabaseAdmin
      .from('clubs')
      .select('id')
      .limit(1)

    if (clubError || !clubs || clubs.length === 0) {
      return NextResponse.json({ error: 'No se encontró un club disponible' }, { status: 400 })
    }

    const clubId = clubs[0].id

    // Crear el torneo
    const { data: tournament, error } = await supabaseAdmin
      .from('tournaments')
      .insert({
        name: body.name,
        category: body.category || 'primera',
        max_teams: body.maxTeams || 32,
        scoring_system: body.scoringSystem || 'traditional',
        start_date: new Date(body.startDate).toISOString(),
        registration_deadline: new Date(body.registrationDeadline).toISOString(),
        club_id: clubId,
        status: 'registration'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tournament:', error)
      throw error
    }

    console.log('Tournament created:', tournament)

    return NextResponse.json({ tournament })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ 
      error: error.message || 'Error al crear el torneo' 
    }, { status: 500 })
  }
}