'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import BeelupPlayer from '@/components/players/BeelupPlayer'
import ReservationSystem from '@/components/clubs/ReservationSystem'

const fechasDisponibles = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - i)
  return d.toISOString().slice(0, 10)
})

function buildLocalDayRange(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const start = new Date(y, m - 1, d, 0, 0, 0, 0)
  const end   = new Date(y, m - 1, d, 23, 59, 59, 999)
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

type Club = { id: string; name: string; province: string | null; city: string | null }

export default function Home() {
  const [mode, setMode] = useState<'home' | 'reservas' | 'partidos' | 'features'>('home')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  const [clubs, setClubs] = useState<any[]>([])
  const [courts, setCourts] = useState<any[]>([])
  const [matchClub, setMatchClub] = useState('')
  const [matchCourt, setMatchCourt] = useState('')
  const [matchDate, setMatchDate] = useState('')
  const [matchHora, setMatchHora] = useState('')
  const [partidoEncontrado, setPartidoEncontrado] = useState<any>(null)
  const [partidoBuscado, setPartidoBuscado] = useState(false)
  const [matches, setMatches] = useState<any[]>([])
  const [matchesLoading, setMatchesLoading] = useState(false)
  const [editingClubId, setEditingClubId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editProv, setEditProv] = useState('')
  const [editCity, setEditCity] = useState('')

  useEffect(() => {
    async function fetchData() {
      const { data: clubsData } = await supabase.from('clubs').select('*')
      setClubs(clubsData || [])
      const { data: courtsData } = await supabase.from('courts').select('*')
      setCourts(courtsData || [])
      const { data: matchesData } = await supabase.from('matches').select('*')
      setMatches(matchesData || [])
    }
    fetchData()
  }, [])

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

  const courtsOfClub = courts.filter(c => c.club_id === matchClub)
  const horariosUnicos = matches
    .filter(m => m.scheduled_at)
    .map(m => new Date(m.scheduled_at).toTimeString().slice(0,5))
    .filter((v,i,a) => a.indexOf(v) === i)
    .sort()

  function buscarPartidoSeguro() {
    setPartidoBuscado(true)
    setPartidoEncontrado(null)
    if (!matchClub || !matchCourt || !matchDate || !matchHora) return

    const partido = matches.find(m => {
      if (!m.scheduled_at) return false
      const fecha = new Date(m.scheduled_at)
      if (isNaN(fecha.getTime())) return false
      const [a, mth, d] = matchDate.split('-')
      const [h, min] = matchHora.split(':')
      return (
        m.club_id === matchClub &&
        m.court_id === matchCourt &&
        fecha.getFullYear() === Number(a) &&
        fecha.getMonth() + 1 === Number(mth) &&
        fecha.getDate() === Number(d) &&
        fecha.getHours() === Number(h) &&
        fecha.getMinutes() === Number(min)
      )
    })
    setPartidoEncontrado(partido || null)
  }

  function startEditClub(c: Club) {
    setEditingClubId(c.id)
    setEditName(c.name || '')
    setEditProv(c.province || '')
    setEditCity(c.city || '')
  }

  async function loadClubs() {
    const { data: clubsData } = await supabase.from('clubs').select('*')
    setClubs(clubsData || [])
  }

  async function saveEditClub() {
    if (!editingClubId) return
    const { error } = await supabase
      .from('clubs')
      .update({
        name: editName.trim(),
        province: editProv.trim() || null,
        city: editCity.trim() || null,
      })
      .eq('id', editingClubId)
    if (!error) {
      setEditingClubId(null)
      await loadClubs()
    } else {
      alert(error.message)
    }
  }

  return (
    <>
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) scale(1);
            opacity: 0.3; 
          }
          50% { 
            transform: translateY(-20px) scale(1.05);
            opacity: 0.5; 
          }
        }
        
        @media (max-width: 768px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 30px !important;
          }
          
          .hero-title {
            font-size: 32px !important;
            line-height: 1.2 !important;
          }
          
          .hero-subtitle {
            font-size: 16px !important;
          }
          
          .features-grid {
            grid-template-columns: 1fr !important;
          }
          
          .search-grid {
            grid-template-columns: 1fr !important;
          }
          
          .hero-image {
            height: 300px !important;
          }
        }
      `}</style>
      
      <div>
        {/* Navegación responsive */}
        <nav style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 2px 20px rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '0 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '70px'
          }}>
            {/* Logo */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
              }}>
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                  <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#1e293b', margin: 0 }}>Byzoc</h1>
                <span style={{ fontSize: '12px', color: '#64748b', display: window.innerWidth < 768 ? 'none' : 'block' }}>
                  Tu cancha, tu momento
                </span>
              </div>
            </div>

            {/* Menu Desktop */}
            <div style={{
              display: window.innerWidth >= 768 ? 'flex' : 'none',
              alignItems: 'center',
              gap: '8px'
            }}>
              <button 
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: mode === 'home' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                  color: mode === 'home' ? 'white' : '#64748b',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setMode('home')}
              >
                Inicio
              </button>
              <button 
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: mode === 'reservas' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                  color: mode === 'reservas' ? 'white' : '#64748b',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setMode('reservas')}
              >
                Reservar
              </button>
              <button 
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: mode === 'partidos' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                  color: mode === 'partidos' ? 'white' : '#64748b',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '14px',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setMode('partidos')}
              >
                Partidos
              </button>
              <a 
                href="/torneos" 
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  color: '#64748b',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                🏆 Torneos
              </a>
              <a 
                href="/clubs/dashboard" 
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '14px'
                }}
              >
                Admin
              </a>
            </div>

            {/* Botón Hamburguesa Mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: window.innerWidth >= 768 ? 'none' : 'flex',
                width: '42px',
                height: '42px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <svg width="24" height="24" fill="none" stroke="#3b82f6" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Menu Mobile Desplegable */}
          {mobileMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '70px',
              left: 0,
              right: 0,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
              borderTop: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <button 
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: mode === 'home' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                  color: mode === 'home' ? 'white' : '#64748b',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '15px',
                  textAlign: 'left'
                }}
                onClick={() => { setMode('home'); setMobileMenuOpen(false); }}
              >
                Inicio
              </button>
              <button 
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: mode === 'reservas' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                  color: mode === 'reservas' ? 'white' : '#64748b',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '15px',
                  textAlign: 'left'
                }}
                onClick={() => { setMode('reservas'); setMobileMenuOpen(false); }}
              >
                Reservar Cancha
              </button>
              <button 
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: mode === 'partidos' ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'transparent',
                  color: mode === 'partidos' ? 'white' : '#64748b',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500',
                  fontSize: '15px',
                  textAlign: 'left'
                }}
                onClick={() => { setMode('partidos'); setMobileMenuOpen(false); }}
              >
                Ver Partidos
              </button>
              <a 
                href="/torneos" 
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  color: '#64748b',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '15px',
                  display: 'block'
                }}
              >
                🏆 Torneos
              </a>
              <hr style={{ border: 'none', borderTop: '1px solid rgba(0,0,0,0.1)', margin: '8px 0' }} />
              <a 
                href="/clubs/dashboard" 
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '15px',
                  display: 'block',
                  textAlign: 'center'
                }}
              >
                Admin Club
              </a>
              <a 
                href="/players/dashboard" 
                style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(22, 160, 133, 0.1)',
                  border: '1px solid rgba(22, 160, 133, 0.3)',
                  color: '#16a085',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '15px',
                  display: 'block',
                  textAlign: 'center'
                }}
              >
                Soy Jugador
              </a>
            </div>
          )}
        </nav>

        {/* Contenido principal */}
        <main style={{ paddingTop: '70px' }}>
          {/* Modo: Página de inicio */}
          {mode === 'home' && (
            <div style={{
              minHeight: '100vh',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Hero Section */}
              <section style={{
                position: 'relative',
                zIndex: 10,
                minHeight: 'calc(100vh - 70px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 16px'
              }}>
                <div className="hero-grid" style={{ 
                  maxWidth: '1200px', 
                  width: '100%', 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '60px', 
                  alignItems: 'center' 
                }}>
                  <div>
                    <h1 className="hero-title" style={{
                      fontSize: '56px',
                      fontWeight: '800',
                      marginBottom: '24px',
                      lineHeight: '1.1',
                      background: 'linear-gradient(135deg, #1e293b, #3b82f6)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                      La mejor experiencia de <span style={{ color: '#3b82f6' }}>Pádel</span>
                    </h1>
                    <p className="hero-subtitle" style={{ 
                      fontSize: '20px', 
                      color: '#64748b', 
                      marginBottom: '40px', 
                      lineHeight: '1.6' 
                    }}>
                      Grabá tus partidos, marcá los mejores puntos y compartí highlights al instante.
                    </p>
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => window.open('/clubs/dashboard', '_blank')}
                        style={{
                          padding: '16px 32px',
                          borderRadius: '16px',
                          border: 'none',
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          color: 'white',
                          fontSize: '16px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)'
                        }}
                      >
                        Empezar Ahora
                      </button>
                    </div>
                  </div>
                  
                  <div className="hero-image" style={{
                    position: 'relative',
                    height: '500px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'white',
                      borderRadius: '24px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{ fontSize: '120px', opacity: '0.2' }}>🎾</div>
                      <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '20px',
                        right: '20px',
                        padding: '16px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        borderRadius: '12px'
                      }}>
                        <div style={{ fontSize: '14px', color: '#10b981', marginBottom: '4px' }}>
                          EN VIVO
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: 'white' }}>
                          Club Pádel Buenos Aires
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Features Grid */}
              <section style={{
                position: 'relative',
                zIndex: 10,
                padding: '60px 16px',
                background: 'rgba(248, 250, 252, 0.5)'
              }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                  <h2 style={{
                    fontSize: '40px',
                    fontWeight: '800',
                    textAlign: 'center',
                    marginBottom: '60px',
                    color: '#1e293b'
                  }}>
                    Todo lo que necesitás
                  </h2>
                  
                  <div className="features-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '24px'
                  }}>
                    {[
                      { icon: '🎥', title: 'Grabación HD', desc: 'Capturá todos tus partidos en alta definición' },
                      { icon: '⚡', title: 'Highlights Instantáneos', desc: 'Marcá y compartí los mejores puntos al instante' },
                      { icon: '📱', title: 'Multi-plataforma', desc: 'Accedé desde cualquier dispositivo' },
                      { icon: '🏆', title: 'Torneos', desc: 'Organizá y seguí torneos completos' },
                      { icon: '📊', title: 'Estadísticas', desc: 'Analizá tu rendimiento con datos detallados' },
                      { icon: '🔗', title: 'Compartir Fácil', desc: 'Links directos para cada highlight' }
                    ].map((feature, idx) => (
                      <div key={idx} style={{
                        padding: '32px',
                        background: 'white',
                        borderRadius: '24px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)'
                      }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>{feature.icon}</div>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>
                          {feature.title}
                        </h3>
                        <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
                          {feature.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Modo: Sistema de reservas */}
          {mode === 'reservas' && <ReservationSystem />}

          {/* Modo: Búsqueda de partidos */}
          {mode === 'partidos' && (
            <div style={{
              minHeight: '100vh',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)',
              padding: '40px 16px'
            }}>
              <div style={{
                maxWidth: '512px',
                width: '100%',
                margin: '0 auto'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                  <h2 style={{
                    fontSize: '32px',
                    fontWeight: '700',
                    color: '#1e293b',
                    marginBottom: '16px'
                  }}>Encuentra tu Partido</h2>
                  <p style={{ fontSize: '16px', color: '#64748b' }}>
                    Busca y reproduce los videos de tus partidos
                  </p>
                </div>

                <div style={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '24px',
                  padding: '24px',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)'
                }}>
                  <div className="search-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    <select
                      value={matchClub}
                      onChange={e => { setMatchClub(e.target.value); setMatchCourt('') }}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="">Selecciona club...</option>
                      {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>

                    <select
                      value={matchCourt}
                      onChange={e => setMatchCourt(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="">Selecciona cancha...</option>
                      {courtsOfClub.map(co => <option key={co.id} value={co.id}>{co.name}</option>)}
                    </select>

                    <select
                      value={matchDate}
                      onChange={e => setMatchDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="">Fecha...</option>
                      {fechasDisponibles.map(f => (
                        <option key={f} value={f}>
                          {new Date(f).toLocaleDateString('es-ES')}
                        </option>
                      ))}
                    </select>

                    <select
                      value={matchHora}
                      onChange={e => setMatchHora(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '16px'
                      }}
                    >
                      <option value="">Horario...</option>
                      {horariosUnicos.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>

                  <button
                    onClick={buscarPartidoSeguro}
                    style={{
                      width: '100%',
                      padding: '16px 24px',
                      background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                      color: 'white',
                      fontWeight: '600',
                      borderRadius: '12px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '16px'
                    }}
                  >
                    Buscar Partido
                  </button>

                  {partidoEncontrado && (
                    <div style={{
                      marginTop: '24px',
                      padding: '24px',
                      background: 'rgba(16, 185, 129, 0.05)',
                      borderRadius: '16px',
                      border: '1px solid rgba(16, 185, 129, 0.2)'
                    }}>
                      <h4 style={{ color: '#10b981', marginBottom: '16px' }}>
                        Partido encontrado
                      </h4>
                      {partidoEncontrado.video_url ? (
                        <BeelupPlayer src={partidoEncontrado.video_url} />
                      ) : (
                        <p style={{ textAlign: 'center', color: '#64748b' }}>
                          No hay video disponible
                        </p>
                      )}
                    </div>
                  )}

                  {partidoBuscado && !partidoEncontrado && (
                    <div style={{
                      marginTop: '24px',
                      padding: '24px',
                      background: 'rgba(239, 68, 68, 0.05)',
                      borderRadius: '16px',
                      textAlign: 'center'
                    }}>
                      <p style={{ color: '#ef4444' }}>
                        No se encontró ningún partido con esos datos
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}