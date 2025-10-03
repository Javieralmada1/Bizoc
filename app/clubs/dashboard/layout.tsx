'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function ClubDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [clubProfile, setClubProfile] = useState<any>(null)

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 text-lg">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="theme-light">
      <div className="dashboard-bg">
        <div className="dash-shell">
          <aside className="dash-aside">
            <div className="brand">BYZOC</div>
            <nav className="dash-nav">
              <a href="/clubs/dashboard" className="active">Inicio</a>
              <a href="/clubs/dashboard/courts">Gestionar Canchas</a>
              <a href="/clubs/dashboard/reservations">Ver Reservas</a>
              <a href="/clubs/dashboard/tournaments">Torneos</a>
              <a href="/clubs/dashboard/cameras">Sistema de Cámaras</a>
              <a href="/clubs/dashboard/schedules">Configurar Horarios</a>
              <a href="/clubs/dashboard/settings">Configuración</a>
            </nav>

            {/* Botón de salida fijo al pie de la sidebar */}
            <div className="mt-auto pt-4">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full rounded-lg px-3 py-2 text-sm font-medium border border-gray-200 hover:bg-gray-50"
              >
                Cerrar sesión
              </button>
            </div>
          </aside>
          <main>{children}</main>
        </div>
      </div>
    </div>
  )
}

