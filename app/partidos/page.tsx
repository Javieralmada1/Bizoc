// app/partidos/page.tsx
import supabaseAdmin from '@/lib/supabaseAdmin'

export default async function PartidosPage() {
  const { data: matches = [] } = await supabaseAdmin
    .from('matches')
    .select('id, title, video_url, thumb_url, start')
    .order('start', { ascending: false })
    .limit(12)

  return (
    <section className="max-w-6xl mx-auto px-6 py-16 text-center">
      <h2 className="text-3xl font-semibold text-slate-800 mb-2">Ver Partidos</h2>
      <p className="text-slate-500 mb-10">Reviví tus partidos grabados.</p>

      {(!matches || matches.length === 0) ? (
        <p className="text-slate-500">Aún no hay partidos disponibles.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
          {matches.map((m) => (
            <div key={m.id} className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition">
              <div
                className="h-48 bg-cover bg-center"
                style={{ backgroundImage: `url(${m.thumb_url || '/default-thumb.jpg'})` }}
              />
              <div className="p-4">
                <h4 className="font-semibold text-slate-800 mb-1">{m.title || 'Partido de pádel'}</h4>
                <p className="text-sm text-slate-500">{m.start ? new Date(m.start).toLocaleDateString('es-ES') : '—'}</p>
                {m.video_url && (
                  <a
                    href={m.video_url}
                    target="_blank"
                    className="inline-block mt-3 px-4 py-2 rounded-lg text-sm bg-violet-600 text-white hover:bg-violet-700"
                  >
                    Ver video
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
