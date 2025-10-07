'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { PlayerDashboardNav } from '@/components/players/PlayerDashboardNav' 
import { PlayerProfileMenu } from '@/components/players/PlayerProfileMenu'

type PlayerProfile = {
  id: string;
  first_name: string;
  last_name: string;
  category: string;
}

export default function PlayerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkAuthAndLoadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/players/auth/login')
        return
      }

      const { data: profileData, error } = await supabase
        .from('player_profiles')
        .select('id, first_name, last_name, category')
        .eq('id', user.id)
        .single()

      if (error || !profileData) {
        console.error('Perfil de jugador no encontrado, deslogueando.', error)
        await supabase.auth.signOut()
        router.replace('/players/auth/login')
        return
      }
      
      setProfile(profileData)
      setLoading(false)
    }
    checkAuthAndLoadProfile()
  }, [router])
  
  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/players')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500">Cargando perfil del jugador...</div>
      </div>
    )
  }

  return (
    // ESTA ES LA SOLUCIÓN CORRECTA: aplicamos el tema aquí
    <div className="player-dashboard-theme min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200">
        <div className="max-w-screen-xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-white font-bold text-lg">B</div>
             <span className="font-bold text-lg text-slate-800 hidden sm:inline">BYZOC</span>
          </div>
          {profile && <PlayerProfileMenu profile={profile} onLogout={handleLogout} />}
        </div>
        <div className="max-w-screen-xl mx-auto px-6">
          <PlayerDashboardNav />
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 pt-44 pb-12">
        {children}
      </main>
    </div>
  )
}