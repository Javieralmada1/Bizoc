import './globals.css'
import ResponsiveNav from '@/components/shared/ResponsiveNav'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Byzoc',
  description: 'MVP para revivir partidos y marcar highlights',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ResponsiveNav />
        {children}
      </body>
    </html>
  )
}