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

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/clubs/auth/login')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-slate-300 text-lg">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Ficha del club */}
      <div className="card">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
            <span className="text-white text-2xl font-bold">
              {profile?.name?.charAt(0).toUpperCase() || 'C'}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{profile?.name || 'Mi Club'}</h1>
            <p className="text-slate-300">{profile?.city}, {profile?.province}</p>
          </div>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link href="/clubs/dashboard/courts">
            <div className="card hover:scale-[1.02] transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">🏟️</span>
                </div>
                <span className="text-purple-300">→</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Gestionar Canchas</h3>
              <p className="text-sm text-slate-300 mb-4">Agregar, editar y configurar tus canchas</p>
              <div className="text-sm font-semibold text-purple-300">
                {stats.totalCourts} canchas registradas
              </div>
            </div>
          </Link>

          <Link href="/clubs/dashboard/reservations">
            <div className="card hover:scale-[1.02] transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">📅</span>
                </div>
                <span className="text-blue-300">→</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ver Reservas</h3>
              <p className="text-sm text-slate-300 mb-4">Gestiona las reservas de tus canchas</p>
              <div className="text-sm font-semibold text-blue-300">
                {stats.todayReservations} reservas hoy
              </div>
            </div>
          </Link>

          <Link href="/clubs/dashboard/tournaments">
            <div className="card hover:scale-[1.02] transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">🏆</span>
                </div>
                <span className="text-orange-300">→</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Gestionar Torneos</h3>
              <p className="text-sm text-slate-300 mb-4">Crea y administra torneos</p>
              <div className="text-sm font-semibold text-orange-300">
                {stats.activeTournaments} torneos activos
              </div>
            </div>
          </Link>

          <Link href="/clubs/dashboard/cameras">
            <div className="card hover:scale-[1.02] transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">📹</span>
                </div>
                <span className="text-red-300">→</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Sistema de Cámaras</h3>
              <p className="text-sm text-slate-300 mb-4">Grabación automática de partidos</p>
              <div className="text-sm font-semibold text-red-300">
                Configurar sistema
              </div>
            </div>
          </Link>

          <Link href="/clubs/dashboard/schedules">
            <div className="card hover:scale-[1.02] transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">⏰</span>
                </div>
                <span className="text-emerald-300">→</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Configurar Horarios</h3>
              <p className="text-sm text-slate-300 mb-4">Define la disponibilidad de canchas</p>
              <div className="text-sm font-semibold text-emerald-300">
                Gestionar horarios
              </div>
            </div>
          </Link>

          <Link href="/clubs/dashboard/settings">
            <div className="card hover:scale-[1.02] transition-transform">
              <div className="flex items-start justify-between mb-4">
                <div className="w-14 h-14 bg-slate-500/20 rounded-2xl flex items-center justify-center">
                  <span className="text-3xl">⚙️</span>
                </div>
                <span className="text-slate-300">→</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Configuración</h3>
              <p className="text-sm text-slate-300 mb-4">Ajustes generales del club</p>
              <div className="text-sm font-semibold text-slate-300">
                Personalizar
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Primeros Pasos */}
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4">
          Primeros Pasos
        </h3>
        <p className="text-slate-300 mb-6">
          Completa estos pasos para comenzar a usar Bizoc al máximo
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">1</span>
            </div>
            <span className="text-slate-300 font-medium">Agrega tus canchas</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">2</span>
            </div>
            <span className="text-slate-300 font-medium">Configura los horarios</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">3</span>
            </div>
            <span className="text-slate-300 font-medium">Conecta las cámaras</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">4</span>
            </div>
            <span className="text-slate-300 font-medium">Recibe reservas</span>
          </div>
        </div>
      </div>
    </div>
  )
}
