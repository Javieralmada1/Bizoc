// lib/cameraDiscovery.ts
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { spawn } from 'node:child_process'
import net from 'node:net'
import dgram from 'dgram'

const execAsync = promisify(exec)

export interface CameraDevice {
  ip: string
  mac: string
  model: string
  manufacturer: string
  status: 'online' | 'offline'
}

export async function scanWithNmap(netRange: string, timeoutMs = 20000) {
  const nmapBin = process.env.NMAP_PATH || 'nmap'
  const args = [
    '-sT',                // connect scan (no requiere Npcap)
    '-p', '554,80',
    '--open',
    '-Pn',                // sin ping discovery
    '-n',                 // sin DNS
    '--max-retries', '1',
    '--host-timeout', '5s',
    netRange,
    '-oG', '-'            // salida grepeable por stdout (una línea por host)
  ]

  return await new Promise<{hosts: {ip:string; rtsp:boolean; http:boolean}[]}>((resolve, reject) => {
    const child = spawn(nmapBin, args, { windowsHide: true })
    let out = ''; let err = ''; let done = false
    const killTimer = setTimeout(() => { if (!done) { done = true; child.kill('SIGTERM'); reject(new Error('Nmap timeout')) } }, timeoutMs)

    child.stdout.on('data', d => out += d.toString())
    child.stderr.on('data', d => err += d.toString())
    child.on('error', e => { clearTimeout(killTimer); if (!done) reject(e) })
    child.on('close', code => {
      clearTimeout(killTimer)
      if (done) return
      if (code !== 0 && !out.trim()) return reject(new Error(err || `nmap exited ${code}`))

      // -oG pone todo en la MISMA línea: "Host: <ip> ... Ports: 80/open..., 554/open..."
      const hosts = out.split('\n')
        .map(l => l.trim())
        .filter(l => l.startsWith('Host:') && l.includes('Ports:'))
        .map(l => {
          const ip = l.match(/^Host:\s+([\d.]+)/)?.[1] || ''
          const rtsp = /\b554\/open\b/.test(l)
          const http = /\b80\/open\b/.test(l)
          return ip ? { ip, rtsp, http } : null
        })
        .filter(Boolean) as {ip:string; rtsp:boolean; http:boolean}[]

      resolve({ hosts })
    })
  })
}

// Fallback sin Nmap: prueba TCP a 554 y 80
export async function scanFallbackTcp(cidr: string, timeout = 500) {
  const [base] = cidr.split('/')
  const oct = base.split('.').map(Number)
  const start = (oct[0]<<24)|(oct[1]<<16)|(oct[2]<<8)|1
  const end   = (oct[0]<<24)|(oct[1]<<16)|(oct[2]<<8)|254

  const ips: string[] = []
  for (let i=start;i<=end;i++) {
    ips.push(`${(i>>24)&255}.${(i>>16)&255}.${(i>>8)&255}.${i&255}`)
  }

  const test = (ip: string, port: number) => new Promise<boolean>(res => {
    const s = new net.Socket()
    s.setTimeout(timeout)
    s.once('connect', () => { s.destroy(); res(true) })
    s.once('timeout', () => { s.destroy(); res(false) })
    s.once('error', () => res(false))
    s.connect(port, ip)
  })

  const results: {ip:string; rtsp:boolean; http:boolean}[] = []
  const batch = 64
  for (let i=0;i<ips.length;i+=batch) {
    const slice = ips.slice(i, i+batch)
    const r = await Promise.all(slice.map(async ip => {
      const [rtsp, http] = await Promise.all([test(ip, 554), test(ip, 80)])
      return (rtsp || http) ? { ip, rtsp, http } : null
    }))
    results.push(...(r.filter(Boolean) as any))
  }
  return { hosts: results }
}

// Escanea la red local para encontrar cámaras Dahua (función principal)
export async function discoverDahuaCameras(networkRange = '192.168.1.0/24'): Promise<CameraDevice[]> {
  try {
    console.log(`🔍 Escaneando red ${networkRange} para cámaras...`)
    
    let hosts: {ip:string; rtsp:boolean; http:boolean}[] = []
    
    // Intentar primero con Nmap
    try {
      const nmapResult = await scanWithNmap(networkRange)
      hosts = nmapResult.hosts
      console.log(`✅ Nmap encontró ${hosts.length} dispositivos con puertos abiertos`)
    } catch (nmapError) {
      console.log(`⚠️ Nmap falló, usando fallback TCP: ${nmapError}`)
      const tcpResult = await scanFallbackTcp(networkRange)
      hosts = tcpResult.hosts
      console.log(`✅ TCP scan encontró ${hosts.length} dispositivos`)
    }
    
    const devices: CameraDevice[] = []
    
    for (const host of hosts) {
      if (host.rtsp || host.http) {
        // Verificar si es una cámara Dahua
        const isDahua = await testDahuaConnection(host.ip)
        if (isDahua) {
          devices.push({
            ip: host.ip,
            mac: await getMacAddress(host.ip) || 'unknown',
            model: 'Dahua IPC-A22P (detectada)',
            manufacturer: 'Dahua',
            status: 'online'
          })
        }
      }
    }
    
    console.log(`✅ Encontradas ${devices.length} cámaras Dahua`)
    return devices
  } catch (error) {
    console.error('❌ Error escaneando red:', error)
    return []
  }
}

async function testDahuaConnection(ip: string): Promise<boolean> {
  try {
    // Probar conexión con credenciales típicas
    const defaultCredentials = [
      { user: 'admin', pass: 'admin' },
      { user: 'admin', pass: '' },
      { user: 'admin', pass: '123456' }
    ]
    
    for (const { user, pass } of defaultCredentials) {
      const rtspUrl = `rtsp://${user}:${pass}@${ip}:554/cam/realmonitor?channel=1&subtype=0`
      
      try {
        // Test rápido con timeout
        const { stdout } = await execAsync(
          `ffprobe -v quiet -show_format "${rtspUrl}"`,
          { timeout: 8000 }
        )
        
        if (stdout.includes('format_name') || !stdout.includes('Connection refused')) {
          console.log(`📹 Cámara Dahua encontrada en ${ip}`)
          return true
        }
      } catch {
        // Continuar con siguiente credencial
      }
    }
    
    return false
  } catch {
    return false
  }
}

async function getMacAddress(ip: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(`arp -a ${ip}`, { timeout: 5000 })
    const macMatch = stdout.match(/([0-9a-fA-F]{2}[:-]){5}[0-9a-fA-F]{2}/)
    return macMatch ? macMatch[0] : null
  } catch {
    return null
  }
}

// Configuración automática de cámara
export async function autoConfigureCamera(ip: string): Promise<{
  success: boolean
  credentials?: { username: string; password: string }
  rtspUrl?: string
  error?: string
}> {
  const defaultCredentials = [
    { username: 'admin', password: 'admin' },
    { username: 'admin', password: '' },
    { username: 'admin', password: '123456' }
  ]
  
  for (const cred of defaultCredentials) {
    const rtspUrl = `rtsp://${cred.username}:${cred.password}@${ip}:554/cam/realmonitor?channel=1&subtype=0`
    
    try {
      const { stderr } = await execAsync(
        `ffprobe -v error -show_entries format=duration "${rtspUrl}"`,
        { timeout: 10000 }
      )
      
      if (!stderr.includes('Connection refused') && !stderr.includes('Unauthorized')) {
        return {
          success: true,
          credentials: cred,
          rtspUrl
        }
      }
    } catch {
      continue
    }
  }
  
  return {
    success: false,
    error: 'No se pudieron verificar las credenciales'
  }
}

// Descubrimiento de cámaras Dahua en la red local (UDP)
interface DiscoveredCamera {
  ip: string
  mac: string
  model?: string
  manufacturer?: string
}

export async function discover(timeout = 3000): Promise<DiscoveredCamera[]> {
  return new Promise((resolve, reject) => {
    const cameras: DiscoveredCamera[] = []
    const socket = dgram.createSocket('udp4')
    
    // Mensaje de descubrimiento Dahua
    const discoveryMessage = Buffer.from(
      'MO_I\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00', 
      'binary'
    )

    socket.on('error', (err) => {
      socket.close()
      reject(err)
    })

    socket.on('message', (msg, rinfo) => {
      try {
        // Parsear respuesta básica (implementar según protocolo específico)
        cameras.push({
          ip: rinfo.address,
          mac: msg.toString('hex').slice(0, 12),
          model: 'Unknown',
          manufacturer: 'Dahua'
        })
      } catch (e) {
        console.error('Error parsing camera response:', e)
      }
    })

    socket.bind(() => {
      socket.setBroadcast(true)
      socket.send(new Uint8Array(discoveryMessage), 0, discoveryMessage.length, 37810, '255.255.255.255')
      
      // Cerrar después del timeout
      setTimeout(() => {
        socket.close()
        resolve(cameras)
      }, timeout)
    })
  })
}