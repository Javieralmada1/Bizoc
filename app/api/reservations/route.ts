// app/api/reservations/route.ts - API mejorada con protección contra race conditions

import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Generar referencia única para la reserva
function generateBookingReference(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substr(2, 5)
  return `PD-${timestamp}-${random}`.toUpperCase()
}

// Obtener session ID del usuario (puedes mejorarlo con auth real)
function getSessionId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  return crypto.createHash('md5').update(ip + userAgent).digest('hex')
}

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  
  try {
    const body = await request.json()
    const {
      court_id,
      customer_name,
      customer_email,
      customer_phone,
      reservation_date,
      start_time,
      end_time,
      duration_hours = 1,
      notes = '',
      idempotency_key
    } = body

    // Validaciones básicas
    if (!court_id || !customer_name || !customer_email || !customer_phone || 
        !reservation_date || !start_time || !end_time) {
      return NextResponse.json({ 
        error: 'Todos los campos obligatorios deben ser proporcionados' 
      }, { status: 400 })
    }

    const sessionId = getSessionId(request)
    const bookingReference = generateBookingReference()
    const finalIdempotencyKey = idempotency_key || uuidv4()

    // Verificar si ya existe una reserva con la misma clave de idempotencia
    if (idempotency_key) {
      const existingReservation = await client.query(
        'SELECT * FROM reservations WHERE idempotency_key = $1',
        [idempotency_key]
      )
      
      if (existingReservation.rows.length > 0) {
        return NextResponse.json(existingReservation.rows[0], { status: 200 })
      }
    }

    await client.query('BEGIN')

    try {
      // PASO 1: Limpiar reservas temporales expiradas
      await client.query('DELETE FROM reservation_holds WHERE expires_at < NOW()')

      // PASO 2: Verificar disponibilidad y crear hold temporal (5 minutos)
      const holdResult = await client.query(`
        INSERT INTO reservation_holds (
          court_id, user_session, reservation_date, start_time, end_time, expires_at
        )
        SELECT $1, $2, $3, $4, $5, NOW() + INTERVAL '5 minutes'
        WHERE NOT EXISTS (
          -- No hay reservas confirmadas
          SELECT 1 FROM reservations 
          WHERE court_id = $1 
            AND reservation_date = $3 
            AND start_time::time = $4::time 
            AND status IN ('confirmed', 'pending')
        ) AND NOT EXISTS (
          -- No hay holds activos de otros usuarios
          SELECT 1 FROM reservation_holds 
          WHERE court_id = $1 
            AND reservation_date = $3 
            AND start_time::time = $4::time 
            AND expires_at > NOW()
            AND user_session != $2
        )
        RETURNING id
      `, [court_id, sessionId, reservation_date, start_time, end_time])

      if (holdResult.rows.length === 0) {
        await client.query('ROLLBACK')
        return NextResponse.json({ 
          error: 'El horario seleccionado ya no está disponible' 
        }, { status: 409 })
      }

      const holdId = holdResult.rows[0].id

      // PASO 3: Obtener precio para el horario
      const priceQuery = await client.query(`
        SELECT price, is_peak_hour 
        FROM pricing_rules 
        WHERE court_id = $1 
          AND $2::time >= start_time 
          AND $2::time < end_time
        ORDER BY is_peak_hour DESC
        LIMIT 1
      `, [court_id, start_time])

      const price = priceQuery.rows.length > 0 ? 
        parseFloat(priceQuery.rows[0].price) : 25.00

      // PASO 4: Crear la reserva definitiva
      const reservationResult = await client.query(`
        INSERT INTO reservations (
          club_id, court_id, customer_name, customer_email, customer_phone,
          reservation_date, start_time, end_time, duration_hours, total_price,
          notes, status, booking_reference, idempotency_key, created_at
        )
        VALUES (
          (SELECT club_id FROM courts WHERE id = $1),
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'confirmed', $11, $12, NOW()
        )
        RETURNING *
      `, [
        court_id, customer_name, customer_email, customer_phone,
        reservation_date, start_time, end_time, duration_hours, price,
        notes, bookingReference, finalIdempotencyKey
      ])

      // PASO 5: Liberar el hold temporal
      await client.query('DELETE FROM reservation_holds WHERE id = $1', [holdId])

      await client.query('COMMIT')

      const reservation = reservationResult.rows[0]

      // Respuesta exitosa con todos los detalles
      return NextResponse.json({
        id: reservation.id,
        booking_reference: reservation.booking_reference,
        court_id: reservation.court_id,
        customer_name: reservation.customer_name,
        customer_email: reservation.customer_email,
        customer_phone: reservation.customer_phone,
        reservation_date: reservation.reservation_date,
        start_time: reservation.start_time,
        end_time: reservation.end_time,
        total_price: parseFloat(reservation.total_price),
        status: reservation.status,
        created_at: reservation.created_at,
        message: 'Reserva creada exitosamente'
      }, { status: 201 })

    } catch (transactionError) {
      await client.query('ROLLBACK')
      
      // Asegurarse de que transactionError es un objeto con las propiedades esperadas
      if (
        typeof transactionError === 'object' &&
        transactionError !== null &&
        'code' in transactionError
      ) {
        const errorObj = transactionError as { code?: string; constraint?: string }
        // Manejar errores específicos de constraint violations
        if (errorObj.code === '23P01') { // exclusion_violation
          return NextResponse.json({ 
            error: 'El horario seleccionado ya está reservado por otro usuario' 
          }, { status: 409 })
        }
        
        if (errorObj.code === '23505') { // unique_violation
          if (errorObj.constraint?.includes('booking_reference')) {
            // Reintentar con nueva referencia
            return POST(request)
          }
          if (errorObj.constraint?.includes('idempotency_key')) {
            return NextResponse.json({ 
              error: 'Solicitud duplicada detectada' 
            }, { status: 409 })
          }
        }
      }

      throw transactionError
    }

  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor al procesar la reserva',
      details: process.env.NODE_ENV === 'development' && error && typeof error === 'object' && 'message' in error
        ? (error as { message?: string }).message
        : undefined
    }, { status: 500 })
    
  } finally {
    client.release()
  }
}

// GET: Obtener reservas del usuario
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const customer_email = searchParams.get('customer_email')
  const booking_reference = searchParams.get('booking_reference')
  
  if (!customer_email && !booking_reference) {
    return NextResponse.json({ 
      error: 'Se requiere customer_email o booking_reference' 
    }, { status: 400 })
  }

  try {
    let query = `
      SELECT 
        r.*,
        c.name as court_name,
        cl.name as club_name
      FROM reservations r
      JOIN courts c ON c.id = r.court_id
      JOIN clubs cl ON cl.id = r.club_id
      WHERE r.status != 'cancelled'
    `
    const params = []

    if (booking_reference) {
      query += ` AND r.booking_reference = $1`
      params.push(booking_reference)
    } else if (customer_email) {
      query += ` AND r.customer_email = $1`
      params.push(customer_email)
    }

    query += ` ORDER BY r.reservation_date DESC, r.start_time DESC`

    const result = await pool.query(query, params)
    
    return NextResponse.json({ 
      reservations: result.rows.map(row => ({
        ...row,
        total_price: parseFloat(row.total_price)
      }))
    })

  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      reservations: []
    }, { status: 500 })
  }
}