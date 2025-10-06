import { supabaseAdmin } from '@/lib/supabaseServer'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const clubId = searchParams.get('club_id')

  const query = supabaseAdmin
    .from('courts')
    .select('id,name,club_id,is_active,hourly_rate,surface_type') // <--- CAMPOS ADICIONALES AÑADIDOS
    .order('name', { ascending: true })

  if (clubId) query.eq('club_id', clubId)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ courts: data ?? [] })
}