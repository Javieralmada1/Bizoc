// app/api/schedules/route.ts - API mejorada para obtener horarios disponibles

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

interface TimeSlot {
  start: string
  end: string
  available: boolean
  price: number
  is_peak_hour: boolean
  status: 'available' | 'occupied' | 'held'
  booking_info?: {
    customer_name?: string
    booking_reference?: string
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const court_id = searchParams.get('court_id')
  const date = searchParams.get('date')
  
  if (!court_id || !date) {
    return NextResponse.json({ error: 'court_id y date son requeridos' }, { status: 400 })
  }

  try {
    // Primero limpiar reservas expiradas
    await pool.query('SELECT cleanup_expired_holds()')

    // Consulta optimizada para obtener disponibilidad
    const availabilityQuery = `
      WITH time_slots AS (
        SELECT 
          ca.court_id,
          generate_series(
            $2::date + ca.start_time,
            $2::date + ca.end_time - INTERVAL '1 minute',
            make_interval(mins => ca.slot_duration)
          ) AS slot_start,
          ca.slot_duration
        FROM court_availability ca
        WHERE ca.court_id = $1 
          AND ca.day_of_week = EXTRACT(DOW FROM $2::date)
          AND ca.is_active = true
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

    const result = await pool.query(availabilityQuery, [court_id, date])
    
    const slots: TimeSlot[] = result.rows.map(row => ({
      start: row.slot_start.toISOString(),
      end: row.slot_end.toISOString(),
      available: row.status === 'available',
      price: parseFloat(row.price),
      is_peak_hour: row.is_peak_hour,
      status: row.status,
      ...(row.status === 'occupied' && {
        booking_info: {
          customer_name: row.customer_name,
          booking_reference: row.booking_reference
        }
      })
    }))

    return NextResponse.json({ 
      slots,
      court_id: parseInt(court_id),
      date,
      total_slots: slots.length,
      available_slots: slots.filter(s => s.available).length
    })

  } catch (error) {
    console.error('Error fetching schedules:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      slots: []
    }, { status: 500 })
  }
}