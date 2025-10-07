// app/api/reservations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}
export async function OPTIONS(){ return new NextResponse(null,{status:204, headers:cors as any}) }

/**
 * GET /api/reservations?courtId=1&date=YYYY-MM-DD
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const courtId = url.searchParams.get('courtId')
  const date = url.searchParams.get('date')
  
  if (!courtId || !date) return NextResponse.json({ ok:false, error:'courtId y date son requeridos' }, { status:400, headers:cors as any })

  const { data, error } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .eq('court_id', courtId)
    // Buscamos dentro del día específico
    .gte('start_at', `${date}T00:00:00+00:00`)
    .lte('end_at', `${date}T23:59:59+00:00`)
    .order('start_at')
    
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500, headers:cors as any })
  return NextResponse.json({ ok:true, reservations: data }, { headers:cors as any })
}

/**
 * POST /api/reservations
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      courtId, start, end, clubId, 
      customer_name, customer_email, customer_phone, 
      total_price, notes 
    } = body
    
    if (!courtId || !start || !end) {
      return NextResponse.json({ ok:false, error:'courtId, start y end son requeridos' }, { status:400, headers:cors as any })
    }

    // 1. OBTENER Y FORZAR AUTENTICACIÓN
    const supabase = createRouteHandlerClient({ cookies })
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        // Devolvemos 401 para que el frontend redirija al login (lógica ya implementada)
        return NextResponse.json({ ok: false, error: 'Autenticación requerida.' }, { status: 401, headers: cors as any })
    }
    const playerId = user.id; // Usamos el ID del usuario como player_id

    // 2. Re-validación de solapamiento
    const { data: overlappingReservations } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('court_id', courtId)
      .in('status', ['confirmed', 'pending'])
      .lt('start_at', end) 
      .gt('end_at', start)

    if (overlappingReservations?.length) {
      return NextResponse.json({ ok: false, error: 'El turno ya fue tomado por otro usuario.' }, { status: 409, headers: cors as any })
    }

    // 3. Insertar la reserva usando player_id (CORREGIDO)
    const { data: insertedReservation, error } = await supabaseAdmin
      .from('reservations')
      .insert({ 
        court_id: courtId, 
        club_id: clubId,
        start_at: start, 
        end_at: end, 
        player_id: playerId, // <--- CORRECCIÓN CLAVE: Usa player_id
        customer_name, 
        customer_email,
        customer_phone,
        total_price,
        notes,
        status: 'confirmed'
      })
      .select().single()
      
    if (error) {
      console.error('Error al insertar reserva:', error)
      const msg = /no_overlap|overlap/i.test(error.message) ? 'El turno ya fue tomado' : error.message
      return NextResponse.json({ ok:false, error: msg }, { status:500, headers:cors as any })
    }
    
    return NextResponse.json({ 
      ok:true, 
      reservation: insertedReservation, 
      booking_reference: insertedReservation.id 
    }, { headers:cors as any })
    
  } catch (e:any) {
    console.error('Error en POST /api/reservations:', e)
    return NextResponse.json({ ok:false, error:e?.message ?? 'create failed' }, { status:500, headers:cors as any })
  }
}

/**
 * DELETE /api/reservations?id=UUID   (cancela)
 */
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const id = url.searchParams.get('id')
  if (!id) return NextResponse.json({ ok:false, error:'id requerido' }, { status:400, headers:cors as any })

  const { error } = await supabaseAdmin
    .from('reservations')
    .update({ status:'cancelled' }).eq('id', id)
    
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500, headers:cors as any })
  return NextResponse.json({ ok:true }, { headers:cors as any })
}