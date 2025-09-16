'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import ReservationSystem from '@/components/ReservationSystem'

export default function PlayerReservationsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    console.log('Cargando datos del usuario...')
    
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.log('No hay usuario logueado')
      router.replace('/player')
      return
    }
    
    console.log('Usuario encontrado:', user.email)
    setUser(user)

    // Verificar que sea jugador
    const { data: playerProfile } = await supabase
      .from('player_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('Perfil del jugador:', playerProfile)

    if (!playerProfile) {
      console.log('No es un jugador válido')
      router.replace('/player')
      return
    }

    setProfile(playerProfile)
    setLoading(false)
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
        Cargando sistema de reservas...
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #16a085 25%, #0f172a 75%, #16a085 100%)'
    }}>
      {/* Header con botón volver */}
      <div style={{
        position: 'fixed',
        top: '20px',
        left: '20px',
        zIndex: 1000
      }}>
        <button
          onClick={() => router.push('/player/dashboard')}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            padding: '12px 20px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'
            e.currentTarget.style.transform = 'translateY(0px)'
          }}
        >
          ← Volver al Dashboard
        </button>
      </div>

      {/* Información del usuario en la esquina superior derecha */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 1000
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          padding: '12px 16px',
          borderRadius: '12px',
          color: 'white',
          fontSize: '14px'
        }}>
          <div style={{ fontWeight: '600' }}>
            {profile?.first_name} {profile?.last_name}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
            Categoría {profile?.category}
          </div>
        </div>
      </div>

      {/* Sistema de reservas existente */}
      <div style={{ paddingTop: '80px' }}>
        <ReservationSystem />
      </div>
    </div>
  )
}