// app/api/cameras/scan/route.ts
import { NextResponse } from 'next/server'
import { scanWithNmap, scanFallbackTcp } from '@/lib/cameraDiscovery'

export async function POST(req: Request) {
  try {
    const { netRange } = await req.json()
    if (!netRange) return NextResponse.json({ error: 'netRange required' }, { status: 400 })

    try {
      const r = await scanWithNmap(netRange)
      return NextResponse.json({ ...r, engine: 'nmap' })
    } catch (e:any) {
      const r = await scanFallbackTcp(netRange)
      return NextResponse.json({ ...r, engine: 'tcp', note: e?.message ?? 'nmap failed' })
    }
  } catch (e:any) {
    return NextResponse.json({ error: e?.message ?? 'bad request' }, { status: 500 })
  }
}
