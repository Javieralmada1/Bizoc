'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Tournament {
  id: string
  name: string
  category: string
  max_teams: number
  registered_teams: number
  start_date: string
  registration_deadline: string
  status: string
  scoring_system: string
  club?: {
    name: string
    city: string
    province: string
  }
}

interface Team {
  id: string
  team_name: string
  player1_name: string
  player1_email: string
  player2_name: string
  player2_email: string
  registration_date: string
}

export default function TournamentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const tournamentId = params.id as string

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Estados para inscripción
  const [showRegistration, setShowRegistration] = useState(false)
  const [registrationForm, setRegistrationForm] = useState({
    teamName: '',
    player1Name: '',
    player1Email: '',
    player2Name: '',
    player2Email: ''
  })
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    if (tournamentId) {
      loadTournament()
      loadTeams()
    }
  }, [tournamentId])

  async function loadTournament() {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}`)
      const data = await response.json()

      if (response.ok) {
        setTournament(data.tournament)
      } else {
        setError('Torneo no encontrado')
      }
    } catch (err) {
      setError('Error al cargar el torneo')
    } finally {
      setLoading(false)
    }
  }

  async function loadTeams() {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/teams`)
      const data = await response.json()
      setTeams(data.teams || [])
    } catch (err) {
      console.error('Error loading teams:', err)
    }
  }

  async function handleRegistration(e: React.FormEvent) {
    e.preventDefault()
    setRegistering(true)

    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationForm)
      })

      if (response.ok) {
        setRegistrationForm({
          teamName: '',
          player1Name: '',
          player1Email: '',
          player2Name: '',
          player2Email: ''
        })
        setShowRegistration(false)
        loadTeams()
        loadTournament()
        alert('¡Inscripción exitosa!')
      } else {
        const data = await response.json()
        alert(`Error: ${data.error}`)
      }
    } catch (err) {
      alert('Error al inscribirse')
    } finally {
      setRegistering(false)
    }
  }

  async function generateBracket() {
    try {
      const response = await fetch(`/api/tournaments/${tournamentId}/generate-bracket`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Bracket generado exitosamente')
        window.open(`/torneos/${tournamentId}/bracket`, '_blank')
      } else {
        const data = await response.json()
        alert(`Error: ${data.error}`)
      }
    } catch (err) {
      alert('Error al generar bracket')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>Cargando torneo...</div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          padding: '48px',
          textAlign: 'center',
          color: 'white'
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>❌</h1>
          <h2 style={{ marginBottom: '16px' }}>Torneo no encontrado</h2>
          <p style={{ color: '#cbd5e1', marginBottom: '24px' }}>
            El torneo que buscas no existe o ha sido eliminado
          </p>
          <button
            onClick={() => router.push('/torneos')}
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #3b82f6, #9333ea)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ← Volver a torneos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)',
      padding: '80px 16px 16px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header del torneo */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '24px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontSize: '36px', marginBottom: '16px', fontWeight: '700' }}>
                🏆 {tournament.name}
              </h1>
              <div style={{ display: 'grid', gap: '8px', fontSize: '16px', color: '#cbd5e1' }}>
                <div>🏢 <strong>{tournament.club?.name}</strong> • 📍 {tournament.club?.city}</div>
                <div>🎾 Categoría: <strong>{tournament.category.toUpperCase()}</strong></div>
                <div>👥 {tournament.registered_teams}/{tournament.max_teams} equipos inscritos</div>
                <div>🏓 Sistema: <strong>{tournament.scoring_system}</strong></div>
                <div>📅 Inicio: <strong>{new Date(tournament.start_date).toLocaleDateString('es-ES')}</strong></div>
                <div>⏰ Inscripciones hasta: <strong>{new Date(tournament.registration_deadline).toLocaleDateString('es-ES')}</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{
                background: tournament.status === 'registration' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(156, 163, 175, 0.2)',
                color: tournament.status === 'registration' ? '#10b981' : '#9ca3af',
                padding: '8px 16px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                {tournament.status === 'registration' ? 'Inscripciones Abiertas' : 'Inscripciones Cerradas'}
              </span>

              {tournament.status === 'registration' && (
                <button
                  onClick={() => setShowRegistration(true)}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #16a085, #3b82f6)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  ✍️ Inscribirse
                </button>
              )}

              {teams.length >= 2 && (
                <button
                  onClick={generateBracket}
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                >
                  🏆 Ver Bracket
                </button>
              )}

              <button
                onClick={() => router.push('/torneos')}
                style={{
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>

        {/* Lista de equipos inscritos */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '24px',
          padding: '32px',
          color: 'white'
        }}>
          <h2 style={{ fontSize: '24px', marginBottom: '24px', fontWeight: '600' }}>
            👥 Equipos Inscritos ({teams.length})
          </h2>

          {teams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#cbd5e1' }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
              <p>Aún no hay equipos inscritos</p>
              <p>¡Sé el primero en inscribirte!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {teams.map((team, index) => (
                <div
                  key={team.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '20px',
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr 1fr auto',
                    gap: '20px',
                    alignItems: 'center'
                  }}
                >
                  <div style={{
                    width: '40px',
                    height: '40px',
                    background: 'linear-gradient(135deg, #3b82f6, #9333ea)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '600'
                  }}>
                    {index + 1}
                  </div>
                  
                  <div>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
                      {team.team_name}
                    </h4>
                    <div style={{ fontSize: '14px', color: '#cbd5e1' }}>
                      Inscrito: {new Date(team.registration_date).toLocaleDateString('es-ES')}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '600' }}>🎾 {team.player1_name}</div>
                      <div style={{ fontSize: '14px', color: '#cbd5e1' }}>{team.player1_email}</div>
                    </div>
                    <div>
                      <div style={{ fontWeight: '600' }}>🎾 {team.player2_name}</div>
                      <div style={{ fontSize: '14px', color: '#cbd5e1' }}>{team.player2_email}</div>
                    </div>
                  </div>

                  <div style={{
                    padding: '6px 12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    ✅ Confirmado
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal de inscripción */}
        {showRegistration && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '24px',
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              color: 'white'
            }}>
              <h3 style={{ fontSize: '24px', marginBottom: '24px', textAlign: 'center' }}>
                ✍️ Inscribir Equipo
              </h3>

              <form onSubmit={handleRegistration}>
                <div style={{ display: 'grid', gap: '16px' }}>
                  <input
                    type="text"
                    placeholder="Nombre del equipo"
                    value={registrationForm.teamName}
                    onChange={(e) => setRegistrationForm({...registrationForm, teamName: e.target.value})}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '16px'
                    }}
                    required
                  />

                  <div style={{ display: 'grid', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>🎾 Jugador 1</h4>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={registrationForm.player1Name}
                      onChange={(e) => setRegistrationForm({...registrationForm, player1Name: e.target.value})}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '16px'
                      }}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={registrationForm.player1Email}
                      onChange={(e) => setRegistrationForm({...registrationForm, player1Email: e.target.value})}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '16px'
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'grid', gap: '12px' }}>
                    <h4 style={{ margin: 0, fontSize: '16px' }}>🎾 Jugador 2</h4>
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={registrationForm.player2Name}
                      onChange={(e) => setRegistrationForm({...registrationForm, player2Name: e.target.value})}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '16px'
                      }}
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={registrationForm.player2Email}
                      onChange={(e) => setRegistrationForm({...registrationForm, player2Email: e.target.value})}
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '16px'
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button
                      type="button"
                      onClick={() => setShowRegistration(false)}
                      style={{
                        flex: 1,
                        padding: '12px 24px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '16px'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={registering}
                      style={{
                        flex: 1,
                        padding: '12px 24px',
                        background: registering ? 'rgba(16, 185, 129, 0.5)' : 'linear-gradient(135deg, #16a085, #3b82f6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: registering ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    >
                      {registering ? 'Inscribiendo...' : 'Inscribir Equipo'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}