// app/api/admin/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin' // Corregido: Importa el cliente admin

// GET - Obtener reservas de un club
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const club_id = searchParams.get('club_id')
  const status = searchParams.get('status') || 'confirmed'
  const limit = searchParams.get('limit') || '50'
  
  if (!club_id) {
    return NextResponse.json({ error: 'club_id es requerido' }, { status: 400 })
  }

  try {
    let query = supabaseAdmin // Corregido: Usa supabaseAdmin
      .from('reservations')
      .select(`
        *,
        courts!inner (
          id,
          name,
          club_id
        )
      `)
      .eq('club_id', club_id)
      .order('reservation_date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(parseInt(limit))

    // Filtrar por status si se especifica
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    if (error) throw error

    // Transformar los datos para incluir el nombre de la cancha en el objeto principal
    const reservations = data.map(reservation => ({
      ...reservation,
      court: {
        name: reservation.courts.name
      }
    }))

    return NextResponse.json({ reservations })
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      reservations: []
    }, { status: 500 })
  }
}