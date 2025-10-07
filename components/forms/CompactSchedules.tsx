'use client'

import { useMemo, useState } from 'react'
import dayjs from 'dayjs'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DURATIONS = [30, 45, 60, 90]

type Court = {
  id: string
  name: string
  // Aseguramos que el tipo incluya buffer_minutes
  hours: { weekday:number; open_time:string; close_time:string; slot_minutes:number; buffer_minutes?:number|null }[] 
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

// Componente para una fila de día (incluye la corrección de estilo para la visibilidad)
function ScheduleRow({ row, setRows, isCopyable, copyRowToAll }: {
  row: any; // Simplified type for immediate use
  setRows: React.Dispatch<React.SetStateAction<any[]>>;
  isCopyable: boolean;
  copyRowToAll: (r: any) => void;
}) {
  const handleChange = (field: 'open' | 'close' | 'slot' | 'on', value: string | number | boolean) => {
    setRows(prevRows => prevRows.map(x => 
      x.d === row.d ? { ...x, [field]: value } : x
    ));
  };
  
  return (
    // La clase bg-white asegura que el fondo claro sea explícito
    <div className={`grid grid-cols-[100px,1fr,140px] items-center gap-3 py-3 border-b border-[var(--border)] last:border-b-0 ${row.on ? 'bg-white' : 'bg-gray-50'}`}>
      
      {/* Columna 1: Día + Toggle */}
      <div className="flex items-center gap-3 px-3">
        <label className={`bz-pill !text-xs !font-medium ${row.on ? 'bz-pill--accent' : 'bg-slate-100 text-slate-500'}`} style={{justifySelf:'start'}}>
          <input
            type="checkbox"
            checked={row.on}
            onChange={e => handleChange('on', e.target.checked)}
            className="mr-2"
          />
          {DAYS[row.d]}
        </label>
      </div>

      {/* Columna 2: Horarios */}
      <div className="flex items-center gap-2">
        <input
          type="time"
          disabled={!row.on}
          value={row.open}
          onChange={e => handleChange('open', e.target.value)}
          // La clase bz-card asegura que se tomen los estilos de .bz-card input, resolviendo el problema de texto blanco.
          className="bz-card px-2 py-1 w-full" 
        />
        <span className="text-sm text-slate-500">-</span>
        <input
          type="time"
          disabled={!row.on}
          value={row.close}
          onChange={e => handleChange('close', e.target.value)}
          className="bz-card px-2 py-1 w-full"
        />
      </div>

      {/* Columna 3: Duración */}
      <div className="flex items-center gap-2">
        <select
          disabled={!row.on}
          value={row.slot}
          onChange={e => handleChange('slot', Number(e.target.value))}
          className="bz-card px-2 py-1 w-full"
        >
          {DURATIONS.map(n => <option key={n} value={n}>{n} min</option>)}
        </select>
        {isCopyable && (
          <button
            disabled={!row.on || !row.open || !row.close}
            onClick={() => copyRowToAll(row)}
            className="bz-pill bz-pill--accent !text-xs !h-full"
            title="Copiar a todos los días"
          >
            📋
          </button>
        )}
      </div>
    </div>
  );
}


function CourtCard({ court }: { court: Court }) {
  // Genera el estado inicial para los 7 días. Si hay datos, los carga. Si no, usa el valor por defecto.
  const initial = useMemo(() => {
    const map = new Map<number, any>()
    court.hours.forEach(h => map.set(h.weekday, h))
    return Array.from({ length: 7 }, (_, d) => {
      const h = map.get(d)
      return {
        d,
        open: h?.open_time ?? '08:00', // Valor por defecto
        close: h?.close_time ?? '22:00', // Valor por defecto
        slot: h?.slot_minutes ?? 60,
        buffer: h?.buffer_minutes ?? 0, 
        on: !!(h?.open_time && h?.close_time), // Marcar como "on" si ya hay horarios guardados
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
      buffer: r.buffer, 
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
          fd.append(`buffer_${r.d}`, String(r.buffer || 0)) 
        }
      })
      
      const res = await fetch('/clubs/dashboard/schedules/upsert', { method: 'POST', body: fd }) 
      
      if (!res.ok) throw new Error('No se pudo guardar')
      alert('Guardado ✔')
    } catch (e:any) {
      alert(e?.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function previewDay() {
    // Lógica para previsualizar, usando la API de disponibilidad
    const res = await fetch(`/api/schedules?courtId=${court.id}&date=${date}`) 
    const j = await res.json()
    
    const slots = (j.slots ?? []).map((s:any) => ({
      t: dayjs(s.start).format('HH:mm'),
      free: s.status === 'available'
    }))
    setPreview({ label: dayjs(date).format('ddd DD MMM'), slots })
  }

  const resetAll = () => {
    setRows(Array.from({ length: 7 }, (_, d) => ({
      d,
      open: '08:00',
      close: '22:00',
      slot: 60,
      buffer: 0, 
      on: false,
    })));
  }

  return (
    <details className="bz-surface p-4 rounded-2xl" open>
      <summary className="flex items-center justify-between cursor-pointer list-none focus:outline-none">
        <div className="text-[15px] font-semibold">{court.name}</div>
        <div className="flex items-center gap-2">
          <button className="bz-btn" onClick={(e)=>{ e.preventDefault(); resetAll() }}>Vaciar</button>
          <button className="bz-btn bz-btn--primary" onClick={(e)=>{ e.preventDefault(); save() }} disabled={saving}>{saving? 'Guardando…':'Guardar'}</button>
        </div>
      </summary>

      <div className="mt-4">
        {/* Cabecera de la tabla */}
        <div className="grid grid-cols-[100px,1fr,140px] text-xs font-semibold text-slate-600 px-3 py-2 border-b-2 border-[var(--border)]">
            <div>Día/Estado</div>
            <div>Horario (Apertura - Cierre)</div>
            <div>Duración/Copiar</div>
        </div>
        
        <div className="divide-y divide-[var(--border)] border border-[var(--border)] rounded-xl overflow-hidden mt-3">
          {rows.map((r, idx) => (
            <ScheduleRow 
              key={r.d} 
              row={r} 
              setRows={setRows} 
              isCopyable={r.d === 0} // Solo el primer día tiene el botón de copiar para simplificar
              copyRowToAll={copyRowToAll}
            />
          ))}
        </div>
      </div>

      {/* Vista previa compacta */}
      <div className="mt-5 grid items-start gap-3 sm:grid-cols-2">
        <div className="bz-card pad">
          <div className="text-sm font-semibold mb-1">Vista previa</div>
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="bz-card px-3 py-2 w-full"/>
          <button className="bz-btn bz-btn--primary mt-2 w-full" onClick={(e)=>{e.preventDefault(); previewDay()}}>Ver disponibilidad</button>
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
            : <div className="bz-sub">Elegí fecha y presioná “Ver disponibilidad”.</div>}
        </div>
      </div>
    </details>
  )
}