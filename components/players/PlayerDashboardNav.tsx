'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  ShieldCheck,
  Award,
  Users,
  FileText,
  Swords
} from 'lucide-react'

// Definimos los items de navegación que SÍ existen en tu app
const navItems = [
  { href: '/players/dashboard', label: 'Datos', icon: BarChart3 },
  { href: '/players/dashboard/matches', label: 'Historial', icon: BookOpen },
  { href: '/players/dashboard/stats', label: 'Estadísticas', icon: Award },
  { href: '/players/dashboard/recategorizations', label: 'Recategorizaciones', icon: ShieldCheck },
  // Los siguientes son placeholders, puedes crear las páginas cuando quieras
  // { href: '/players/dashboard/sanciones', label: 'Sanciones', icon: FileText },
  // { href: '/players/dashboard/fiscales', label: 'Fiscales', icon: Users },
  // { href: '/players/dashboard/enfrentamientos', label: 'Enfrentamientos', icon: Swords },
]

export function PlayerDashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
              ${
                isActive
                  ? 'bg-emerald-100/70 text-emerald-800' // Estilo activo
                  : 'text-slate-600 hover:bg-slate-200/60' // Estilo inactivo
              }
            `}
          >
            <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}

