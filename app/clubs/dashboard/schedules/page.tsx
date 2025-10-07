// app/clubs/dashboard/schedules/page.tsx
import supabaseAdmin from '@/lib/supabaseAdmin'
import { createServerClient } from '@/lib/supabaseServer'
import CompactSchedules from '@/components/forms/CompactSchedules'

// Definición de tipos
interface CourtNameAndId {
    id: string;
    name: string;
}

interface ClubFallbackRow {
    id: string;
    name: string;
}

// Tipo clave: Definimos la relación 'club' como un ARRAY de objetos.
interface ProfileResult {
    club_id: string | null;
    club: Array<{ name: string | null }> | null; 
}


export default async function SchedulesPage() {
  let activeClubId: string | null = null
  let activeClubName: string | null = null

  try {
    const { supabase } = createServerClient() 
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: rawProfile } = await supabase
        .from('club_profiles')
        .select('club_id, club:clubs!inner(name)') 
        .eq('id', user.id)
        .maybeSingle()
        
      // CASTING EXPLÍCITO al tipo que define el campo 'club' como un array.
      const profile = rawProfile as ProfileResult | null;

      activeClubId = profile?.club_id ?? null;
      
      // SOLUCIÓN DEFINITIVA: Accedemos al primer elemento del array club
      activeClubName = profile?.club?.[0]?.name ?? null; 
    }
  } catch (e) {
    // fallback silencioso
  }

  // 2) Si no hay club por perfil, tomar el primero (fallback)
  if (!activeClubId) {
    const { data: rawData } = await supabaseAdmin
      .from('clubs')
      .select('id, name')
      .order('created_at', { ascending: true })
      .limit(1)
      
    const firstClub = (rawData as ClubFallbackRow[] | null)?.[0];
      
    activeClubId = firstClub?.id ?? null
    activeClubName = firstClub?.name ?? null
  }

  if (!activeClubId) {
    return (
      <div className="bz-surface p-6">
        <h1 className="text-xl font-semibold">Horarios por cancha</h1>
        <p className="bz-sub">No se encontró un club asociado a tu usuario.</p>
      </div>
    )
  }

  // 3) Traer canchas del club y sus horarios (Lógica de CompactSchedules)
  const [{ data: courtsRes }, { data: hours }] = await Promise.all([
    supabaseAdmin
      .from('courts')
      .select('id, name')
      .eq('club_id', activeClubId)
      .order('name'),
    
    supabaseAdmin
      .from('court_weekly_hours')
      .select('*, courts!inner(club_id)') 
      .eq('courts.club_id', activeClubId) 
      .then((res) => ({ data: res.data ?? [], error: res.error })),
  ])
  
  const courts: CourtNameAndId[] = (courtsRes || [])
    .filter((c: any): c is CourtNameAndId => c.id !== null && c.name !== null) 
    .map((c) => ({
      id: String(c.id),
      name: c.name as string
    }));

  const hoursByCourt = new Map<string, any[]>()
  ;(hours || []).forEach((h: any) => {
    const courtId = String(h.court_id);
    if (courts.some(c => c.id === courtId)) { 
      const arr = hoursByCourt.get(courtId) ?? []
      arr.push(h)
      hoursByCourt.set(courtId, arr)
    }
  })

  const payload = courts.map((c) => ({
    id: c.id,
    name: c.name, 
    hours: (hoursByCourt.get(c.id) ?? []).map((h) => ({
      weekday: h.weekday as number,
      open_time: h.open_time as string,
      close_time: h.close_time as string,
      slot_minutes: h.slot_minutes as number,
    })),
  }))
  
  const filteredPayload = payload.filter(p => p.id && p.name);

  return (
    <div className="space-y-6">
      <section className="bz-surface px-6 py-5">
        <h1 className="text-xl font-semibold">Horarios · {activeClubName ?? 'Tu club'}</h1>
        <p className="bz-sub">Semana tipo por cancha. Días cerrados no generan turnos.</p>
      </section>

      <CompactSchedules clubName={activeClubName ?? 'Tu club'} courts={filteredPayload} />
    </div>
  )
}