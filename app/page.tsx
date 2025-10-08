// app/page.tsx
import supabaseAdmin from '@/lib/supabaseAdmin'

export default async function HomePage() {
  const { data: clubsData } = await supabaseAdmin.from('clubs').select('id').limit(1)
  const clubs: { id: string }[] = Array.isArray(clubsData) ? clubsData : []

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      {/* HERO */}
      <section className="text-center max-w-4xl mx-auto mb-16">
        <div className="inline-block px-4 py-1 mb-6 rounded-full border border-violet-200 text-violet-600 text-sm font-medium">
          ⚡ Plataforma #1 de Pádel en Argentina
        </div>
        <h2 className="text-5xl font-extrabold leading-tight text-slate-900 mb-4">
          Encuentra tu cancha perfecta<br />
          <span className="text-violet-600">y revive tus partidos</span>
        </h2>
        <p className="text-lg text-slate-600">
          Busca clubes, reserva canchas disponibles y mira tus partidos grabados desde cualquier dispositivo.
        </p>
      </section>

      {/* CTA */}
      <div className="flex gap-4 justify-center mb-12">
        <a href="/reservas" className="px-6 py-3 rounded-xl text-white font-medium bg-emerald-600 hover:bg-emerald-700">
          Reservar Cancha
        </a>
        <a href="/partidos" className="px-6 py-3 rounded-xl font-medium border border-slate-300 hover:bg-slate-100">
          Ver Partidos
        </a>
      </div>

      {/* KPIs simples */}
      <div className="flex gap-10 justify-center text-center text-slate-600 mb-16">
        <div>
          <h3 className="text-xl font-bold text-slate-900">{clubs.length}+</h3>
          <p className="text-sm">Clubes</p>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">10K+</h3>
          <p className="text-sm">Jugadores</p>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">24/7</h3>
          <p className="text-sm">Disponible</p>
        </div>
      </div>
    </main>
  )
}
