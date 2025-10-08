// components/SiteNav.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function SiteNav() {
  const pathname = usePathname()

  const item = (href: string, label: string, variant: 'primary' | 'ghost' = 'ghost') => {
    const active = pathname === href
    const base = 'px-4 py-2 rounded-lg text-sm font-medium transition'
    if (variant === 'primary') {
      return (
        <Link
          href={href}
          className={`${base} ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
        >
          {label}
        </Link>
      )
    }
    return (
      <Link
        href={href}
        className={`${base} ${active ? 'bg-violet-600 text-white' : 'bg-slate-100 hover:bg-slate-200'}`}
      >
        {label}
      </Link>
    )
  }

  return (
    <header className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-violet-500 text-white font-bold">
          ✓
        </div>
        <div>
          <h1 className="font-semibold text-lg leading-none">Byzoc</h1>
          <span className="text-xs text-slate-500">Tu cancha, tu momento</span>
        </div>
      </Link>

      <nav className="flex gap-2">
        {item('/', 'Inicio')}
        {item('/reservas', 'Reservar Cancha')}
        {item('/partidos', 'Ver Partidos')}
        <Link
          href="/clubs/auth/login"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200"
        >
          Admin Club
        </Link>
        <Link
          href="/players/auth/login"
          className="px-4 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200"
        >
          Soy Jugador
        </Link>
      </nav>
    </header>
  )
}
