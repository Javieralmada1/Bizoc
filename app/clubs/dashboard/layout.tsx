'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const NAV = [
  { href:'/clubs/dashboard', label:'Inicio' },
  { href:'/clubs/dashboard/courts', label:'Canchas' },
  { href:'/clubs/dashboard/reservations', label:'Reservas' },
  { href:'/clubs/dashboard/tournaments', label:'Torneos' },
  { href:'/clubs/dashboard/cameras', label:'Cámaras' },
  { href:'/clubs/dashboard/schedules', label:'Horarios' },
  { href:'/clubs/dashboard/settings', label:'Configuración' },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function logout(){
    await supabase.auth.signOut()
    router.replace('/clubs/auth/login')
  }

  return (
    <div className="bz-shell wide">{/* 👈 ahora ocupa todo el ancho */}
      {/* Topbar */}
      <div className="bz-surface bz-topbar px-4 py-3 mb-6 flex items-center gap-3">
        <button
          onClick={()=>setOpen(v=>!v)}
          className="bz-btn lg:hidden"
          aria-label="Menú"
          aria-expanded={open}
        >☰</button>
        <div className="bz-sub">Byzoc · Panel de Club</div>
        <div className="ml-auto flex items-center gap-2">
          <span className="bz-pill bz-pill--accent">ID del club</span>
          <button onClick={logout} className="bz-btn">Cerrar sesión</button>
        </div>
      </div>

      {/* Layout grid */}
      <div className="bz-grid">
        {/* Sidebar */}
        <aside className={`bz-surface bz-aside ${open ? '' : 'hidden lg:block'}`}>
          <div className="bz-sub mb-2">Navegación</div>
          <nav className="bz-nav">
            {NAV.map(i=>{
              const active = pathname === i.href || pathname.startsWith(i.href + '/')
              return (
                <Link key={i.href} href={i.href} className={`bz-link ${active ? 'active' : ''}`}>
                  {i.label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-3 pt-3 border-t border-[var(--border)]">
            <div className="bz-pill">Configura canchas y horarios</div>
          </div>
        </aside>

        {/* Main */}
        <main className="space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}