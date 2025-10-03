'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import BeelupPlayer from '@/components/players/BeelupPlayer'
import ReservationSystemImproved from '@/components/clubs/ReservationSystemImproved'
import Link from 'next/link'

// Utilidades
const fechasDisponibles = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - i)
  return d.toISOString().slice(0, 10)
})

function buildLocalDayRange(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const start = new Date(y, m - 1, d, 0, 0, 0, 0)
  const end = new Date(y, m - 1, d, 23, 59, 59, 999)
  return { start, end }
}

async function fetchMatchesDelDia(
  supabase: any,
  { clubId, courtId, date }: { clubId: string; courtId: string; date: string },
  setMatches: (rows: any[]) => void
) {
  if (!clubId || !courtId || !date) return
  const { start, end } = buildLocalDayRange(date)
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('club_id', clubId)
    .eq('court_id', courtId)
    .gte('scheduled_at', start.toISOString())
    .lt('scheduled_at', end.toISOString())
    .order('scheduled_at')
  if (error) {
    console.error('fetchMatchesDelDia error', error)
    setMatches([])
    return
  }
  setMatches(data || [])
}

export default function Home() {
  // Estados de navegación
  const [mode, setMode] = useState<'home' | 'reservas' | 'partidos'>('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  // Estados de datos
  const [clubs, setClubs] = useState<any[]>([])
  const [courts, setCourts] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  
  // Estados de búsqueda de partidos
  const [matchClub, setMatchClub] = useState('')
  const [matchCourt, setMatchCourt] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [matchHora, setMatchHora] = useState('')
  const [partidoEncontrado, setPartidoEncontrado] = useState<any>(null)
  const [partidoBuscado, setPartidoBuscado] = useState(false)

  // Detectar mobile de forma reactiva
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    async function fetchData() {
      const { data: clubsData } = await supabase.from('clubs').select('*')
      setClubs(clubsData || [])
      const { data: courtsData } = await supabase.from('courts').select('*')
      setCourts(courtsData || [])
    }
    fetchData()
  }, [])

  // Cargar partidos del día cuando cambian los filtros
  useEffect(() => {
    let active = true
    async function load() {
      if (!matchClub || !matchCourt || !matchDate) return
      setMatchesLoading(true)
      try {
        await fetchMatchesDelDia(supabase, {
          clubId: matchClub,
          courtId: matchCourt,
          date: matchDate
        }, rows => { if (active) setMatches(rows) })
      } finally {
        if (active) setMatchesLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [matchClub, matchCourt, matchDate])

  // Computed values
  const courtsOfClub = courts.filter(c => c.club_id === matchClub)
  const horariosUnicos = matches
    .filter(m => m.scheduled_at)
    .map(m => new Date(m.scheduled_at).toTimeString().slice(0, 5))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()

  // Buscar partido específico
  function buscarPartidoSeguro() {
    setPartidoBuscado(true)
    setPartidoEncontrado(null)
    if (!matchClub || !matchCourt || !matchDate || !matchHora) return

    const partido = matches.find(m => {
      if (!m.scheduled_at) return false
      const fecha = new Date(m.scheduled_at)
      if (isNaN(fecha.getTime())) return false
      const [ah, am] = matchHora.split(':').map(Number)
      return fecha.getHours() === ah && fecha.getMinutes() === am
    })

    if (partido) {
      setPartidoEncontrado(partido)
    }
  }

  return (
    <>
      {/* Navegación Principal */}
      <nav className="landing-nav">
        <div className="landing-nav-container">
          {/* Logo */}
          <Link href="/" className="landing-brand" onClick={() => setMode('home')}>
            <div className="landing-brand-icon">
              <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="landing-brand-text">
              <h1>Byzoc</h1>
              {!isMobile && <span>Tu cancha, tu momento</span>}
            </div>
          </Link>

          {/* Menu Desktop */}
          {!isMobile && (
            <div className="landing-nav-menu">
              <button 
                className={`landing-nav-btn ${mode === 'home' ? 'active' : ''}`}
                onClick={() => setMode('home')}
              >
                Inicio
              </button>
              <button 
                className={`landing-nav-btn ${mode === 'reservas' ? 'active' : ''}`}
                onClick={() => setMode('reservas')}
              >
                Reservar Cancha
              </button>
              <button 
                className={`landing-nav-btn ${mode === 'partidos' ? 'active' : ''}`}
                onClick={() => setMode('partidos')}
              >
                Ver Partidos
              </button>
              <Link href="/clubs/dashboard" className="landing-nav-btn admin">
                Admin Club
              </Link>
              <Link href="/players/dashboard" className="landing-nav-btn player">
                Soy Jugador
              </Link>
            </div>
          )}

          {/* Botón Mobile Menu */}
          {isMobile && (
            <button 
              className="landing-mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          )}
        </div>

        {/* Menu Mobile Desplegable */}
        {isMobile && mobileMenuOpen && (
          <div className="landing-mobile-menu">
            <button 
              className={`landing-mobile-item ${mode === 'home' ? 'active' : ''}`}
              onClick={() => { setMode('home'); setMobileMenuOpen(false); }}
            >
              Inicio
            </button>
            <button 
              className={`landing-mobile-item ${mode === 'reservas' ? 'active' : ''}`}
              onClick={() => { setMode('reservas'); setMobileMenuOpen(false); }}
            >
              Reservar Cancha
            </button>
            <button 
              className={`landing-mobile-item ${mode === 'partidos' ? 'active' : ''}`}
              onClick={() => { setMode('partidos'); setMobileMenuOpen(false); }}
            >
              Ver Partidos
            </button>
            <hr className="landing-mobile-divider" />
            <Link 
              href="/clubs/dashboard" 
              className="landing-mobile-item admin"
              onClick={() => setMobileMenuOpen(false)}
            >
              Admin Club
            </Link>
            <Link 
              href="/players/dashboard" 
              className="landing-mobile-item player"
              onClick={() => setMobileMenuOpen(false)}
            >
              Soy Jugador
            </Link>
          </div>
        )}
      </nav>

      {/* Contenido Principal */}
      <main className="landing-main">
        {/* MODO: HOME */}
        {mode === 'home' && (
          <div className="landing-home">
            {/* Hero Section */}
            <section className="hero-section">
              <div className="hero-content">
                <div className="hero-badge">
                  <span className="hero-badge-icon">⚡</span>
                  <span>Plataforma #1 de Pádel en Argentina</span>
                </div>
                
                <h1 className="hero-title">
                  Tu cancha de pádel,
                  <span className="hero-title-gradient"> tu momento perfecto</span>
                </h1>
                
                <p className="hero-subtitle">
                  Reserva canchas al instante, revive tus mejores partidos y conecta con la comunidad. 
                  Todo en un solo lugar.
                </p>

                <div className="hero-actions">
                  <button 
                    className="hero-btn-primary"
                    onClick={() => setMode('reservas')}
                  >
                    Reservar Cancha
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                  <button 
                    className="hero-btn-secondary"
                    onClick={() => setMode('partidos')}
                  >
                    Ver Partidos
                  </button>
                </div>

                {/* Stats */}
                <div className="hero-stats">
                  <div className="hero-stat">
                    <div className="hero-stat-value">50+</div>
                    <div className="hero-stat-label">Clubes</div>
                  </div>
                  <div className="hero-stat">
                    <div className="hero-stat-value">10K+</div>
                    <div className="hero-stat-label">Jugadores</div>
                  </div>
                  <div className="hero-stat">
                    <div className="hero-stat-value">24/7</div>
                    <div className="hero-stat-label">Disponible</div>
                  </div>
                </div>
              </div>

              {/* Hero Image/Visual */}
              <div className="hero-visual">
                <div className="hero-card">
                  <div className="hero-card-badge">EN VIVO</div>
                  <div className="hero-card-title">Club Pádel Buenos Aires</div>
                  <div className="hero-card-subtitle">Cancha 3 • Final del Torneo</div>
                </div>
              </div>
            </section>

            {/* Features Grid */}
            <section className="features-section">
              <div className="features-container">
                <h2 className="features-title">Todo lo que necesitás</h2>
                
                <div className="features-grid">
                  <div className="feature-card">
                    <div className="feature-icon">🎥</div>
                    <h3 className="feature-title">Grabación HD</h3>
                    <p className="feature-desc">Capturá todos tus partidos en alta definición</p>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">⚡</div>
                    <h3 className="feature-title">Highlights Instantáneos</h3>
                    <p className="feature-desc">Marcá y compartí los mejores puntos al instante</p>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">📱</div>
                    <h3 className="feature-title">Multi-plataforma</h3>
                    <p className="feature-desc">Accedé desde cualquier dispositivo</p>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">🏆</div>
                    <h3 className="feature-title">Torneos</h3>
                    <p className="feature-desc">Organizá y seguí torneos completos</p>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">📊</div>
                    <h3 className="feature-title">Estadísticas</h3>
                    <p className="feature-desc">Analizá tu rendimiento con datos detallados</p>
                  </div>

                  <div className="feature-card">
                    <div className="feature-icon">🔗</div>
                    <h3 className="feature-title">Compartir Fácil</h3>
                    <p className="feature-desc">Links directos para cada highlight</p>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
              <div className="cta-card">
                <h2 className="cta-title">¿Listo para comenzar?</h2>
                <p className="cta-subtitle">
                  Únete a miles de jugadores que ya disfrutan de la mejor experiencia de pádel digital
                </p>
                <div className="cta-actions">
                  <button className="cta-btn-primary" onClick={() => setMode('reservas')}>
                    Reservar Ahora
                  </button>
                  <Link href="/clubs/dashboard" className="cta-btn-secondary">
                    ¿Administras un Club?
                  </Link>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* MODO: RESERVAS */}
        {mode === 'reservas' && <ReservationSystemImproved />}

        {/* MODO: PARTIDOS */}
        {mode === 'partidos' && (
          <div className="partidos-section">
            <div className="partidos-container">
              <div className="partidos-header">
                <h2 className="partidos-title">Encuentra tu Partido</h2>
                <p className="partidos-subtitle">
                  Busca y reproduce los videos de tus partidos
                </p>
              </div>

              <div className="partidos-form-card">
                <div className="partidos-form">
                  {/* Club */}
                  <div className="form-group">
                    <label className="form-label">Club</label>
                    <select 
                      className="form-select"
                      value={matchClub}
                      onChange={e => { setMatchClub(e.target.value); setMatchCourt(''); setMatchDate(''); setMatchHora(''); }}
                    >
                      <option value="">Selecciona un club</option>
                      {clubs.map(club => (
                        <option key={club.id} value={club.id}>
                          {club.name} {club.city ? `(${club.city})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Cancha */}
                  <div className="form-group">
                    <label className="form-label">Cancha</label>
                    <select 
                      className="form-select"
                      value={matchCourt}
                      onChange={e => { setMatchCourt(e.target.value); setMatchDate(''); setMatchHora(''); }}
                      disabled={!matchClub}
                    >
                      <option value="">Selecciona una cancha</option>
                      {courtsOfClub.map(court => (
                        <option key={court.id} value={court.id}>{court.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fecha */}
                  <div className="form-group">
                    <label className="form-label">Fecha</label>
                    <select 
                      className="form-select"
                      value={matchDate}
                      onChange={e => { setMatchDate(e.target.value); setMatchHora(''); }}
                      disabled={!matchCourt}
                    >
                      <option value="">Selecciona una fecha</option>
                      {fechasDisponibles.map(f => (
                        <option key={f} value={f}>
                          {new Date(f + 'T12:00:00').toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Hora */}
                  {matchesLoading ? (
                    <div className="form-group">
                      <label className="form-label">Hora</label>
                      <div className="form-loading">Cargando horarios...</div>
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">Hora</label>
                      <select 
                        className="form-select"
                        value={matchHora}
                        onChange={e => setMatchHora(e.target.value)}
                        disabled={!matchDate || horariosUnicos.length === 0}
                      >
                        <option value="">Selecciona una hora</option>
                        {horariosUnicos.map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button 
                    className="form-submit-btn"
                    onClick={buscarPartidoSeguro}
                    disabled={!matchClub || !matchCourt || !matchDate || !matchHora}
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Buscar Partido
                  </button>
                </div>

                {/* Resultados */}
                {partidoBuscado && (
                  <div className="partidos-results">
                    {partidoEncontrado ? (
                      <div className="partido-found">
                        <div className="partido-found-header">
                          <div className="partido-found-icon">✓</div>
                          <div>
                            <h3 className="partido-found-title">¡Partido encontrado!</h3>
                            <p className="partido-found-subtitle">{partidoEncontrado.title || 'Partido sin título'}</p>
                          </div>
                        </div>
                        {partidoEncontrado.video_url && (
                          <div className="partido-video">
                            <BeelupPlayer src={partidoEncontrado.video_url} />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="partido-not-found">
                        <div className="partido-not-found-icon">😔</div>
                        <h3 className="partido-not-found-title">No se encontró el partido</h3>
                        <p className="partido-not-found-text">
                          No hay video disponible para este horario
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  )
}