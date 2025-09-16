'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type PlayerProfile = {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  province: string | null
  city: string | null
  category: string
  matches_played: number
  matches_won: number
  phone_verified: boolean
  created_at: string
}

type Reservation = {
  id: string
  club_id: string
  court_id: string
  scheduled_at: string
  number_of_players: number
  notes: string | null
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  created_at: string
  clubs: {
    name: string
    address: string
  }
  courts: {
    name: string
    surface_type: string
  }
}

export default function PlayerDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [availableTournaments, setAvailableTournaments] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { 
        router.replace('/player'); 
        return 
      }
      const { data: playerP } = await supabase
        .from('player_profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()
      if (!playerP) {
        // si es club, mandalo a /dashboard; si no, a /login
        const { data: clubP } = await supabase
          .from('club_profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()
        if (clubP) router.replace('/dashboard')
        else router.replace('/player')
      } else {
        loadProfile() // Cargar perfil del jugador si existe
        loadReservations() // Cargar reservas del jugador
        loadAvailableTournaments() // Cargar torneos disponibles
      }
    })()
  }, [router])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.replace('/player')
      return
    }
    
    setUser(user)

    // Cargar perfil del jugador
    const { data: profile, error } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error cargando perfil:', error)
    } else {
      setProfile(profile)
    }
    
    setLoading(false)
  }

  async function loadReservations() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data: reservations, error } = await supabase
      .from('reservations')
      .select(`
        *,
        clubs:club_id (name, address),
        courts:court_id (name, surface_type)
      `)
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true })

    if (error) {
      console.error('Error cargando reservas:', error)
    } else {
      setReservations(reservations || [])
    }
  }

  async function loadAvailableTournaments() {
    try {
      const response = await fetch('/api/tournaments?status=registration')
      const data = await response.json()
      
      console.log('Torneos cargados desde API:', data) // Para debug
      
      setAvailableTournaments(data.tournaments || [])
    } catch (error) {
      console.error('Error loading tournaments:', error)
    }
  }

  async function cancelReservation(reservationId: string) {
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId)

    if (error) {
      console.error('Error cancelando reserva:', error)
      alert('Error al cancelar la reserva')
    } else {
      alert('Reserva cancelada exitosamente')
      loadReservations() // Recargar reservas
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/player')
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #16a085 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        Cargando dashboard...
      </div>
    )
  }

  const winRate = profile?.matches_played ? Math.round((profile.matches_won / profile.matches_played) * 100) : 0
  const upcomingReservations = reservations.filter(r => 
    new Date(r.scheduled_at) > new Date() && ['pending', 'confirmed'].includes(r.status)
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b'
      case 'confirmed': return '#10b981'
      case 'cancelled': return '#ef4444'
      case 'completed': return '#6b7280'
      default: return '#9ca3af'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente'
      case 'confirmed': return 'Confirmada'
      case 'cancelled': return 'Cancelada'
      case 'completed': return 'Completada'
      default: return status
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #16a085 25%, #0f172a 75%, #16a085 100%)',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Efectos de fondo */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '15%',
        width: '300px',
        height: '300px',
        background: 'rgba(22, 160, 133, 0.15)',
        borderRadius: '50%',
        filter: 'blur(80px)',
        animation: 'float 8s infinite ease-in-out'
      }} />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, #16a085, #10b981)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              🏸
            </div>
            <div>
              <h1 style={{ color: 'white', fontSize: '24px', margin: '0', fontWeight: '700' }}>
                ¡Hola, {profile?.first_name}!
              </h1>
              <p style={{ color: '#9ca3af', margin: '0', fontSize: '14px' }}>
                {user?.email} • Categoría {profile?.category}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Cerrar sesión
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#16a085', marginBottom: '8px' }}>
              {profile?.matches_played || 0}
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '14px' }}>Partidos Jugados</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981', marginBottom: '8px' }}>
              {profile?.matches_won || 0}
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '14px' }}>Partidos Ganados</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#3b82f6', marginBottom: '8px' }}>
              {winRate}%
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '14px' }}>Efectividad</div>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#8b5cf6', marginBottom: '8px' }}>
              {upcomingReservations.length}
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '14px' }}>Reservas Activas</div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          {/* Perfil */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Mi Perfil
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>Nombre Completo</span>
                <div style={{ color: 'white', fontWeight: '500' }}>
                  {profile?.first_name} {profile?.last_name}
                </div>
              </div>
              {profile?.phone && (
                <div>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>Teléfono</span>
                  <div style={{ color: 'white', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {profile.phone}
                    {profile.phone_verified ? (
                      <span style={{ color: '#10b981', fontSize: '12px' }}>✓ Verificado</span>
                    ) : (
                      <span style={{ color: '#f59e0b', fontSize: '12px' }}>⚠ Sin verificar</span>
                    )}
                  </div>
                </div>
              )}
              {(profile?.province || profile?.city) && (
                <div>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>Ubicación</span>
                  <div style={{ color: 'white', fontWeight: '500' }}>
                    {profile?.city}{profile?.city && profile?.province && ', '}{profile?.province}
                  </div>
                </div>
              )}
              <div>
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>Miembro desde</span>
                <div style={{ color: 'white', fontWeight: '500' }}>
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('es-ES') : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Próximas funciones */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Próximamente
            </h3>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ 
                padding: '12px', 
                background: 'rgba(22, 160, 133, 0.1)', 
                borderRadius: '8px',
                border: '1px solid rgba(22, 160, 133, 0.2)'
              }}>
                <div style={{ color: '#16a085', fontWeight: '600', fontSize: '14px' }}>🏆 Torneos</div>
                <div style={{ color: '#9ca3af', fontSize: '12px' }}>Encuentra torneos en tu zona</div>
              </div>
              <div style={{ 
                padding: '12px', 
                background: 'rgba(59, 130, 246, 0.1)', 
                borderRadius: '8px',
                border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div style={{ color: '#3b82f6', fontWeight: '600', fontSize: '14px' }}>👥 Compañeros</div>
                <div style={{ color: '#9ca3af', fontSize: '12px' }}>Busca jugadores de tu nivel</div>
              </div>
              <div style={{ 
                padding: '12px', 
                background: 'rgba(139, 92, 246, 0.1)', 
                borderRadius: '8px',
                border: '1px solid rgba(139, 92, 246, 0.2)'
              }}>
                <div style={{ color: '#8b5cf6', fontWeight: '600', fontSize: '14px' }}>📊 Estadísticas</div>
                <div style={{ color: '#9ca3af', fontSize: '12px' }}>Análisis detallado de tu juego</div>
              </div>
              <div style={{ 
                padding: '12px', 
                background: 'rgba(16, 185, 129, 0.1)', 
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.2)'
              }}>
                <div style={{ color: '#10b981', fontWeight: '600', fontSize: '14px' }}>📅 Reservas</div>
                <div style={{ color: '#9ca3af', fontSize: '12px' }}>Sistema de reservas inteligente</div>
              </div>
            </div>
          </div>
        </div>

        {/* Reservas Section */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0' }}>
              Mis Reservas
            </h3>
            <button
              onClick={() => router.push('/player/dashboard/mis-reservas')}
              style={{ 
                padding: '16px', 
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0px)'}
            >
              <div style={{ color: 'white', fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>
                📋 Mis Reservas
              </div>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>
                Ver y gestionar tus reservas
              </div>
            </button>
          </div>

          {reservations.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              color: '#9ca3af' 
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
              <p>No tienes reservas aún</p>
              <p style={{ fontSize: '14px' }}>¡Haz tu primera reserva en uno de nuestros clubes!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {reservations.slice(0, 5).map((reservation) => (
                <div
                  key={reservation.id}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <h4 style={{ color: 'white', margin: '0', fontSize: '16px', fontWeight: '600' }}>
                        {reservation.clubs?.name}
                      </h4>
                      <span
                        style={{
                          background: `${getStatusColor(reservation.status)}20`,
                          color: getStatusColor(reservation.status),
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        {getStatusText(reservation.status)}
                      </span>
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '4px' }}>
                      📍 {reservation.clubs?.address}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '4px' }}>
                      🏸 {reservation.courts?.name} • {reservation.courts?.surface_type}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                      🕐 {new Date(reservation.scheduled_at).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '14px' }}>
                      👥 {reservation.number_of_players} jugadores
                    </div>
                  </div>
                  {['pending', 'confirmed'].includes(reservation.status) && new Date(reservation.scheduled_at) > new Date() && (
                    <button
                      onClick={() => {
                        if (confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
                          cancelReservation(reservation.id)
                        }
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#fca5a5',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              ))}
              {reservations.length > 5 && (
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#9ca3af',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Ver todas las reservas ({reservations.length})
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sección de Torneos disponibles */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: '0' }}>
              🏆 Torneos Disponibles
            </h3>
            <button
              onClick={() => window.open('/torneos', '_blank')}
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Ver Todos
            </button>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {availableTournaments.slice(0, 3).map(tournament => (
              <div
                key={tournament.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  cursor: 'pointer'
                }}
                onClick={() => window.open(`/torneos/${tournament.id}`, '_blank')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ color: 'white', margin: '0', fontSize: '16px', fontWeight: '600' }}>
                    {tournament.name}
                  </h4>
                  <span style={{
                    background: 'rgba(124, 58, 237, 0.2)',
                    color: '#a78bfa',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}>
                    {tournament.category.toUpperCase()}
                  </span>
                </div>
                <div style={{ color: '#9ca3af', fontSize: '14px', marginBottom: '8px' }}>
                  🏢 {tournament.club?.name} • 📍 {tournament.club?.city}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                    👥 {tournament.registered_teams}/{tournament.max_teams} equipos
                  </div>
                  {tournament.status === 'registration' && (
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      color: '#10b981',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}>
                      Inscripciones Abiertas
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {availableTournaments.length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
              <p>No hay torneos disponibles en este momento</p>
            </div>
          )}
        </div>

        {/* Back to home link */}
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <a 
            href="/" 
            style={{ 
              color: '#9ca3af', 
              fontSize: '14px', 
              textDecoration: 'none',
              padding: '8px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
            ← Volver al inicio
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}