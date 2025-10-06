// app/api/schedules/upsert/route.ts
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

// Recibe FormData con: court_id y los pares open_X, close_X, slot_X para X=0..6
export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const court_id = String(formData.get('court_id') || '')
    if (!court_id) return NextResponse.json({ ok:false, error:'Falta court_id' }, { status:400 })

    const rows: {
      court_id: string
      weekday: number
      open_time: string
      close_time: string
      slot_minutes: number
    }[] = []

    for (let d = 0; d <= 6; d++) {
      const open = (formData.get(`open_${d}`) as string) || ''
      const close = (formData.get(`close_${d}`) as string) || ''
      const slot = Number(formData.get(`slot_${d}`) || 60)
      if (open && close) {
        rows.push({ court_id, weekday:d, open_time:open, close_time:close, slot_minutes:slot })
      }
    }

    // Reemplazar la semana tipo completa
    const del = await supabaseAdmin.from('court_weekly_hours').delete().eq('court_id', court_id)
    if (del.error) return NextResponse.json({ ok:false, error: del.error.message }, { status:400 })

    if (rows.length) {
      const ins = await supabaseAdmin.from('court_weekly_hours').insert(rows)
      if (ins.error) return NextResponse.json({ ok:false, error: ins.error.message }, { status:400 })
    }

    return NextResponse.json({ ok:true })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? 'save failed' }, { status:500 })
  }
}
