// app/api/record-now/route.ts
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { recordNowAndCreateMatch } from '../../../lib/recorder' // ajustá la ruta si usás alias

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      minutes = 1,
      clubId = null,
      courtId = null,
      clubName = null,
      courtName = null,
      title = 'Grabación local'
    } = body

    const match = await recordNowAndCreateMatch({ minutes, clubId, courtId, clubName, courtName, title })
    return NextResponse.json({ ok: true, match })
  } catch (e: any) {
    console.error('[record-now] error', e)
    return NextResponse.json({ ok: false, error: String(e.message || e) }, { status: 500 })
  }
}
