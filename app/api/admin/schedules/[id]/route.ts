// app/api/admin/schedules/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin' // Corregido: Importa el cliente admin

// PATCH - Actualizar horario específico (activar/desactivar, cambiar horarios, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const updateData: any = {}

    // Validar y preparar campos para actualización
    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active
    }
    
    if (body.start_time) {
      updateData.start_time = body.start_time
    }
    
    if (body.end_time) {
      updateData.end_time = body.end_time
    }
    
    if (body.slot_duration) {
      updateData.slot_duration = parseInt(body.slot_duration)
    }

    // Validar que haya al menos un campo para actualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ 
        error: 'No hay campos para actualizar' 
      }, { status: 400 })
    }

    // Validar horarios si se están actualizando
    if (updateData.start_time && updateData.end_time && updateData.start_time >= updateData.end_time) {
      return NextResponse.json({ 
        error: 'La hora de inicio debe ser anterior a la hora de fin' 
      }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin // Corregido: Usa supabaseAdmin
      .from('court_availability')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        courts (
          name,
          club_id
        )
      `)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ 
        error: 'Horario no encontrado' 
      }, { status: 404 })
    }

    const actionMessage = updateData.is_active !== undefined 
      ? `Horario ${updateData.is_active ? 'activado' : 'desactivado'} exitosamente`
      : 'Horario actualizado exitosamente'

    return NextResponse.json({ 
      schedule: data,
      message: actionMessage
    })

  } catch (error) {
    console.error('Error updating schedule:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// DELETE - Eliminar horario completamente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar si hay reservas futuras para este horario
    const { data: reservationCheck, error: checkError } = await supabaseAdmin // Corregido: Usa supabaseAdmin
      .from('court_availability')
      .select('court_id')
      .eq('id', params.id)
      .single()

    if (checkError) throw checkError

    if (reservationCheck) {
      const { data: reservations, error: reservationError } = await supabaseAdmin // Corregido: Usa supabaseAdmin
        .from('reservations')
        .select('id')
        .eq('court_id', reservationCheck.court_id)
        .gte('reservation_date', new Date().toISOString().split('T')[0])
        .eq('status', 'confirmed')

      if (reservationError) throw reservationError

      if (reservations && reservations.length > 0) {
        return NextResponse.json({ 
          error: `No se puede eliminar el horario porque tiene ${reservations.length} reservas futuras confirmadas. Desactívalo en su lugar.`
        }, { status: 409 })
      }
    }

    const { data, error } = await supabaseAdmin // Corregido: Usa supabaseAdmin
      .from('court_availability')
      .delete()
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ 
        error: 'Horario no encontrado' 
      }, { status: 404 })
    }

    return NextResponse.json({ 
      message: 'Horario eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}