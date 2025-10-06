'use server'
import supabaseAdmin from '@/lib/supabaseAdmin'
import { revalidatePath } from 'next/cache'

export async function upsertWeeklyHours(formData: FormData) {
  const court_id = Number(formData.get('court_id'))
  if (!court_id) throw new Error('Falta court')

  const rows:any[] = []
  for (let d=0; d<=6; d++){
    const open = String(formData.get(`open_${d}`) || '')
    const close= String(formData.get(`close_${d}`) || '')
    const slot = Number(formData.get(`slot_${d}`) || 60)
    if (open && close) rows.push({ court_id, weekday:d, open_time:open, close_time:close, slot_minutes:slot })
  }

  await supabaseAdmin.from('court_weekly_hours').delete().eq('court_id', court_id)
  if (rows.length) await supabaseAdmin.from('court_weekly_hours').insert(rows)

  revalidatePath('/clubs/dashboard/schedules')
}
