'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type Tournament = {
  id: string
  name: string
  category: string
  max_teams: number
  status: string
  scoring_system: string
}

type Team = {
  id: string
  team_name: string
  player1_name: string
  player2_name: string
}

type Match = {
  id: string
  round_name: string
  match_number: number
  team1: Team | null
  team2: Team | null
  winner: Team | null
  team1_score: number
  team2_score: number
  status: string
  scheduled_at: string | null
}

export default function BracketPage() {
  const params = useParams()
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBracketData()
  }, [params.id])

  async function loadBracketData() {
    try {
      // Cargar torneo
      const tournamentResponse = await fetch(`/api/tournaments/${params.id}`)
      if (tournamentResponse.ok) {
        const tournamentData = await tournamentResponse.json()
        setTournament(tournamentData.tournament)
      }

      // Cargar equipos
      const teamsResponse = await fetch(`/api/tournaments/${params.id}/teams`)
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json()
        setTeams(teamsData.teams || [])
      }

      // Cargar partidos
      const matchesResponse = await fetch(`/api/tournaments/${params.id}/matches`)
      if (matchesResponse.ok) {
        const matchesData = await matchesResponse.json()
        setMatches(matchesData.matches || [])
      }

    } catch (error) {
      console.error('Error loading bracket data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function generateBracket() {
    try {
      const response = await fetch(`/api/tournaments/${params.id}/generate-bracket`, {
        method: 'POST'
      })

      if (response.ok) {
        alert('Bracket generado exitosamente')
        loadBracketData()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Error al generar el bracket')
    }
  }

  function groupMatchesByRound(matches: Match[]) {
    const rounds: { [key: string]: Match[] } = {}
    
    matches.forEach(match => {
      if (!rounds[match.round_name]) {
        rounds[match.round_name] = []
      }
      rounds[match.round_name].push(match)
    })

    return rounds
  }

  function getRoundOrder() {
    const numTeams = teams.length
    const rounds = []
    
    if (numTeams <= 4) {
      rounds.push('Semifinal', 'Final')
    } else if (numTeams <= 8) {
      rounds.push('Cuartos de Final', 'Semifinal', 'Final')
    } else if (numTeams <= 16) {
      rounds.push('Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Final')
    } else if (numTeams <= 32) {
      rounds.push('Primera Ronda', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Final')
    } else {
      rounds.push('Primera Ronda', 'Segunda Ronda', 'Octavos de Final', 'Cuartos de Final', 'Semifinal', 'Final')
    }
    
    return rounds
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #7c3aed 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        Cargando bracket...
      </div>
    )
  }

  if (!tournament) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #7c3aed 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: 'white'
      }}>
        <h2>Torneo no encontrado</h2>
        <button 
          onClick={() => router.push('/torneos')}
          style={{
            background: '#7c3aed',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Volver a torneos
        </button>
      </div>
    )
  }

  const matchesByRound = groupMatchesByRound(matches)
  const roundOrder = getRoundOrder()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #7c3aed 50%, #0f172a 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white'
        }}>
          <button 
            onClick={() => router.push(`/torneos/${params.id}`)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            ← Volver al torneo
          </button>

          <h1 style={{ fontSize: '36px', fontWeight: '800', marginBottom: '16px' }}>
            🏆 Bracket - {tournament.name}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <span>👥 {teams.length} equipos registrados</span>
            <span>📊 {matches.length} partidos programados</span>
          </div>

          {matches.length === 0 && teams.length >= 4 && (
            <button
              onClick={generateBracket}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              🎯 Generar Bracket
            </button>
          )}
        </div>

        {/* Bracket */}
        {matches.length === 0 ? (
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '60px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center',
            color: 'white'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚡</div>
            {teams.length < 4 ? (
              <>
                <h3>Se necesitan al menos 4 equipos</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Actualmente hay {teams.length} equipos registrados
                </p>
              </>
            ) : (
              <>
                <h3>Bracket no generado</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Haz clic en "Generar Bracket" para crear los emparejamientos
                </p>
              </>
            )}
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflowX: 'auto'
          }}>
            <div style={{
              display: 'flex',
              gap: '40px',
              minWidth: 'fit-content'
            }}>
              {roundOrder.map(roundName => {
                const roundMatches = matchesByRound[roundName] || []
                
                return (
                  <div key={roundName} style={{ minWidth: '300px' }}>
                    <h3 style={{
                      color: 'white',
                      textAlign: 'center',
                      marginBottom: '24px',
                      fontSize: '18px',
                      fontWeight: '600'
                    }}>
                      {roundName}
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {roundMatches.map(match => (
                        <div
                          key={match.id}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '12px',
                            padding: '16px',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white'
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '12px'
                          }}>
                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
                              Partido #{match.match_number}
                            </span>
                            {match.status === 'completed' && (
                              <span style={{
                                background: '#10b981',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '10px'
                              }}>
                                Finalizado
                              </span>
                            )}
                          </div>
                          
                          <div style={{ marginBottom: '8px' }}>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px',
                              background: match.winner?.id === match.team1?.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '6px',
                              marginBottom: '4px'
                            }}>
                              <span>{match.team1?.team_name || 'TBD'}</span>
                              <span style={{ fontWeight: 'bold' }}>{match.team1_score}</span>
                            </div>
                            
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px',
                              background: match.winner?.id === match.team2?.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                              borderRadius: '6px'
                            }}>
                              <span>{match.team2?.team_name || 'TBD'}</span>
                              <span style={{ fontWeight: 'bold' }}>{match.team2_score}</span>
                            </div>
                          </div>
                          
                          {match.scheduled_at && (
                            <div style={{
                              fontSize: '12px',
                              color: 'rgba(255,255,255,0.6)',
                              textAlign: 'center'
                            }}>
                              📅 {new Date(match.scheduled_at).toLocaleString('es-ES')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}