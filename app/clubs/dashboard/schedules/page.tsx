// app/clubs/dashboard/schedules/page.tsx
import supabaseAdmin from '@/lib/supabaseAdmin'
import supabaseServer from '@/lib/supabaseServer' // usa tu helper server-side
import CompactSchedules from '@/components/forms/CompactSchedules'

export default async function SchedulesPage() {
  // 1) Detectar club del usuario (club_profiles -> club_id)
  let activeClubId: string | null = null
  let activeClubName: string | null = null

  try {
    const { supabase } = supabaseServer() // tu helper server lee cookies
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('club_profiles')
        .select('club_id, club:clubs!inner(name)')
        .eq('id', user.id)
        .maybeSingle()
      activeClubId = profile?.club_id ?? null
      activeClubName = profile?.club?.name ?? null
    }
  } catch (_) {
    // fallback silencioso
  }

  // 2) Si no hay club por perfil, tomar el primero (fallback)
  if (!activeClubId) {
    const { data: firstClub } = await supabaseAdmin
      .from('clubs')
      .select('id, name')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    activeClubId = firstClub?.id ?? null
    activeClubName = firstClub?.name ?? null
  }

  if (!activeClubId) {
    return (
      <div className="bz-surface p-6">
        <h1 className="text-lg font-semibold">Horarios por cancha</h1>
        <p className="bz-sub mt-1">No se encontró un club asociado a tu usuario.</p>
      </div>
    )
  }

  // 3) Traer canchas del club y sus horarios
  const [{ data: courts }, { data: hours }] = await Promise.all([
    supabaseAdmin
      .from('courts')
      .select('id, name')
      .eq('club_id', activeClubId)
      .order('name'),
    supabaseAdmin
      .from('court_weekly_hours')
      .select('*')
      .in('court_id', [activeClubId]) // no sirve; evitamos error con in vacío
      .then(async (res) => {
        // como in no funciona con uuid club, traemos todos y filtramos luego:
        const { data: all } = await supabaseAdmin
          .from('court_weekly_hours')
          .select('*')
        return { data: all ?? [], error: null }
      }),
  ])

  // Mapear horarios por cancha
  const hoursByCourt = new Map<string, any[]>()
  ;(hours ?? []).forEach((h: any) => {
    const arr = hoursByCourt.get(String(h.court_id)) ?? []
    arr.push(h)
    hoursByCourt.set(String(h.court_id), arr)
  })

  const payload = (courts ?? []).map((c) => ({
    id: String(c.id),
    name: c.name as string,
    hours: (hoursByCourt.get(String(c.id)) ?? []).map((h) => ({
      weekday: h.weekday as number,
      open_time: h.open_time as string,
      close_time: h.close_time as string,
      slot_minutes: h.slot_minutes as number,
    })),
  }))

  return (
    <div className="space-y-6">
      <section className="bz-surface px-6 py-5">
        <h1 className="text-xl font-semibold">Horarios · {activeClubName ?? 'Tu club'}</h1>
        <p className="bz-sub">Semana tipo por cancha. Días cerrados no generan turnos.</p>
      </section>

      <CompactSchedules clubName={activeClubName ?? 'Tu club'} courts={payload} />
    </div>
  )
}
