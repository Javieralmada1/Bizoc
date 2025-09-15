import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Obtener reservas
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const clubId = searchParams.get('club_id')
  const courtId = searchParams.get('court_id')
  const date = searchParams.get('date')

  try {
    let query = supabase
      .from('reservations')
      .select(`
        *,
        club:clubs(name),
        court:courts(name)
      `)
      .order('reservation_date', { ascending: true })

    if (clubId) query = query.eq('club_id', clubId)
    if (courtId) query = query.eq('court_id', courtId)
    if (date) query = query.eq('reservation_date', date)

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json({ reservations: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Crear nueva reserva
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      court_id,
      club_id,
      customer_name,
      customer_email,
      customer_phone,
      reservation_date,
      start_time,
      end_time,
      duration_hours,
      total_price,
      notes
    } = body

    // Validar campos requeridos
    if (!court_id || !club_id || !customer_name || !customer_email || !reservation_date || !start_time || !end_time) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    // Verificar disponibilidad usando la función SQL
    const { data: availability } = await supabase
      .rpc('check_availability', {
        p_court_id: court_id,
        p_date: reservation_date,
        p_start_time: start_time,
        p_end_time: end_time
      })

    if (!availability) {
      return NextResponse.json({ error: 'El horario no está disponible' }, { status: 409 })
    }

    // Crear la reserva
    const { data, error } = await supabase
      .from('reservations')
      .insert({
        court_id,
        club_id,
        customer_name,
        customer_email,
        customer_phone,
        reservation_date,
        start_time,
        end_time,
        duration_hours: duration_hours || 1,
        total_price: total_price || 0,
        notes,
        status: 'confirmed'
      })
      .select(`
        *,
        club:clubs(name),
        court:courts(name)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ reservation: data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}