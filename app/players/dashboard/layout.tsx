'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

// Este layout verifica que el usuario esté autenticado y tenga un perfil de jugador.
export default function PlayerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Redirección CORRECTA a la página de login de jugadores si no hay usuario.
        router.replace('/players/auth/login')
        return
      }

      // 1. Verificación de perfil de jugador 
      const { data: profile } = await supabase
        .from('player_profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile) {
        // Si el usuario existe en Auth pero no en player_profiles, lo mandamos al login de jugadores.
        router.replace('/players/auth/login') 
        return
      }
      
    } catch (error) {
      console.error('Error de autenticación en dashboard:', error)
      router.replace('/players/auth/login')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-300 text-lg">Cargando dashboard de jugador...</div>
      </div>
    )
  }

  // Si pasa la autenticación, renderiza el contenido del dashboard.
  return <>{children}</>
}