'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'

const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

type Club = { id: string; name: string }
type Court = {
  id: string
  name: string
  club_id: string
  hours: { weekday:number; open_time:string; close_time:string; slot_minutes:number; buffer_minutes?:number|null }[]
}

export default function SchedulesBoard({ clubs, courts }:{ clubs:Club[]; courts:Court[] }) {
  const [activeClub, setActiveClub] = useState(clubs[0]?.id ?? '')

  const courtsOfClub = useMemo(
    () => courts.filter(c => c.club_id === activeClub),
    [courts, activeClub]
  )

  return (
    <div className="bz-surface p-5">
      {/* Switch club */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bz-sub">Club</div>
        <select
          className="bz-card px-3 py-2"
          value={activeClub}
          onChange={e=>setActiveClub(e.target.value)}
        >
          {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {courtsOfClub.length === 0 ? (
        <div className="bz-card pad">Este club no tiene canchas aún.</div>
      ) : (
        <div className="grid xl:grid-cols-2 gap-5">
          {courtsOfClub.map(court => (
            <CourtScheduleEditor key={court.id} court={court} />
          ))}
        </div>
      )}
    </div>
  )
}

function CourtScheduleEditor({ court }:{ court:Court }) {
  // mapa weekday -> config
  const initial = useMemo(()=>{
    const m = new Map<number, any>()
    court.hours.forEach(h => m.set(h.weekday, h))
    return m
  }, [court.hours])

  // Estado local del formulario (para UX)
  const [rows, setRows] = useState(()=>(
    Array.from({ length: 7 }, (_,weekday) => {
      const h = initial.get(weekday)
      return {
        weekday,
        open: h?.open_time ?? '',
        close: h?.close_time ?? '',
        slot: h?.slot_minutes ?? 60,
        openDay: !!(h?.open_time && h?.close_time),
      }
    })
  ))
  const [saving, setSaving] = useState(false)
  const [datePreview, setDatePreview] = useState(() => dayjs().format('YYYY-MM-DD'))
  const [preview, setPreview] = useState<{label:string; slots:{t:string; enabled:boolean}[]} | null>(null)

  const applyToAll = (r:any) => {
    setRows(rows.map(row => row.weekday === r.weekday ? row : {
      ...row,
      open: r.open,
      close: r.close,
      slot: r.slot,
      openDay: r.openDay,
    }))
  }

  const submit = async () => {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('court_id', court.id)
      rows.forEach(r => {
        if (r.openDay && r.open && r.close) {
          fd.append(`open_${r.weekday}`, r.open)
          fd.append(`close_${r.weekday}`, r.close)
          fd.append(`slot_${r.weekday}`, String(r.slot))
        }
      })
      const res = await fetch('/clubs/dashboard/schedules/server-actions', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('No se pudo guardar')
      // tip: podrías usar toasts; por simpleza:
      alert('Horarios guardados')
    } catch (e:any) {
      alert(e?.message || 'Error')
    } finally {
      setSaving(false)
    }
  }

  const viewPreview = async () => {
    // usa tu API real de disponibilidad
    const w = dayjs(datePreview).day()
    // si está cerrado ese weekday, mostrar vacío
    const r = rows.find(x => x.weekday === w)!
    if (!r.openDay || !r.open || !r.close) {
      setPreview({ label: dayjs(datePreview).format('ddd DD MMM'), slots: [] })
      return
    }
    const res = await fetch(`/api/availability?courtId=${court.id}&date=${datePreview}`)
    const j = await res.json()
    const slots = (j.slots || []).map((s:any)=>({
      t: new Date(s.start).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
      enabled: !!s.available
    }))
    setPreview({ label: dayjs(datePreview).format('ddd DD MMM'), slots })
  }

  return (
    <div className="bz-card pad-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[15px] font-semibold">{court.name}</div>
        <div className="flex items-center gap-2">
          <button className="bz-btn" onClick={()=>setRows(Array.from({length:7},(_,d)=>({weekday:d,open:'',close:'',slot:60,openDay:false})))}>Vaciar</button>
          <button className="bz-btn bz-btn--primary" onClick={submit} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
        </div>
      </div>

      <div className="grid gap-2">
        {rows.map((r, idx) => (
          <div key={idx} className="grid grid-cols-[70px,90px,90px,110px,auto] items-center gap-2">
            <div className="text-[12px] text-slate-500">{DAYS[r.weekday]}</div>

            {/* Abierto/Cerrado */}
            <label className={`bz-pill ${r.openDay ? 'bz-pill--accent' : ''}`} style={{justifySelf:'start'}}>
              <input
                type="checkbox"
                checked={r.openDay}
                onChange={e=>setRows(rows.map(x => x.weekday===r.weekday ? { ...x, openDay: e.target.checked } : x))}
                className="mr-2"
              />
              {r.openDay ? 'Abierto' : 'Cerrado'}
            </label>

            {/* Horarios */}
            <input
              type="time"
              disabled={!r.openDay}
              value={r.open}
              onChange={e=>setRows(rows.map(x => x.weekday===r.weekday ? { ...x, open:e.target.value } : x))}
              className="bz-card px-3 py-2"
            />
            <input
              type="time"
              disabled={!r.openDay}
              value={r.close}
              onChange={e=>setRows(rows.map(x => x.weekday===r.weekday ? { ...x, close:e.target.value } : x))}
              className="bz-card px-3 py-2"
            />

            {/* Duración + presets */}
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={15}
                step={5}
                disabled={!r.openDay}
                value={r.slot}
                onChange={e=>setRows(rows.map(x => x.weekday===r.weekday ? { ...x, slot:Number(e.target.value) } : x))}
                className="bz-card px-3 py-2 w-[88px]"
                title="Minutos por turno"
              />
              <div className="hidden sm:flex items-center gap-1">
                {[30,60,90].map(n=>(
                  <button
                    key={n}
                    onClick={()=>setRows(rows.map(x => x.weekday===r.weekday ? { ...x, slot:n } : x))}
                    className="bz-pill"
                    disabled={!r.openDay}
                  >
                    {n}m
                  </button>
                ))}
                <button className="bz-pill bz-pill--accent" onClick={()=>applyToAll(r)} disabled={!r.openDay}>
                  Copiar a todos
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Vista previa rápida */}
      <div className="mt-5 grid sm:grid-cols-[220px,1fr] gap-3 items-start">
        <div className="bz-card pad">
          <div className="text-sm font-semibold mb-2">Vista previa</div>
          <input
            type="date"
            value={datePreview}
            onChange={e=>setDatePreview(e.target.value)}
            className="bz-card px-3 py-2 w-full"
          />
          <button className="bz-btn bz-btn--primary mt-2 w-full" onClick={viewPreview}>Ver disponibilidad</button>
          <p className="bz-sub mt-2">Usa la configuración guardada + reservas reales.</p>
        </div>

        <div className="bz-card pad">
          {preview ? (
            <>
              <div className="text-sm font-semibold mb-2">{preview.label}</div>
              {preview.slots.length === 0 ? (
                <div className="bz-sub">Sin turnos (cerrado o fuera de horario).</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {preview.slots.map((s,i)=>(
                    <span key={i} className={`bz-pill ${s.enabled ? 'bz-pill--accent' : ''}`}>{s.t}</span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="bz-sub">Elegí una fecha y presioná “Ver disponibilidad”.</div>
          )}
        </div>
      </div>
    </div>
  )
}
