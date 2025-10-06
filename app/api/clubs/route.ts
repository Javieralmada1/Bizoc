import supabaseAdmin from '@/lib/supabaseAdmin' // <-- Importación corregida a DEFAULT export

export async function GET() {
  const { data, error } = await supabaseAdmin 
    .from('clubs')
    .select('id,name,province,city')
    .order('province')
    .order('city')
    .order('name')

  if (error) {
      console.error("Error fetching clubs:", error.message);
      // Es crucial devolver un JSON válido en caso de error 500.
      return Response.json({ error: error.message || 'Error al cargar clubes' }, { status: 500 })
  }
  return Response.json({ clubs: data })
}