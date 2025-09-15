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

export default function PlayerDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

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
              {profile?.category}
            </div>
            <div style={{ color: '#e5e7eb', fontSize: '14px' }}>Categoría Actual</div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px'
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