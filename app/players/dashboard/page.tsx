'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { LogOut, Settings, Calendar, Trophy, BarChart3, User, BookOpen } from 'lucide-react'

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

interface Tournament {
  id: string
  name: string
  status: string
  registration_deadline: string
  start_date: string
  category: string
  entry_fee?: number
}

interface Reservation {
  id: string
  scheduled_at: string
  start_time: string
  end_time: string
  total_price: number
  status: string
  court: {
    name: string
  }
}

export default function PlayerDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data } = await supabase.auth.getUser()
      if (!data.user) { 
        router.replace('/players/auth/login')
        return 
      }
      
      const { data: playerP } = await supabase
        .from('player_profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()
        
      if (!playerP) {
        const { data: clubP } = await supabase
          .from('club_profiles')
          .select('id')
          .eq('id', data.user.id)
          .single()
        if (clubP) router.replace('/clubs/dashboard')
        else router.replace('/players/auth/login')
      } else {
        await loadProfile()
        await loadTournaments()
        await loadReservations(data.user.id)
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      router.replace('/players/auth/login')
    }
  }

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.replace('/players/auth/login')
      return
    }
    
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

  async function loadTournaments() {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('status', 'registration')
        .order('registration_deadline', { ascending: true })
        .limit(3)

      if (error) throw error
      setTournaments(data || [])
    } catch (error) {
      console.error('Error loading tournaments:', error)
    }
  }

  async function loadReservations(userId: string) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          court:courts(name)
        `)
        .eq('customer_email', userId)
        .gte('scheduled_at', new Date().toISOString().split('T')[0])
        .order('scheduled_at', { ascending: true })
        .limit(3)

      if (error) throw error
      setReservations(data || [])
    } catch (error) {
      console.error('Error loading reservations:', error)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/players')
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#cbd5e1', fontSize: '18px' }}>Cargando dashboard...</div>
      </div>
    )
  }

  const winRate = profile?.matches_played ? 
    Math.round((profile.matches_won / profile.matches_played) * 100) : 0

  const displayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.first_name || 'Jugador'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '32px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '24px',
                fontWeight: 'bold'
              }}>
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <h1 style={{ color: '#ffffff', fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
                  {displayName}
                </h1>
                <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '16px' }}>
                  Categoría {profile?.category} • {profile?.city}, {profile?.province}
                </p>
              </div>
            </div>
            
            <button 
              onClick={logout}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px 20px',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <div style={{
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#60a5fa', fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
              {profile?.matches_played || 0}
            </div>
            <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
              Partidos Jugados
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
              Total en tu carrera
            </div>
          </div>
          
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#4ade80', fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
              {profile?.matches_won || 0}
            </div>
            <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
              Partidos Ganados
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
              Victorias conseguidas
            </div>
          </div>
          
          <div style={{
            background: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#a855f7', fontSize: '48px', fontWeight: 'bold', marginBottom: '8px' }}>
              {winRate}%
            </div>
            <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: '500', marginBottom: '4px' }}>
              Efectividad
            </div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>
              Porcentaje de victorias
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          borderRadius: '16px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '32px'
        }}>
          <h2 style={{ color: '#ffffff', fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
            Acciones Rápidas
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <Link href="/players/dashboard/reservations" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <Calendar size={24} color="#60a5fa" />
                <div>
                  <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '500', marginBottom: '4px' }}>
                    Mis Reservas
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                    Ver y gestionar reservas de canchas
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/players/dashboard/tournaments" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(251, 146, 60, 0.1)',
                border: '1px solid rgba(251, 146, 60, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <Trophy size={24} color="#fb923c" />
                <div>
                  <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '500', marginBottom: '4px' }}>
                    Torneos
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                    Inscribirse en competencias
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/players/dashboard/stats" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <BarChart3 size={24} color="#a855f7" />
                <div>
                  <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '500', marginBottom: '4px' }}>
                    Estadísticas
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                    Ver rendimiento detallado
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/players/dashboard/profile" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <User size={24} color="#22c55e" />
                <div>
                  <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '500', marginBottom: '4px' }}>
                    Mi Perfil
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                    Configurar información personal
                  </div>
                </div>
              </div>
            </Link>
            
            <Link href="/players/dashboard/matches" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <BookOpen size={24} color="#ef4444" />
                <div>
                  <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '500', marginBottom: '4px' }}>
                    Historial
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                    Ver partidos jugados
                  </div>
                </div>
              </div>
            </Link>
            
            <button
              onClick={() => window.open('/', '_blank')}
              style={{
                background: 'rgba(107, 114, 128, 0.1)',
                border: '1px solid rgba(107, 114, 128, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <Calendar size={24} color="#6b7280" />
              <div style={{ textAlign: 'left' }}>
                <div style={{ color: '#ffffff', fontSize: '18px', fontWeight: '500', marginBottom: '4px' }}>
                  Reservar Cancha
                </div>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                  Hacer nueva reserva en cualquier club
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          {/* Upcoming Reservations */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                Próximas Reservas
              </h3>
              <Link href="/players/dashboard/reservations" style={{ color: '#60a5fa', fontSize: '14px', textDecoration: 'none' }}>
                Ver todas →
              </Link>
            </div>
            
            {reservations.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reservations.map((reservation) => (
                  <div key={reservation.id} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ color: '#ffffff', fontWeight: '500', fontSize: '16px' }}>
                        {reservation.court?.name || 'Cancha'}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                        {new Date(reservation.scheduled_at).toLocaleDateString()} | {reservation.start_time}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#4ade80', fontWeight: '500' }}>
                        ${reservation.total_price}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                        {reservation.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '12px' }}>
                  No tienes reservas próximas
                </div>
                <button
                  onClick={() => window.open('/', '_blank')}
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    color: '#60a5fa',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Hacer una reserva
                </button>
              </div>
            )}
          </div>

          {/* Available Tournaments */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '600', margin: 0 }}>
                Torneos Disponibles
              </h3>
              <Link href="/players/dashboard/tournaments" style={{ color: '#fb923c', fontSize: '14px', textDecoration: 'none' }}>
                Ver todos →
              </Link>
            </div>
            
            {tournaments.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {tournaments.map((tournament) => (
                  <div key={tournament.id} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{ color: '#ffffff', fontWeight: '500', fontSize: '16px', marginBottom: '4px' }}>
                      {tournament.name}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>
                      Categoría: {tournament.category}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                      Inscripciones hasta: {new Date(tournament.registration_deadline).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '32px' }}>
                <div style={{ color: '#94a3b8', fontSize: '16px' }}>
                  No hay torneos disponibles
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}