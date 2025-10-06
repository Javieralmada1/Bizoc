// app/clubs/dashboard/schedules/page.tsx
import supabaseAdmin from '@/lib/supabaseAdmin'
import CompactSchedules from '@/components/forms/CompactSchedules'

export default async function SchedulesPage() {
  // 1) Tomar el primer club como fallback (simple y robusto)
  const { data: firstClub, error: eClub } = await supabaseAdmin
    .from('clubs')
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (eClub) console.error('clubs error', eClub)

  if (!firstClub) {
    return (
      <div className="bz-surface p-6">
        <h1 className="text-lg font-semibold">Horarios por cancha</h1>
        <p className="bz-sub mt-1">No se encontró un club en tu base de datos.</p>
      </div>
    )
  }

  const clubId = String(firstClub.id)
  const clubName = String(firstClub.name)

  // 2) Canchas del club
  const { data: courts, error: eCourts } = await supabaseAdmin
    .from('courts')
    .select('id, name')
    .eq('club_id', clubId)
    .order('name')
  if (eCourts) console.error('courts error', eCourts)

  const courtIds = (courts ?? []).map(c => String(c.id))

  // 3) Horarios de esas canchas (semana tipo)
  let hours: any[] = []
  if (courtIds.length) {
    const { data: h, error: eH } = await supabaseAdmin
      .from('court_weekly_hours')
      .select('*')
      .in('court_id', courtIds)
    if (eH) console.error('hours error', eH)
    hours = h ?? []
  }

  // 4) Mapear por cancha → payload para el componente
  const hoursByCourt = new Map<string, any[]>()
  hours.forEach(h => {
    const k = String(h.court_id)
    const arr = hoursByCourt.get(k) ?? []
    arr.push(h)
    hoursByCourt.set(k, arr)
  })

  const payload = (courts ?? []).map(c => ({
    id: String(c.id),
    name: String(c.name),
    hours: (hoursByCourt.get(String(c.id)) ?? []).map(h => ({
      weekday: Number(h.weekday),
      open_time: String(h.open_time),
      close_time: String(h.close_time),
      slot_minutes: Number(h.slot_minutes),
    })),
  }))

  return (
    <div className="space-y-6">
      <section className="bz-surface px-6 py-5">
        <h1 className="text-xl font-semibold">Horarios · {clubName}</h1>
        <p className="bz-sub">Semana tipo por cancha. Días cerrados no generan turnos.</p>
      </section>

      <CompactSchedules clubName={clubName} courts={payload} />
    </div>
  )
}
