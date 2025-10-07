import supabaseAdmin from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin 
      .from('clubs')
      .select('id,name,province,city')
      .order('province')
      .order('city')
      .order('name')

    if (error) {
        console.error("Error fetching clubs:", error.message);
        return Response.json({ error: error.message || 'Error al cargar clubes' }, { status: 500 })
    }
    return Response.json({ clubs: data })
  } catch (e: any) {
    console.error("CRITICAL Error in /api/clubs:", e.message);
    return Response.json({ error: e.message || 'Fallo crítico al conectar con la DB' }, { status: 500 })
  }
}