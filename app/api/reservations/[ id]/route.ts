import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Obtener reserva específica
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select(`
        *,
        club:clubs(name, city),
        court:courts(name)
      `)
      .eq('id', params.id)
      .single()

    if (error) throw error

    return NextResponse.json({ reservation: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: Actualizar reserva (cambiar estado, etc.)
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status, notes, ...otherFields } = body

    const { data, error } = await supabase
      .from('reservations')
      .update({
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...otherFields,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select(`
        *,
        club:clubs(name),
        court:courts(name)
      `)
      .single()

    if (error) throw error

    return NextResponse.json({ reservation: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Cancelar reserva
export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    const { data, error } = await supabase
      .from('reservations')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      message: 'Reserva cancelada exitosamente',
      reservation: data 
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}