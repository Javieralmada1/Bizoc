import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Byzoc',
  description: 'Gestión de torneos y reservas de pádel.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Este layout ahora es simple y aplica a toda la app */}
        {children}
      </body>
    </html>
  )
}