'use client'
import Link from 'next/link'

export default function ClubsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <div className="text-white font-semibold">Bizoc</div>
                <div className="text-slate-400 text-xs">Highlights al instante</div>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/players" className="text-slate-300 hover:text-white transition-colors">
                ¿Eres Jugador?
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-3xl">🏆</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Panel de Control para
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">
              Clubes de Pádel
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Gestiona tu club de forma inteligente. Reservas, torneos, canchas y estadísticas 
            en una sola plataforma.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-400 text-xl">🏟️</span>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Gestión de Canchas</h3>
            <p className="text-slate-400">
              Administra tus canchas, horarios, precios y disponibilidad desde un solo lugar.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-purple-400 text-xl">📅</span>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Sistema de Reservas</h3>
            <p className="text-slate-400">
              Recibe y gestiona reservas automáticamente. Control total de tu agenda.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-orange-400 text-xl">🏆</span>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Organización de Torneos</h3>
            <p className="text-slate-400">
              Crea y gestiona torneos fácilmente. Desde la inscripción hasta los resultados.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-green-400 text-xl">📊</span>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Estadísticas Detalladas</h3>
            <p className="text-slate-400">
              Analiza el rendimiento de tu club con métricas avanzadas y reportes.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 rounded-2xl p-8 border border-emerald-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">
              ¿Listo para digitalizar tu club?
            </h2>
            <p className="text-slate-300 mb-6">
              Únete a los clubes que ya están transformando su gestión con Bizoc.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/clubs/auth/login">
                <button className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all transform hover:scale-105">
                  Iniciar Sesión
                </button>
              </Link>
              <Link href="/clubs/auth/register">
                <button className="px-8 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all">
                  Registrar Club
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center text-slate-400">
            <p>© 2024 Bizoc. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}