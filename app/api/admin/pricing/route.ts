// app/api/admin/pricing/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Obtener precios configurados para un club
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const club_id = searchParams.get('club_id')
  
  if (!club_id) {
    return NextResponse.json({ error: 'club_id es requerido' }, { status: 400 })
  }

  try {
    const { data, error } = await supabase
      .from('pricing_rules')
      .select(`
        *,
        courts!inner (
          id,
          name,
          club_id
        )
      `)
      .eq('courts.club_id', club_id)
      .order('start_time')

    if (error) throw error

    return NextResponse.json({ pricing: data || [] })
  } catch (error) {
    console.error('Error fetching pricing:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      pricing: []
    }, { status: 500 })
  }
}

// POST - Crear nueva regla de precios
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { court_id, start_time, end_time, price, is_peak_hour = false } = body

    if (!court_id || !start_time || !end_time || !price) {
      return NextResponse.json({ 
        error: 'Todos los campos son requeridos' 
      }, { status: 400 })
    }

    // Validar que start_time sea antes que end_time
    if (start_time >= end_time) {
      return NextResponse.json({ 
        error: 'La hora de inicio debe ser anterior a la hora de fin' 
      }, { status: 400 })
    }

    // Validar que el precio sea positivo
    const priceFloat = parseFloat(price)
    if (priceFloat <= 0) {
      return NextResponse.json({ 
        error: 'El precio debe ser mayor a 0' 
      }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('pricing_rules')
      .insert({
        court_id,
        start_time,
        end_time,
        price: priceFloat,
        is_peak_hour
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ 
      pricing: data,
      message: 'Regla de precios creada exitosamente'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating pricing rule:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}