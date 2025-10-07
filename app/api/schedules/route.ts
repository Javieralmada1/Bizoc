import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import dayjs from 'dayjs'
import { buildDailySlots } from '@/lib/slots' // Importamos la utilidad de cálculo

export const dynamic = 'force-dynamic'

// GET /api/schedules?courtId=XXXX&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { searchParams } = new URL(req.url)
    const courtId = searchParams.get('courtId')
    const dateStr = searchParams.get('date')

    if (!courtId || !dateStr) {
      return NextResponse.json({ error: 'Missing courtId or date parameter' }, { status: 400 })
    }

    const date = dayjs(dateStr)
    const weekday = date.day() // 0 (Sun) to 6 (Sat)

    // 1. Obtener la configuración semanal para ese día y cancha
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('court_weekly_hours')
      .select('open_time, close_time, slot_minutes')
      .eq('court_id', courtId)
      .eq('weekday', weekday)
      .eq('is_active', true)
      .maybeSingle()

    if (scheduleError) throw scheduleError
    
    // Si no hay horario configurado para este día, terminamos
    if (!scheduleData) {
      return NextResponse.json({ courtId, date: dateStr, slots: [] })
    }
    
    // 2. Obtener todas las reservas (y holds) para ese día
    const { data: reservations, error: resError } = await supabase
      .from('reservations')
      .select('start_at, end_at, status') // Traemos solo lo necesario para el cálculo
      .eq('court_id', courtId)
      .gte('start_at', date.startOf('day').toISOString())
      .lte('end_at', date.endOf('day').toISOString())
      .in('status', ['confirmed', 'pending']) // Solo las que realmente bloquean el slot

    if (resError) throw resError

    // 3. Generar slots usando la función de librería
    const slots = buildDailySlots({
      date: dateStr,
      // Nota: tz (timezone) se asume como el del servidor o dayjs.tz.guess()
      open: scheduleData.open_time,
      close: scheduleData.close_time,
      slotMinutes: scheduleData.slot_minutes,
      reservations: reservations || []
    })

    // NOTA: Esta lógica simplificada no trae precios ni is_peak_hour.
    // Si necesitas esa información en el front, la deberías obtener por separado 
    // o integrarla aquí (ej. consultando la tabla pricing_rules).
    // Por ahora, solo devolvemos disponibilidad (available: true/false).

    return NextResponse.json({ 
        courtId, 
        date: dateStr, 
        slots: slots.map(s => ({
          ...s,
          status: s.available ? 'available' : 'occupied',
          price: 25, // Fallback price (puedes ajustarlo si sabes el precio base)
          is_peak_hour: false // Falso por defecto
        })) 
    })

  } catch (error: any) {
    console.error('API Error in /api/schedules:', error.message)
    // Devolvemos un error 500 amigable
    return NextResponse.json({ 
      error: 'Internal Server Error: ' + error.message, 
      details: 'Check server logs for database connection/RLS issues.'
    }, { status: 500 })
  }
}