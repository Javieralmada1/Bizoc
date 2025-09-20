'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

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
        loadProfile()
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

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/players')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-slate-300 text-lg">Cargando dashboard...</div>
      </div>
    )
  }

  const winRate = profile?.matches_played ? 
    Math.round((profile.matches_won / profile.matches_played) * 100) : 0

  const displayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.first_name || 'Jugador'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-xl font-bold">🎾</span>
              </div>
              <div>
                <h1 className="text-white text-xl font-semibold">¡Hola, {displayName}!</h1>
                <p className="text-slate-400 text-sm">Categoría {profile?.category}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <span className="text-green-400 text-lg">📅</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Reservas Totales</p>
                <p className="text-white text-2xl font-bold">0</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="text-blue-400 text-lg">🎾</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Partidos Jugados</p>
                <p className="text-white text-2xl font-bold">{profile?.matches_played || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <span className="text-yellow-400 text-lg">🏆</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Partidos Ganados</p>
                <p className="text-white text-2xl font-bold">{profile?.matches_won || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <span className="text-purple-400 text-lg">📊</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Efectividad</p>
                <p className="text-white text-2xl font-bold">{winRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 mb-8">
          <div className="flex flex-wrap border-b border-white/10">
            <Link href="/players/dashboard/profile" className="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              Datos
            </Link>
            <Link href="/players/dashboard/matches" className="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              Historial
            </Link>
            <Link href="/players/dashboard/stats" className="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors border-b-2 border-blue-500 text-blue-400">
              Estadísticas
            </Link>
            <Link href="/players/dashboard/recategorizations" className="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              Recategorizaciones
            </Link>
            <Link href="/players/dashboard/sanctions" className="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              Sanciones
            </Link>
            <Link href="/players/dashboard/fiscal" className="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              Fiscales
            </Link>
            <Link href="/players/dashboard/encounters" className="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
              Enfrentamientos
            </Link>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-white text-lg font-semibold mb-4">Acciones Rápidas</h3>
              <div className="space-y-3">
                <Link href="/players/dashboard/reservations/new" className="block">
                  <div className="flex items-center gap-3 p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-all group">
                    <span className="text-blue-400 text-lg">📅</span>
                    <div>
                      <div className="text-white font-medium text-sm">Nueva Reserva</div>
                      <div className="text-blue-400 text-xs">Reservar cancha</div>
                    </div>
                  </div>
                </Link>

                <Link href="/players/dashboard/tournaments" className="block">
                  <div className="flex items-center gap-3 p-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg transition-all group">
                    <span className="text-orange-400 text-lg">🏆</span>
                    <div>
                      <div className="text-white font-medium text-sm">Ver Torneos</div>
                      <div className="text-orange-400 text-xs">Inscribirse</div>
                    </div>
                  </div>
                </Link>

                <Link href="/players/dashboard/profile" className="block">
                  <div className="flex items-center gap-3 p-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-lg transition-all group">
                    <span className="text-green-400 text-lg">👤</span>
                    <div>
                      <div className="text-white font-medium text-sm">Mi Perfil</div>
                      <div className="text-green-400 text-xs">Editar datos</div>
                    </div>
                  </div>
                </Link>

                <Link href="/players/dashboard/stats" className="block">
                  <div className="flex items-center gap-3 p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg transition-all group">
                    <span className="text-purple-400 text-lg">📊</span>
                    <div>
                      <div className="text-white font-medium text-sm">Estadísticas</div>
                      <div className="text-purple-400 text-xs">Ver historial</div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Player Info */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-white text-lg font-semibold mb-4">Mi información</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </div>
                <div>
                  <div className="text-white font-medium">{displayName}</div>
                  <div className="text-slate-400 text-sm">Categoría {profile?.category}</div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                {profile?.city && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ciudad:</span>
                    <span className="text-white">{profile.city}</span>
                  </div>
                )}
                {profile?.province && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Provincia:</span>
                    <span className="text-white">{profile.province}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Miembro desde:</span>
                  <span className="text-white">
                    {new Date(profile?.created_at || '').getFullYear()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Reservations */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Próximas Reservas</h3>
                <Link href="/players/dashboard/reservations" className="text-blue-400 text-sm hover:text-blue-300">
                  Ver todas →
                </Link>
              </div>
              
              <div className="text-center py-8">
                <div className="text-slate-400 text-sm">No tienes reservas próximas</div>
                <Link href="/players/dashboard/reservations/new" className="text-blue-400 text-sm hover:text-blue-300 mt-2 inline-block">
                  Hacer una reserva →
                </Link>
              </div>
            </div>

            {/* Available Tournaments */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-lg font-semibold">Torneos Disponibles</h3>
                <Link href="/players/dashboard/tournaments" className="text-orange-400 text-sm hover:text-orange-300">
                  Ver todos →
                </Link>
              </div>
              
              <div className="text-center py-8">
                <div className="text-slate-400 text-sm">No hay torneos disponibles</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}