// lib/cameraDiscovery.ts
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export interface CameraDevice {
  ip: string
  mac: string
  model: string
  manufacturer: string
  status: 'online' | 'offline'
}

// Escanea la red local para encontrar cámaras Dahua
export async function discoverDahuaCameras(networkRange = '192.168.1.0/24'): Promise<CameraDevice[]> {
  try {
    console.log(`🔍 Escaneando red ${networkRange} para cámaras Dahua...`)
    
    // Usar nmap para escanear puertos RTSP (554) y HTTP (80)
    const { stdout } = await execAsync(`nmap -p 554,80 --open ${networkRange} -oG -`, { timeout: 30000 })
    
    const devices: CameraDevice[] = []
    const lines = stdout.split('\n')
    
    for (const line of lines) {
      if (line.includes('554/open') || line.includes('80/open')) {
        const ipMatch = line.match(/(\d+\.\d+\.\d+\.\d+)/)
        if (ipMatch) {
          const ip = ipMatch[1]
          
          // Verificar si es una cámara Dahua
          const isDahua = await testDahuaConnection(ip)
          if (isDahua) {
            devices.push({
              ip,
              mac: await getMacAddress(ip) || 'unknown',
              model: 'Dahua IPC-A22P (detectada)',
              manufacturer: 'Dahua',
              status: 'online'
            })
          }
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