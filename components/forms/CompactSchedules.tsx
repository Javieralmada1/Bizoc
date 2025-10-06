'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DURATIONS = [30, 45, 60, 90]

type Court = {
  id: string
  name: string
  hours: { weekday:number; open_time:string; close_time:string; slot_minutes:number }[]
}

export default function CompactSchedules({ clubName, courts }:{
  clubName: string
  courts: Court[]
}) {
  if (!courts?.length) {
    return <div className="bz-card pad">Este club no tiene canchas aún.</div>
  }
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {courts.map((c) => <CourtCard key={c.id} court={c} />)}
    </div>
  )
}

function CourtCard({ court }: { court: Court }) {
  // Estado editable compacto (tabla)
  const initial = useMemo(() => {
    const map = new Map<number, any>()
    court.hours.forEach(h => map.set(h.weekday, h))
    return Array.from({ length: 7 }, (_, d) => {
      const h = map.get(d)
      return {
        d,
        open: h?.open_time ?? '',
        close: h?.close_time ?? '',
        slot: h?.slot_minutes ?? 60,
        on: !!(h?.open_time && h?.close_time),
      }
    })
  }, [court.hours])

  const [rows, setRows] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<{ label: string; slots: { t: string; free: boolean }[] } | null>(null)
  const [date, setDate] = useState(() => dayjs().format('YYYY-MM-DD'))

  const copyRowToAll = (r: any) => {
    setRows(rows.map(x => ({
      ...x,
      open: r.open,
      close: r.close,
      slot: r.slot,
      on: r.on,
    })))
  }

  async function save() {
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('court_id', court.id)
      rows.forEach(r => {
        if (r.on && r.open && r.close) {
          fd.append(`open_${r.d}`, r.open)
          fd.append(`close_${r.d}`, r.close)
          fd.append(`slot_${r.d}`, String(r.slot))
        }
      })
      const res = await fetch('/api/schedules/upsert', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('No se pudo guardar')
      alert('Guardado ✔')
    } catch (e:any) {
      alert(e?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function previewDay() {
    const res = await fetch(`/api/availability?courtId=${court.id}&date=${date}`)
    const j = await res.json()
    const slots = (j.slots ?? []).map((s:any) => ({
      t: new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      free: !!s.available
    }))
    setPreview({ label: dayjs(date).format('ddd DD MMM'), slots })
  }

  return (
    <details className="bz-surface p-4 rounded-2xl" open>
      <summary className="flex items-center justify-between cursor-pointer">
        <div className="text-[15px] font-semibold">{court.name}</div>
        <div className="flex items-center gap-2">
          <button className="bz-btn" onClick={(e)=>{ e.preventDefault(); setRows(initial) }}>Reset</button>
          <button className="bz-btn bz-btn--primary" onClick={(e)=>{ e.preventDefault(); save() }} disabled={saving}>{saving? 'Guardando…':'Guardar'}</button>
        </div>
      </summary>

      <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--border)]">
        {/* Cabecera compacta */}
        <div className="grid grid-cols-[64px,80px,1fr,1fr,110px,90px] bg-[#fafafa] text-[12px] font-semibold text-slate-600 px-3 py-2">
          <div>Día</div>
          <div>Estado</div>
          <div>Apertura</div>
          <div>Cierre</div>
          <div>Duración</div>
          <div>Copiar</div>
        </div>

        {/* Filas */}
        <div className="divide-y divide-[var(--border)]">
          {rows.map((r, idx) => (
            <div key={idx} className="grid grid-cols-[64px,80px,1fr,1fr,110px,90px] items-center px-3 py-2 bg-white">
              <div className="text-[12px] text-slate-600">{DAYS[r.d]}</div>

              {/* Estado */}
              <label className={`bz-pill ${r.on ? 'bz-pill--accent' : ''}`} style={{justifySelf:'start'}}>
                <input
                  type="checkbox"
                  checked={r.on}
                  onChange={e => setRows(rows.map(x => x.d === r.d ? { ...x, on: e.target.checked } : x))}
                  className="mr-2"
                />
                {r.on ? 'Abierto' : 'Cerrado'}
              </label>

              {/* Apertura / Cierre */}
              <input
                type="time"
                disabled={!r.on}
                value={r.open}
                onChange={e => setRows(rows.map(x => x.d === r.d ? { ...x, open: e.target.value } : x))}
                className="bz-card px-2 py-1 text-[13px] w-[110px]"
              />
              <input
                type="time"
                disabled={!r.on}
                value={r.close}
                onChange={e => setRows(rows.map(x => x.d === r.d ? { ...x, close: e.target.value } : x))}
                className="bz-card px-2 py-1 text-[13px] w-[110px]"
              />

              {/* Duración */}
              <select
                disabled={!r.on}
                value={r.slot}
                onChange={e => setRows(rows.map(x => x.d === r.d ? { ...x, slot: Number(e.target.value) } : x))}
                className="bz-card px-2 py-1 text-[13px] w-[100px]"
              >
                {DURATIONS.map(n => <option key={n} value={n}>{n} min</option>)}
              </select>

              {/* Copiar a todos */}
              <button
                disabled={!r.on}
                onClick={() => copyRowToAll(r)}
                className="bz-pill text-[12px]"
              >
                A todos
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Vista previa compacta */}
      <div className="mt-3 grid items-start gap-2 sm:grid-cols-[220px,1fr]">
        <div className="bz-card pad">
          <div className="text-sm font-semibold mb-1">Vista previa</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bz-card px-3 py-2 w-full"/>
          <button className="bz-btn bz-btn--primary mt-2 w-full" onClick={(e)=>{e.preventDefault(); previewDay()}}>Ver</button>
        </div>
        <div className="bz-card pad">
          {preview
            ? (
              <>
                <div className="text-sm font-semibold mb-2">{preview.label}</div>
                {preview.slots.length
                  ? <div className="flex flex-wrap gap-2">{preview.slots.map((s,i)=>(
                      <span key={i} className={`bz-pill ${s.free? 'bz-pill--accent':''}`}>{s.t}</span>
                    ))}</div>
                  : <div className="bz-sub">Sin turnos (cerrado o fuera de horario).</div>}
              </>
            )
            : <div className="bz-sub">Elegí fecha y presioná “Ver”.</div>}
        </div>
      </div>
    </details>
  )
}
