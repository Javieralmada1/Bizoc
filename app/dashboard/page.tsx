'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase as supabaseClient } from '@/lib/supabaseClient'
import CameraManagement from '@/components/CameraManagement'
import CourtMap from '@/components/CourtMap'

type Club = { id: string; name: string; province: string | null; city: string | null }
type Court = { id: string; name: string; club_id: string; club?: { name: string | null } }
type Match = {
  id: string
  title: string | null
  video_url: string | null
  scheduled_at: string | null
  club_id: string | null
  court_id: string | null
  club?: { name: string | null }
  court?: { name: string | null }
}

type MetricMonth = { month: string | null; videos_count: number }
type MetricCourt = { court_id: string; court_name: string; videos_count: number }
type MetricDay = { day: number; videos: number }

function formatNumber(n: number) {
  return new Intl.NumberFormat('es-AR').format(n)
}

export default function DashboardPage() {
  const router = useRouter()

  // activar estilos de fondo solo aquí
  useEffect(() => {
    document.body.classList.add('dashboard-bg')
    return () => document.body.classList.remove('dashboard-bg')
  }, [])

  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<string | null>(null)

  const [clubs, setClubs] = useState<Club[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [message, setMessage] = useState<string>('')

  // sidebar colapsable
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    document.body.classList.toggle('dash-collapsed', collapsed)
  }, [collapsed])

  // forms existentes
  const [clubName, setClubName] = useState(''); const [clubCity, setClubCity] = useState('')
  const [courtName, setCourtName] = useState(''); const [courtClub, setCourtClub] = useState<string>('')
  const [matchClub, setMatchClub] = useState<string>(''); const [matchCourt, setMatchCourt] = useState<string>('')
  const [matchTitle, setMatchTitle] = useState(''); const [matchUrl, setMatchUrl] = useState(''); const [matchDate, setMatchDate] = useState('')

  const [courtCams, setCourtCams] = useState([{ id: 'cam-1', name: 'Cam 1', x: 10, y: 20 }])

  // NUEVO: edición inline de club
  const [editingClubId, setEditingClubId] = useState<string | null>(null)
  const [editName, setEditName] = useState(''); const [editProv, setEditProv] = useState(''); const [editCity, setEditCity] = useState('')

  // métricas (desde API)
  const [metrics, setMetrics] = useState<{
    monthTotal: MetricMonth
    byCourt: MetricCourt[]
    byDay: MetricDay[]
  } | null>(null)

  useEffect(() => {
    (async () => {
      const { data } = await supabaseClient.auth.getUser()
      if (!data.user) { router.replace('/login?mode=signin'); return }
      setMe(data.user.email ?? null)

      await Promise.all([loadClubs(), loadCourts(), loadMatches()])
      try {
        const m = await fetch('/api/metrics', { cache: 'no-store' }).then(r => r.json())
        setMetrics(m)
      } catch { /* métrica opcional */ }

      setLoading(false)
    })()
  }, [router])

  async function loadClubs() {
    const { data } = await supabaseClient
      .from('clubs')
      .select('id,name,province,city')
      .order('created_at', { ascending: false })
    if (data) setClubs(data as Club[])
  }
  async function loadCourts() {
    const { data } = await supabaseClient.from('courts').select('id,name,club_id,club:clubs(name)').order('created_at', { ascending: false })
    if (data) setCourts(data as any)
  }
  async function loadMatches() {
    // últimos 60 días
    const since = new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString()
    const { data } = await supabaseClient
      .from('matches')
      .select('id,title,video_url,scheduled_at,club_id,court_id,club:clubs(name),court:courts(name)')
      .gte('scheduled_at', since)
      .order('scheduled_at', { ascending: false })
    if (data) setMatches(data as any)
  }

  async function addClub() {
    if (!clubName.trim()) { setMessage('El nombre del club es obligatorio.'); return }
    const { error } = await supabaseClient.from('clubs').insert({ name: clubName.trim(), city: clubCity.trim() || null })
    if (error) return setMessage(error.message)
    setClubName(''); setClubCity(''); setMessage('Club creado.'); await loadClubs()
  }
  async function deleteClub(id: string) {
    if (!confirm('¿Eliminar club?')) return
    await supabaseClient.from('clubs').delete().eq('id', id)
    await Promise.all([loadClubs(), loadCourts()])
  }

  async function addCourt() {
    if (!courtName.trim() || !courtClub) { setMessage('Debes completar nombre y club.'); return }
    const { error } = await supabaseClient.from('courts').insert({ name: courtName.trim(), club_id: courtClub })
    if (error) return setMessage(error.message)
    setCourtName(''); setCourtClub(''); setMessage('Cancha creada.'); await loadCourts()
  }
  async function deleteCourt(id: string) {
    if (!confirm('¿Eliminar cancha?')) return
    await supabaseClient.from('courts').delete().eq('id', id)
    await Promise.all([loadCourts(), loadMatches()])
  }

  async function addMatch() {
    if (!matchClub || !matchCourt || !matchTitle.trim() || !matchUrl.trim() || !matchDate) {
      setMessage('Todos los campos son obligatorios.'); return
    }
    const { error } = await supabaseClient.from('matches').insert({
      title: matchTitle.trim(),
      video_url: matchUrl.trim(),
      scheduled_at: new Date(matchDate).toISOString(),
      club_id: matchClub,
      court_id: matchCourt,
    })
    if (error) return setMessage(error.message)
    setMatchTitle(''); setMatchUrl(''); setMatchDate(''); setMatchClub(''); setMatchCourt(''); setMessage('Partido creado.'); await loadMatches()
  }
  async function deleteMatch(id: string) {
    if (!confirm('¿Eliminar partido?')) return
    await supabaseClient.from('matches').delete().eq('id', id)
    await loadMatches()
  }

  async function handleLogout() { await supabaseClient.auth.signOut(); router.replace('/login?mode=signin') }

  // NUEVO: helpers edición club
  function startEditClub(c: Club) {
    setEditingClubId(c.id)
    setEditName(c.name || '')
    setEditProv(c.province || '')
    setEditCity(c.city || '')
  }
  async function saveEditClub() {
    if (!editingClubId) return
    const { error } = await supabaseClient
      .from('clubs')
      .update({
        name: editName.trim(),
        province: editProv.trim() || null,
        city: editCity.trim() || null,
      })
      .eq('id', editingClubId)
    if (error) return alert(error.message)
    setEditingClubId(null)
    await loadClubs()
  }

  const courtsOfClub = useMemo(() => courts.filter(c => c.club_id === matchClub), [courts, matchClub])

  if (loading) return <div className="dash-loading">Cargando dashboard…</div>

  // Helpers métricas para ancho de barras
  const bestCourt = metrics?.byCourt?.[0]?.videos_count ?? 1
  const bestDay = Math.max(1, ...(metrics?.byDay ?? []).map(d => d.videos))

  return (
    <div className="dash-shell">
      {/* Sidebar fija */}
      <aside className="dash-aside">
        <div className="brand">Beelup Admin</div>
        <nav className="dash-nav">
          {['Resumen','Cámaras','Canchas','Partidos','Horarios','Métricas','Config'].map(lbl => (
            <a key={lbl} href={`#${lbl}`}><span className="lbl">{lbl}</span></a>
          ))}
        </nav>
        <div className="dash-user">
          <div className="muted">{me}</div>
          <button className="btn-danger" onClick={handleLogout}>Cerrar sesión</button>
        </div>
      </aside>

      <main>
        {/* Header con toggle sidebar */}
        <header className="dash-header">
          <button className="btn-ghost" onClick={()=>setCollapsed(!collapsed)} aria-label="Toggle sidebar">☰</button>
          <div className="muted">Panel de control</div>
        </header>

        {/* RESUMEN / MÉTRICAS */}
        <section id="Resumen" className="card">
          <h1>Resumen</h1>

          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-title">Videos del mes</div>
              <div className="kpi-big">{metrics?.monthTotal?.videos_count ?? 0}</div>
              <div className="kpi-small">
                {metrics?.monthTotal?.month
                  ? new Date(metrics.monthTotal.month).toLocaleString('es-AR', { month: 'long', year: 'numeric' })
                  : ''}
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">Total videos periodo</div>
              <div className="kpi-big">{formatNumber(matches.filter(m => m.video_url).length)}</div>
              <div className="kpi-small">últimos ~60 días</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">Clubs</div>
              <div className="kpi-big">{clubs.length}</div>
              <div className="kpi-small">registrados</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-title">Canchas</div>
              <div className="kpi-big">{courts.length}</div>
              <div className="kpi-small">en total</div>
            </div>
          </div>

          {/* Ranking por cancha */}
          <div className="card">
            <h2>Videos por cancha (mes)</h2>
            <div className="barlist">
              {(metrics?.byCourt ?? []).map((row) => (
                <div key={row.court_id} className="barrow">
                  <span className="name">{row.court_name}</span>
                  <div className="bar">
                    <div className="fill" style={{ width: `${(row.videos_count / Math.max(1, bestCourt)) * 100}%` }} />
                  </div>
                  <span className="val">{row.videos_count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Videos por día del mes */}
          <div className="card">
            <h2>Videos por día (mes)</h2>
            <div className="minibars">
              {(metrics?.byDay ?? []).map(d => (
                <div key={d.day} className="mini">
                  <div className="col" style={{ height: `${(d.videos / bestDay) * 100}%` }} />
                  <span className="muted xs">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CÁMARAS */}
        <section id="Cámaras" className="card">
          <h2>Cámaras IP</h2>
          <CameraManagement />
        </section>

        {/* CANCHAS */}
        <section id="Canchas" className="card">
          <h2>Canchas</h2>

          <div className="form-row">
            <input className="input" placeholder="Nombre del club" value={clubName} onChange={e=>setClubName(e.target.value)} />
            <input className="input" placeholder="Ciudad (opcional)" value={clubCity} onChange={e=>setClubCity(e.target.value)} />
            <button className="btn-primary" onClick={addClub}>Agregar club</button>
          </div>

          <div className="two-col">
            <div>
              <div className="list-scroll">
                {clubs.map(c => (
                  <div key={c.id} className="row">
                    {editingClubId === c.id ? (
                      <div style={{display:'grid', gap:8, gridTemplateColumns:'1fr 160px 160px'}}>
                        <input className="input" value={editName} onChange={e=>setEditName(e.target.value)} placeholder="Nombre" />
                        <input className="input" value={editProv} onChange={e=>setEditProv(e.target.value)} placeholder="Provincia" />
                        <input className="input" value={editCity} onChange={e=>setEditCity(e.target.value)} placeholder="Ciudad" />
                      </div>
                    ) : (
                      <div>
                        <div className="row-title">{c.name}</div>
                        <div className="muted">{c.province || '—'} · {c.city || '—'}</div>
                      </div>
                    )}
                    <div style={{ display:'flex', gap:8 }}>
                      {editingClubId === c.id ? (
                        <>
                          <button className="btn-primary" onClick={saveEditClub}>Guardar</button>
                          <button className="btn-secondary" onClick={()=>setEditingClubId(null)}>Cancelar</button>
                        </>
                      ) : (
                        <>
                          <button className="btn-secondary" onClick={()=>startEditClub(c)}>Editar</button>
                          <button className="btn-danger" onClick={()=>deleteClub(c.id)}>Eliminar</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {clubs.length === 0 && <div className="muted">Aún no hay clubes.</div>}
              </div>

              <div className="form-row" style={{ marginTop: 16 }}>
                <input className="input" placeholder="Nombre de cancha" value={courtName} onChange={e=>setCourtName(e.target.value)} />
                <select className="input" value={courtClub} onChange={e=>setCourtClub(e.target.value)}>
                  <option value="">Club…</option>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="btn-primary" onClick={addCourt}>Agregar</button>
              </div>

              <div className="list-scroll">
                {courts.map(c => (
                  <div key={c.id} className="row">
                    <div>
                      <div className="row-title">{c.name}</div>
                      <div className="muted">{c.club?.name ?? 'Sin club'}</div>
                    </div>
                    <button className="btn-danger" onClick={() => deleteCourt(c.id)}>Eliminar</button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="muted mb-2">Mapa 2D (click para mover Cam 1)</div>
              <CourtMap cameras={courtCams} editable onChange={setCourtCams}/>
              <div className="muted xs mt-1">x/y: {Math.round(courtCams[0].x)} · {Math.round(courtCams[0].y)}</div>
            </div>
          </div>
        </section>

        {/* PARTIDOS (CRUD rápido) */}
        <section id="Partidos" className="card">
          <h2>Partidos</h2>
          <div className="grid-auto">
            <select className="input" value={matchClub} onChange={e=>{ setMatchClub(e.target.value); setMatchCourt('') }}>
              <option value="">Club…</option>
              {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select className="input" value={matchCourt} onChange={e=>setMatchCourt(e.target.value)}>
              <option value="">Cancha…</option>
              {courts.filter(co=>co.club_id===matchClub).map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
            </select>
            <input className="input" placeholder="Título" value={matchTitle} onChange={e=>setMatchTitle(e.target.value)} />
            <input className="input" placeholder="URL del video" value={matchUrl} onChange={e=>setMatchUrl(e.target.value)} />
            <input className="input" type="datetime-local" value={matchDate} onChange={e=>setMatchDate(e.target.value)} />
            <button className="btn-secondary" onClick={addMatch}>Crear partido</button>
          </div>

          <div className="list-scroll">
            {matches.map(m => (
              <div key={m.id} className="row">
                <div>
                  <div className="row-title">{m.title || 'Sin título'}</div>
                  <div className="muted">{m.club?.name} — {m.court?.name}</div>
                </div>
                <button className="btn-danger" onClick={() => deleteMatch(m.id)}>Eliminar</button>
              </div>
            ))}
          </div>
        </section>

        {/* HORARIOS / SCHEDULES */}
        <SchedulesSection clubs={clubs} courts={courts} />

        {/* MÉTRICAS extra */}
        <section id="Métricas" className="card"><h2>Métricas</h2><div className="muted">Listo para agregar más paneles/series.</div></section>

        {message && (
          <div className="msg-ok">
            {message}
            <button className="msg-close" onClick={()=>setMessage('')}>×</button>
          </div>
        )}
      </main>
    </div>
  )
}

/* ---------- Sub-sección: Horarios (usa APIs reales) ---------- */

function SchedulesSection({ clubs, courts }: { clubs: Club[]; courts: Court[] }) {
  const [jobs, setJobs] = useState<any[]>([])
  const [busyId, setBusyId] = useState<string | null>(null)

  // formulario (jobs existentes)
  const [club, setClub] = useState('')
  const [court, setCourt] = useState('')
  const [title, setTitle] = useState('Grabación')
  const [startTime, setStartTime] = useState('18:00')   // HH:mm
  const [minutes, setMinutes] = useState<number>(90)
  const [days, setDays] = useState<boolean[]>([false,true,true,true,true,true,false]) // [D,L,M,Mi,J,V,S] L–V

  // derived
  const courtsFiltered = useMemo(() => courts.filter(c => c.club_id === club), [courts, club])

  // cron preview
  const cron = useMemo(() => {
    const [h, m] = startTime.split(':')
    const minute = Number.isFinite(parseInt(m ?? '0')) ? parseInt(m!,10) : 0
    const hour = Number.isFinite(parseInt(h ?? '0')) ? parseInt(h!,10) : 0
    // En cron: 0=Dom, 1=Lun…6=Sáb
    const list = days
      .map((on, idx) => (on ? idx : -1))
      .filter(i => i >= 0)
      .join(',')
    return `${minute} ${hour} * * ${list || '*'}`
  }, [startTime, days])

  function setPreset(kind: 'LV' | 'SD' | 'ALL') {
    if (kind === 'LV') setDays([false, true, true, true, true, true, false])
    if (kind === 'SD') setDays([true, false, false, false, false, false, true])
    if (kind === 'ALL') setDays([true, true, true, true, true, true, true])
  }

  async function refresh() {
    const r = await fetch('/api/jobs', { cache: 'no-store' })
    const d = await r.json().catch(()=>({}))
    setJobs(d?.jobs || [])
  }

  useEffect(() => { refresh() }, [])

  async function createJob() {
    if (!club || !court) return alert('Elegí club y cancha')
    if (!minutes || minutes <= 0) return alert('Duración inválida')

    const r = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, club_id: club, court_id: court, cron, minutes }),
    })
    const j = await r.json().catch(()=>({}))
    if (!r.ok) return alert(j?.error ?? 'Error creando horario')
    setJobs([j.job, ...jobs])
  }

  async function runNow(id: string) {
    setBusyId(id)
    try {
      const r = await fetch(`/api/jobs/${id}`, { method: 'POST', cache: 'no-store' })
      if (!r.ok) {
        const t = await r.text().catch(()=> '')
        return alert(`Error ${r.status}: ${t || 'no se pudo encolar'}`)
      }
      alert('Ejecución iniciada ✅')
    } catch (e:any) {
      alert(`Failed to fetch: ${e?.message || e}`)
    } finally { setBusyId(null) }
  }

  async function toggle(id: string, enabled: boolean) {
    setBusyId(id)
    try {
      const r = await fetch(`/api/jobs/${id}`, { method: 'PATCH', body: JSON.stringify({ enabled }) })
      if (!r.ok) {
        const t = await r.text().catch(()=> '')
        return alert(`Error ${r.status}: ${t}`)
      }
      setJobs(jobs.map(j => (j.id === id ? { ...j, enabled } : j)))
    } finally { setBusyId(null) }
  }

  async function del(id: string) {
    if (!confirm('¿Eliminar horario?')) return
    setBusyId(id)
    try {
      await fetch(`/api/jobs/${id}`, { method: 'DELETE' })
      setJobs(jobs.filter(j => j.id !== id))
    } finally { setBusyId(null) }
  }

  const dayLabels = ['D', 'L', 'M', 'Mi', 'J', 'V', 'S'] // índice 0 = Domingo en cron

  /* ===================== NUEVO: Turnos de reserva (Plantilla semanal) ===================== */
  const [rsClub, setRsClub] = useState('')
  const [rsCourt, setRsCourt] = useState('')
  const [rsWeekday, setRsWeekday] = useState(0)       // 0=Lunes
  const [rsStart, setRsStart] = useState('08:00')     // HH:mm
  const [rsEnd, setRsEnd] = useState('12:00')         // HH:mm
  const [rsSlot, setRsSlot] = useState(60)            // minutos
  const rsCourts = useMemo(() => courts.filter(c => c.club_id === rsClub), [courts, rsClub])

  async function saveReservationTemplate() {
    if (!rsClub || !rsCourt) return alert('Elegí club y cancha')
    if (!rsStart || !rsEnd || !rsSlot) return alert('Completa hora inicio/fin y duración')
    const r = await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        court_id: rsCourt,
        weekday: rsWeekday,
        start_time: rsStart,
        end_time: rsEnd,
        slot_minutes: rsSlot
      })
    })
    const j = await r.json().catch(()=>({}))
    if (!r.ok) return alert(j?.error || 'No se pudo guardar la plantilla')
    alert('Plantilla guardada ✅')
  }

  /* ===================== NUEVO: Bloqueo por 1 día (reserva externa) ===================== */
  const [bkClub, setBkClub] = useState('')
  const [bkCourt, setBkCourt] = useState('')
  const [bkDate, setBkDate] = useState<string>(new Date().toISOString().slice(0,10))
  const [bkStart, setBkStart] = useState('08:00')
  const [bkEnd, setBkEnd] = useState('09:00')
  const bkCourts = useMemo(() => courts.filter(c => c.club_id === bkClub), [courts, bkClub])

  function toIsoLocal(date: string, time: string) {
    const [y,m,d] = date.split('-').map(Number)
    const [hh,mm] = time.split(':').map(Number)
    const dt = new Date(y, (m-1), d, hh, mm, 0, 0)
    return dt.toISOString()
  }

  async function blockOneDaySlot() {
    if (!bkClub || !bkCourt) return alert('Elegí club y cancha')
    const start = toIsoLocal(bkDate, bkStart)
    const end = toIsoLocal(bkDate, bkEnd)
    const r = await fetch('/api/reservations', {
      method:'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        club_id: bkClub,
        court_id: bkCourt,
        start,
        end,
        user_name: 'Bloqueo'
      })
    })
    const j = await r.json().catch(()=>({}))
    if (!r.ok) return alert(j?.error || 'No se pudo bloquear')
    alert('Turno bloqueado por el día ✅')
  }

  return (
    <section id="Horarios" className="card">
      <h2>Horarios / Schedules</h2>

      {/* ======= BLOQUE EXISTENTE: creación y gestión de jobs ======= */}
      <div className="group">
        <label className="label">Club</label>
        <select className="input" value={club} onChange={e => { setClub(e.target.value); setCourt('') }}>
          <option value="">Elegí un club…</option>
          {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="group">
        <label className="label">Cancha</label>
        <select className="input" value={court} onChange={e => setCourt(e.target.value)} disabled={!club}>
          <option value="">Elegí una cancha…</option>
          {courtsFiltered.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
        </select>
      </div>

      <div className="grid-auto" style={{ marginTop: 8 }}>
        <div className="group">
          <label className="label">Título</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej: Liga Nocturna" />
        </div>

        <div className="group">
          <label className="label">Hora de inicio</label>
          <input className="input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
          <div className="help">Se usa tu zona horaria local del servidor</div>
        </div>

        <div className="group">
          <label className="label">Duración (minutos)</label>
          <input className="input" type="number" min={1} value={minutes} onChange={e => setMinutes(parseInt(e.target.value || '0', 10))} />
        </div>
      </div>

      <div className="group" style={{ marginTop: 8 }}>
        <label className="label">Días</label>
        <div className="dow">
          {['D', 'L', 'M', 'Mi', 'J', 'V', 'S'].map((lbl, i) => (
            <button
              key={i}
              type="button"
              className={`dow-btn ${days[i] ? 'on' : ''}`}
              onClick={() => setDays(s => { const n=[...s]; n[i]=!n[i]; return n })}
              aria-pressed={days[i]}
            >
              {lbl}
            </button>
          ))}
          <div className="dow-sep" />
          <button type="button" className="btn-chip" onClick={() => setPreset('LV')}>L–V</button>
          <button type="button" className="btn-chip" onClick={() => setPreset('SD')}>S–D</button>
          <button type="button" className="btn-chip" onClick={() => setPreset('ALL')}>Todos</button>
        </div>
      </div>

      <div className="cron-preview">
        <div className="muted xs">CRON generado</div>
        <code className="cron">{cron}</code>
      </div>

      <div className="actions">
        <button className="btn-primary" onClick={createJob} disabled={!club || !court || !minutes}>Crear horario</button>
      </div>

      <div className="list-scroll" style={{ marginTop: 16 }}>
        {jobs.map(j => (
          <div key={j.id} className="row">
            <div>
              <div className="row-title">{j.title}</div>
              <div className="muted xs">{j.club?.name} — {j.court?.name} · cron: <code>{j.cron}</code> · {j.minutes} min</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-secondary" onClick={() => runNow(j.id)} disabled={busyId===j.id}>Ejecutar ahora</button>
              <button className="btn-primary" onClick={() => toggle(j.id, !j.enabled)} disabled={busyId===j.id}>{j.enabled ? 'Pausar' : 'Reanudar'}</button>
              <button className="btn-danger" onClick={() => del(j.id)} disabled={busyId===j.id}>Eliminar</button>
            </div>
          </div>
        ))}
        {jobs.length === 0 && <div className="muted">Aún no hay horarios.</div>}
      </div>

      {/* ======= NUEVO: Plantilla semanal de turnos de RESERVA ======= */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Turnos de Reserva (Plantilla semanal)</h2>

        <div className="grid-auto">
          <select className="input" value={rsClub} onChange={e=>{ setRsClub(e.target.value); setRsCourt('') }}>
            <option value="">Club…</option>
            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select className="input" value={rsCourt} onChange={e=>setRsCourt(e.target.value)} disabled={!rsClub}>
            <option value="">Cancha…</option>
            {rsCourts.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
          </select>

          <select className="input" value={rsWeekday} onChange={e=>setRsWeekday(parseInt(e.target.value,10))}>
            {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map((d,i)=>
              <option key={i} value={i}>{d}</option>
            )}
          </select>

          <input className="input" type="time" value={rsStart} onChange={e=>setRsStart(e.target.value)} />
          <input className="input" type="time" value={rsEnd} onChange={e=>setRsEnd(e.target.value)} />
          <input className="input" type="number" min={15} step={15} value={rsSlot} onChange={e=>setRsSlot(parseInt(e.target.value||'0',10))} placeholder="Minutos por turno" />
        </div>

        <div className="actions">
          <button className="btn-primary" onClick={saveReservationTemplate} disabled={!rsCourt}>Guardar plantilla</button>
        </div>
      </div>

      {/* ======= NUEVO: Bloquear un turno por 1 día ======= */}
      <div className="card" style={{ marginTop: 16 }}>
        <h2>Bloquear turno (solo un día)</h2>
        <div className="grid-auto">
          <select className="input" value={bkClub} onChange={e=>{ setBkClub(e.target.value); setBkCourt('') }}>
            <option value="">Club…</option>
            {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          <select className="input" value={bkCourt} onChange={e=>setBkCourt(e.target.value)} disabled={!bkClub}>
            <option value="">Cancha…</option>
            {bkCourts.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
          </select>

          <input className="input" type="date" value={bkDate} onChange={e=>setBkDate(e.target.value)} />
          <input className="input" type="time" value={bkStart} onChange={e=>setBkStart(e.target.value)} />
          <input className="input" type="time" value={bkEnd} onChange={e=>setBkEnd(e.target.value)} />
        </div>

        <div className="actions">
          <button className="btn-danger" onClick={blockOneDaySlot} disabled={!bkCourt}>Bloquear</button>
        </div>
      </div>
    </section>
  )
}
