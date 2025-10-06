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
    // Cambiado de court_availability a court_schedules
    const { data, error } = await supabase
      .from('court_schedules')
      .select(`
        *,
        courts!inner (
          id,
          name,
          club_id
        )
      `)
      .eq('club_id', club_id)
      .order('weekday')
      .order('start_time')

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
    const { 
      club_id,
      court_id, 
      weekday, // Cambiado de day_of_week a weekday
      start_time, 
      end_time, 
      slot_minutes, // Cambiado de slot_duration a slot_minutes
      buffer_minutes,
      effective_from,
      effective_to,
      is_active = true
    } = body

    // Validaciones
    if (!club_id || !court_id || weekday === undefined || !start_time || !end_time || !slot_minutes) {
      return NextResponse.json({ 
        error: 'Todos los campos obligatorios son requeridos' 
      }, { status: 400 })
    }

    // Validar que weekday esté entre 0 y 6
    if (weekday < 0 || weekday > 6) {
      return NextResponse.json({ 
        error: 'weekday debe estar entre 0 (domingo) y 6 (sábado)' 
      }, { status: 400 })
    }

    // Validar que start_time sea antes que end_time
    if (start_time >= end_time) {
      return NextResponse.json({ 
        error: 'La hora de inicio debe ser anterior a la hora de fin' 
      }, { status: 400 })
    }

    // Insertar en court_schedules
    const { data, error } = await supabase
      .from('court_schedules')
      .insert({
        club_id,
        court_id,
        weekday,
        start_time,
        end_time,
        slot_minutes: parseInt(slot_minutes),
        buffer_minutes: parseInt(buffer_minutes || 0),
        effective_from: effective_from || null,
        effective_to: effective_to || null,
        is_active
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

  } catch (error: any) {
    console.error('Error creating schedule:', error)
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor'
    }, { status: 500 })
  }
}

// DELETE - Eliminar horario específico
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('court_schedules')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ 
      message: 'Horario eliminado exitosamente'
    })

  } catch (error: any) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor'
    }, { status: 500 })
  }
}

// PATCH - Actualizar horario
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ error: 'id es requerido' }, { status: 400 })
    }

    // Convertir nombres de campos si vienen del frontend
    if (updateData.slot_minutes !== undefined) {
      updateData.slot_minutes = parseInt(updateData.slot_minutes)
    }
    if (updateData.buffer_minutes !== undefined) {
      updateData.buffer_minutes = parseInt(updateData.buffer_minutes)
    }

    const { data, error } = await supabase
      .from('court_schedules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      schedule: data,
      message: 'Horario actualizado exitosamente'
    })

  } catch (error: any) {
    console.error('Error updating schedule:', error)
    return NextResponse.json({ 
      error: error.message || 'Error interno del servidor'
    }, { status: 500 })
  }
}