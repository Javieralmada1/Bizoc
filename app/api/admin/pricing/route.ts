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

    const { data, error } = await supabase
      .from('pricing_rules')
      .insert({
        court_id,
        start_time,
        end_time,
        price: parseFloat(price),
        is_peak_hour
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ pricing: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating pricing rule:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor'
    }, { status: 500 })
  }
}