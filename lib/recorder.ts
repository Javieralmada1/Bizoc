// /lib/recorder.ts
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import fs from 'node:fs'
import cron, { ScheduledTask } from 'node-cron'   // 👈 importa también el tipo
import { format } from 'date-fns'
import { supabaseAdmin } from './supabaseAdmin' // ⬅️ reemplaza supabaseServer por supabaseAdmin


const pexec = promisify(exec)

type JobInfo = {
  id: string
  cron: string
  clubId?: string | null
  courtId?: string | null
  title?: string | null
  minutes: number
}

const jobs = new Map<string, ScheduledTask>()     // 👈 usar ScheduledTask (NO cron.ScheduledTask)

function ffmpegRecordOnce({
  rtsp,
  outDir,
  filename,
  minutes
}: { rtsp: string; outDir: string; filename: string; minutes: number }) {
  const duration = Math.max(1, minutes) // minutos
  const outPath = path.join(outDir, filename)

  // Re-codificar a H.264 + AAC (compatible browser)
  const cmd = `ffmpeg -y -rtsp_transport tcp -i "${rtsp}" -t ${duration * 60} -c:v libx264 -preset veryfast -crf 22 -c:a aac -b:a 128k "${outPath}"`
  return pexec(cmd, { windowsHide: true })
}

// Helpers: obtener o crear Club/Court
async function getOrCreateClubByName(name: string) {
  const supabase = supabaseAdmin() // ⬅️ usa admin para escritura
  const { data: found } = await supabase.from('clubs').select('*').ilike('name', name).limit(1).maybeSingle()
  if (found) return found
  const { data, error } = await supabase.from('clubs').insert({ name }).select('*').single()
  if (error) throw error
  return data
}

async function getOrCreateCourtByName(clubId: string | null, name: string) {
  const supabase = supabaseAdmin() // ⬅️ usa admin para escritura
  if (clubId) {
    const { data: found } = await supabase
      .from('courts').select('*')
      .eq('club_id', clubId).ilike('name', name)
      .limit(1).maybeSingle()
    if (found) return found
    const { data, error } = await supabase.from('courts').insert({ name, club_id: clubId }).select('*').single()
    if (error) throw error
    return data
  }
  const { data: found2 } = await supabase.from('courts').select('*').ilike('name', name).limit(1).maybeSingle()
  if (found2) return found2
  const { data, error } = await supabase.from('courts').insert({ name }).select('*').single()
  if (error) throw error
  return data
}

// Cambia también en recordNowAndCreateMatch y scheduleRecording:
export async function recordNowAndCreateMatch(opts: {
  minutes: number
  clubId?: string | null
  courtId?: string | null
  clubName?: string | null
  courtName?: string | null
  title?: string | null
}) {
  const rtsp = process.env.LOCAL_RTSP!
  const outDir = process.env.RECORD_OUT_DIR || 'public/videos'
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  // resolver club/cancha
  let clubId = opts.clubId || null
  let courtId = opts.courtId || null

  if (!clubId && opts.clubName) {
    const club = await getOrCreateClubByName(opts.clubName)
    clubId = club.id
  }
  if (!courtId && opts.courtName) {
    const court = await getOrCreateCourtByName(clubId, opts.courtName)
    courtId = court.id
  }

  const start = new Date()
  const base = `club_${clubId || 'test'}_${format(start, 'yyyyMMdd_HHmm')}.mp4`

  await ffmpegRecordOnce({ rtsp, outDir, filename: base, minutes: opts.minutes })

  const supabase = supabaseAdmin() // ⬅️ usa admin para escritura
  const { data, error } = await supabase.from('matches').insert({
    title: opts.title || 'Grabación local',
    video_url: `/videos/${base}`,
    scheduled_at: start.toISOString(),
    club_id: clubId,
    court_id: courtId
  }).select('*').single()

  if (error) throw error
  return data
}

export function scheduleRecording(job: JobInfo) {
  const rtsp = process.env.LOCAL_RTSP!
  const outDir = process.env.RECORD_OUT_DIR || 'public/videos'
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  // cron: "0 18 * * 1-5" -> L-V 18:00, por ejemplo
  const task = cron.schedule(job.cron, async () => {
    try {
      const start = new Date()
      const base = `club_${job.clubId || 'test'}_${format(start, 'yyyyMMdd_HHmm')}.mp4`
      await ffmpegRecordOnce({ rtsp, outDir, filename: base, minutes: job.minutes })

      const supabase = supabaseAdmin() // ⬅️ usa admin para escritura
      await supabase.from('matches').insert({
        title: job.title || 'Grabación programada',
        video_url: `/videos/${base}`,
        scheduled_at: start.toISOString(),
        club_id: job.clubId || null,
        court_id: job.courtId || null
      })
      // opcional: logs a consola
      console.log(`[recorder] match creado: ${base}`)
    } catch (e) {
      console.error('[recorder] error en tarea programada', e)
    }
  })
  jobs.set(job.id, task)
  return job.id
}

export function listJobs() {
  return Array.from(jobs.keys())
}

export function cancelJob(id: string) {
  const task = jobs.get(id)
  if (task) {
    task.stop()
    jobs.delete(id)
    return true
  }
  return false
}
