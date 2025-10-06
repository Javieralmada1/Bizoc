// app/api/schedules/upsert/route.ts
import { NextResponse } from 'next/server'
import supabaseAdmin from '@/lib/supabaseAdmin'

export async function POST(req: Request) {
  try {
    const form = await req.formData()
    const court_id = String(form.get('court_id') || '')
    if (!court_id) {
      return NextResponse.json({ ok:false, error:'Falta court_id' }, { status:400 })
    }

    const rows: {
      court_id: string
      weekday: number
      open_time: string
      close_time: string
      slot_minutes: number
    }[] = []

    for (let d=0; d<=6; d++){
      const open = (form.get(`open_${d}`) as string) || ''
      const close = (form.get(`close_${d}`) as string) || ''
      const slot = Number(form.get(`slot_${d}`) || 60)
      if (open && close) {
        rows.push({ court_id, weekday:d, open_time:open, close_time:close, slot_minutes:slot })
      }
    }

    // Reemplazar la configuración completa para esa cancha
    const del = await supabaseAdmin.from('court_weekly_hours').delete().eq('court_id', court_id)
    if (del.error) {
      return NextResponse.json({ ok:false, error: del.error.message }, { status:400 })
    }

    if (rows.length) {
      const ins = await supabaseAdmin.from('court_weekly_hours').insert(rows)
      if (ins.error) {
        return NextResponse.json({ ok:false, error: ins.error.message }, { status:400 })
      }
    }

    return NextResponse.json({ ok:true })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? 'save failed' }, { status:500 })
  }
}
