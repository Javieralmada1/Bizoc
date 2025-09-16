'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import BeelupPlayer from '@/components/BeelupPlayer'
import ReservationSystem from '@/components/ReservationSystem'

const fechasDisponibles = Array.from({ length: 7 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - i)
  return d.toISOString().slice(0, 10)
})

// Helper rango diario local
function buildLocalDayRange(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const start = new Date(y, m - 1, d, 0, 0, 0, 0)
  const end   = new Date(y, m - 1, d, 23, 59, 59, 999)
  return { start, end }
}

// Carga filtrada
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
  // Estados para el modo de la aplicación
  const [mode, setMode] = useState('home') // 'home', 'reservas', 'partidos'
  
  // Estados para búsqueda de partidos (existentes)
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

  const navStyle = {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    background: 'rgba(15, 23, 42, 0.9)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  }

  const containerStyle = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '70px'
  }

  const brandStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  }

  const menuStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }

  const navItemBaseStyle = {
    padding: '10px 16px',
    borderRadius: '8px',
    color: '#cbd5e1',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    textDecoration: 'none'
  }

  const getNavItemStyle = (isActive: boolean, isAdmin = false) => ({
    ...navItemBaseStyle,
    background: isActive 
      ? 'linear-gradient(135deg, #16a085, #3b82f6)' 
      : isAdmin 
        ? 'rgba(59, 130, 246, 0.1)' 
        : 'transparent',
    border: isAdmin ? '1px solid rgba(59, 130, 246, 0.3)' : 'none',
    color: isActive ? 'white' : isAdmin ? '#60a5fa' : '#cbd5e1'
  })

  const mainContentStyle = {
    paddingTop: '70px'
  }

  const gradientBackgroundStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)',
    position: 'relative' as const,
    overflow: 'hidden'
  }

  const floatingElementStyle = (top: string, left: string, delay = '0s') => ({
    position: 'absolute' as const,
    top,
    left,
    width: '288px',
    height: '288px',
    background: 'rgba(59, 130, 246, 0.2)',
    borderRadius: '50%',
    filter: 'blur(64px)',
    animation: `pulse 4s infinite ${delay}`
  })

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
      `}</style>
      
      <div>
        {/* Navegación principal */}
        <nav style={navStyle}>
          <div style={containerStyle}>
            <div style={brandStyle}>
              <div style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #16a085, #3b82f6)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
                  <path d="M12 20L18 26L28 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: 0 }}>Byzoc</h1>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>Tu cancha, tu momento</span>
              </div>
            </div>

            <div style={menuStyle}>
              <button 
                style={getNavItemStyle(mode === 'home')}
                onClick={() => setMode('home')}
              >
                Inicio
              </button>
              <button 
                style={getNavItemStyle(mode === 'reservas')}
                onClick={() => setMode('reservas')}
              >
                Reservar Cancha
              </button>
              <button 
                style={getNavItemStyle(mode === 'partidos')}
                onClick={() => setMode('partidos')}
              >
                Ver Partidos
              </button>
              <a 
                href="/torneos" 
                style={getNavItemStyle(false, false)}
                onClick={(e) => {
                  e.preventDefault()
                  window.open('/torneos', '_blank')
                }}
              >
                🏆 Torneos
              </a>
              <a 
                href="/dashboard" 
                style={getNavItemStyle(false, true)}
                onClick={(e) => {
                  e.preventDefault()
                  window.open('/dashboard', '_blank')
                }}
              >
                Admin Club
              </a>
              <a 
                href="/player/dashboard" 
                style={getNavItemStyle(false, false)}
                onClick={(e) => {
                  e.preventDefault()
                  window.open('/player/dashboard', '_blank')
                }}
              >
                Soy Jugador
              </a>
            </div>
          </div>
        </nav>

        {/* Contenido principal */}
        <main style={mainContentStyle}>
          {/* Modo: Página de inicio */}
          {mode === 'home' && (
            <div style={gradientBackgroundStyle}>
              <div style={floatingElementStyle('40px', '25%')}></div>
              <div style={floatingElementStyle('80px', '75%', '1s')}></div>
              <div style={floatingElementStyle('40px', '33%', '2s')}></div>

              {/* Hero Section */}
              <section style={{
                position: 'relative',
                zIndex: 10,
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 16px 16px'
              }}>
                <div style={{ 
                  maxWidth: '1200px', 
                  width: '100%', 
                  display: 'grid', 
                  gridTemplateColumns: '1fr 1fr', 
                  gap: '60px', 
                  alignItems: 'center' 
                }}>
                  <div>
                    <h1 style={{
                      fontSize: '56px',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, white, #16a085)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      marginBottom: '24px',
                      lineHeight: '1.1'
                    }}>
                      La mejor experiencia de 
                      <span style={{ color: '#16a085' }}> Pádel</span>
                    </h1>
                    <p style={{
                      fontSize: '20px',
                      color: '#cbd5e1',
                      marginBottom: '40px',
                      lineHeight: '1.6'
                    }}>
                      Reserva tu cancha en segundos, participa en torneos emocionantes y disfruta de grabaciones profesionales de tus partidos
                    </p>
                    
                    <div style={{
                      display: 'flex',
                      gap: '20px',
                      flexWrap: 'wrap'
                    }}>
                      <button 
                        onClick={() => setMode('reservas')}
                        style={{
                          padding: '16px 32px',
                          background: 'linear-gradient(135deg, #16a085, #3b82f6)',
                          color: 'white',
                          fontWeight: '600',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 10px 25px rgba(22, 160, 133, 0.3)'
                        }}
                      >
                        Reservar Cancha
                      </button>
                      <button 
                        onClick={() => window.open('/torneos', '_blank')}
                        style={{
                          padding: '16px 32px',
                          background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                          color: 'white',
                          fontWeight: '600',
                          borderRadius: '12px',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px',
                          transition: 'all 0.3s ease',
                          boxShadow: '0 10px 25px rgba(124, 58, 237, 0.3)'
                        }}
                      >
                        🏆 Ver Torneos
                      </button>
                      <button 
                        onClick={() => setMode('partidos')}
                        style={{
                          padding: '16px 32px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontWeight: '600',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          fontSize: '16px',
                          transition: 'all 0.3s ease',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        Ver Partidos
                      </button>
                    </div>

                    {/* Quick access cards */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                      marginTop: '48px'
                    }}>
                      <div 
                        onClick={() => window.open('/dashboard', '_blank')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '16px',
                          padding: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'center'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0px)'
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏢</div>
                        <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                          Soy Club
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                          Gestiona canchas y torneos
                        </p>
                      </div>

                      <div 
                        onClick={() => window.open('/player/dashboard', '_blank')}
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          backdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '16px',
                          padding: '20px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          textAlign: 'center'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'translateY(-4px)'
                          e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'translateY(0px)'
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                        }}
                      >
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎾</div>
                        <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0' }}>
                          Soy Jugador
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '12px', margin: 0 }}>
                          Reservas y torneos
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      width: '400px',
                      height: '300px',
                      background: 'linear-gradient(135deg, #16a085, #3b82f6)',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      boxShadow: '0 25px 50px rgba(22, 160, 133, 0.3)'
                    }}>
                      <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}>
                        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                          <path d="M15 10L30 20L15 30V10Z" fill="white"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Modo: Sistema de reservas */}
          {mode === 'reservas' && (
            <ReservationSystem />
          )}

          {/* Modo: Búsqueda de partidos */}
          {mode === 'partidos' && (
            <div style={gradientBackgroundStyle}>
              <div style={floatingElementStyle('40px', '25%')}></div>
              <div style={floatingElementStyle('80px', '75%', '1s')}></div>
              <div style={floatingElementStyle('40px', '33%', '2s')}></div>

              <div style={{
                position: 'relative',
                zIndex: 10,
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 16px 16px'
              }}>
                <div style={{ maxWidth: '512px', width: '100%' }}>
                  {/* Header */}
                  <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '80px',
                      height: '80px',
                      background: 'linear-gradient(135deg, #3b82f6, #9333ea)',
                      borderRadius: '16px',
                      marginBottom: '24px',
                      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                    }}>
                      <svg style={{ width: '40px', height: '40px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <h2 style={{
                      fontSize: '36px',
                      fontWeight: '700',
                      color: 'white',
                      marginBottom: '16px'
                    }}>Encuentra tu Partido</h2>
                    <p style={{
                      fontSize: '18px',
                      color: '#cbd5e1',
                      lineHeight: '1.6'
                    }}>Busca y reproduce los videos de tus partidos grabados automáticamente</p>
                  </div>

                  {/* Card de búsqueda */}
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '24px',
                    padding: '32px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'linear-gradient(135deg, #3b82f6, #9333ea)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '16px'
                      }}>
                        <svg style={{ width: '24px', height: '24px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'white', margin: 0 }}>
                        Buscar mi partido
                      </h3>
                    </div>

                    <div style={{
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
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          color: 'white',
                          backdropFilter: 'blur(8px)',
                          outline: 'none',
                          fontSize: '16px'
                        }}
                      >
                        <option value="" style={{ color: 'black' }}>Selecciona club...</option>
                        {clubs.map(c => <option key={c.id} value={c.id} style={{ color: 'black' }}>{c.name}</option>)}
                      </select>

                      <select
                        value={matchCourt}
                        onChange={e => setMatchCourt(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          color: 'white',
                          backdropFilter: 'blur(8px)',
                          outline: 'none',
                          fontSize: '16px'
                        }}
                      >
                        <option value="" style={{ color: 'black' }}>Selecciona cancha...</option>
                        {courtsOfClub.map(co => <option key={co.id} value={co.id} style={{ color: 'black' }}>{co.name}</option>)}
                      </select>

                      <select
                        value={matchDate}
                        onChange={e => setMatchDate(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          color: 'white',
                          backdropFilter: 'blur(8px)',
                          outline: 'none',
                          fontSize: '16px'
                        }}
                      >
                        <option value="" style={{ color: 'black' }}>Selecciona fecha...</option>
                        {fechasDisponibles.map(f => (
                          <option key={f} value={f} style={{ color: 'black' }}>
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
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '12px',
                          color: 'white',
                          backdropFilter: 'blur(8px)',
                          outline: 'none',
                          fontSize: '16px'
                        }}
                      >
                        <option value="" style={{ color: 'black' }}>Selecciona horario...</option>
                        {horariosUnicos.map(h => (
                          <option key={h} value={h} style={{ color: 'black' }}>{h}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={buscarPartidoSeguro}
                      style={{
                        width: '100%',
                        padding: '16px 24px',
                        background: 'linear-gradient(135deg, #3b82f6, #9333ea)',
                        color: 'white',
                        fontWeight: '600',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Buscar Partido
                    </button>

                    {/* Resultado de búsqueda */}
                    {partidoEncontrado && (
                      <div style={{
                        marginTop: '24px',
                        padding: '24px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '16px'
                        }}>
                          <svg style={{ width: '24px', height: '24px', marginRight: '8px', color: '#10b981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h4 style={{ color: '#10b981', fontSize: '18px', fontWeight: '600', margin: 0 }}>
                            Partido encontrado
                          </h4>
                        </div>
                        {partidoEncontrado.video_url ? (
                          <div style={{ marginTop: '20px' }}>
                            <BeelupPlayer src={partidoEncontrado.video_url} />
                          </div>
                        ) : (
                          <div style={{
                            textAlign: 'center',
                            padding: '48px',
                            color: '#d1d5db'
                          }}>
                            <svg style={{ width: '64px', height: '64px', margin: '0 auto 16px', opacity: 0.5 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <p>No hay video disponible para este partido</p>
                          </div>
                        )}
                      </div>
                    )}

                    {partidoBuscado && !partidoEncontrado && (
                      <div style={{
                        marginTop: '24px',
                        padding: '24px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        backdropFilter: 'blur(8px)',
                        borderRadius: '16px',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '12px'
                        }}>
                          <svg style={{ width: '24px', height: '24px', marginRight: '8px', color: '#fca5a5' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <h4 style={{ color: '#fca5a5', fontSize: '16px', fontWeight: '600', margin: 0 }}>
                            No encontrado
                          </h4>
                        </div>
                        <p style={{ color: '#fca5a5', margin: 0 }}>
                          No se encontró ningún partido con esos datos
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  )
}