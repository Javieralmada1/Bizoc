'use client'
import Link from 'next/link'

export default function PlayersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <div className="text-white font-semibold">Bizoc</div>
                <div className="text-slate-400 text-xs">Highlights al instante</div>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/clubs" className="text-slate-300 hover:text-white transition-colors">
                ¿Administras un Club?
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-3xl">🎾</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Tu Plataforma de
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
              Pádel Personal
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Reserva canchas, participa en torneos, analiza tu rendimiento y conecta 
            con la comunidad del pádel.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-green-400 text-xl">📅</span>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Reservas Fáciles</h3>
            <p className="text-slate-400">
              Reserva canchas en tus clubes favoritos con solo unos clics. Confirma y paga en línea.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-orange-400 text-xl">🏆</span>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Torneos Emocionantes</h3>
            <p className="text-slate-400">
              Participa en torneos de tu categoría. Desde competencias locales hasta grandes eventos.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-purple-400 text-xl">📊</span>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Análisis de Rendimiento</h3>
            <p className="text-slate-400">
              Trackea tus estadísticas, analiza tu progreso y mejora tu juego con datos detallados.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
              <span className="text-blue-400 text-xl">👥</span>
            </div>
            <h3 className="text-white text-lg font-semibold mb-2">Comunidad Activa</h3>
            <p className="text-slate-400">
              Conecta con otros jugadores, forma equipos y disfruta de la comunidad del pádel.
            </p>
          </div>
        </div>

        {/* Player Benefits */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20 mb-12">
          <h2 className="text-2xl font-bold text-white mb-4 text-center">
            ¿Por qué elegir Bizoc?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-400 text-2xl">⚡</span>
              </div>
              <h4 className="text-white font-semibold mb-2">Rápido y Fácil</h4>
              <p className="text-slate-400 text-sm">
                Reserva en segundos, sin complicaciones ni largas esperas telefónicas.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-400 text-2xl">🎯</span>
              </div>
              <h4 className="text-white font-semibold mb-2">Personalizado</h4>
              <p className="text-slate-400 text-sm">
                Recomendaciones basadas en tu nivel, ubicación y horarios preferidos.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                <span className="text-green-400 text-2xl">💯</span>
              </div>
              <h4 className="text-white font-semibold mb-2">Confiable</h4>
              <p className="text-slate-400 text-sm">
                Clubes verificados, pagos seguros y confirmación instantánea.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-2xl p-8 border border-blue-500/30">
            <h2 className="text-2xl font-bold text-white mb-4">
              ¿Listo para llevar tu pádel al siguiente nivel?
            </h2>
            <p className="text-slate-300 mb-6">
              Únete a miles de jugadores que ya disfrutan de la mejor experiencia de pádel digital.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/players/auth/login">
                <button className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105">
                  Iniciar Sesión
                </button>
              </Link>
              <Link href="/players/auth/register">
                <button className="px-8 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-all">
                  Crear Cuenta
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