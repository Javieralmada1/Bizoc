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
  const [user, setUser] = useState<any>(null)

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
        .select('*')
        .eq('id', user.id)
        .single()

      if (!clubProfile) {
        // No es club, redirigir
        const { data: playerProfile } = await supabase
          .from('player_profiles')
          .select('id')
          .eq('id', user.id)
          .single()
        
        if (playerProfile) {
          router.replace('//clubs/dashboard')
        } else {
          router.replace('/clubs/auth/login')
        }
        return
      }

      setUser(user)
      setProfile(clubProfile)
      await loadStats(clubProfile.id)
      
    } catch (error) {
      console.error('Error checking auth:', error)
      router.replace('/clubs/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadStats(clubId: string) {
    try {
      // Cargar estadísticas del club
      const [courtsRes, reservationsRes, tournamentsRes] = await Promise.all([
        supabase.from('courts').select('*').eq('club_id', clubId),
        supabase.from('reservations').select('*').eq('club_id', clubId).gte('scheduled_at', new Date().toISOString().split('T')[0]),
        supabase.from('tournaments').select('*').eq('club_id', clubId).eq('status', 'active')
      ])

      const courts = courtsRes.data || []
      const todayReservations = reservationsRes.data || []
      const tournaments = tournamentsRes.data || []

      setStats({
        totalCourts: courts.length,
        activeCourts: courts.filter(c => c.is_active).length,
        todayReservations: todayReservations.length,
        monthRevenue: todayReservations.reduce((sum, r) => sum + (r.total_price || 0), 0),
        activeTournaments: tournaments.length
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/clubs')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
        <div className="text-slate-300 text-lg">Cargando dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">🏆</span>
              </div>
              <div>
                <h1 className="text-white text-xl font-semibold">{profile?.name}</h1>
                <p className="text-slate-400 text-sm">Panel de Control</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 text-lg">🏟️</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Canchas</p>
                <p className="text-white text-2xl font-bold">{stats.totalCourts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-green-400 text-lg">✅</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Activas</p>
                <p className="text-white text-2xl font-bold">{stats.activeCourts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-purple-400 text-lg">📅</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Reservas Hoy</p>
                <p className="text-white text-2xl font-bold">{stats.todayReservations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-yellow-400 text-lg">💰</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Ingresos Mes</p>
                <p className="text-white text-2xl font-bold">${stats.monthRevenue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <span className="text-orange-400 text-lg">🏆</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Torneos</p>
                <p className="text-white text-2xl font-bold">{stats.activeTournaments}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/clubs/clubs/dashboard/courts" className="group">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all group-hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🏟️</span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold">Gestionar Canchas</h3>
                  <p className="text-slate-400 text-sm">Agregar, editar y configurar canchas</p>
                </div>
              </div>
              <div className="text-blue-400 text-sm font-medium">
                {stats.totalCourts} canchas registradas →
              </div>
            </div>
          </Link>

          <Link href="/clubs/clubs/dashboard/reservations" className="group">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all group-hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📅</span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold">Reservas</h3>
                  <p className="text-slate-400 text-sm">Ver y gestionar reservas</p>
                </div>
              </div>
              <div className="text-purple-400 text-sm font-medium">
                {stats.todayReservations} para hoy →
              </div>
            </div>
          </Link>

          <Link href="/clubs/clubs/dashboard/tournaments" className="group">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all group-hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🏆</span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold">Torneos</h3>
                  <p className="text-slate-400 text-sm">Crear y gestionar torneos</p>
                </div>
              </div>
              <div className="text-orange-400 text-sm font-medium">
                {stats.activeTournaments} activos →
              </div>
            </div>
          </Link>

          <Link href="/clubs/clubs/dashboard/schedules" className="group">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all group-hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">⏰</span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold">Horarios</h3>
                  <p className="text-slate-400 text-sm">Configurar disponibilidad</p>
                </div>
              </div>
              <div className="text-green-400 text-sm font-medium">
                Gestionar horarios →
              </div>
            </div>
          </Link>

          <Link href="/clubs/clubs/dashboard/cameras" className="group">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all group-hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📹</span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold">Cámaras</h3>
                  <p className="text-slate-400 text-sm">Gestionar sistema de grabación</p>
                </div>
              </div>
              <div className="text-red-400 text-sm font-medium">
                Configurar cámaras →
              </div>
            </div>
          </Link>

          <Link href="/clubs/clubs/dashboard/analytics" className="group">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all group-hover:scale-105">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">📊</span>
                </div>
                <div>
                  <h3 className="text-white text-lg font-semibold">Estadísticas</h3>
                  <p className="text-slate-400 text-sm">Métricas y análisis</p>
                </div>
              </div>
              <div className="text-teal-400 text-sm font-medium">
                Ver reportes →
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}