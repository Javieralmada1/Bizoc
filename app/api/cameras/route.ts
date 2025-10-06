import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { discover } from '@/lib/cameraDiscovery'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper Dahua RTSP (principal: channel=1, subtype=0)
function buildRtspUrl({ ip_address, username, password }: { ip_address: string; username: string; password: string }) {
  const user = encodeURIComponent(username || 'admin')
  const pass = encodeURIComponent(password || '')
  return `rtsp://${user}:${pass}@${ip_address}:554/cam/realmonitor?channel=1&subtype=0`
}

// GET: descubrir cámaras
export async function GET(req: Request) {
  const url = new URL(req.url)
  const discover_param = url.searchParams.get('discover')

  if (discover_param === 'true') {
    try {
      const discoveredCams = await discover()
      return NextResponse.json({ ok: true, cameras: discoveredCams })
    } catch (e: any) {
      return NextResponse.json(
        { ok: false, error: e.message ?? 'discovery failed' },
        { status: 500 }
      )
    }
  }

  // Código existente para listar cámaras
  const { data, error } = await supabase
    .from('cameras')
    .select('id, court_id, name, ip_address, username, model, status, rtsp_url')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ cameras: data ?? [] })
}

// POST: crea cámara (calcula rtsp_url)
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { court_id, name, ip_address, username = 'admin', password, model } = body || {}

  if (!court_id || !name || !ip_address || !password) {
    return NextResponse.json({ error: 'Faltan datos: court_id, name, ip_address, password' }, { status: 400 })
  }

  // validar cancha
  const { data: court, error: courtErr } = await supabase
    .from('courts').select('id').eq('id', court_id).maybeSingle()
  if (courtErr) return NextResponse.json({ error: courtErr.message }, { status: 500 })
  if (!court?.id) return NextResponse.json({ error: 'La cancha no existe' }, { status: 400 })

  // construir RTSP
  const rtsp_url = buildRtspUrl({ ip_address, username, password })

  // insertar cámara
  const { data, error } = await supabase
    .from('cameras')
    .insert({
      court_id,
      name,
      ip_address,
      username,
      password,
      model,
      status: 'offline',
      rtsp_url
    })
    .select('id, court_id, name, ip_address, username, model, status, rtsp_url')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ camera: data })
}
