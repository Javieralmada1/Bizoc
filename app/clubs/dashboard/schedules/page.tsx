'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type ClubProfile = { id: string; club_id: string; name: string }
type Court = { id: string; name: string; club_id: string }
type Schedule = {
  id: string; club_id: string; court_id: string;
  weekday: number; start_time: string; end_time: string;
  slot_minutes: number; effective_from: string | null; effective_to: string | null;
  is_active: boolean; buffer_minutes?: number;
}
type Reservation = { id: string; court_id: string; start_at: string; end_at: string; status: string }
type Blackout = { id:string; court_id:string; club_id:string; start_at:string; end_at:string; reason:string|null }

const WEEKDAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const SLOT_OPTIONS = [15,20,30,45,60,90,120]
const BUFFER_OPTIONS = [0,5,10,15,20,30]

export default function SchedulesPage() {
  const router = useRouter()
  const params = useSearchParams()

  const [club, setClub] = useState<ClubProfile | null>(null)
  const [courts, setCourts] = useState<Court[]>([])
  const [selectedCourtId, setSelectedCourtId] = useState<string>('')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [busy, setBusy] = useState<Reservation[]>([])
  const [blackouts, setBlackouts] = useState<Blackout[]>([])
  const [loading, setLoading] = useState(true)

  // ------- NUEVO: carga masiva -------
  const [bulkDays, setBulkDays] = useState<number[]>([1,2,3,4,5]) // L a V
  const [bulkCourts, setBulkCourts] = useState<string[]>([])
  const [bulk, setBulk] = useState({
    start_time: '08:00',
    end_time: '22:00',
    slot_minutes: 60,
    buffer_minutes: 0,
    effective_from: '',
    effective_to: '',
    is_active: true,
  })

  // ------- Edición individual (igual que antes) -------
  const [editing, setEditing] = useState<Schedule | null>(null)
  const [form, setForm] = useState({
    weekday: 1, start_time: '08:00', end_time: '22:00',
    slot_minutes: 60, buffer_minutes: 0,
    effective_from: '', effective_to: '', is_active: true,
  })

  const [previewDate, setPreviewDate] = useState<string>(() => new Date().toISOString().slice(0,10))

  useEffect(() => { init() }, [])

  async function init() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/clubs/auth/login')

      const { data: p } = await supabase
        .from('club_profiles').select('id,club_id,name').eq('id', user.id).single()
      if (!p) return router.replace('/clubs/auth/login')
      setClub(p)

      const { data: cts } = await supabase
        .from('courts').select('id,name,club_id').eq('club_id', p.club_id).order('name')

      setCourts(cts || [])
      const qCourt = params.get('court')
      const initial = qCourt && (cts || []).some(c => c.id === qCourt) ? qCourt : (cts?.[0]?.id ?? '')
      setSelectedCourtId(initial)
      setBulkCourts(initial ? [initial] : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (club && selectedCourtId) {
      loadSchedules()
      loadReservationsForDate(previewDate)
      loadBlackoutsForDate(previewDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [club, selectedCourtId])

  useEffect(() => {
    if (selectedCourtId) {
      loadReservationsForDate(previewDate)
      loadBlackoutsForDate(previewDate)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDate])

  async function loadSchedules() {
    const { data } = await supabase
      .from('court_schedules').select('*')
      .eq('club_id', club!.club_id).eq('court_id', selectedCourtId)
      .order('weekday, start_time')
    setSchedules((data || []) as Schedule[])
  }

  async function loadReservationsForDate(dateISO: string) {
    const start = new Date(dateISO + 'T00:00:00')
    const end   = new Date(dateISO + 'T23:59:59')
    const { data } = await supabase
      .from('reservations')
      .select('id,court_id,start_at,end_at,status')
      .eq('court_id', selectedCourtId)
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
      .select('id,club_id,court_id,start_at,end_at,reason')
      .eq('court_id', selectedCourtId)
      .gte('start_at', start.toISOString())
      .lte('start_at', end.toISOString())
    setBlackouts((data || []) as Blackout[])
  }

  // -------- helpers UI --------
  function onChangeForm(e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) {
    const target = e.target as HTMLInputElement | HTMLSelectElement
    const { name, value, type } = target
    const checked = (type === 'checkbox') ? (target as HTMLInputElement).checked : undefined
    setForm(prev => ({ ...prev, [name]: type==='checkbox'? checked : value }))
  }
  function resetForm() {
    setEditing(null)
    setForm({ weekday:1, start_time:'08:00', end_time:'22:00', slot_minutes:60, buffer_minutes:0, effective_from:'', effective_to:'', is_active:true })
  }
  async function saveSchedule(e: React.FormEvent) {
    e.preventDefault()
    if (!club || !selectedCourtId) return
    const payload = {
      club_id: club.club_id, court_id: selectedCourtId,
      weekday: Number(form.weekday),
      start_time: form.start_time, end_time: form.end_time,
      slot_minutes: Number(form.slot_minutes),
      buffer_minutes: Number(form.buffer_minutes || 0),
      effective_from: form.effective_from || null, effective_to: form.effective_to || null,
      is_active: !!form.is_active,
    }
    if (editing) {
      await supabase.from('court_schedules').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('court_schedules').insert(payload)
    }
    await loadSchedules()
    resetForm()
  }

  // ------- NUEVO: creación masiva -------
  function toggleBulkDay(d: number) {
    setBulkDays(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d].sort((a,b)=>a-b))
  }
  function toggleBulkCourt(id: string) {
    setBulkCourts(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }
  function onChangeBulk(e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) {
    const { name, value, type } = e.target
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined
    setBulk(prev => ({ ...prev, [name]: type==='checkbox'? checked : value }))
  }
  async function createBulkRules() {
    if (!club) return
    if (bulkCourts.length === 0 || bulkDays.length === 0) {
      alert('Selecciona al menos una cancha y un día.')
      return
    }
    const rows = []
    for (const courtId of bulkCourts) {
      for (const d of bulkDays) {
        rows.push({
          club_id: club.club_id,
          court_id: courtId,
          weekday: d,
          start_time: bulk.start_time,
          end_time: bulk.end_time,
          slot_minutes: Number(bulk.slot_minutes),
          buffer_minutes: Number(bulk.buffer_minutes || 0),
          effective_from: bulk.effective_from || null,
          effective_to: bulk.effective_to || null,
          is_active: !!bulk.is_active,
        })
      }
    }
    const { error } = await supabase.from('court_schedules').insert(rows)
    if (error) {
      console.error(error)
      alert('No se pudieron crear las reglas')
      return
    }
    // recargar si la cancha seleccionada estaba incluida
    if (bulkCourts.includes(selectedCourtId)) {
      await loadSchedules()
    }
    alert('Reglas creadas correctamente')
  }

  // ------- Blackouts (cierres puntuales) -------
  const [blk, setBlk] = useState({ start: '', end: '', reason: '' })
  function onChangeBlk(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setBlk(prev => ({ ...prev, [name]: value }))
  }
  async function createBlackout() {
    if (!club || !selectedCourtId || !blk.start || !blk.end) return
    const startISO = new Date(blk.start).toISOString()
    const endISO   = new Date(blk.end).toISOString()
    const { error } = await supabase.from('court_blackouts').insert({
      club_id: club.club_id,
      court_id: selectedCourtId,
      start_at: startISO,
      end_at: endISO,
      reason: blk.reason || null
    })
    if (error) {
      console.error(error); alert('No se pudo crear el cierre'); return
    }
    setBlk({ start:'', end:'', reason:'' })
    await loadBlackoutsForDate(previewDate)
  }
  async function deleteBlackout(id: string) {
    await supabase.from('court_blackouts').delete().eq('id', id)
    setBlackouts(blackouts.filter(b => b.id !== id))
  }

  // -------- cálculo de slots (con buffer + reservas + blackouts) --------
  function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
    return aStart < bEnd && bStart < aEnd
  }
  const previewSlots = useMemo(() => {
    if (!previewDate || !schedules.length) return []
    const d = new Date(previewDate+'T00:00:00'); const wd = d.getDay()

    const rules = schedules.filter(r => {
      if (!r.is_active || r.weekday!==wd) return false
      if (r.effective_from && new Date(previewDate) < new Date(r.effective_from)) return false
      if (r.effective_to && new Date(previewDate) > new Date(r.effective_to)) return false
      return true
    })

    const slots: {start:Date; end:Date; taken:boolean; reason?:string}[] = []
    for (const r of rules) {
      const [sh,sm] = r.start_time.split(':').map(Number)
      const [eh,em] = r.end_time.split(':').map(Number)
      const start = new Date(previewDate); start.setHours(sh, sm, 0, 0)
      const end   = new Date(previewDate); end.setHours(eh, em, 0, 0)
      let cur = new Date(start)
      const step = (r.slot_minutes + (r.buffer_minutes || 0)) * 60 * 1000
      while (cur < end) {
        const next = new Date(cur.getTime() + r.slot_minutes*60*1000)
        if (next > end) break
        slots.push({ start: new Date(cur), end: new Date(next), taken: false })
        // saltar buffer si lo hay
        cur = new Date(cur.getTime() + step)
      }
    }

    const busyInts = busy.map(b => ({ start:new Date(b.start_at), end:new Date(b.end_at) }))
    const blkInts  = blackouts.map(b => ({ start:new Date(b.start_at), end:new Date(b.end_at), reason:b.reason || 'Cerrado' }))
    for (const s of slots) {
      if (busyInts.some(b => overlaps(s.start,s.end,b.start,b.end))) {
        s.taken = true
        s.reason = 'Ocupado'
        continue
      }
      const blkMatch = blkInts.find(b => overlaps(s.start,s.end,b.start,b.end))
      if (blkMatch) {
        s.taken = true
        s.reason = blkMatch.reason
      }
    }
    return slots
  }, [previewDate, schedules, busy, blackouts])

  if (loading) return <div className="p-6">Cargando…</div>

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold heading-gradient">Configurar Horarios</h1>
            <p className="text-slate-600">Define la disponibilidad y tamaño de turnos por cancha.</p>
          </div>
        </div>

        {/* Selector de cancha + fecha */}
        <div className="glass-card p-4 mb-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cancha</label>
              <select className="select-glass" value={selectedCourtId} onChange={e=>setSelectedCourtId(e.target.value)}>
                {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha para previsualizar</label>
              <input type="date" className="field-glass" value={previewDate} onChange={e=>setPreviewDate(e.target.value)} />
            </div>
            <div className="flex items-end">
              <div className="text-sm text-slate-600">
                <div><span className="pill pill-success inline-block mr-2"></span>Disponible</div>
                <div><span className="pill pill-danger  inline-block mr-2"></span>Ocupado / Cerrado</div>
            </div>
            </div>
          </div>
        </div>

        {/* Carga masiva */}
        <div className="glass-card p-6 mb-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Crear reglas recurrentes (varias canchas/días)</h3>
          <div className="grid md:grid-cols-12 gap-4 items-end">
            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Canchas</label>
              <div className="bg-white/70 border border-white/60 rounded-xl p-2 max-h-36 overflow-auto">
                {courts.map(c => (
                  <label key={c.id} className="flex items-center gap-2 text-sm py-1 px-2">
                    <input type="checkbox" checked={bulkCourts.includes(c.id)} onChange={()=>toggleBulkCourt(c.id)} />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Días</label>
              <div className="bg-white/70 border border-white/60 rounded-xl p-2 grid grid-cols-2 gap-1">
                {WEEKDAYS.map((w,i)=>(
                  <label key={i} className="flex items-center gap-2 text-sm py-1 px-2">
                    <input type="checkbox" checked={bulkDays.includes(i)} onChange={()=>toggleBulkDay(i)} />
                    <span>{w}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
              <input type="time" name="start_time" value={bulk.start_time} onChange={onChangeBulk} className="field-glass" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
              <input type="time" name="end_time" value={bulk.end_time} onChange={onChangeBulk} className="field-glass" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Turno (min)</label>
              <select name="slot_minutes" value={bulk.slot_minutes} onChange={onChangeBulk} className="select-glass">
                {SLOT_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Buffer (min)</label>
              <select name="buffer_minutes" value={bulk.buffer_minutes} onChange={onChangeBulk} className="select-glass">
                {BUFFER_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Vigencia desde</label>
              <input type="date" name="effective_from" value={bulk.effective_from} onChange={onChangeBulk} className="field-glass" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Vigencia hasta</label>
              <input type="date" name="effective_to" value={bulk.effective_to} onChange={onChangeBulk} className="field-glass" />
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input type="checkbox" name="is_active" checked={!!bulk.is_active} onChange={onChangeBulk} />
              <span className="text-sm text-slate-700">Activa</span>
            </div>

            <div className="md:col-span-12">
              <button onClick={createBulkRules} className="btn-gradient">Crear reglas</button>
            </div>
          </div>
        </div>

        {/* Form individual + listado + preview (igual que antes, con buffer) */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{editing ? 'Editar regla' : 'Nueva regla (individual)'}</h3>
              <form className="grid md:grid-cols-6 gap-4 items-end" onSubmit={saveSchedule}>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Día</label>
                  <select name="weekday" value={form.weekday} onChange={onChangeForm} className="select-glass">
                    {WEEKDAYS.map((w,i)=> <option key={i} value={i}>{w}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
                  <input type="time" name="start_time" value={form.start_time} onChange={onChangeForm} className="field-glass"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
                  <input type="time" name="end_time" value={form.end_time} onChange={onChangeForm} className="field-glass"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Turno</label>
                  <select name="slot_minutes" value={form.slot_minutes} onChange={onChangeForm} className="select-glass">
                    {SLOT_OPTIONS.map(v=> <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Buffer</label>
                  <select name="buffer_minutes" value={form.buffer_minutes} onChange={onChangeForm} className="select-glass">
                    {BUFFER_OPTIONS.map(v=> <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vigencia desde</label>
                  <input type="date" name="effective_from" value={form.effective_from} onChange={onChangeForm} className="field-glass"/>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vigencia hasta</label>
                  <input type="date" name="effective_to" value={form.effective_to} onChange={onChangeForm} className="field-glass"/>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" name="is_active" checked={!!form.is_active} onChange={onChangeForm} className="h-4 w-4"/>
                  <span className="text-sm text-slate-700">Activa</span>
                </div>
                <div className="md:col-span-2 flex gap-3">
                  <button type="submit" className="btn-gradient">{editing ? 'Actualizar' : 'Agregar'}</button>
                  {editing && <button type="button" onClick={resetForm} className="btn-ghost">Cancelar</button>}
                </div>
              </form>
            </div>

            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Reglas de la cancha</h3>
              {schedules.length===0 ? (
                <div className="text-slate-600">Aún no definiste horarios.</div>
              ) : (
                <div className="space-y-3">
                  {schedules.map(s => (
                    <div key={s.id} className="flex items-center justify-between bg-white/70 border border-white/60 rounded-xl px-4 py-3">
                      <div className="text-sm">
                        <div className="font-medium text-slate-900">
                          {WEEKDAYS[s.weekday]} {s.start_time}–{s.end_time} · {s.slot_minutes}′
                          {s.buffer_minutes ? ` (+${s.buffer_minutes}′ buffer)` : ''}
                        </div>
                        <div className="text-slate-500">
                          Vigencia {s.effective_from ?? '∞'} — {s.effective_to ?? '∞'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`pill ${s.is_active ? 'pill-success' : 'pill-danger'}`}>{s.is_active ? 'Activa' : 'Inactiva'}</span>
                        <button className="btn-ghost" onClick={()=>{
                          setEditing(s)
                          setForm({
                            weekday:s.weekday, start_time:s.start_time, end_time:s.end_time,
                            slot_minutes:s.slot_minutes, buffer_minutes: s.buffer_minutes ?? 0,
                            effective_from:s.effective_from ?? '', effective_to:s.effective_to ?? '',
                            is_active:s.is_active
                          })
                        }}>Editar</button>
                        <button className="btn-ghost text-rose-700" onClick={async ()=>{
                          if (!confirm('¿Eliminar esta regla?')) return
                          await supabase.from('court_schedules').delete().eq('id', s.id)
                          setSchedules(prev => prev.filter(x=>x.id!==s.id))
                        }}>Eliminar</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cierres puntuales */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Cierres puntuales (excepciones)</h3>
              <div className="grid md:grid-cols-6 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
                  <input type="datetime-local" name="start" value={blk.start} onChange={onChangeBlk} className="field-glass" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
                  <input type="datetime-local" name="end" value={blk.end} onChange={onChangeBlk} className="field-glass" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Motivo (opcional)</label>
                  <input type="text" placeholder="Lluvia / Mantenimiento" value={blk.reason} name="reason" onChange={onChangeBlk} className="field-glass" />
                </div>
                <div className="md:col-span-6">
                  <button onClick={createBlackout} className="btn-gradient">Agregar cierre</button>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {blackouts.length === 0 ? (
                  <div className="text-slate-600">No hay cierres para la fecha seleccionada.</div>
                ) : (
                  blackouts.map(b => (
                    <div key={b.id} className="flex items-center justify-between bg-white/70 border border-white/60 rounded-xl px-4 py-2 text-sm">
                      <div>
                        {new Date(b.start_at).toLocaleString()} — {new Date(b.end_at).toLocaleString()}
                        {b.reason ? ` · ${b.reason}` : ''}
                      </div>
                      <button className="btn-ghost text-rose-700" onClick={()=>deleteBlackout(b.id)}>Eliminar</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Previsualización */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Previsualización — {new Date(previewDate).toLocaleDateString()}</h3>
            {previewSlots.length===0 ? (
              <div className="text-slate-600">Sin disponibilidad para este día.</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {previewSlots.map((slot,i)=>(
                  <div key={i} className={`px-2 py-1 rounded-lg text-sm text-center border ${
                    slot.taken ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`} title={slot.reason || (slot.taken ? 'Ocupado' : 'Disponible')}>
                    {slot.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
