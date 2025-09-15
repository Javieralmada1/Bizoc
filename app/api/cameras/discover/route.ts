// app/api/cameras/discover/route.ts
import { NextResponse } from 'next/server'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'

const execAsync = promisify(exec)

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { networkRange = '192.168.1.0/24' } = body
    
    console.log('🔍 Iniciando escaneo de cámaras en:', networkRange)
    
    // Escanear red con nmap
    const { stdout } = await execAsync(
      `nmap -p 554,80 --open ${networkRange} -oG -`,
      { timeout: 30000 }
    )
    
    const discoveredCameras = []
    const lines = stdout.split('\n')
    
    for (const line of lines) {
      if (line.includes('554/open')) {
        const ipMatch = line.match(/(\d+\.\d+\.\d+\.\d+)/)
        if (ipMatch) {
          const ip = ipMatch[1]
          console.log('📹 IP encontrada:', ip)
          
          // Probar credenciales básicas
          const testResult = await testCameraCredentials(ip)
          
          discoveredCameras.push({
            ip,
            mac: 'unknown',
            model: 'Dahua IPC-A22P (detectada)',
            configured: testResult.success,
            credentials: testResult.credentials,
            rtspUrl: testResult.rtspUrl,
            error: testResult.error
          })
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      cameras: discoveredCameras,
      total: discoveredCameras.length,
      configured: discoveredCameras.filter(c => c.configured).length
    })
    
  } catch (error: any) {
    console.error('❌ Error en descubrimiento:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error durante el escaneo',
        cameras: []
      },
      { status: 500 }
    )
  }
}

async function testCameraCredentials(ip: string) {
  const credentials = [
    { username: 'admin', password: 'admin' },
    { username: 'admin', password: '' },
    { username: 'admin', password: '123456' }
  ]
  
  for (const cred of credentials) {
    const rtspUrl = `rtsp://${cred.username}:${cred.password}@${ip}:554/cam/realmonitor?channel=1&subtype=0`
    
    try {
      // Test simple con timeout corto
      const { stderr } = await execAsync(
        `ffprobe -v error -show_entries format=duration "${rtspUrl}"`,
        { timeout: 5000 }
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
    error: 'No se pudieron probar las credenciales'
  }
}