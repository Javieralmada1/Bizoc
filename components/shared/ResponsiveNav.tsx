'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Menu, X, User, LogOut, Settings, Calendar, Trophy } from 'lucide-react'

interface Profile {
  id: string
  type: 'club' | 'player'
  name: string
  email: string
  avatar_url?: string
}

export default function ResponsiveNav() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        checkUser()
      } else {
        setUser(null)
        setProfile(null)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  // Cerrar menús al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cerrar menú mobile al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        
        // Check club profile
        const { data: clubProfile } = await supabase
          .from('club_profiles')
          .select('name, avatar_url')
          .eq('id', user.id)
          .single()

        if (clubProfile) {
          setProfile({
            id: user.id,
            type: 'club',
            name: clubProfile.name || 'Mi Club',
            email: user.email || '',
            avatar_url: clubProfile.avatar_url
          })
        } else {
          // Check player profile
          const { data: playerProfile } = await supabase
            .from('player_profiles')
            .select('first_name, last_name, avatar_url')
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
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
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

  const navigationItems = [
    { label: 'Inicio', href: '/', show: true },
    { label: '🏆 Torneos', href: '/torneos', show: true },
    { label: 'Reservar', href: '/reservas', show: !user },
    { label: 'Partidos', href: '/partidos', show: !user },
  ]

  const userMenuItems = profile?.type === 'club' 
    ? [
        { label: 'Dashboard', icon: Settings, href: '/clubs/dashboard' },
        { label: 'Mi Club', icon: User, href: '/clubs/dashboard#club' },
        { label: 'Configuración', icon: Settings, href: '/clubs/dashboard/settings' },
      ]
    : [
        { label: 'Mi Perfil', icon: User, href: '/players/dashboard' },
        { label: 'Mis Reservas', icon: Calendar, href: '/players/dashboard/reservations' },
        { label: 'Mis Torneos', icon: Trophy, href: '/players/dashboard/tournaments' },
      ]

  if (loading) return null

  return (
    <nav className="byzoc-nav">
      <div className="byzoc-nav-container">
        {/* Logo/Brand */}
        <a href="/" className="byzoc-brand">
          <div className="byzoc-brand-icon">B</div>
          <div>
            <div className="byzoc-brand-text">Byzoc</div>
            <div className="byzoc-brand-subtitle">Tu cancha, tu momento</div>
          </div>
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex byzoc-nav-menu">
          {navigationItems.filter(item => item.show).map((item) => (
            <a 
              key={item.href} 
              href={item.href}
              className={`byzoc-nav-item ${pathname === item.href ? 'active' : ''}`}
            >
              {item.label}
            </a>
          ))}

          {!user ? (
            <>
              <button 
                onClick={() => router.push('/clubs/auth/login')}
                className="byzoc-nav-item admin"
              >
                Soy Club
              </button>
              <button 
                onClick={() => router.push('/players/auth/login')}
                className="byzoc-nav-item active"
              >
                Soy Jugador
              </button>
            </>
          ) : (
            <>
              {profile?.type === 'player' && (
                <button 
                  onClick={() => router.push('/clubs/auth/login')}
                  className="byzoc-nav-item admin"
                >
                  Cambiar a Club
                </button>
              )}
              {profile?.type === 'club' && (
                <button 
                  onClick={() => router.push('/players/auth/login')}
                  className="byzoc-nav-item"
                  style={{
                    background: 'rgba(22, 160, 133, 0.1)',
                    border: '1px solid rgba(22, 160, 133, 0.3)',
                    color: '#16a085'
                  }}
                >
                  Cambiar a Jugador
                </button>
              )}
              
              {/* User Menu Desktop */}
              <div ref={userMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: profile?.avatar_url 
                      ? `url(${profile.avatar_url}) center/cover`
                      : 'linear-gradient(135deg, #16a085, #3b82f6)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}
                >
                  {!profile?.avatar_url && getInitials(profile?.name || 'U')}
                </button>

                {userMenuOpen && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    minWidth: '220px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    zIndex: 1000,
                    overflow: 'hidden'
                  }}>
                    {/* User Info */}
                    <div style={{
                      padding: '16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: profile?.avatar_url 
                            ? `url(${profile.avatar_url}) center/cover`
                            : 'linear-gradient(135deg, #16a085, #3b82f6)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: '600',
                          fontSize: '14px'
                        }}>
                          {!profile?.avatar_url && getInitials(profile?.name || 'U')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '14px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {profile?.name}
                          </div>
                          <div style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: '500',
                            marginTop: '4px',
                            background: profile?.type === 'club' 
                              ? 'rgba(59, 130, 246, 0.2)' 
                              : 'rgba(22, 160, 133, 0.2)',
                            color: profile?.type === 'club' ? '#60a5fa' : '#16a085'
                          }}>
                            {profile?.type === 'club' ? 'Club' : 'Jugador'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div style={{ padding: '8px 0' }}>
                      {userMenuItems.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            color: '#cbd5e1',
                            textDecoration: 'none',
                            fontSize: '14px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                            e.currentTarget.style.color = 'white'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent'
                            e.currentTarget.style.color = '#cbd5e1'
                          }}
                        >
                          <item.icon size={16} />
                          {item.label}
                        </a>
                      ))}
                      
                      <hr style={{
                        margin: '8px 0',
                        border: 'none',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                      }} />
                      
                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          width: '100%',
                          padding: '12px 16px',
                          background: 'none',
                          border: 'none',
                          color: '#f87171',
                          fontSize: '14px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                          e.currentTarget.style.color = '#fca5a5'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'none'
                          e.currentTarget.style.color = '#f87171'
                        }}
                      >
                        <LogOut size={16} />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'rgba(15, 23, 42, 0.98)',
            backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            maxHeight: 'calc(100vh - 60px)',
            overflowY: 'auto',
            zIndex: 999
          }}
        >
          {/* User Info Mobile */}
          {user && profile && (
            <div style={{
              padding: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: profile.avatar_url 
                  ? `url(${profile.avatar_url}) center/cover`
                  : 'linear-gradient(135deg, #16a085, #3b82f6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: '600',
                fontSize: '16px'
              }}>
                {!profile.avatar_url && getInitials(profile.name)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontWeight: '600', fontSize: '16px' }}>
                  {profile.name}
                </div>
                <div style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500',
                  marginTop: '4px',
                  background: profile.type === 'club' 
                    ? 'rgba(59, 130, 246, 0.2)' 
                    : 'rgba(22, 160, 133, 0.2)',
                  color: profile.type === 'club' ? '#60a5fa' : '#16a085'
                }}>
                  {profile.type === 'club' ? 'Club' : 'Jugador'}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div style={{ padding: '8px 0' }}>
            {navigationItems.filter(item => item.show).map((item) => (
              <a
                key={item.href}
                href={item.href}
                style={{
                  display: 'block',
                  padding: '14px 16px',
                  color: pathname === item.href ? '#16a085' : '#cbd5e1',
                  background: pathname === item.href ? 'rgba(22, 160, 133, 0.1)' : 'transparent',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: pathname === item.href ? '600' : '400',
                  borderLeft: pathname === item.href ? '3px solid #16a085' : '3px solid transparent'
                }}
              >
                {item.label}
              </a>
            ))}

            {!user && (
              <>
                <hr style={{
                  margin: '8px 0',
                  border: 'none',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }} />
                
                <a
                  href="/clubs/auth/login"
                  style={{
                    display: 'block',
                    padding: '14px 16px',
                    margin: '8px 16px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                    color: '#60a5fa',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}
                >
                  Soy Club
                </a>
                
                <a
                  href="/players/auth/login"
                  style={{
                    display: 'block',
                    padding: '14px 16px',
                    margin: '8px 16px',
                    background: 'rgba(22, 160, 133, 0.1)',
                    border: '1px solid rgba(22, 160, 133, 0.3)',
                    borderRadius: '8px',
                    color: '#16a085',
                    textDecoration: 'none',
                    fontSize: '15px',
                    fontWeight: '600',
                    textAlign: 'center'
                  }}
                >
                  Soy Jugador
                </a>
              </>
            )}

            {user && profile && (
              <>
                <hr style={{
                  margin: '8px 0',
                  border: 'none',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }} />
                
                {userMenuItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '14px 16px',
                      color: '#cbd5e1',
                      textDecoration: 'none',
                      fontSize: '15px'
                    }}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </a>
                ))}

                {profile.type === 'player' && (
                  <a
                    href="/clubs/auth/login"
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      margin: '8px 16px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      color: '#60a5fa',
                      textDecoration: 'none',
                      fontSize: '14px',
                      textAlign: 'center'
                    }}
                  >
                    Cambiar a Club
                  </a>
                )}
                
                {profile.type === 'club' && (
                  <a
                    href="/players/auth/login"
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      margin: '8px 16px',
                      background: 'rgba(22, 160, 133, 0.1)',
                      border: '1px solid rgba(22, 160, 133, 0.3)',
                      borderRadius: '8px',
                      color: '#16a085',
                      textDecoration: 'none',
                      fontSize: '14px',
                      textAlign: 'center'
                    }}
                  >
                    Cambiar a Jugador
                  </a>
                )}
                
                <hr style={{
                  margin: '8px 0',
                  border: 'none',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
                }} />
                
                <button
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    width: 'calc(100% - 32px)',
                    margin: '8px 16px',
                    padding: '14px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#f87171',
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <LogOut size={18} />
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}