'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ClubDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clubProfile, setClubProfile] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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

      const { data: profile, error } = await supabase
        .from('club_profiles')
        .select('id, name, club_id')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error(error)
        router.replace('/clubs/auth/login')
        return
      }

      if (!profile) {
        router.replace('/clubs/onboarding')
        return
      }

      setClubProfile(profile)
    } catch (error) {
      console.error('Error:', error)
      router.replace('/clubs/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/clubs/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-slate-300 text-lg">Cargando...</div>
      </div>
    )
  }

  const menuItems = [
    { href: '/clubs/dashboard', label: 'Inicio', icon: '📊' },
    { href: '/clubs/dashboard/courts', label: 'Gestionar Canchas', icon: '🏟️' },
    { href: '/clubs/dashboard/reservations', label: 'Ver Reservas', icon: '📅' },
    { href: '/clubs/dashboard/tournaments', label: 'Torneos', icon: '🏆' },
    { href: '/clubs/dashboard/cameras', label: 'Sistema de Cámaras', icon: '📹' },
    { href: '/clubs/dashboard/schedules', label: 'Configurar Horarios', icon: '⏰' },
    { href: '/clubs/dashboard/settings', label: 'Configuración', icon: '⚙️' }
  ]

  return (
    <div>
      <div className="dashboard-bg">
        <div className="dash-shell">
          {/* Mobile Menu Button */}
          <button
            className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-slate-800/90 backdrop-blur-lg border border-white/10 rounded-lg flex items-center justify-center text-white hover:bg-slate-700/90 transition-all"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          {/* Sidebar */}
          <aside className={`dash-aside ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <div className="brand">BYZOC</div>
            
            <nav className="dash-nav">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="dash-nav-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Botón de salida al pie */}
            <div className="dash-user">
              <div className="text-slate-400 text-sm mb-2">
                {clubProfile?.name || 'Mi Club'}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 transition-all"
              >
                Cerrar sesión
              </button>
            </div>
          </aside>

          {/* Overlay for mobile */}
          {mobileMenuOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}