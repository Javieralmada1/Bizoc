import { supabaseAdmin } from '@/lib/supabaseServer'

export async function GET(_: Request, { params }: { params: { clubId: string } }) {
  try {
    const { clubId } = params

    const { data: club, error: clubError } = await supabaseAdmin
      .from('clubs')
      .select('id,name,city')
      .eq('id', clubId)
      .single()
    if (clubError || !club) {
      return Response.json({ error: 'Club no encontrado' }, { status: 404 })
    }

    const { data: courts, error: courtsErr } = await supabaseAdmin
      .from('courts')
      .select('id,name,club_id')
      .eq('club_id', clubId)
      .order('name')
    if (courtsErr) return Response.json({ error: courtsErr.message }, { status: 500 })

    const { data: cameras } = await supabaseAdmin
      .from('cameras')
      .select(`id,name,ip_address,status,last_ping,court:courts(name,club_id)`)
      .eq('courts.club_id', clubId)

    const { data: activeJobs } = await supabaseAdmin
      .from('record_jobs')
      .select(`id,title,cron,minutes,enabled,court:courts(name),camera:cameras(ip_address,status)`)
      .eq('club_id', clubId)
      .eq('enabled', true)

    return Response.json({
      success: true,
      club,
      courts: courts || [],
      cameras: cameras || [],
      activeJobs: activeJobs || []
    })
  } catch (error: any) {
    console.error('Error obteniendo dashboard del club:', error)
    return Response.json({ error: error.message || 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req: Request, { params }: { params: { clubId: string } }) {
  try {
    const { clubId } = params
    const { action, payload } = await req.json()

    switch (action) {
      case 'ping_camera': {
        const { cameraId } = payload
        const { data, error } = await supabaseAdmin.rpc('ping_camera', { camera_id: cameraId })
        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, result: data, message: data ? 'Cámara responde' : 'Cámara no responde' })
      }
      case 'run_job': {
        const { jobId } = payload
        const { data: job } = await supabaseAdmin
          .from('record_jobs').select('id').eq('id', jobId).eq('club_id', clubId).single()
        if (!job) return Response.json({ error: 'Trabajo no encontrado' }, { status: 404 })
        const { error } = await supabaseAdmin.from('record_runs').insert({
          job_id: jobId, status: 'queued', trigger_type: 'manual'
        })
        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, message: 'Grabación iniciada manualmente' })
      }
      case 'update_camera_status': {
        const { cameraId: camId, status } = payload
        const { data: camera } = await supabaseAdmin
          .from('cameras').select('court_id,courts!inner(club_id)').eq('id', camId).single()
        if (!camera || (camera as any)?.courts?.club_id !== clubId) {
          return Response.json({ error: 'Cámara no encontrada' }, { status: 404 })
        }
        const { error } = await supabaseAdmin
          .from('cameras').update({ status, last_ping: new Date().toISOString() }).eq('id', camId)
        if (error) return Response.json({ error: error.message }, { status: 500 })
        return Response.json({ success: true, message: 'Estado de cámara actualizado' })
      }
      default:
        return Response.json({ error: 'Acción no válida' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error ejecutando acción del dashboard:', error)
    return Response.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
