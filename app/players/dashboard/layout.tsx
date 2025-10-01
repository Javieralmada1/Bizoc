'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function PlayerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [playerName, setPlayerName] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.replace('/players/auth/login')
        return
      }

      // Verificar que es un jugador
      const { data: playerProfile } = await supabase
        .from('player_profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      if (!playerProfile) {
        router.replace('/players/auth/login')
        return
      }

      const displayName = playerProfile.first_name && playerProfile.last_name 
        ? `${playerProfile.first_name} ${playerProfile.last_name}`
        : playerProfile.first_name || 'Jugador'
      
      setPlayerName(displayName)
      
    } catch (error) {
      console.error('Error checking auth:', error)
      router.replace('/players/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/players')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-slate-300 text-lg">Cargando...</div>
      </div>
    )
  }

  // IMPORTANTE: Para la página principal del dashboard, devolver solo children
  if (pathname === '/players/dashboard') {
    return <>{children}</>
  }

  // Para otras páginas del dashboard, mostrar sidebar
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex">
      {/* Sidebar solo para sub-páginas */}
      <div className="w-80 bg-white/5 backdrop-blur-lg border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <Link href="/players/dashboard" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎾</span>
            </div>
            <div>
              <h2 className="text-white text-lg font-semibold">{playerName}</h2>
              <p className="text-slate-400 text-sm">Panel de Jugador</p>
            </div>
          </Link>
        </div>
        
        <div className="flex-1 p-4">
          <div className="space-y-2">
            <Link href="/players/dashboard" className="flex items-center gap-3 p-3 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white">
              <span className="text-lg">🏠</span>
              <span className="font-medium text-sm">Dashboard</span>
            </Link>
            <Link href="/players/dashboard/profile" className="flex items-center gap-3 p-3 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white">
              <span className="text-lg">👤</span>
              <span className="font-medium text-sm">Datos</span>
            </Link>
            <Link href="/players/dashboard/matches" className="flex items-center gap-3 p-3 rounded-lg text-slate-300 hover:bg-white/5 hover:text-white">
              <span className="text-lg">📋</span>
              <span className="font-medium text-sm">Historial</span>
            </Link>
          </div>
        </div>
        
        <div className="p-4 border-t border-white/10">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full p-3 text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
          >
            <span className="text-lg">🚪</span>
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}