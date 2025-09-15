import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  const { data, error } = await supabase
    .from('record_jobs')
    .select('id, title, cron, minutes, enabled, club:clubs(name), court:courts(name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ jobs: data ?? [] })
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { title, club_id, court_id, cron, minutes } = body || {}

  if (!title || !club_id || !court_id || !cron || !minutes) {
    return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
  }

  // buscar cámara de esa cancha
  const { data: cam } = await supabase.from('cameras').select('id').eq('court_id', court_id).maybeSingle()
  if (!cam?.id) return NextResponse.json({ error: 'No hay cámara asignada a esa cancha' }, { status: 400 })

  const { data, error } = await supabase
    .from('record_jobs')
    .insert({ title, club_id, court_id, camera_id: cam.id, cron, minutes, enabled: true })
    .select('id, title, cron, minutes, enabled, club:clubs(name), court:courts(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ job: data })
}
