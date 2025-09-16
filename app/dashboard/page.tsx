'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase as supabaseClient } from '@/lib/supabaseClient'
import CameraManagement from '@/components/CameraManagement'
import CourtMap from '@/components/CourtMap'
import ReservationSystem from '@/components/ReservationSystem'
import ReservationsManager from '@/components/ReservationsManager'

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
  const [clubName, setClubName] = useState('')
  const [clubCity, setClubCity] = useState('')
  const [courtName, setCourtName] = useState('')
  const [courtClub, setCourtClub] = useState<string>('')
  const [matchClub, setMatchClub] = useState<string>('')
  const [matchCourt, setMatchCourt] = useState<string>('')
  const [matchTitle, setMatchTitle] = useState('')
  const [matchUrl, setMatchUrl] = useState('')
  const [matchDate, setMatchDate] = useState('')

  const [courtCams, setCourtCams] = useState([{ id: 'cam-1', name: 'Cam 1', x: 10, y: 20 }])

  // NUEVO: edición inline de club
  const [editingClubId, setEditingClubId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editProv, setEditProv] = useState('')
  const [editCity, setEditCity] = useState('')

  // métricas (desde API)
  const [metrics, setMetrics] = useState<{
    monthTotal: MetricMonth
    byCourt: MetricCourt[]
    byDay: MetricDay[]
  } | null>(null)

  // Agregar estados para el escáner de cámaras
  const [scanning, setScanning] = useState(false)
  const [cameras, setCameras] = useState<{ip: string; rtsp: boolean; http: boolean}[]>([])
  const [netRange, setNetRange] = useState('192.168.1.0/24')

  // Estados para gestión de horarios
  const [schedules, setSchedules] = useState<any[]>([])
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    court_id: '',
    day_of_week: 0,
    start_time: '08:00',
    end_time: '22:00',
    price_per_hour: 0
  })

  // NUEVO: estados para gestión de torneos
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    category: 'primera',
    maxTeams: 32,
    scoringSystem: 'traditional',
    registrationDeadline: '',
    startDate: ''
  })
  const [clubTournaments, setClubTournaments] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      const { data } = await supabaseClient.auth.getUser()
      if (!data.user) { router.replace('/login?mode=signin'); return }

      // ✅ Solo CLUB puede entrar a /dashboard
      const r = await fetch('/api/auth/is-club', { cache: 'no-store' })
      const j = await r.json()
      if (!j.ok) {
        // si es jugador, mandarlo a /player/dashboard, sino a /club
        router.replace('/player/dashboard')
        return
      }

      setMe(data.user.email ?? null)

      await Promise.all([loadClubs(), loadCourts(), loadMatches(), loadSchedules(), loadTournaments()])
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

  async function loadSchedules() {
    if (!clubs.length) return
    const { data } = await supabaseClient
      .from('club_schedules')
      .select(`
        id, day_of_week, start_time, end_time, price_per_hour, active,
        court:courts(name),
        club:clubs(name)
      `)
      .order('day_of_week')
      .order('start_time')
    if (data) setSchedules(data)
  }

  async function loadTournaments() {
    try {
      const response = await fetch('/api/tournaments')
      const data = await response.json()
      setClubTournaments(data.tournaments || [])
    } catch (error) {
      console.error('Error loading tournaments:', error)
    }
  }

  // NUEVA FUNCIÓN: handleCreateTournament
  async function handleCreateTournament(e: React.FormEvent) {
    e.preventDefault()
    
    if (!tournamentForm.name || !tournamentForm.startDate || !tournamentForm.registrationDeadline) {
      setMessage('❌ Por favor completa todos los campos obligatorios')
      return
    }
    
    try {
      setMessage('⏳ Creando torneo...')
      
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: tournamentForm.name,
          category: tournamentForm.category,
          maxTeams: tournamentForm.maxTeams,
          scoringSystem: tournamentForm.scoringSystem,
          startDate: tournamentForm.startDate,
          registrationDeadline: tournamentForm.registrationDeadline
        })
      })

      const result = await response.json()
      console.log('API Response:', result)

      if (response.ok) {
        setTournamentForm({
          name: '',
          category: 'primera',
          maxTeams: 32,
          scoringSystem: 'traditional',
          registrationDeadline: '',
          startDate: ''
        })
        await loadTournaments()
        setMessage('✅ Torneo creado exitosamente')
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setMessage(''), 3000)
      } else {
        console.error('Error response:', result)
        setMessage(`❌ Error: ${result.error}`)
      }
    } catch (error: any) {
      console.error('Network error:', error)
      setMessage('❌ Error de conexión al crear el torneo')
    }
  }

  async function addSchedule() {
    if (!scheduleForm.court_id || !scheduleForm.start_time || !scheduleForm.end_time) {
      setMessage('Completa todos los campos del horario.')
      return
    }

    try {
      // Primero obtener el club_id de la cancha seleccionada
      const selectedCourt = courts.find(court => court.id === scheduleForm.court_id)
      if (!selectedCourt) {
        setMessage('Cancha no encontrada.')
        return
      }

      const { error } = await supabaseClient.from('club_schedules').insert({
        court_id: scheduleForm.court_id,
        club_id: selectedCourt.club_id, // Obtener el club_id de la cancha
        day_of_week: scheduleForm.day_of_week,
        start_time: scheduleForm.start_time + ':00',
        end_time: scheduleForm.end_time + ':00',
        price_per_hour: scheduleForm.price_per_hour
      })

      if (error) {
        console.error('Error al guardar horario:', error)
        setMessage(`Error al guardar: ${error.message}`)
        return
      }
      
      setScheduleForm({
        court_id: '',
        day_of_week: 0,
        start_time: '08:00',
        end_time: '22:00',
        price_per_hour: 0
      })
      setShowScheduleForm(false)
      setMessage('Horario agregado correctamente.')
      await loadSchedules()

    } catch (err: any) {
      console.error('Error:', err)
      setMessage(`Error inesperado: ${err.message}`)
    }
  }

  async function toggleSchedule(id: string, active: boolean) {
    await supabaseClient
      .from('club_schedules')
      .update({ active: !active })
      .eq('id', id)
    await loadSchedules()
  }

  async function deleteSchedule(id: string) {
    if (!confirm('¿Eliminar este horario?')) return
    await supabaseClient.from('club_schedules').delete().eq('id', id)
    await loadSchedules()
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

  async function handleLogout() { 
    await supabaseClient.auth.signOut(); 
    router.replace('/login?mode=signin') 
  }

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

  async function scanCameras() {
    setScanning(true)
    setMessage('')
    try {
      const resp = await fetch('/api/cameras/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ netRange }) // p.ej. "192.168.0.0/24"
      })
      const json = await resp.json()
      if (!resp.ok) throw new Error(json.error || 'Scan failed')

      // json.hosts = [{ ip, rtsp, http }...], json.engine = 'nmap' | 'tcp'
      setCameras(json.hosts || [])
      setMessage(`✅ Encontradas ${json.hosts?.length || 0} cámaras usando ${json.engine}`)
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`)
    } finally {
      setScanning(false)
    }
  }

  const courtsOfClub = useMemo(() => courts.filter(c => c.club_id === matchClub), [courts, matchClub])

  if (loading) return <div className="dash-loading">Cargando dashboard…</div>

  // Helpers métricas para ancho de barras
  const bestCourt = metrics?.byCourt?.[0]?.videos_count ?? 1
  const bestDay = Math.max(1, ...(metrics?.byDay ?? []).map(d => d.videos))

  const mode = 'reservas'; // Asegúrate de que esta variable esté definida correctamente

  return (
    <div className="dash-shell">
      {/* Sidebar fija */}
      <aside className="dash-aside">
        <div className="brand">Byzoc Admin</div>
        <nav className="dash-nav">
          {['Resumen','Cámaras','Canchas','Partidos','Horarios','Métricas','Config'].map(lbl => (
            <a key={lbl} href={`#${lbl}`}><span className="lbl">{lbl}</span></a>
          ))}
          <a href="#Torneos" className="dash-nav-link">🏆 Torneos</a>
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
        <section className="dash-section">
          <div className="section-header">
            <h2>
              <span className="icon">🕐</span>
              Gestión de Horarios
            </h2>
            <button 
              onClick={() => setShowScheduleForm(!showScheduleForm)}
              className="btn-primary"
            >
              {showScheduleForm ? 'Cancelar' : '+ Nuevo Horario'}
            </button>
          </div>

          {showScheduleForm && (
            <div className="form-card">
              <h3>Configurar Nuevo Horario</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>Cancha</label>
                  <select 
                    value={scheduleForm.court_id} 
                    onChange={e => setScheduleForm({...scheduleForm, court_id: e.target.value})}
                  >
                    <option value="">Selecciona una cancha</option>
                    {courts.map(court => (
                      <option key={court.id} value={court.id}>
                        {court.name} - {court.club?.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Día de la semana</label>
                  <select 
                    value={scheduleForm.day_of_week} 
                    onChange={e => setScheduleForm({...scheduleForm, day_of_week: parseInt(e.target.value)})}
                  >
                    <option value={0}>Domingo</option>
                    <option value={1}>Lunes</option>
                    <option value={2}>Martes</option>
                    <option value={3}>Miércoles</option>
                    <option value={4}>Jueves</option>
                    <option value={5}>Viernes</option>
                    <option value={6}>Sábado</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Hora de inicio</label>
                  <input 
                    type="time" 
                    value={scheduleForm.start_time}
                    onChange={e => setScheduleForm({...scheduleForm, start_time: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Hora de fin</label>
                  <input 
                    type="time" 
                    value={scheduleForm.end_time}
                    onChange={e => setScheduleForm({...scheduleForm, end_time: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Precio por hora ($)</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    value={scheduleForm.price_per_hour}
                    onChange={e => setScheduleForm({...scheduleForm, price_per_hour: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group full-width">
                  <button onClick={addSchedule} className="btn-primary">
                    Guardar Horario
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="schedules-grid">
        <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
          Horarios Configurados
        </h4>
        
        {schedules.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: 'rgba(255,255,255,0.6)', 
            padding: '40px 20px',
            border: '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '12px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🕐</div>
            <p style={{ margin: '0 0 8px 0', fontSize: '16px' }}>No hay horarios configurados</p>
            <small>Agrega horarios para que los jugadores puedan reservar canchas</small>
          </div>
        ) : (
          schedules.map(schedule => (
            <div key={schedule.id} className="schedule-card">
              <div className="schedule-info">
                <h5 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '14px', fontWeight: '600' }}>
                  {schedule.court?.name || 'Cancha N/A'}
                </h5>
                <div className="schedule-meta">
                  <span>
                    <strong>{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][schedule.day_of_week]}</strong>
                  </span>
                  <span>
                    {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
                  </span>
                  <span>${schedule.price_per_hour}/hora</span>
                </div>
              </div>
              <div className="schedule-actions">
                <button 
                  onClick={() => toggleSchedule(schedule.id, schedule.active)}
                  className={`btn-toggle ${schedule.active ? 'active' : 'inactive'}`}
                >
                  {schedule.active ? 'Activo' : 'Inactivo'}
                </button>
                <button 
                  onClick={() => deleteSchedule(schedule.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#fca5a5',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>
        </section>

        {/* FIN de Gestión de Horarios */}

        {/* AQUÍ VA EL PUNTO 3 - Gestión de Reservas */}
        <section className="dash-section">
          <div className="section-header">
            <h2>
              <span className="icon">📅</span>
              Reservas Recibidas
            </h2>
          </div>
          
          <ReservationsManager />
        </section>

        {/* Continúa con Métricas u otras secciones existentes */}
        {/* MÉTRICAS extra */}
        <section id="Métricas" className="card"><h2>Métricas</h2><div className="muted">Listo para agregar más paneles/series.</div></section>

        {/* Sección de Torneos */}
        <section id="Torneos" style={{ marginBottom: '40px' }}>
          <h2>🏆 Gestión de Torneos</h2>
          
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* Botón para crear torneo */}
            <div className="card">
              <h3>Crear Nuevo Torneo</h3>
              <div style={{ display: 'grid', gap: '16px' }}>
                <form onSubmit={handleCreateTournament}>
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Nombre del torneo"
                      value={tournamentForm.name}
                      onChange={(e) => setTournamentForm({...tournamentForm, name: e.target.value})}
                      required
                    />
                    <select
                      value={tournamentForm.category}
                      onChange={(e) => setTournamentForm({...tournamentForm, category: e.target.value})}
                    >
                      <option value="primera">Primera</option>
                      <option value="segunda">Segunda</option>
                      <option value="tercera">Tercera</option>
                    </select>
                    <button type="submit" className="btn-primary">Crear Torneo</button>
                  </div>
                  
                  <div className="form-row">
                    <select
                      value={tournamentForm.maxTeams}
                      onChange={(e) => setTournamentForm({...tournamentForm, maxTeams: parseInt(e.target.value)})}
                    >
                      <option value={16}>16 equipos</option>
                      <option value={32}>32 equipos</option>
                      <option value={64}>64 equipos</option>
                    </select>
                    <select
                      value={tournamentForm.scoringSystem}
                      onChange={(e) => setTournamentForm({...tournamentForm, scoringSystem: e.target.value})}
                    >
                      <option value="traditional">Tradicional</option>
                      <option value="suma7">Suma 7</option>
                      <option value="suma11">Suma 11</option>
                    </select>
                    <input
                      type="datetime-local"
                      value={tournamentForm.startDate}
                      onChange={(e) => setTournamentForm({...tournamentForm, startDate: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <input
                      type="datetime-local"
                      value={tournamentForm.registrationDeadline}
                      onChange={(e) => setTournamentForm({...tournamentForm, registrationDeadline: e.target.value})}
                      required
                    />
                  </div>
                </form>
              </div>
            </div>

            {/* Lista de torneos del club */}
            <div className="card">
              <h3>Mis Torneos</h3>
              <div className="list-scroll">
                {clubTournaments.map(tournament => (
                  <div key={tournament.id} className="row">
                    <div>
                      <div className="row-title">{tournament.name}</div>
                      <div className="muted xs">
                        {tournament.category} • {tournament.registered_teams}/{tournament.max_teams} equipos
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span style={{
                        background: tournament.status === 'registration' ? 'rgba(16, 185, 129, 0.2)' : 
                                   tournament.status === 'in_progress' ? 'rgba(245, 158, 11, 0.2)' : 
                                   'rgba(156, 163, 175, 0.2)',
                        color: tournament.status === 'registration' ? '#10b981' : 
                               tournament.status === 'in_progress' ? '#f59e0b' : '#9ca3af',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {tournament.status === 'registration' ? 'Inscripciones' : 
                         tournament.status === 'in_progress' ? 'En curso' : 'Finalizado'}
                      </span>
                      <button 
                        onClick={() => window.open(`/torneos/${tournament.id}`, '_blank')}
                        className="btn-ghost"
                        style={{ fontSize: '12px', padding: '4px 8px' }}
                      >
                        Ver
                      </button>
                    </div>
                  </div>
                ))}
                {clubTournaments.length === 0 && (
                  <div style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>
                    No has creado torneos aún
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {message && (
          <div className="msg-ok">
            {message}
            <button className="msg-close" onClick={()=>setMessage('')}>×</button>
          </div>
        )}

        {mode === 'reservas' && (
          <ReservationSystem />
        )}

        {/* En el JSX, agregar la sección de cámaras: */}
        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h3 style={{ color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            📹 Descubrir Cámaras
          </h3>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
            <input
              placeholder="192.168.1.0/24"
              value={netRange}
              onChange={e => setNetRange(e.target.value)}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: 8,
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: 'white'
              }}
            />
            <button
              onClick={scanCameras}
              disabled={scanning}
              style={{
                padding: '8px 16px',
                background: scanning ? 'rgba(124,58,237,0.5)' : 'linear-gradient(135deg, #7c3aed, #9333ea)',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: scanning ? 'not-allowed' : 'pointer'
              }}
            >
              {scanning ? 'Escaneando...' : 'Buscar Cámaras'}
            </button>
          </div>

          {cameras.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h4 style={{ color: '#9ca3af', marginBottom: 8 }}>Cámaras encontradas:</h4>
              <div style={{ display: 'grid', gap: 8 }}>
                {cameras.map((cam, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 12px',
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ color: 'white' }}>{cam.ip}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {cam.rtsp && <span style={{ color: '#10b981', fontSize: 12 }}>RTSP</span>}
                      {cam.http && <span style={{ color: '#3b82f6', fontSize: 12 }}>HTTP</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <style jsx>{`
        .schedules-grid {
          background: rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          margin-top: 20px;
        }
        
        .schedule-card {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .schedule-info {
          flex: 1;
        }
        
        .schedule-meta {
          display: flex;
          gap: 20px;
          font-size: 14px;
          color: rgba(255, 255, 255, 0.8);
        }
        
        .schedule-actions {
          display: flex;
          gap: 8px;
        }
        
        .btn-toggle {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-toggle.active {
          background: rgba(34, 197, 94, 0.2);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }
        
        .btn-toggle.inactive {
          background: rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
      `}</style>
    </div>
  )
}