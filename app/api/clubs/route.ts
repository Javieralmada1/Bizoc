import { supabaseAdmin } from '@/lib/supabaseServer'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('clubs')
    .select('id,name,province,city')
    .order('province')
    .order('city')
    .order('name')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ clubs: data })
}
