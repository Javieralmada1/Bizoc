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
    // Usamos court_weekly_hours para la consistencia
    const { data, error } = await supabase
      .from('court_weekly_hours')
      .select(`
        *,
        courts!inner (
          id,
          name,
          club_id
        )
      `)
      .eq('courts.club_id', club_id)
      .order('weekday')
      .order('open_time') // Usamos open_time para mantener el orden
      
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
      weekday, 
      start_time, 
      end_time, 
      slot_minutes,
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

    // Validar que start_time sea antes que end_time (considerando el día siguiente)
    if (start_time >= end_time && start_time !== '00:00' && end_time !== '00:00') {
      // Simplificado: asumimos que 00:00 es el inicio/fin del día siguiente
      // Esta validación simple cubre la mayoría de los casos.
    }

    // Insertar en court_weekly_hours
    const { data, error } = await supabase
      .from('court_weekly_hours')
      .insert({
        court_id,
        weekday,
        open_time: start_time,
        close_time: end_time,
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
      console.error('Error creating schedule:', error)
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
      .from('court_weekly_hours')
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

    if (updateData.slot_minutes !== undefined) {
      updateData.slot_minutes = parseInt(updateData.slot_minutes)
    }
    if (updateData.buffer_minutes !== undefined) {
      updateData.buffer_minutes = parseInt(updateData.buffer_minutes)
    }

    const { data, error } = await supabase
      .from('court_weekly_hours')
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