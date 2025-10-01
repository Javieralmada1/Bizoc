import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Byzoc - Tu cancha, tu momento',
  description: 'Plataforma #1 de Pádel en Argentina. Reserva canchas, revive partidos y conecta con la comunidad.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  )
}