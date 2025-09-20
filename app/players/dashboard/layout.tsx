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

  const menuItems = [
    {
      href: '/players/dashboard',
      label: 'Dashboard',
      icon: '🏠',
      description: 'Vista general'
    },
    {
      href: '/players/dashboard/profile',
      label: 'Datos',
      icon: '👤',
      description: 'Información personal'
    },
    {
      href: '/players/dashboard/matches',
      label: 'Historial',
      icon: '📋',
      description: 'Partidos jugados'
    },
    {
      href: '/players/dashboard/stats',
      label: 'Estadísticas',
      icon: '📊',
      description: 'Rendimiento detallado'
    },
    {
      href: '/players/dashboard/recategorizations',
      label: 'Recategorizaciones',
      icon: '🔄',
      description: 'Cambios de categoría'
    },
    {
      href: '/players/dashboard/sanctions',
      label: 'Sanciones',
      icon: '⚠️',
      description: 'Historial disciplinario'
    },
    {
      href: '/players/dashboard/fiscal',
      label: 'Fiscales',
      icon: '📋',
      description: 'Registros fiscales'
    },
    {
      href: '/players/dashboard/encounters',
      label: 'Enfrentamientos',
      icon: '⚔️',
      description: 'Historial vs rivales'
    },
    {
      href: '/players/dashboard/reservations',
      label: 'Reservas',
      icon: '📅',
      description: 'Mis reservas'
    },
    {
      href: '/players/dashboard/tournaments',
      label: 'Torneos',
      icon: '🏆',
      description: 'Competencias'
    }
  ]

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

  // Si estamos en la página principal del dashboard, no mostrar sidebar
  if (pathname === '/players/dashboard') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white/5 backdrop-blur-lg border-r border-white/10 flex flex-col">
        {/* Player Header */}
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

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className={`text-xs ${isActive ? 'text-blue-400/80' : 'text-slate-500'}`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Footer */}
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

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}