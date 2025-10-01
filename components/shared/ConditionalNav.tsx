'use client'

import { usePathname } from 'next/navigation'
import ModernNav from './ModernNav'

export function ConditionalNav() {
  const pathname = usePathname()
  
  // No mostrar navegación en rutas del dashboard
  const isDashboard = pathname?.includes('/dashboard')
  
  if (isDashboard) {
    return null
  }
  
  return <ModernNav />
}