// app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Byzoc',
  description: 'Tu cancha, tu momento',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* NAVBAR GLOBAL (única) */}
        <header className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-violet-500 text-white font-bold">✓</div>
            <div>
              <h1 className="font-semibold text-lg leading-none">Byzoc</h1>
              <span className="text-xs text-slate-500">Tu cancha, tu momento</span>
            </div>
          </Link>

          <nav className="flex flex-wrap gap-2">
            <Link href="/" className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200">Inicio</Link>
            <Link href="/reservas" className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200">Reservar Cancha</Link>
            <Link href="/partidos" className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200">Ver Partidos</Link>
            <Link href="/clubs/auth/login" className="px-4 py-2 rounded-lg text-sm bg-slate-100 hover:bg-slate-200">Admin Club</Link>
            <Link href="/players/auth/login" className="px-4 py-2 rounded-lg text-sm bg-green-100 text-green-700 hover:bg-green-200">Soy Jugador</Link>
          </nav>
        </header>

        {children}
      </body>
    </html>
  )
}
