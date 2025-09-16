'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Calendar, MapPin, Users, Trophy, DollarSign, Clock, ArrowLeft, UserCheck, AlertCircle } from 'lucide-react'
import TeamRegistrationModal from '@/components/TeamRegistrationmodal'

interface Tournament {
  id: string
  name: string
  category: string
  scoring_system: string
  status: string
  venue: string
  start_date: string
  end_date: string
  registration_deadline: string
  max_teams: number
  registered_teams: number
  entry_fee?: string
  prizes?: string
  description?: string
  progress: number
  club?: {
    name: string
    city: string
    province: string
  }
  tournament_registrations?: Array<{
    id: string
    team_name: string
    player1_name: string
    player2_name: string
    registration_date: string
    status: string
  }>
}

export default function TournamentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tournamentId = params.id as string
  
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)

  useEffect(() => {
    if (tournamentId) {
      loadTournament()
    }
  }, [tournamentId])

  const loadTournament = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/tournaments/${tournamentId}`)
      const data = await response.json()

      if (response.ok) {
        setTournament(data.tournament)
      } else {
        setError(data.error || 'Torneo no encontrado')
      }
    } catch (err) {
      setError('Error al cargar el torneo')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
      'registration': { label: 'INSCRIPCIONES ABIERTAS', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      'in_progress': { label: 'EN CURSO', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
      'completed': { label: 'FINALIZADO', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
      'cancelled': { label: 'CANCELADO', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' }
    }

    const config = statusConfig[status] || statusConfig.registration
    
    return (
      <span style={{
        background: config.bg,
        color: config.color,
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '14px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {config.label}
      </span>
    )
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'primera': '🥇',
      'damas': '👩',
      'caballeros': '👨',
      'mixto': '👫'
    }
    return icons[category] || '🏆'
  }

  const isRegistrationOpen = () => {
    if (!tournament) return false
    if (tournament.status !== 'registration') return false
    if (tournament.registered_teams >= tournament.max_teams) return false
    
    const deadline = new Date(tournament.registration_deadline)
    const now = new Date()
    return now <= deadline
  }

  const getDaysUntilDeadline = () => {
    if (!tournament) return 0
    const deadline = new Date(tournament.registration_deadline)
    const now = new Date()
    const diffTime = deadline.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #7c3aed 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '3px solid rgba(255,255,255,0.3)', 
            borderTop: '3px solid white', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <div>Cargando torneo...</div>
        </div>
      </div>
    )
  }

  if (error || !tournament) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #7c3aed 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          maxWidth: '500px'
        }}>
          <AlertCircle size={64} color="#ef4444" style={{ margin: '0 auto 20px', display: 'block' }} />
          <h2 style={{ marginBottom: '12px', fontSize: '24px' }}>Torneo no encontrado</h2>
          <p style={{ color: '#94a3b8', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => router.push('/torneos')}
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 auto'
            }}
          >
            <ArrowLeft size={16} />
            Volver a Torneos
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #7c3aed 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header con botón de volver */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => router.push('/torneos')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <ArrowLeft size={16} />
            Volver a Torneos
          </button>
        </div>

        {/* Header principal del torneo */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                <span style={{ fontSize: '48px' }}>{getCategoryIcon(tournament.category)}</span>
                <div>
                  <h1 style={{ fontSize: '36px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>
                    {tournament.name}
                  </h1>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {getStatusBadge(tournament.status)}
                    {tournament.club && (
                      <span style={{ color: '#94a3b8', fontSize: '16px' }}>
                        📍 {tournament.club.name} • {tournament.club.city}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {isRegistrationOpen() && (
                <div style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                    <Clock size={16} />
                    {getDaysUntilDeadline() > 0 
                      ? `Quedan ${getDaysUntilDeadline()} días para inscribirse`
                      : 'Último día para inscribirse'
                    }
                  </div>
                </div>
              )}
            </div>

            {isRegistrationOpen() && (
              <button
                onClick={() => setShowRegistrationModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  color: 'white',
                  border: 'none',
                  padding: '16px 32px',
                  borderRadius: '16px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)'
                }}
              >
                <UserCheck size={20} />
                Inscribir Equipo
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Información principal */}
          <div>
            {/* Detalles del torneo */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
                Información del Torneo
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    padding: '8px',
                    borderRadius: '8px'
                  }}>
                    <Trophy size={20} color="#3b82f6" />
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '14px' }}>Categoría</div>
                    <div style={{ color: 'white', fontWeight: '600' }}>{tournament.category.toUpperCase()}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    padding: '8px',
                    borderRadius: '8px'
                  }}>
                    <Users size={20} color="#10b981" />
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '14px' }}>Sistema</div>
                    <div style={{ color: 'white', fontWeight: '600' }}>{tournament.scoring_system?.toUpperCase() || 'ELIMINACIÓN'}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    padding: '8px',
                    borderRadius: '8px'
                  }}>
                    <MapPin size={20} color="#f59e0b" />
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '14px' }}>Lugar</div>
                    <div style={{ color: 'white', fontWeight: '600' }}>{tournament.venue}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    background: 'rgba(139, 92, 246, 0.2)',
                    padding: '8px',
                    borderRadius: '8px'
                  }}>
                    <Calendar size={20} color="#8b5cf6" />
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '14px' }}>Duración</div>
                    <div style={{ color: 'white', fontWeight: '600' }}>
                      {new Date(tournament.start_date).toLocaleDateString('es-ES')} - {new Date(tournament.end_date).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                </div>

                {tournament.entry_fee && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      padding: '8px',
                      borderRadius: '8px'
                    }}>
                      <DollarSign size={20} color="#22c55e" />
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px' }}>Inscripción</div>
                      <div style={{ color: 'white', fontWeight: '600' }}>{tournament.entry_fee}</div>
                    </div>
                  </div>
                )}

                {tournament.prizes && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: 'rgba(251, 191, 36, 0.2)',
                      padding: '8px',
                      borderRadius: '8px'
                    }}>
                      <Trophy size={20} color="#fbbf24" />
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px' }}>Premio</div>
                      <div style={{ color: 'white', fontWeight: '600' }}>{tournament.prizes}</div>
                    </div>
                  </div>
                )}
              </div>

              {tournament.description && (
                <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
                    Descripción
                  </h3>
                  <p style={{ color: '#cbd5e1', lineHeight: '1.6' }}>
                    {tournament.description}
                  </p>
                </div>
              )}
            </div>

            {/* Equipos inscritos */}
            {tournament.tournament_registrations && tournament.tournament_registrations.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{ color: 'white', fontSize: '20px', fontWeight: '600', marginBottom: '20px' }}>
                  Equipos Inscritos ({tournament.registered_teams})
                </h2>
                
                <div style={{ display: 'grid', gap: '12px' }}>
                  {tournament.tournament_registrations.map((registration, index) => (
                    <div key={registration.id} style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          color: 'white',
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {index + 1}
                        </div>
                        <div>
                          <div style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
                            {registration.team_name}
                          </div>
                          <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                            {registration.player1_name} • {registration.player2_name}
                          </div>
                        </div>
                      </div>
                      <div style={{ color: '#10b981', fontSize: '12px', fontWeight: '600' }}>
                        {registration.status === 'approved' ? 'CONFIRMADO' : 'PENDIENTE'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Panel lateral */}
          <div>
            {/* Progreso y estadísticas */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                Estadísticas
              </h3>
              
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Inscripciones</span>
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                    {tournament.registered_teams}/{tournament.max_teams}
                  </span>
                </div>
                <div style={{ background: 'rgba(255, 255, 255, 0.1)', borderRadius: '6px', height: '8px' }}>
                  <div style={{
                    background: tournament.registered_teams >= tournament.max_teams 
                      ? '#ef4444' 
                      : 'linear-gradient(90deg, #3b82f6, #10b981)',
                    borderRadius: '6px',
                    height: '100%',
                    width: `${(tournament.registered_teams / tournament.max_teams) * 100}%`,
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Estado</span>
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                    {tournament.status === 'registration' ? 'Abierto' : 
                     tournament.status === 'in_progress' ? 'En Curso' : 'Finalizado'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Límite inscripción</span>
                  <span style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                    {new Date(tournament.registration_deadline).toLocaleDateString('es-ES')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#94a3b8', fontSize: '14px' }}>Días restantes</span>
                  <span style={{ 
                    color: getDaysUntilDeadline() <= 3 ? '#ef4444' : '#10b981', 
                    fontSize: '14px', 
                    fontWeight: '600' 
                  }}>
                    {getDaysUntilDeadline()} días
                  </span>
                </div>
              </div>
            </div>

            {/* Información de contacto */}
            {tournament.club && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '16px' }}>
                  Organizador
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ color: 'white', fontWeight: '600' }}>
                    {tournament.club.name}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                    {tournament.club.city}, {tournament.club.province}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal de inscripción */}
        <TeamRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          tournament={tournament}
          onSuccess={() => {
            loadTournament() // Recargar torneo actualizado
          }}
        />

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}