'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Club = { id:string; name:string }
type Court = { id:string; name:string; club_id:string }
type Schedule = {
  court_id:string; weekday:number; start_time:string; end_time:string;
  slot_minutes:number; effective_from:string|null; effective_to:string|null;
  is_active:boolean; buffer_minutes?: number | null
}
type Reservation = { id:string; court_id:string; start_at:string; end_at:string; status:string }
type Blackout = { id:string; court_id:string; start_at:string; end_at:string; reason:string|null }

export default function PlayerReservationsPage() {
  const router = useRouter()
  const [clubs, setClubs] = useState<Club[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [busy, setBusy] = useState<Reservation[]>([])
  const [blackouts, setBlackouts] = useState<Blackout[]>([])

  const [clubId, setClubId] = useState<string>('')
  const [courtId, setCourtId] = useState<string>('')
  const [dateISO, setDateISO] = useState<string>(() => new Date().toISOString().slice(0,10))

  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => { init() }, [])
  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.replace('/players/auth/login')

    const { data: clubs } = await supabase.from('clubs').select('id,name').order('name')
    setClubs(clubs || [])
    if ((clubs||[]).length) setClubId(clubs![0].id)
  }

  useEffect(() => { if (clubId) loadCourts() }, [clubId])

  useEffect(() => {
    if (!courtId) return
    loadSchedules()
    loadReservationsForDate(dateISO)
    loadBlackoutsForDate(dateISO)
  }, [courtId])

  useEffect(() => {
    if (!courtId) return
    loadReservationsForDate(dateISO)
    loadBlackoutsForDate(dateISO)
  }, [dateISO])

  async function loadCourts() {
    const { data } = await supabase.from('courts')
      .select('id,name,club_id')
      .eq('club_id', clubId)
      .order('name')
    setCourts(data || [])
    setCourtId(data?.[0]?.id ?? '')
  }

  async function loadSchedules() {
    const { data } = await supabase
      .from('court_schedules')
      .select('court_id,weekday,start_time,end_time,slot_minutes,effective_from,effective_to,is_active,buffer_minutes')
      .eq('court_id', courtId)
      .eq('is_active', true)
    setSchedules((data || []) as Schedule[])
  }

  async function loadReservationsForDate(dateISO: string) {
    const start = new Date(dateISO + 'T00:00:00')
    const end   = new Date(dateISO + 'T23:59:59')
    const { data } = await supabase
      .from('reservations')
      .select('id,court_id,start_at,end_at,status')
      .eq('court_id', courtId)
      .not('status','in','("cancelled")')
      .gte('start_at', start.toISOString())
      .lte('start_at', end.toISOString())
    setBusy((data || []) as Reservation[])
  }

  async function loadBlackoutsForDate(dateISO: string) {
    const start = new Date(dateISO + 'T00:00:00')
    const end   = new Date(dateISO + 'T23:59:59')
    const { data } = await supabase
      .from('court_blackouts')
      .select('id,court_id,start_at,end_at,reason')
      .eq('court_id', courtId)
      .gte('start_at', start.toISOString())
      .lte('start_at', end.toISOString())
    setBlackouts((data || []) as Blackout[])
  }

  function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && bStart < aEnd
  }

  // Generación de slots: respeta buffer_minutes y descarta reservas + cierres
  const slots = useMemo(() => {
    if (!dateISO || !schedules.length) return []
    const d = new Date(dateISO+'T00:00:00'); const wd = d.getDay()
    const rules = schedules.filter(r => {
      if (!r.is_active || r.weekday!==wd) return false
      if (r.effective_from && new Date(dateISO) < new Date(r.effective_from)) return false
      if (r.effective_to && new Date(dateISO) > new Date(r.effective_to)) return false
      return true
    })
    const out: {start:Date; end:Date; taken:boolean; reason?:string}[] = []
    for (const r of rules) {
      const [sh,sm] = r.start_time.split(':').map(Number)
      const [eh,em] = r.end_time.split(':').map(Number)
      const start = new Date(dateISO); start.setHours(sh,sm,0,0)
      const end   = new Date(dateISO); end.setHours(eh,em,0,0)
      let cur = new Date(start)
      const stepMs = (r.slot_minutes + (r.buffer_minutes || 0)) * 60 * 1000
      while (cur < end) {
        const next = new Date(cur.getTime() + r.slot_minutes*60*1000)
        if (next > end) break
        out.push({ start: new Date(cur), end: new Date(next), taken: false })
        // saltamos el buffer (si lo hay)
        cur = new Date(cur.getTime() + stepMs)
      }
    }
    const busyInts = busy.map(b => ({start:new Date(b.start_at), end:new Date(b.end_at)}))
    const blkInts  = blackouts.map(b => ({start:new Date(b.start_at), end:new Date(b.end_at), reason:b.reason || 'Cerrado'}))
    for (const s of out) {
      if (busyInts.some(b => overlaps(s.start,s.end,b.start,b.end))) {
        s.taken = true; s.reason = 'Ocupado'
        continue
      }
      const blk = blkInts.find(b => overlaps(s.start,s.end,b.start,b.end))
      if (blk) { s.taken = true; s.reason = blk.reason }
    }
    return out
  }, [dateISO, schedules, busy, blackouts])

  async function reserveSlot(start: Date, end: Date) {
    setLoading(true); setMsg(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/players/auth/login'); return }

      // 1) Re-chequeo de disponibilidad (anti-colisión)
      const startISO = start.toISOString()
      const endISO   = end.toISOString()

      // a) reservas que se solapan
      const { data: collidingRes } = await supabase
        .from('reservations')
        .select('id')
        .eq('court_id', courtId)
        .not('status','in','("cancelled")')
        .lt('start_at', endISO)   // start_at < end
        .gt('end_at', startISO)   // end_at > start
      if ((collidingRes || []).length) {
        setMsg('Ese horario acaba de ocuparse. Elegí otro.')
        await loadReservationsForDate(dateISO)
        return
      }

      // b) blackouts que se solapan
      const { data: collidingBlk } = await supabase
        .from('court_blackouts')
        .select('id')
        .eq('court_id', courtId)
        .lt('start_at', endISO)
        .gt('end_at', startISO)
      if ((collidingBlk || []).length) {
        setMsg('Ese horario no está disponible (cierre del club).')
        await loadBlackoutsForDate(dateISO)
        return
      }

      // 2) Insert de la reserva
      const { error } = await supabase.from('reservations').insert({
        club_id: clubId,
        court_id: courtId,
        player_id: user.id,
        start_at: startISO,
        end_at: endISO,
        status: 'confirmed' // o 'pending' si querés aprobación del club
      })
      if (error) throw error

      setMsg('¡Reserva confirmada!')
      await Promise.all([
        loadReservationsForDate(dateISO),
        loadBlackoutsForDate(dateISO),
      ])
    } catch (e:any) {
      console.error(e)
      setMsg(e.message || 'No se pudo crear la reserva')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold heading-gradient">Reservar Turno</h1>
          <p className="text-slate-600">Elegí club, cancha y fecha para ver la disponibilidad.</p>
        </div>

        <div className="glass-card p-4 grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Club</label>
            <select className="select-glass" value={clubId} onChange={(e)=>setClubId(e.target.value)}>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cancha</label>
            <select className="select-glass" value={courtId} onChange={(e)=>setCourtId(e.target.value)}>
              {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
            <input type="date" className="field-glass" value={dateISO} onChange={(e)=>setDateISO(e.target.value)} />
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              {new Date(dateISO).toLocaleDateString()}
            </h2>
            {msg && (
              <div className={`text-sm px-3 py-1 rounded-lg border ${
                msg.includes('confirmada')
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {msg}
              </div>
            )}
          </div>

          {slots.length === 0 ? (
            <div className="text-slate-600">No hay disponibilidad para esta fecha.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {slots.map((s,i)=>(
                <button
                  key={i}
                  disabled={s.taken || !courtId || loading}
                  onClick={()=>reserveSlot(s.start, s.end)}
                  className={`px-2 py-1 rounded-lg text-sm border transition ${
                    s.taken
                      ? 'bg-rose-100 text-rose-700 border-rose-200 cursor-not-allowed'
                      : 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200'
                  }`}
                  title={s.taken ? (s.reason || 'Ocupado') : 'Reservar'}
                >
                  {s.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
