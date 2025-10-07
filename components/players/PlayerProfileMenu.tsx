'use client'

import { useState, useRef, useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { PlayerProfile } from '@/app/players/dashboard/layout' // Importamos el tipo desde el layout

interface PlayerProfileMenuProps {
  profile: PlayerProfile | null;
  onLogout: () => void;
}

export function PlayerProfileMenu({ profile, onLogout }: PlayerProfileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const displayName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Jugador'
  const initials = profile ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() : '?'

  // Cierra el menú si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [menuRef])

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold text-lg hover:ring-2 hover:ring-emerald-400 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {initials}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-200/80 p-2 z-50">
          <div className="px-3 py-2">
            <p className="font-bold text-slate-800 truncate">{displayName}</p>
            <p className="text-sm text-slate-500">Categoría: {profile?.category || 'N/A'}</p>
          </div>
          <div className="h-px bg-slate-200 my-1"></div>
          <button
            onClick={() => {
              setIsOpen(false)
              onLogout()
            }}
            className="w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <LogOut className="w-5 h-5 text-slate-500" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  )
}
