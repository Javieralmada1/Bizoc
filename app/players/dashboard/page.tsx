'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

type ClubProfile = {
  id: string
  name: string
  email: string
  province: string | null
  city: string | null
  address: string | null
  phone: string | null
  created_at: string
}

type DashboardStats = {
  totalCourts: number
  activeCourts: number
  todayReservations: number
  monthRevenue: number
  activeTournaments: number
}

export default function ClubDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<ClubProfile | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalCourts: 0,
    activeCourts: 0,
    todayReservations: 0,
    monthRevenue: 0,
    activeTournaments: 0
  })
  const [loading, setLoading] = useState(true)

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

      const { data: clubProfile } = await supabase
        .from('club_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!clubProfile) {
        router.replace('/clubs/auth/login')
        return
      }

      setProfile(clubProfile)
      await loadStats(clubProfile.id)
      
    } catch (error) {
      console.error('Error:', error)
      router.replace('/clubs/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadStats(clubId: string) {
    try {
      const [courtsRes, reservationsRes, tournamentsRes] = await Promise.all([
        supabase.from('courts').select('*').eq('club_id', clubId),
        supabase.from('reservations').select('*').eq('club_id', clubId),
        supabase.from('tournaments').select('*').eq('club_id', clubId)
      ])

      const courts = courtsRes.data || []
      const reservations = reservationsRes.data || []
      const tournaments = tournamentsRes.data || []

      const today = new Date().toISOString().split('T')[0]
      const todayReservations = reservations.filter(r => 
        r.date?.startsWith(today)
      ).length

      const activeTournaments = tournaments.filter(t => 
        t.status === 'active' || t.status === 'registration'
      ).length

      setStats({
        totalCourts: courts.length,
        activeCourts: courts.filter(c => c.is_active).length,
        todayReservations,
        monthRevenue: 0,
        activeTournaments
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-slate-300 text-lg">Cargando...</div>
      </div>
    )
  }

  const quickActions = [
    {
      href: '/clubs/dashboard/courts',
      icon: '🏟️',
      title: 'Gestionar Canchas',
      description: 'Agregar, editar y configurar tus canchas',
      stat: `${stats.totalCourts} canchas registradas`,
      color: 'purple'
    },
    {
      href: '/clubs/dashboard/reservations',
      icon: '📅',
      title: 'Ver Reservas',
      description: 'Gestiona las reservas de tus canchas',
      stat: `${stats.todayReservations} reservas hoy`,
      color: 'blue'
    },
    {
      href: '/clubs/dashboard/tournaments',
      icon: '🏆',
      title: 'Gestionar Torneos',
      description: 'Crea y administra torneos',
      stat: `${stats.activeTournaments} torneos activos`,
      color: 'orange'
    },
    {
      href: '/clubs/dashboard/cameras',
      icon: '📹',
      title: 'Sistema de Cámaras',
      description: 'Grabación automática de partidos',
      stat: 'Configurar sistema',
      color: 'red'
    },
    {
      href: '/clubs/dashboard/schedules',
      icon: '⏰',
      title: 'Configurar Horarios',
      description: 'Define la disponibilidad de canchas',
      stat: 'Gestionar horarios',
      color: 'emerald'
    },
    {
      href: '/clubs/dashboard/settings',
      icon: '⚙️',
      title: 'Configuración',
      description: 'Ajustes generales del club',
      stat: 'Personalizar',
      color: 'slate'
    }
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string, text: string, border: string }> = {
      purple: { bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/30' },
      blue: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/30' },
      orange: { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/30' },
      red: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
      emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
      slate: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' }
    }
    return colors[color] || colors.slate
  }

  return (
    <div className="space-y-8">
      {/* Ficha del club */}
      <div className="card">
        <div className="flex items-center gap-4 mb-2">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}
          >
            <span className="text-white text-2xl font-bold">
              {profile?.name?.charAt(0).toUpperCase() || 'C'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{profile?.name || 'Mi Club'}</h1>
            <p className="text-slate-300">
              {profile?.city}{profile?.city && profile?.province && ', '}{profile?.province}
            </p>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-3xl font-bold text-white mb-2">{stats.totalCourts}</div>
          <div className="text-sm text-slate-300">Canchas Totales</div>
          <div className="mt-3 text-xs text-emerald-300 font-medium">
            {stats.activeCourts} activas
          </div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-white mb-2">{stats.todayReservations}</div>
          <div className="text-sm text-slate-300">Reservas Hoy</div>
          <div className="mt-3 text-xs text-purple-300 font-medium">Programadas</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-white mb-2">${stats.monthRevenue}</div>
          <div className="text-sm text-slate-300">Ingresos Mes</div>
          <div className="mt-3 text-xs text-blue-300 font-medium">Período actual</div>
        </div>
        <div className="card">
          <div className="text-3xl font-bold text-white mb-2">{stats.activeTournaments}</div>
          <div className="text-sm text-slate-300">Torneos Activos</div>
          <div className="mt-3 text-xs text-orange-300 font-medium">En progreso</div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div>
        <h2 className="text-xl font-bold text-white mb-6">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => {
            const colors = getColorClasses(action.color)
            return (
              <Link key={action.href} href={action.href}>
                <div className="card hover:scale-[1.02] transition-transform cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-14 h-14 ${colors.bg} rounded-2xl flex items-center justify-center`}>
                      <span className="text-3xl">{action.icon}</span>
                    </div>
                    <span className={colors.text}>→</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{action.title}</h3>
                  <p className="text-sm text-slate-300 mb-4">{action.description}</p>
                  <div className={`text-sm font-semibold ${colors.text}`}>
                    {action.stat}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Primeros Pasos */}
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4">Primeros Pasos</h3>
        <p className="text-slate-300 mb-6">
          Completa estos pasos para comenzar a usar Byzoc al máximo
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            'Agrega tus canchas',
            'Configura los horarios',
            'Conecta las cámaras',
            'Recibe reservas'
          ].map((step, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">{index + 1}</span>
              </div>
              <span className="text-slate-300 font-medium">{step}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}