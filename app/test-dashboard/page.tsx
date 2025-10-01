'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Calendar, Trophy, TrendingUp, Award, Star, Bell, ChevronDown, Users } from 'lucide-react'

type PlayerProfile = {
  id: string
  first_name: string
  last_name: string
  category: string
  phone: string | null
  province: string | null
  city: string | null
  matches_played: number
  matches_won: number
  email: string
  created_at: string
}

export default function PlayerDashboard() {
  const router = useRouter()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  async function checkAuthAndLoadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.replace('/players/auth/login')
        return
      }

      const { data: playerProfile, error } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error loading profile:', error)
      } else {
        setProfile({
          ...playerProfile,
          email: user.email || '',
          matches_played: playerProfile.matches_played || 39,
          matches_won: playerProfile.matches_won || 32
        })
      }
      
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
        <div className="text-slate-300 text-lg">Cargando dashboard...</div>
      </div>
    )
  }

  const displayName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Jugador' : 'Jugador'
  const winRate = profile ? Math.round((profile.matches_won / profile.matches_played) * 100) || 0 : 0
  const initials = profile ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}` : 'PP'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      
      {/* NAVIGATION BAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-white">BYZQC</h1>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                Inicio
              </Link>
              <Link href="/#reservas" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                Reservar Cancha
              </Link>
              <Link href="/#partidos" className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors">
                Ver Partidos
              </Link>
              <Link href="/torneos" className="px-4 py-2 rounded-lg text-sm font-medium text-blue-400 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                Torneos
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all relative">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">3</span>
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 p-1 hover:bg-white/5 rounded-lg transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">{initials}</span>
                  </div>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl z-50">
                    <div className="p-3 border-b border-slate-700">
                      <p className="text-white font-medium">{displayName}</p>
                      <p className="text-slate-400 text-sm">{profile?.email}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <div className="pt-16">
        
        {/* PLAYER HEADER */}
        <div className="bg-white/5 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{initials}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">{displayName}</h1>
                <p className="text-slate-400 text-lg">
                  Categoría {profile?.category || '7ª'} • {profile?.city || 'Concepción del Uruguay'}, {profile?.province || 'Entre Ríos'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="bg-white/5 backdrop-blur-lg border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-1 overflow-x-auto">
              <div className="px-6 py-4 bg-blue-500/20 text-blue-400 border-b-2 border-blue-400 text-sm font-medium whitespace-nowrap">
                Datos
              </div>
              <Link href="/players/dashboard/matches" className="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 text-sm font-medium whitespace-nowrap transition-colors">
                Historial
              </Link>
              <Link href="/players/dashboard/stats" className="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 text-sm font-medium whitespace-nowrap transition-colors">
                Estadísticas
              </Link>
              <Link href="/players/dashboard/recategorizations" className="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 text-sm font-medium whitespace-nowrap transition-colors">
                Recategorizaciones
              </Link>
              <button className="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 text-sm font-medium whitespace-nowrap transition-colors">
                Sanciones
              </button>
              <button className="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 text-sm font-medium whitespace-nowrap transition-colors">
                Fiscales
              </button>
              <button className="px-6 py-4 text-slate-300 hover:text-white hover:bg-white/5 text-sm font-medium whitespace-nowrap transition-colors">
                Enfrentamientos
              </button>
            </div>
          </div>
        </div>

        {/* DASHBOARD CONTENT */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* STATS GRID */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/8 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <Trophy className="text-blue-400" size={24} />
                </div>
                <span className="text-slate-400 text-xs">Total</span>
              </div>
              <p className="text-white text-3xl font-bold mb-1">{profile?.matches_played || 39}</p>
              <p className="text-slate-400 text-sm">Partidos Jugados</p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/8 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <Award className="text-green-400" size={24} />
                </div>
                <span className="text-slate-400 text-xs">Ganados</span>
              </div>
              <p className="text-white text-3xl font-bold mb-1">{profile?.matches_won || 32}</p>
              <p className="text-slate-400 text-sm">Partidos Ganados</p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/8 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="text-purple-400" size={24} />
                </div>
                <span className="text-slate-400 text-xs">%</span>
              </div>
              <p className="text-white text-3xl font-bold mb-1">{winRate}%</p>
              <p className="text-slate-400 text-sm">Efectividad</p>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 hover:bg-white/8 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                  <Star className="text-yellow-400" size={24} />
                </div>
                <span className="text-slate-400 text-xs">Pts</span>
              </div>
              <p className="text-white text-3xl font-bold mb-1">87</p>
              <p className="text-slate-400 text-sm">Puntos Ranking</p>
            </div>
          </div>

          {/* MAIN CONTENT GRID */}
          <div className="grid lg:grid-cols-2 gap-8">
            
            {/* QUICK ACTIONS */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-white text-xl font-semibold mb-6">Acciones Rápidas</h3>
              <div className="space-y-4">
                
                <Link href="/#reservas" className="block">
                  <div className="flex items-center gap-4 p-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-xl transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-all">
                      <Calendar className="text-blue-400" size={20} />
                    </div>
                    <div>
                      <div className="text-white font-medium">Nueva Reserva</div>
                      <div className="text-blue-400 text-sm">Reservar cancha ahora</div>
                    </div>
                  </div>
                </Link>

                <Link href="/torneos" className="block">
                  <div className="flex items-center gap-4 p-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center group-hover:bg-orange-500/30 transition-all">
                      <Trophy className="text-orange-400" size={20} />
                    </div>
                    <div>
                      <div className="text-white font-medium">Ver Torneos</div>
                      <div className="text-orange-400 text-sm">Inscribirse a competencias</div>
                    </div>
                  </div>
                </Link>

                <Link href="/players/dashboard/stats" className="block">
                  <div className="flex items-center gap-4 p-4 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                      <TrendingUp className="text-purple-400" size={20} />
                    </div>
                    <div>
                      <div className="text-white font-medium">Estadísticas</div>
                      <div className="text-purple-400 text-sm">Ver rendimiento completo</div>
                    </div>
                  </div>
                </Link>

                <button className="w-full">
                  <div className="flex items-center gap-4 p-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl transition-all cursor-pointer group">
                    <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center group-hover:bg-green-500/30 transition-all">
                      <Users className="text-green-400" size={20} />
                    </div>
                    <div className="text-left">
                      <div className="text-white font-medium">Enfrentamientos</div>
                      <div className="text-green-400 text-sm">Historial vs rivales</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* PERSONAL INFO */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white text-xl font-semibold">Información Personal</h3>
                <Link href="/players/dashboard/profile" className="text-blue-400 text-sm hover:text-blue-300 transition-colors">
                  Editar
                </Link>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-slate-400 text-sm">Fecha de nacimiento</span>
                  <span className="text-white font-medium">19/02/1997</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-slate-400 text-sm">País</span>
                  <span className="text-white font-medium">Argentina</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-slate-400 text-sm">Provincia</span>
                  <span className="text-white font-medium">{profile?.province || 'Entre Ríos'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-white/10">
                  <span className="text-slate-400 text-sm">Ciudad</span>
                  <span className="text-white font-medium">{profile?.city || 'Concepción del Uruguay'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-sm">Teléfono</span>
                  <span className="text-white font-medium">{profile?.phone || 'No especificado'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}