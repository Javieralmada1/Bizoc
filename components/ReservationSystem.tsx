'use client'
import { useEffect, useMemo, useState } from 'react'

type Club = { id: string; name: string; province: string|null; city: string|null }
type Court = { id: string; name: string; club_id: string }
type Slot = { start: string; end: string; available: boolean }

const ReservationSystem = () => {
  const [clubs, setClubs] = useState<Club[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [clubId, setClubId] = useState('')
  const [courtId, setCourtId] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10))
  const [selectedSlot, setSelectedSlot] = useState<Slot|null>(null)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    fetch('/api/clubs').then(r=>r.json()).then(d=>setClubs(d.clubs||[]))
  }, [])

  // Ahora obtengo canchas del endpoint /api/courts con filtro club_id
  useEffect(() => {
    if (!clubId) { setCourts([]); setCourtId(''); return }
    fetch(`/api/courts?club_id=${clubId}`)
      .then(r=>r.json())
      .then(d=> setCourts(d.courts || []))
      .catch(()=> setCourts([]))
  }, [clubId])

  useEffect(() => {
    if (!courtId || !date) { setSlots([]); return }
    setLoadingSlots(true)
    fetch(`/api/schedules?court_id=${courtId}&date=${date}`)
      .then(r=>r.json())
      .then(d=>setSlots(d.slots||[]))
      .catch(()=>setSlots([]))
      .finally(()=>setLoadingSlots(false))
  }, [courtId, date])

  const provinces = useMemo(
    () => Array.from(new Set(clubs.map(c=>c.province).filter(Boolean))) as string[],
    [clubs]
  )
  const cities = useMemo(
    () => Array.from(new Set(clubs.filter(c=>!province || c.province===province).map(c=>c.city).filter(Boolean))) as string[],
    [clubs, province]
  )
  const filteredClubs = useMemo(
    () => clubs.filter(c =>
      (!province || c.province===province) &&
      (!city || c.city===city)
    ), [clubs, province, city]
  )

  async function reservar() {
    if (!clubId || !courtId || !selectedSlot) return
    setSaving(true); setError('')
    const res = await fetch('/api/reservations',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        club_id: clubId,
        court_id: courtId,
        start: selectedSlot.start,
        end: selectedSlot.end,
        user_name: userName || 'Invitado'
      })
    })
    const data = await res.json()
    if (!res.ok) setError(data.error||'Error')
    else {
      setSelectedSlot(null)
      fetch(`/api/schedules?court_id=${courtId}&date=${date}`)
        .then(r=>r.json()).then(d=>setSlots(d.slots||[]))
    }
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Reservar Cancha</h2>

      <div>
        <label className="block text-sm mb-1">Provincia</label>
        <select value={province} onChange={e=>{setProvince(e.target.value); setCity(''); setClubId(''); setCourtId(''); setSlots([])}} className="bg-neutral-800 p-2 rounded w-full">
          <option value="">(Todas)</option>
          {provinces.map(p=> <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">Ciudad</label>
        <select value={city} onChange={e=>{setCity(e.target.value); setClubId(''); setCourtId(''); setSlots([])}} className="bg-neutral-800 p-2 rounded w-full">
          <option value="">(Todas)</option>
          {cities.map(c=> <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">Club</label>
        <select value={clubId} onChange={e=>{setClubId(e.target.value); setCourtId(''); setSlots([])}} className="bg-neutral-800 p-2 rounded w-full">
          <option value="">Selecciona...</option>
          {filteredClubs.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">Cancha</label>
        <select value={courtId} onChange={e=>{setCourtId(e.target.value); setSelectedSlot(null)}} className="bg-neutral-800 p-2 rounded w-full" disabled={!clubId}>
          <option value="">Selecciona...</option>
          {courts.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">Fecha</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bg-neutral-800 p-2 rounded" />
      </div>

      <div>
        <label className="block text-sm mb-2">Horarios</label>
        {loadingSlots && <div className="text-sm text-neutral-400">Cargando...</div>}
        {!loadingSlots && !slots.length && courtId && <div className="text-sm text-neutral-400">Sin horarios</div>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {slots.map(s=>(
            <button key={s.start} disabled={!s.available}
              onClick={()=>setSelectedSlot(s)}
              className={`text-sm p-2 rounded border ${
                selectedSlot?.start===s.start ? 'bg-indigo-600 border-indigo-500' :
                s.available ? 'bg-neutral-800 border-neutral-700 hover:bg-neutral-700' :
                'bg-neutral-900 border-neutral-800 opacity-40 cursor-not-allowed'
              }`}>
              {new Date(s.start).toTimeString().slice(0,5)}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1">Nombre (opcional)</label>
        <input value={userName} onChange={e=>setUserName(e.target.value)} className="bg-neutral-800 p-2 rounded w-full" placeholder="Tu nombre" />
      </div>

      {error && <div className="text-red-400 text-sm">{error}</div>}

      <button onClick={reservar} disabled={!selectedSlot || saving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 px-4 py-2 rounded text-sm font-medium">
        {saving ? 'Guardando...' : 'Confirmar Reserva'}
      </button>

      {selectedSlot && <div className="text-sm text-neutral-300">
        Seleccionado: {new Date(selectedSlot.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
      </div>}
    </div>
  )
}

export default ReservationSystem
