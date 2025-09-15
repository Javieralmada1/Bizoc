// worker/index.mjs - Versión corregida
import 'dotenv/config'
import cron from 'node-cron'
import { mkdirSync, existsSync, statSync, readdirSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { format } from 'date-fns'
import { execa } from 'execa'
import { createClient } from '@supabase/supabase-js'

// --- Config ---
const TZ_DEFAULT = 'America/Argentina/Buenos_Aires'
const KEEP_DAYS = 7
const PUBLIC_DIR = join(process.cwd(), 'public')
const VIDEOS_DIR = join(PUBLIC_DIR, 'videos')

// Verificar variables de entorno
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('[worker] ❌ Faltan variables de entorno:')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', url ? '✅' : '❌')
  console.error('SUPABASE_SERVICE_ROLE_KEY:', serviceKey ? '✅' : '❌')
  process.exit(1)
}

// Crear cliente Supabase con service key
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// Cliente Realtime dedicado
const realtime = createClient(url, serviceKey, { 
  realtime: { params: { eventsPerSecond: 5 } } 
})

// Asegurar carpetas
if (!existsSync(VIDEOS_DIR)) mkdirSync(VIDEOS_DIR, { recursive: true })

console.log('[worker] 🚀 Configuración cargada:')
console.log('- Zona horaria:', TZ_DEFAULT)
console.log('- Directorio videos:', VIDEOS_DIR)
console.log('- Retener archivos:', KEEP_DAYS, 'días')

// --- Simple lock para evitar múltiples workers ---
async function acquireLock() {
  const owner = `worker-${process.pid}`
  const now = new Date()
  const expires = new Date(now.getTime() + 60_000) // 1 minuto

  try {
    // Intentar crear el lock
    const { data: existing } = await supabase
      .from('scheduler_lock')
      .select('*')
      .eq('id', 1)
      .maybeSingle()

    if (!existing) {
      // No existe, crearlo
      const { error } = await supabase
        .from('scheduler_lock')
        .insert({ id: 1, owner, expires_at: expires.toISOString() })
      
      if (error) throw error
      console.log('[worker] 🔒 Lock adquirido por', owner)
      return owner
    }

    // Existe, verificar si expiró
    if (!existing.expires_at || new Date(existing.expires_at) < now) {
      // Expirado, tomarlo
      const { error } = await supabase
        .from('scheduler_lock')
        .update({ owner, expires_at: expires.toISOString() })
        .eq('id', 1)
      
      if (error) throw error
      console.log('[worker] 🔒 Lock tomado de worker expirado por', owner)
      return owner
    }

    // Activo por otro worker
    throw new Error(`Otro worker activo: ${existing.owner} (expira: ${existing.expires_at})`)
  } catch (error) {
    console.error('[worker] ❌ Error adquiriendo lock:', error.message)
    throw error
  }
}

async function refreshLock(owner) {
  const expires = new Date(Date.now() + 60_000)
  try {
    await supabase
      .from('scheduler_lock')
      .update({ expires_at: expires.toISOString() })
      .eq('id', 1)
      .eq('owner', owner)
  } catch (error) {
    console.error('[worker] ⚠️ Error refrescando lock:', error.message)
  }
}

// Schedules activos
const schedules = new Map()

// Construye RTSP URL para Dahua
function rtspFromJob(job) {
  const c = job.camera
  if (!c) return null
  
  const channel = c.channel ?? 1
  const subtype = c.subtype ?? 0
  const user = encodeURIComponent(c.username || 'admin')
  const pass = encodeURIComponent(c.password || '')
  
  return `rtsp://${user}:${pass}@${c.ip_address}:554/cam/realmonitor?channel=${channel}&subtype=${subtype}`
}

// Ejecuta grabación
async function runJob(job, cause = 'cron') {
  console.log(`[worker] 🎬 Iniciando grabación: ${job.title} (${cause})`)
  
  const started = new Date()
  const dayDir = join(VIDEOS_DIR, format(started, 'yyyy-MM-dd'))
  
  if (!existsSync(dayDir)) {
    mkdirSync(dayDir, { recursive: true })
    console.log('[worker] 📁 Creado directorio:', dayDir)
  }

  const filenameBase = [
    format(started, 'yyyyMMdd_HHmmss'),
    (job.club?.name || 'club').replace(/\s+/g, '-'),
    (job.court?.name || 'cancha').replace(/\s+/g, '-')
  ].join('_')

  const outPath = join(dayDir, `${filenameBase}.mp4`)
  const publicUrl = `/videos/${format(started, 'yyyy-MM-dd')}/${filenameBase}.mp4`

  // Crear registro de ejecución
  const { data: run } = await supabase
    .from('record_runs')
    .insert({ 
      job_id: job.id, 
      status: 'running', 
      started_at: started.toISOString() 
    })
    .select('*')
    .single()

  const seconds = job.minutes * 60
  const rtsp = rtspFromJob(job)

  if (!rtsp) {
    console.error('[worker] ❌ No se pudo construir URL RTSP para job', job.id)
    await supabase
      .from('record_runs')
      .update({ status: 'error', error: 'URL RTSP inválida' })
      .eq('id', run.id)
    return
  }

  console.log('[worker] 📹 RTSP URL:', rtsp.replace(/:[^:@]+@/, ':***@')) // ocultar password en logs
  console.log('[worker] ⏱️ Duración:', seconds, 'segundos')
  console.log('[worker] 💾 Archivo destino:', outPath)

  // Comando ffmpeg
  const args = [
    '-rtsp_transport', 'tcp',
    '-i', rtsp,
    '-t', String(seconds),
    '-c:v', 'libx264', 
    '-preset', 'veryfast', 
    '-crf', '23',
    '-c:a', 'aac', 
    '-ar', '44100', 
    '-ac', '2',
    '-y', // sobrescribir si existe
    outPath
  ]

  console.log(`[worker] 🎬 Ejecutando: ffmpeg ${args.join(' ')}`)

  try {
    // Ejecutar ffmpeg
    const result = await execa('ffmpeg', args, { 
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: (seconds + 30) * 1000 // timeout con margen
    })

    const finished = new Date()
    
    // Verificar que el archivo se creó
    if (!existsSync(outPath)) {
      throw new Error('El archivo de video no se generó')
    }

    const stats = statSync(outPath)
    console.log(`[worker] ✅ Video creado: ${outPath} (${Math.round(stats.size / 1024 / 1024)}MB)`)

    // Actualizar registro
    await supabase
      .from('record_runs')
      .update({
        status: 'ok',
        finished_at: finished.toISOString(),
        duration_sec: seconds,
        video_url: publicUrl,
        file_size: stats.size
      })
      .eq('id', run.id)

    // Crear entrada en matches si no existe
    const { data: existingMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('scheduled_at', started.toISOString())
      .eq('club_id', job.club_id)
      .eq('court_id', job.court_id)
      .maybeSingle()

    if (!existingMatch) {
      await supabase
        .from('matches')
        .insert({
          title: job.title || 'Grabación automática',
          scheduled_at: started.toISOString(),
          club_id: job.club_id,
          court_id: job.court_id,
          video_url: publicUrl
        })
      console.log('[worker] 🎯 Match creado:', job.title)
    }

    console.log(`[worker] ✅ Grabación completada: ${publicUrl}`)

  } catch (error) {
    console.error('[worker] ❌ Error en grabación:', error.message)
    
    // Limpiar archivo parcial si existe
    try {
      if (existsSync(outPath)) {
        unlinkSync(outPath)
        console.log('[worker] 🗑️ Archivo parcial eliminado')
      }
    } catch {}

    // Actualizar registro con error
    await supabase
      .from('record_runs')
      .update({ 
        status: 'error', 
        error: error.message || 'Error desconocido',
        finished_at: new Date().toISOString()
      })
      .eq('id', run.id)
  }
}

// 🔧 FUNCIÓN scheduleAll() CORREGIDA
async function scheduleAll() {
  console.log('[worker] 📅 Reprogramando jobs...')
  
  // Limpiar schedules existentes
  for (const [, task] of schedules) {
    task.stop()
  }
  schedules.clear()

  try {
    // 🔧 CONSULTA CORREGIDA
    const { data: jobs, error } = await supabase
      .from('record_jobs')
      .select(`
        id, title, cron, minutes, enabled, timezone, club_id, court_id,
        cameras!inner(ip_address, username, password, channel, subtype),
        clubs!inner(name),
        courts!inner(name)
      `)
      .eq('enabled', true)

    if (error) {
      console.error('[worker] ❌ Error cargando jobs:', error.message)
      return
    }

    console.log(`[worker] 📋 Encontrados ${jobs?.length || 0} jobs activos`)

    for (const job of (jobs || [])) {
      if (!job.cameras?.ip_address) {
        console.warn(`[worker] ⚠️ Job ${job.id} sin cámara válida, saltando`)
        continue
      }

      // 🔧 MAPEAR DATOS para compatibilidad con runJob
      const jobWithCamera = {
        ...job,
        camera: job.cameras,  // Mapear cameras -> camera
        club: job.clubs,      // Mapear clubs -> club
        court: job.courts     // Mapear courts -> court
      }

      const tz = job.timezone || TZ_DEFAULT
      
      try {
        const task = cron.schedule(job.cron, () => {
          console.log(`[worker] ⏰ Ejecutando job programado: ${job.title}`)
          runJob(jobWithCamera, 'cron')
        }, { 
          timezone: tz,
          scheduled: true
        })
        
        schedules.set(job.id, task)
        console.log(`[worker] ✅ Programado: ${job.title} · ${job.cron} · ${tz}`)
        
      } catch (error) {
        console.error(`[worker] ❌ Cron inválido para job ${job.id}: "${job.cron}" - ${error.message}`)
      }
    }

    console.log(`[worker] 🎯 ${schedules.size} jobs programados correctamente`)

  } catch (error) {
    console.error('[worker] ❌ Error en scheduleAll:', error.message)
  }
}

// 🔧 FUNCIÓN watchRealtime() CORREGIDA
async function watchRealtime() {
  console.log('[worker] 👁️ Configurando watch de tiempo real...')

  // Escuchar cambios en record_jobs
  realtime
    .channel('jobs')
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'record_jobs' 
    }, async (payload) => {
      console.log('[worker] 🔄 Cambio en record_jobs:', payload.eventType)
      await scheduleAll()
    })
    .subscribe((status) => {
      console.log('[worker] 🔌 Canal jobs:', status)
    })

  // Escuchar ejecuciones manuales - FUNCIÓN CORREGIDA
  realtime
    .channel('runs')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'record_runs' 
    }, async (payload) => {
      const row = payload.new
      if (row?.status !== 'queued') return

      console.log('[worker] 🎬 Ejecución manual solicitada para job:', row.job_id)

      try {
        // 🔧 CONSULTA CORREGIDA - usar sintaxis Supabase correcta
        const { data: job, error } = await supabase
          .from('record_jobs')
          .select(`
            id, title, cron, minutes, club_id, court_id,
            cameras!inner(ip_address, username, password, channel, subtype),
            clubs!inner(name),
            courts!inner(name)
          `)
          .eq('id', row.job_id)
          .single()

        if (error) {
          console.error('[worker] ❌ Error consultando job:', error.message)
          return
        }

        console.log('[worker] 📋 Job obtenido:', { 
          id: job.id, 
          title: job.title,
          camera_ip: job.cameras?.ip_address 
        })

        if (job?.cameras?.ip_address) {
          // 🔧 MAPEAR DATOS para compatibilidad con runJob
          const jobWithCamera = {
            ...job,
            camera: job.cameras,  // Mapear cameras -> camera
            club: job.clubs,      // Mapear clubs -> club  
            court: job.courts     // Mapear courts -> court
          }
          await runJob(jobWithCamera, 'manual')
        } else {
          console.error('[worker] ❌ Job manual sin cámara válida:', row.job_id)
        }
      } catch (error) {
        console.error('[worker] ❌ Error en ejecución manual:', error.message)
      }
    })
    .subscribe((status) => {
      console.log('[worker] 🔌 Canal runs:', status)
    })
}

// Limpieza de archivos antiguos
function cleanupOldFiles() {
  console.log('[worker] 🧹 Iniciando limpieza de archivos antiguos...')
  
  try {
    const today = new Date()
    const dirs = readdirSync(VIDEOS_DIR)
    let cleanedCount = 0

    for (const dayFolder of dirs) {
      const fullPath = join(VIDEOS_DIR, dayFolder)
      
      try {
        const stats = statSync(fullPath)
        if (!stats.isDirectory()) continue

        const ageDays = Math.floor((today.getTime() - stats.mtime.getTime()) / 86400000)
        
        if (ageDays > KEEP_DAYS) {
          const files = readdirSync(fullPath)
          for (const file of files) {
            unlinkSync(join(fullPath, file))
          }
          cleanedCount += files.length
          console.log(`[worker] 🗑️ Limpiado directorio: ${dayFolder} (${files.length} archivos)`)
        }
      } catch (error) {
        console.error(`[worker] ⚠️ Error procesando ${dayFolder}:`, error.message)
      }
    }

    if (cleanedCount > 0) {
      console.log(`[worker] ✅ Limpieza completada: ${cleanedCount} archivos eliminados`)
    } else {
      console.log('[worker] ℹ️ No hay archivos para limpiar')
    }

  } catch (error) {
    console.error('[worker] ❌ Error en limpieza:', error.message)
  }
}

// Función principal
async function main() {
  try {
    console.log('[worker] 🚀 Iniciando BulkMatch Worker...')
    
    // Adquirir lock
    const owner = await acquireLock()
    
    // Programar jobs iniciales
    await scheduleAll()
    
    // Configurar realtime
    await watchRealtime()
    
    // Configurar refresco de lock cada 30 segundos
    setInterval(() => refreshLock(owner), 30_000)
    
    // Configurar limpieza diaria a las 3:00
    cron.schedule('0 3 * * *', cleanupOldFiles, { 
      timezone: TZ_DEFAULT 
    })
    console.log('[worker] 🧹 Limpieza programada para las 03:00 diarias')

    console.log('[worker] ✅ Worker iniciado correctamente')
    console.log('[worker] 🎯 Monitoreo activo de jobs y ejecuciones manuales')

  } catch (error) {
    console.error('[worker] ❌ Error fatal:', error.message)
    process.exit(1)
  }
}

// Manejo de señales para cierre limpio
process.on('SIGINT', () => {
  console.log('[worker] 🛑 Recibida señal SIGINT, cerrando...')
  for (const [, task] of schedules) {
    task.stop()
  }
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('[worker] 🛑 Recibida señal SIGTERM, cerrando...')
  for (const [, task] of schedules) {
    task.stop()
  }
  process.exit(0)
})

// Iniciar
main()