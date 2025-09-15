// app/api/cameras/discover/route.ts
import { NextResponse } from 'next/server'
import { discoverDahuaCameras, autoConfigureCamera } from '@/lib/cameraDiscovery'

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { networkRange = '192.168.1.0/24' } = body
    
    console.log('🔍 Iniciando escaneo de cámaras...')
    
    // Descubrir cámaras en la red
    const cameras = await discoverDahuaCameras(networkRange)
    
    // Auto-configurar cada cámara encontrada
    const configuredCameras = []
    
    for (const camera of cameras) {
      console.log(`⚙️ Configurando cámara ${camera.ip}...`)
      
      const config = await autoConfigureCamera(camera.ip)
      
      configuredCameras.push({
        ...camera,
        configured: config.success,
        credentials: config.credentials,
        rtspUrl: config.rtspUrl,
        error: config.error
      })
    }
    
    return NextResponse.json({
      success: true,
      cameras: configuredCameras,
      total: configuredCameras.length,
      configured: configuredCameras.filter(c => c.configured).length
    })
    
  } catch (error: any) {
    console.error('❌ Error en descubrimiento:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Error durante el escaneo' 
      },
      { status: 500 }
    )
  }
}

// GET: Obtener estado de cámaras conocidas
export async function GET() {
  try {
    // Aquí podrías verificar el estado actual de cámaras ya configuradas
    return NextResponse.json({ 
      message: 'Use POST para escanear cámaras' 
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}