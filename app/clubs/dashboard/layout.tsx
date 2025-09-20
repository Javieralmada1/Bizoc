'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ClubDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [clubName, setClubName] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.replace('/clubs/auth/login')
        return
      }

      // Verificar que es un club
      const { data: clubProfile } = await supabase
        .from('club_profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      if (!clubProfile) {
        router.replace('/clubs/auth/login')
        return
      }

      setClubName(clubProfile.name || 'Mi Club')
      
    } catch (error) {
      console.error('Error checking auth:', error)
      router.replace('/clubs/auth/login')
    } finally {
      setLoading(false)
    }
  }

  const menuItems = [
    {
      href: '/clubs/clubs/dashboard',
      label: 'Dashboard',
      icon: '📊',
      description: 'Resumen general'
    },
    {
      href: '/clubs/clubs/dashboard/courts',
      label: 'Canchas',
      icon: '🏟️',
      description: 'Gestionar canchas'
    },
    {
      href: '/clubs/clubs/dashboard/reservations',
      label: 'Reservas',
      icon: '📅',
      description: 'Ver reservas'
    },
    {
      href: '/clubs/clubs/dashboard/tournaments',
      label: 'Torneos',
      icon: '🏆',
      description: 'Gestionar torneos'
    },
    {
      href: '/clubs/clubs/dashboard/schedules',
      label: 'Horarios',
      icon: '⏰',
      description: 'Configurar horarios'
    },
    {
      href: '/clubs/clubs/dashboard/cameras',
      label: 'Cámaras',
      icon: '📹',
      description: 'Sistema de grabación'
    },
    {
      href: '/clubs/clubs/dashboard/analytics',
      label: 'Estadísticas',
      icon: '📊',
      description: 'Métricas y reportes'
    },
    {
      href: '/clubs/clubs/dashboard/settings',
      label: 'Configuración',
      icon: '⚙️',
      description: 'Ajustes del club'
    }
  ]

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/clubs')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
        <div className="text-slate-300 text-lg">Cargando...</div>
      </div>
    )
  }

  // Si estamos en la página principal del dashboard, no mostrar sidebar
  if (pathname === '/clubs/clubs/dashboard') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex">
      {/* Sidebar */}
      <div className="w-80 bg-white/5 backdrop-blur-lg border-r border-white/10 flex flex-col">
        {/* Club Header */}
        <div className="p-6 border-b border-white/10">
          <Link href="/clubs/clubs/dashboard" className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🏆</span>
            </div>
            <div>
              <h2 className="text-white text-lg font-semibold">{clubName}</h2>
              <p className="text-slate-400 text-sm">Panel de Control</p>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {menuItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div>
                    <div className="font-medium text-sm">{item.label}</div>
                    <div className={`text-xs ${isActive ? 'text-emerald-400/80' : 'text-slate-500'}`}>
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