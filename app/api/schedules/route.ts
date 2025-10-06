import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import dayjs from 'dayjs'

export const dynamic = 'force-dynamic'

// http://localhost:3000/api/schedules?courtId=XXXX&date=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { searchParams } = new URL(req.url)
    const courtId = searchParams.get('courtId')
    const dateStr = searchParams.get('date')

    if (!courtId || !dateStr) {
      return NextResponse.json({ error: 'Missing courtId or date parameter' }, { status: 400 })
    }

    // Consulta optimizada para obtener disponibilidad
    // --- CONSULTA SQL CORREGIDA ---
    const availabilityQuery = `
      WITH time_slots AS (
        SELECT 
          cwh.court_id,
          generate_series(
            $2::date + cwh.open_time,
            $2::date + cwh.close_time - INTERVAL '1 minute',
            make_interval(mins => cwh.slot_minutes)
          ) AS slot_start,
          cwh.slot_minutes AS slot_duration -- Cambiado de slot_minutes a slot_duration para el CTE
        FROM court_weekly_hours cwh  -- <<-- TABLA CORREGIDA
        WHERE cwh.court_id = $1 
          AND cwh.weekday = EXTRACT(DOW FROM $2::date) -- <<-- COLUMNA CORREGIDA
      ),
      slot_details AS (
        SELECT 
          ts.court_id,
          ts.slot_start,
          ts.slot_start + make_interval(mins => ts.slot_duration) as slot_end,
          COALESCE(pr.price, 25.00) as price,
          COALESCE(pr.is_peak_hour, false) as is_peak_hour
        FROM time_slots ts
        LEFT JOIN pricing_rules pr ON pr.court_id = ts.court_id
          AND ts.slot_start::time >= pr.start_time 
          AND ts.slot_start::time < pr.end_time
      )
      SELECT 
        sd.slot_start,
        sd.slot_end,
        sd.price,
        sd.is_peak_hour,
        CASE 
          WHEN r.id IS NOT NULL THEN 'occupied'
          WHEN rh.id IS NOT NULL THEN 'held'
          ELSE 'available'
        END as status,
        r.customer_name,
        r.booking_reference
      FROM slot_details sd
      LEFT JOIN reservations r ON r.court_id = sd.court_id 
        AND r.reservation_date = $2::date
        AND r.start_time::time = sd.slot_start::time
        AND r.status IN ('confirmed', 'pending')
      LEFT JOIN reservation_holds rh ON rh.court_id = sd.court_id 
        AND rh.reservation_date = $2::date
        AND rh.start_time::time = sd.slot_start::time
        AND rh.expires_at > NOW()
      ORDER BY sd.slot_start;
    `

    // Ejecutar la consulta SQL
    const { data: slots, error } = await supabase.rpc('execute_sql', {
      query: availabilityQuery,
      params: [courtId, dateStr],
    }).select('*')


    if (error) {
      console.error('SQL Execution Error:', error)
      return NextResponse.json({ error: 'Failed to fetch availability data', details: error.message }, { status: 500 })
    }

    // El resultado de la RPC (Remote Procedure Call) es un array de objetos con una propiedad 'execute_sql' que contiene el resultado real.
    // Accedemos a la data dentro de slots[0].execute_sql
    const finalSlots = slots ? (slots as any)[0].execute_sql : []
    
    // Convertir los resultados de texto a objetos JavaScript
    const parsedSlots = finalSlots.map((slot:any) => ({
      ...slot,
      slot_start: dayjs(slot.slot_start).toISOString(),
      slot_end: dayjs(slot.slot_end).toISOString(),
      price: parseFloat(slot.price),
      is_peak_hour: slot.is_peak_hour === 't', // Convertir 't' a true
    }))

    return NextResponse.json({ courtId, date: dateStr, slots: parsedSlots })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}