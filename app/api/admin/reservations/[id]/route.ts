// app/api/admin/reservations/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// PATCH - Actualizar estado de reserva (cancelar, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, notes } = body
    
    if (!status) {
      return NextResponse.json({ 
        error: 'Status es requerido' 
      }, { status: 400 })
    }

    // Validar que el status sea válido
    const validStatuses = ['confirmed', 'cancelled', 'pending', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: 'Status no válido. Debe ser: ' + validStatuses.join(', ')
      }, { status: 400 })
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Agregar notas si se proporcionan
    if (notes !== undefined) {
      updateData.notes = notes
    }

    const { data, error } = await supabase
      .from('reservations')
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
        error: 'Reserva no encontrada' 
      }, { status: 404 })
    }

    const actionMessage = status === 'cancelled' 
      ? 'Reserva cancelada exitosamente'
      : `Reserva actualizada a "${status}" exitosamente`

    return NextResponse.json({ 
      reservation: data,
      message: actionMessage
    })

  } catch (error) {
    console.error('Error updating reservation:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}

// GET - Obtener detalles de una reserva específica
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        courts (
          id,
          name,
          club_id
        ),
        clubs (
          name,
          address,
          city,
          province
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    if (!data) {
      return NextResponse.json({ 
        error: 'Reserva no encontrada' 
      }, { status: 404 })
    }

    return NextResponse.json({ reservation: data })

  } catch (error) {
    console.error('Error fetching reservation:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}