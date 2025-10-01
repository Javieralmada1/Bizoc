'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import { Search, Bell, Settings, LogOut, User as UserIcon, Calendar, Trophy, ChevronDown } from 'lucide-react'

interface Profile {
  id: string
  type: 'player' | 'club'
  name: string
  email: string
  avatar_url?: string
}

export default function ModernNav() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    checkUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        checkUser()
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Cerrar dropdowns al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      if (user) {
        // Verificar si es club
        const { data: clubProfile } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', user.id)
          .single()

        if (clubProfile) {
          setProfile({
            id: user.id,
            type: 'club',
            name: clubProfile.name,
            email: user.email || '',
            avatar_url: clubProfile.logo_url
          })
        } else {
          // Verificar si es jugador
          const { data: playerProfile } = await supabase
            .from('players')
            .select('*')
            .eq('id', user.id)
            .single()

          if (playerProfile) {
            const displayName = playerProfile.last_name 
              ? `${playerProfile.first_name} ${playerProfile.last_name}`
              : playerProfile.first_name || user.email?.split('@')[0] || 'Jugador'
            
            setProfile({
              id: user.id,
              type: 'player',
              name: displayName,
              email: user.email || '',
              avatar_url: playerProfile.avatar_url
            })
          }
        }
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
    router.push('/')
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) return null

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo y Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-white">BYZQC</h1>
              <p className="text-xs text-slate-400 -mt-1">Pádel Platform</p>
            </div>
          </Link>

          {/* Navegación Central */}
          <div className="hidden md:flex items-center space-x-1">
            <Link
              href="/torneos"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith('/torneos')
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              🏆 Torneos
            </Link>
            <Link
              href="/reservar"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith('/reservar')
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              📅 Reservar
            </Link>
            <Link
              href="/partidos"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname.startsWith('/partidos')
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              🎾 Ver Partidos
            </Link>
          </div>

          {/* Acciones del Usuario */}
          <div className="flex items-center gap-3">
            
            {!user ? (
              // Usuario no autenticado
              <div className="flex items-center gap-2">
                <Link
                  href="/clubs"
                  className="px-4 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/30 rounded-lg hover:bg-blue-500/20 transition-all"
                >
                  Soy Club
                </Link>
                <Link
                  href="/players"
                  className="px-4 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/20 transition-all"
                >
                  Soy Jugador
                </Link>
              </div>
            ) : (
              // Usuario autenticado
              <div className="flex items-center gap-3">
                
                {/* Botón de cambio de contexto */}
                {profile?.type === 'player' ? (
                  <Link
                    href="/clubs"
                    className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 transition-all"
                  >
                    <span className="text-xs">🏢</span>
                    Cambiar a Club
                  </Link>
                ) : (
                  <Link
                    href="/players"
                    className="hidden sm:flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-all"
                  >
                    <span className="text-xs">🎾</span>
                    Cambiar a Jugador
                  </Link>
                )}

                {/* Notificaciones */}
                <div ref={notificationRef} className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all relative"
                  >
                    <Bell size={20} />
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      3
                    </span>
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-slate-800/90 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      <div className="p-4 border-b border-white/10">
                        <h3 className="text-white font-semibold">Notificaciones</h3>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        <div className="p-3 hover:bg-white/5 border-b border-white/5">
                          <p className="text-white text-sm">Nuevo partido disponible</p>
                          <p className="text-slate-400 text-xs mt-1">Hace 2 horas</p>
                        </div>
                        <div className="p-3 hover:bg-white/5 border-b border-white/5">
                          <p className="text-white text-sm">Reserva confirmada</p>
                          <p className="text-slate-400 text-xs mt-1">Hace 4 horas</p>
                        </div>
                        <div className="p-3 hover:bg-white/5">
                          <p className="text-white text-sm">Torneo inscripto</p>
                          <p className="text-slate-400 text-xs mt-1">Hace 1 día</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Menú de usuario */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 p-1 hover:bg-white/5 rounded-lg transition-all"
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {getInitials(profile?.name || 'User')}
                        </span>
                      </div>
                    )}
                    <ChevronDown size={16} className="text-slate-400" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-800/90 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                      
                      {/* Header del usuario */}
                      <div className="p-4 border-b border-white/10">
                        <div className="flex items-center gap-3">
                          {profile?.avatar_url ? (
                            <img
                              src={profile.avatar_url}
                              alt={profile.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {getInitials(profile?.name || 'User')}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-white font-medium text-sm">{profile?.name}</p>
                            <p className="text-slate-400 text-xs">{profile?.email}</p>
                            <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                              profile?.type === 'club' 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}>
                              {profile?.type === 'club' ? 'Club' : 'Jugador'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menú de opciones */}
                      <div className="py-2">
                        <Link
                          href={profile?.type === 'club' ? '/clubs/dashboard' : '/players/dashboard'}
                          className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <UserIcon size={16} />
                          Mi Perfil
                        </Link>
                        
                        {profile?.type === 'player' && (
                          <>
                            <Link
                              href="/players/dashboard/reservations"
                              className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                            >
                              <Calendar size={16} />
                              Mis Reservas
                            </Link>
                            <Link
                              href="/players/dashboard/tournaments"
                              className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                            >
                              <Trophy size={16} />
                              Mis Torneos
                            </Link>
                          </>
                        )}

                        <Link
                          href="/settings"
                          className="flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                        >
                          <Settings size={16} />
                          Configuración
                        </Link>
                        
                        <hr className="my-2 border-white/10" />
                        
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 px-4 py-2 w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all"
                        >
                          <LogOut size={16} />
                          Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}