'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Tournament = {
  id: string
  name: string
  category: string
  max_teams: number
  registered_teams: number
  registration_deadline: string
  start_date: string
  status: string
  scoring_system: string
  club: {
    name: string
    city: string
    province: string
  }
}

export default function TorneosPage() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isClub, setIsClub] = useState(false)
  
  // Filtros
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal para crear torneo
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    category: 'primera',
    maxTeams: 32,
    scoringSystem: 'traditional',
    registrationDeadline: '',
    startDate: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // Verificar usuario
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)

    if (user) {
      // Verificar si es club
      const { data: clubProfile } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      setIsClub(!!clubProfile)
    }

    // Cargar torneos
    await loadTournaments()
    setLoading(false)
  }

  async function loadTournaments() {
    const params = new URLSearchParams()
    if (statusFilter) params.append('status', statusFilter)
    if (categoryFilter) params.append('category', categoryFilter)
    if (searchTerm) params.append('search', searchTerm)

    const response = await fetch(`/api/tournaments?${params}`)
    const data = await response.json()
    setTournaments(data.tournaments || [])
  }

  // Recargar cuando cambien los filtros
  useEffect(() => {
    if (!loading) {
      loadTournaments()
    }
  }, [statusFilter, categoryFilter, searchTerm])

  async function createTournament(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setShowCreateModal(false)
        setFormData({
          name: '',
          category: 'primera',
          maxTeams: 32,
          scoringSystem: 'traditional',
          registrationDeadline: '',
          startDate: ''
        })
        await loadTournaments()
        alert('Torneo creado exitosamente')
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      alert('Error al crear el torneo')
    }
  }

  function getStatusBadge(status: string) {
    const styles = {
      registration: { bg: 'rgba(16, 185, 129, 0.1)', color: '#10b981', text: 'Inscripciones Abiertas' },
      in_progress: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', text: 'En Curso' },
      completed: { bg: 'rgba(156, 163, 175, 0.1)', color: '#9ca3af', text: 'Finalizado' }
    }
    const style = styles[status as keyof typeof styles] || styles.registration
    
    return (
      <span style={{
        background: style.bg,
        color: style.color,
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        {style.text}
      </span>
    )
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
        Cargando torneos...
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #7c3aed 50%, #0f172a 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, white, #7c3aed)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px'
          }}>
            🏆 Torneos de Pádel
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '18px', marginBottom: '24px' }}>
            Encuentra y participa en torneos de tu categoría
          </p>
          
          {isClub && (
            <button
              onClick={() => setShowCreateModal(true)}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ➕ Crear Nuevo Torneo
            </button>
          )}
        </div>

        {/* Filtros */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <input
              type="text"
              placeholder="Buscar torneo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white'
              }}
            />
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white'
              }}
            >
              <option value="" style={{background: '#2d3748'}}>Todos los estados</option>
              <option value="registration" style={{background: '#2d3748'}}>Inscripciones abiertas</option>
              <option value="in_progress" style={{background: '#2d3748'}}>En curso</option>
              <option value="completed" style={{background: '#2d3748'}}>Finalizados</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white'
              }}
            >
              <option value="" style={{background: '#2d3748'}}>Todas las categorías</option>
              <option value="primera" style={{background: '#2d3748'}}>Primera</option>
              <option value="segunda" style={{background: '#2d3748'}}>Segunda</option>
              <option value="tercera" style={{background: '#2d3748'}}>Tercera</option>
            </select>
          </div>
        </div>

        {/* Lista de torneos */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
          gap: '24px'
        }}>
          {tournaments.map(tournament => (
            <div
              key={tournament.id}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(20px)',
                borderRadius: '20px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onClick={() => router.push(`/torneos/${tournament.id}`)}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 20px 40px rgba(124, 58, 237, 0.2)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0px)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{
                  color: 'white',
                  fontSize: '20px',
                  fontWeight: '700',
                  marginBottom: '8px'
                }}>
                  {tournament.name}
                </h3>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <span style={{
                    background: 'rgba(124, 58, 237, 0.2)',
                    color: '#a78bfa',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {tournament.category.toUpperCase()}
                  </span>
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {tournament.scoring_system.toUpperCase()}
                  </span>
                </div>
                {getStatusBadge(tournament.status)}
              </div>
              
              <div style={{ color: 'rgba(255,255,255,0.8)', marginBottom: '16px' }}>
                <p style={{ margin: '4px 0' }}>🏢 {tournament.club.name}</p>
                <p style={{ margin: '4px 0' }}>📍 {tournament.club.city}, {tournament.club.province}</p>
                <p style={{ margin: '4px 0' }}>👥 {tournament.registered_teams}/{tournament.max_teams} equipos</p>
                <p style={{ margin: '4px 0' }}>📅 Inicia: {new Date(tournament.start_date).toLocaleDateString('es-ES')}</p>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                  Registro hasta: {new Date(tournament.registration_deadline).toLocaleDateString('es-ES')}
                </div>
                {tournament.status === 'registration' && (
                  <button
                    style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      // Aquí iría la lógica de inscripción
                      alert('Función de inscripción próximamente')
                    }}
                  >
                    Inscribirse
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {tournaments.length === 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '60px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🏆</div>
            <h3 style={{ color: 'white', marginBottom: '8px' }}>No hay torneos disponibles</h3>
            <p style={{ color: 'rgba(255,255,255,0.6)' }}>
              {statusFilter || categoryFilter || searchTerm 
                ? 'Prueba cambiando los filtros de búsqueda'
                : 'Pronto habrá torneos emocionantes'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal crear torneo */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{ color: 'white', marginBottom: '24px', fontSize: '24px' }}>
              Crear Nuevo Torneo
            </h2>
            
            <form onSubmit={createTournament}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <input
                  type="text"
                  placeholder="Nombre del torneo"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                />
                
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                >
                  <option value="primera" style={{background: '#0f172a'}}>Primera</option>
                  <option value="segunda" style={{background: '#0f172a'}}>Segunda</option>
                  <option value="tercera" style={{background: '#0f172a'}}>Tercera</option>
                </select>
                
                <select
                  value={formData.maxTeams}
                  onChange={(e) => setFormData({...formData, maxTeams: parseInt(e.target.value)})}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                >
                  <option value={16} style={{background: '#0f172a'}}>16 equipos</option>
                  <option value={32} style={{background: '#0f172a'}}>32 equipos</option>
                  <option value={64} style={{background: '#0f172a'}}>64 equipos</option>
                </select>
                
                <select
                  value={formData.scoringSystem}
                  onChange={(e) => setFormData({...formData, scoringSystem: e.target.value})}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.1)',
                    color: 'white'
                  }}
                >
                  <option value="traditional" style={{background: '#0f172a'}}>Tradicional</option>
                  <option value="suma7" style={{background: '#0f172a'}}>Suma 7</option>
                  <option value="suma11" style={{background: '#0f172a'}}>Suma 11</option>
                </select>
                
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Fecha límite de inscripción
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.registrationDeadline}
                    onChange={(e) => setFormData({...formData, registrationDeadline: e.target.value})}
                    required
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      width: '100%'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
                    Fecha de inicio del torneo
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      width: '100%'
                    }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'transparent',
                    color: 'rgba(255,255,255,0.8)',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                    color: 'white',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Crear Torneo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Enlace de navegación */}
      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <a 
          href="/" 
          style={{ 
            color: 'rgba(255,255,255,0.6)', 
            textDecoration: 'none',
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          ← Volver al inicio
        </a>
      </div>
    </div>
  )
}