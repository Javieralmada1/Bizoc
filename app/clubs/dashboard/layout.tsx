'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ClubDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(true)
  const [clubProfile, setClubProfile] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    (async () => {
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
      } finally {
        setLoading(false)
      }
    })()
  }, [router])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.replace('/clubs/auth/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600 text-lg">Cargando...</div>
      </div>
    )
  }

  const navLinks = [
    { href: '/clubs/dashboard', label: 'Inicio', icon: '🏠' },
    { href: '/clubs/dashboard/courts', label: 'Gestionar Canchas', icon: '🏟️' },
    { href: '/clubs/dashboard/reservations', label: 'Ver Reservas', icon: '📅' },
    { href: '/clubs/dashboard/tournaments', label: 'Torneos', icon: '🏆' },
    { href: '/clubs/dashboard/cameras', label: 'Sistema de Cámaras', icon: '📹' },
    { href: '/clubs/dashboard/schedules', label: 'Configurar Horarios', icon: '⏰' },
    { href: '/clubs/dashboard/settings', label: 'Configuración', icon: '⚙️' },
  ]

  return (
    <div className="theme-light">
      <div className="dash-shell">
        <aside className={`dash-aside ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="brand hidden lg:block font-extrabold tracking-tight text-slate-900 text-xl">
            BYZOC
          </div>
          
          <nav className="dash-nav mt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`dash-nav-link ${pathname === link.href ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="mr-1 text-lg">{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto p-4 border-t border-gray-200">
            <div className="mb-2">
              <div className="text-sm font-semibold text-slate-900">{clubProfile?.name}</div>
              <div className="text-xs text-slate-500">ID: {clubProfile?.club_id}</div>
            </div>
            <button 
              onClick={handleLogout} 
              className="btn w-full"
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[90] lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <div className="dash-main">
          {children}
        </div>
      </div>
    </div>
  )
}