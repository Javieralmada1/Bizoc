import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const search = searchParams.get('search')

    const supabase = createRouteHandlerClient({ cookies })
    
    let query = supabase
      .from('tournaments')
      .select(`
        *,
        club:clubs(name, city, province)
      `)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,venue.ilike.%${search}%`)
    }

    const { data: tournaments, error } = await query

    if (error) {
      console.error('Error fetching tournaments:', error)
      throw error
    }

    return NextResponse.json({ tournaments: tournaments || [] })
  } catch (error) {
    console.error('Error in GET /api/tournaments:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()

    // Obtener usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Verificar que el usuario tenga un club
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('id')
      .eq('owner_id', user.id)
      .single()

    if (clubError || !club) {
      return NextResponse.json({ error: 'Debes tener un club registrado para crear torneos' }, { status: 400 })
    }

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .insert([{
        name: body.name,
        category: body.category,
        scoring_system: body.scoring_system || body.type,
        venue: body.venue,
        start_date: body.startDate,
        end_date: body.endDate,
        registration_deadline: body.registrationDeadline,
        max_teams: parseInt(body.maxTeams),
        entry_fee: body.entryFee,
        prizes: body.prizes,
        description: body.description,
        status: 'registration',
        club_id: club.id,
        format: body.type || 'eliminacion'
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating tournament:', error)
      throw error
    }

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error('Error in POST /api/tournaments:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}