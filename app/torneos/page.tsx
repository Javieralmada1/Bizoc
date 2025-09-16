'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Search, Plus, Trophy, Users, MapPin } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import TeamRegistrationModal from '@/components/TeamRegistrationmodal'

// Definir tipos
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
  }
}

interface Filters {
  search: string
  category: string
  status: string
}

export default function TorneosPage() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [clubProfile, setClubProfile] = useState<any>(null)
  
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: 'all',
    status: 'all'
  })

  // Estados para el modal de registro
  const [showRegistrationModal, setShowRegistrationModal] = useState(false)
  const [selectedTournamentForRegistration, setSelectedTournamentForRegistration] = useState<Tournament | null>(null)

  // Cargar datos iniciales
  useEffect(() => {
    loadInitialData()
  }, [])

  // Filtrar torneos cuando cambien los filtros
  useEffect(() => {
    let filtered = tournaments

    if (filters.search) {
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category)
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(t => t.status === filters.status)
    }

    setFilteredTournaments(filtered)
  }, [tournaments, filters])

  async function loadInitialData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data: profile } = await supabase
          .from('clubs')
          .select('*')
          .eq('owner_id', user.id)
          .single()
        
        if (profile) setClubProfile(profile)
      }

      await loadTournaments()
      
    } catch (error) {
      console.error('Error loading initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadTournaments() {
    try {
      const response = await fetch('/api/tournaments')
      const data = await response.json()
      setTournaments(data.tournaments || [])
    } catch (error) {
      console.error('Error loading tournaments:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
      'registration': { label: 'INSCRIPCIONES ABIERTAS', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      'in_progress': { label: 'EN CURSO', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
      'completed': { label: 'FINALIZADO', color: '#6b7280', bg: 'rgba(107, 114, 128, 0.1)' },
      'cancelled': { label: 'CANCELADO', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' }
    }

    const config = statusConfig[status] || statusConfig.registration
    
    return (
      <span style={{
        background: config.bg,
        color: config.color,
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600'
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

  const TournamentCard = ({ tournament }: { tournament: Tournament }) => (
    <div style={{
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '20px',
      marginBottom: '16px',
      transition: 'all 0.3s ease',
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
      e.currentTarget.style.transform = 'translateY(-2px)'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
      e.currentTarget.style.transform = 'translateY(0)'
    }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>{getCategoryIcon(tournament.category)}</span>
          <div>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>
              {tournament.name}
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              {tournament.category.toUpperCase()}
            </p>
          </div>
        </div>
        {getStatusBadge(tournament.status)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <MapPin size={16} color="#94a3b8" />
            <span style={{ color: '#cbd5e1', fontSize: '14px' }}>{tournament.venue || 'Ubicación TBD'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} color="#94a3b8" />
            <span style={{ color: '#cbd5e1', fontSize: '14px' }}>
              {new Date(tournament.start_date).toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Users size={16} color="#94a3b8" />
            <span style={{ color: '#cbd5e1', fontSize: '14px' }}>
              {tournament.registered_teams || 0}/{tournament.max_teams} equipos
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trophy size={16} color="#94a3b8" />
            <span style={{ color: '#cbd5e1', fontSize: '14px' }}>Premio: {tournament.prizes || 'N/A'}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/torneos/${tournament.id}`)
          }}
          style={{
            background: 'rgba(59, 130, 246, 0.2)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            color: '#60a5fa',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Ver Detalles
        </button>
        {tournament.status === 'registration' && (
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setSelectedTournamentForRegistration(tournament)
              setShowRegistrationModal(true)
            }}
            style={{
              background: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Inscribirse
          </button>
        )}
      </div>
    </div>
  )

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
        <div>Cargando sistema de torneos...</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #7c3aed 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h1 style={{ color: 'white', fontSize: '28px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
              🏆 Sistema de Torneos Profesional
            </h1>
          </div>

          {/* Filtros básicos */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                Búsqueda
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  placeholder="Buscar torneo..."
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                Categoría
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="all">Todas</option>
                <option value="primera">Primera</option>
                <option value="damas">Damas</option>
                <option value="caballeros">Caballeros</option>
                <option value="mixto">Mixto</option>
              </select>
            </div>

            <div>
              <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px', display: 'block' }}>
                Estado
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="all">Todos</option>
                <option value="registration">Inscripciones</option>
                <option value="in_progress">En Curso</option>
                <option value="completed">Finalizado</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estadísticas principales */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎾</div>
            <div style={{ color: '#10b981', fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
              {tournaments.filter(t => t.status === 'in_progress' || t.status === 'registration').length}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Torneos Activos</div>
          </div>

          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>👥</div>
            <div style={{ color: '#3b82f6', fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
              {tournaments.reduce((acc, t) => acc + (t.registered_teams || 0), 0)}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Equipos Inscritos</div>
          </div>

          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🏆</div>
            <div style={{ color: '#f59e0b', fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>
              {tournaments.length}
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Total Torneos</div>
          </div>
        </div>

        {/* Lista de torneos */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600' }}>
              Torneos Disponibles ({filteredTournaments.length})
            </h3>
          </div>

          {filteredTournaments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <Trophy size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.5 }} />
              <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>No hay torneos</h3>
              <p>No se encontraron torneos con los filtros seleccionados</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {filteredTournaments.map(tournament => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal de registro de equipo */}
      <TeamRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => {
          setShowRegistrationModal(false)
          setSelectedTournamentForRegistration(null)
        }}
        tournament={selectedTournamentForRegistration}
        onSuccess={() => {
          loadTournaments() // Recargar torneos
          setShowRegistrationModal(false)
          setSelectedTournamentForRegistration(null)
        }}
      />
    </div>
  )
}