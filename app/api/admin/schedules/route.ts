// app/api/admin/schedules/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Obtener horarios configurados para un club
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const club_id = searchParams.get('club_id')
  
  if (!club_id) {
    return NextResponse.json({ error: 'club_id es requerido' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('court_availability')
      .select(`
        *,
        courts!inner (
          id,
          name,
          club_id
        )
      `)
      .eq('courts.club_id', club_id)
      .order('day_of_week')

    if (error) throw error

    return NextResponse.json({ schedules: data || [] })
  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      schedules: []
    }, { status: 500 })
  }
}

// POST - Crear nuevo horario disponible
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { court_id, day_of_week, start_time, end_time, slot_duration } = body

    if (!court_id || day_of_week === undefined || !start_time || !end_time || !slot_duration) {
      return NextResponse.json({ 
        error: 'Todos los campos son requeridos' 
      }, { status: 400 })
    }

    // Validar que day_of_week esté entre 0 y 6
    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json({ 
        error: 'day_of_week debe estar entre 0 (domingo) y 6 (sábado)' 
      }, { status: 400 })
    }

    // Validar que start_time sea antes que end_time
    if (start_time >= end_time) {
      return NextResponse.json({ 
        error: 'La hora de inicio debe ser anterior a la hora de fin' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('court_availability')
      .insert({
        court_id,
        day_of_week,
        start_time,
        end_time,
        slot_duration: parseInt(slot_duration),
        is_active: true
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // unique violation
        return NextResponse.json({ 
          error: 'Ya existe un horario configurado para esta cancha en este día de la semana' 
        }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ 
      schedule: data,
      message: 'Horario creado exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating schedule:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}