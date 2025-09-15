import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(_: Request, { params }: { params: { id: string } }) {
  try {
    // ¿existe ese job?
    const { data: job, error: jobErr } = await supabase
      .from('record_jobs')
      .select('id')
      .eq('id', params.id)
      .maybeSingle()

    if (jobErr) {
      console.error('[jobs/id POST] jobErr:', jobErr.message)
      return NextResponse.json({ error: jobErr.message }, { status: 500 })
    }
    if (!job?.id) {
      return NextResponse.json({ error: 'Job no existe (ID inválido)' }, { status: 400 })
    }

    // encolar ejecución manual
    const { error } = await supabase
      .from('record_runs')
      .insert({ job_id: params.id, status: 'queued' }) // si tu esquema exige started_at NOT NULL, añade: started_at: new Date().toISOString()
    if (error) {
      console.error('[jobs/id POST] insert error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[jobs/id POST] fatal:', e?.message || e)
    return NextResponse.json({ error: e?.message || 'unexpected' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { enabled } = await req.json().catch(() => ({}))
  const { error } = await supabase.from('record_jobs').update({ enabled }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { error } = await supabase.from('record_jobs').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
