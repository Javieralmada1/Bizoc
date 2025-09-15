// /app/api/metrics/route.ts
import { NextResponse } from 'next/server'
import supabase from '@/lib/supabaseServer'

export async function GET() {
  // Total mes
  const monthTotal = await supabase.from('v_metrics_month_total').select('*').maybeSingle()
  // Por cancha
  const byCourt = await supabase.from('v_metrics_by_court_month').select('*')
  // Por día (función)
  const byDay = await supabase.rpc('f_metrics_by_day_month')

  return NextResponse.json({
    monthTotal: monthTotal.data ?? { month: null, videos_count: 0 },
    byCourt: byCourt.data ?? [],
    byDay: byDay.data ?? [],
  })
}
