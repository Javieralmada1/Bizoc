// components/AuthHeader.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { User, LogOut, Settings, LayoutDashboard, Calendar, Trophy, UserCircle } from 'lucide-react'

type UserProfile = {
  id: string
  type: 'club' | 'player'
  name: string
  email: string
  avatar_url?: string
}

export default function AuthHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
    
    // Click outside handler
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function checkUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUser(user)
        
        // Check if club
        const { data: clubProfile } = await supabase
          .from('club_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (clubProfile) {
          setProfile({
            id: user.id,
            type: 'club',
            name: clubProfile.name || user.email?.split('@')[0] || 'Club',
            email: user.email || '',
            avatar_url: clubProfile.avatar_url
          })
        } else {
          // Check if player
          const { data: playerProfile } = await supabase
            .from('player_profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (playerProfile) {
            const displayName = playerProfile.first_name && playerProfile.last_name
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

  const menuItems = profile?.type === 'club' 
    ? [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/clubs/dashboard' },
        { label: 'Mi Club', icon: UserCircle, href: '/clubs/dashboard#club' },
        { label: 'Configuración', icon: Settings, href: '/clubs/dashboard/settings' },
      ]
    : [
        { label: 'Mi Perfil', icon: UserCircle, href: '/player/clubs/dashboard' },
        { label: 'Mis Reservas', icon: Calendar, href: '/player/clubs/dashboard/reservas' },
        { label: 'Mis Torneos', icon: Trophy, href: '/player/clubs/dashboard/torneos' },
        { label: 'Configuración', icon: Settings, href: '/player/settings' },
      ]

  if (loading) return null

  return (
    <nav className="byzoc-nav">
      <div className="byzoc-nav-container">
        <div className="byzoc-brand">
          <div className="byzoc-brand-icon">B</div>
          <div>
            <div className="byzoc-brand-text">Bizoc</div>
            <div className="byzoc-brand-subtitle">Highlights al instante</div>
          </div>
        </div>

        <div className="byzoc-nav-menu">
          <a href="/torneos" className="byzoc-nav-item">
            🏆 Torneos
          </a>
          
          {!user ? (
            <>
              <button 
                onClick={() => router.push('/club')}
                className="byzoc-nav-item admin"
              >
                Soy Club
              </button>
              <button 
                onClick={() => router.push('/players')}
                className="byzoc-nav-item active"
              >
                Soy Jugador
              </button>
            </>
          ) : (
            <>
              {profile?.type === 'player' && (
                <button 
                  onClick={() => router.push('/club')}
                  className="byzoc-nav-item"
                  style={{ 
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#60a5fa'
                  }}
                >
                  Cambiar a Club
                </button>
              )}
              {profile?.type === 'club' && (
                <button 
                  onClick={() => router.push('/players')}
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
              
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: profile?.avatar_url 
                      ? `url(${profile.avatar_url}) center/cover`
                      : 'linear-gradient(135deg, #16a085, #3b82f6)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                  }}
                >
                  {!profile?.avatar_url && getInitials(profile?.name || 'U')}
                </button>

                {showDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '50px',
                    right: '0',
                    minWidth: '220px',
                    background: 'rgba(15, 23, 42, 0.98)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
                    animation: 'slideDown 0.2s ease'
                  }}>
                    <div style={{
                      padding: '16px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: '600', 
                        color: 'white',
                        marginBottom: '4px'
                      }}>
                        {profile?.name}
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        color: '#94a3b8' 
                      }}>
                        {profile?.type === 'club' ? 'Club' : 'Jugador'}
                      </div>
                    </div>

                    <div style={{ padding: '8px' }}>
                      {menuItems.map((item, idx) => {
                        const Icon = item.icon
                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              router.push(item.href)
                              setShowDropdown(false)
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              borderRadius: '8px',
                              border: 'none',
                              background: 'transparent',
                              color: '#cbd5e1',
                              fontSize: '14px',
                              fontWeight: '500',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              transition: 'all 0.2s ease',
                              textAlign: 'left'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                              e.currentTarget.style.color = 'white'
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = '#cbd5e1'
                            }}
                          >
                            <Icon size={18} />
                            {item.label}
                          </button>
                        )
                      })}
                      
                      <div style={{
                        height: '1px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        margin: '8px 0'
                      }} />
                      
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: 'transparent',
                          color: '#ef4444',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          transition: 'all 0.2s ease',
                          textAlign: 'left'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                      >
                        <LogOut size={18} />
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </nav>
  )
}