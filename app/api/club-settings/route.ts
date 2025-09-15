import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Obtener horarios disponibles
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const courtId = searchParams.get('court_id')
  const date = searchParams.get('date')
  const dayOfWeek = searchParams.get('day_of_week')

  try {
    if (!courtId) {
      return NextResponse.json({ error: 'court_id es requerido' }, { status: 400 })
    }

    let query = supabase
      .from('court_schedules')
      .select('*')
      .eq('court_id', courtId)
      .eq('is_active', true)
      .order('start_time')

    if (dayOfWeek !== null) {
      query = query.eq('day_of_week', dayOfWeek)
    }

    const { data: schedules, error: scheduleError } = await query

    if (scheduleError) throw scheduleError

    // Si se especifica una fecha, filtrar por reservas existentes
    if (date) {
      const { data: reservations, error: reservationError } = await supabase
        .from('reservations')
        .select('start_time, end_time')
        .eq('court_id', courtId)
        .eq('reservation_date', date)
        .neq('status', 'cancelled')

      if (reservationError) throw reservationError

      // Filtrar horarios disponibles
      const availableSchedules = schedules?.filter(schedule => {
        const isReserved = reservations?.some(reservation =>
          schedule.start_time >= reservation.start_time &&
          schedule.start_time < reservation.end_time
        )
        return !isReserved
      })

      return NextResponse.json({ schedules: availableSchedules })
    }

    return NextResponse.json({ schedules })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Crear horarios para una cancha
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      court_id,
      start_time = '08:00',
      end_time = '23:00',
      slot_duration = '1 hour',
      price_per_hour = 25.00
    } = body

    if (!court_id) {
      return NextResponse.json({ error: 'court_id es requerido' }, { status: 400 })
    }

    // Usar la función SQL para generar horarios
    const { data, error } = await supabase
      .rpc('generate_court_schedules', {
        p_court_id: court_id,
        p_start_time: start_time,
        p_end_time: end_time,
        p_slot_duration: slot_duration,
        p_price_per_hour: price_per_hour
      })

    if (error) throw error

    return NextResponse.json({ 
      message: `${data} horarios creados exitosamente`,
      slots_created: data 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}