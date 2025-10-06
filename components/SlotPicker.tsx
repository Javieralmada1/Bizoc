'use client'
import { useEffect, useState } from 'react'

type Slot = { start:string; end:string; available:boolean }

export default function SlotPicker({ courtId, date, onPick }:{
  courtId: number
  date: string            // 'YYYY-MM-DD'
  onPick: (slot: Slot) => void
}) {
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string| null>(null)

  useEffect(()=>{
    let cancel=false
    ;(async ()=>{
      setLoading(true); setError(null)
      try {
        const res = await fetch(`/api/availability?courtId=${courtId}&date=${date}`)
        const j = await res.json()
        if (!cancel) {
          if (j.ok) setSlots(j.slots)
          else setError(j.error || 'No se pudo cargar')
        }
      } catch (e:any) {
        if (!cancel) setError(e?.message || 'Error')
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return ()=>{ cancel=true }
  },[courtId, date])

  if (loading) return <div className="bz-card pad">Cargando horarios…</div>
  if (error) return <div className="bz-card pad text-red-600">{error}</div>
  if (!slots.length) return <div className="bz-card pad">Cancha cerrada este día.</div>

  return (
    <div className="bz-card pad">
      <div className="text-sm font-semibold mb-2">Turnos disponibles</div>
      <div className="flex flex-wrap gap-2">
        {slots.map((s, i)=>(
          <button
            key={i}
            disabled={!s.available}
            onClick={()=>onPick(s)}
            className={`bz-pill ${s.available ? 'bz-pill--accent hover:brightness-105' : 'opacity-40 cursor-not-allowed'}`}
            title={`${new Date(s.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} – ${new Date(s.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`}
          >
            {new Date(s.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
          </button>
        ))}
      </div>
    </div>
  )
}
