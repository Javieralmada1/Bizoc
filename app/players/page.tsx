'use client'
import Link from 'next/link'

export default function PlayersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all duration-300">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <div>
                <div className="text-slate-900 font-bold text-xl">Bizoc</div>
                <div className="text-purple-600 text-xs font-medium">Highlights al instante</div>
              </div>
            </Link>
            <Link 
              href="/clubs" 
              className="px-6 py-2.5 text-slate-700 hover:text-purple-600 font-medium rounded-xl transition-all duration-300"
            >
              ¿Administras un Club?
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="w-full flex flex-col items-center px-8">
        
        {/* Hero Section */}
        <div className="text-center py-32 max-w-5xl w-full">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-700 rounded-3xl shadow-xl shadow-purple-500/30 mb-12">
            <span className="text-white text-6xl">🎾</span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-extrabold text-slate-900 mb-8 leading-tight">
            Tu Plataforma de
            <span className="block mt-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800">
              Pádel Personal
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-600 mb-16 leading-relaxed max-w-3xl mx-auto">
            Reserva canchas, participa en torneos, analiza tu rendimiento y conecta 
            con la <span className="text-purple-600 font-semibold">comunidad del pádel</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/players/auth/register">
              <button className="px-12 py-5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold text-lg rounded-2xl shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:scale-105">
                Comenzar Ahora
              </button>
            </Link>
            <Link href="/players/auth/login">
              <button className="px-12 py-5 bg-white border-2 border-slate-200 text-slate-700 font-semibold text-lg rounded-2xl hover:border-purple-300 hover:text-purple-600 transition-all duration-300 hover:scale-105 shadow-sm">
                Iniciar Sesión
              </button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="w-full max-w-7xl py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
            {[
              {
                icon: '📅',
                title: 'Reservas Fáciles',
                desc: 'Reserva canchas en tus clubes favoritos con solo unos clics.',
              },
              {
                icon: '🏆',
                title: 'Torneos Emocionantes',
                desc: 'Participa en torneos de tu categoría desde competencias locales.',
              },
              {
                icon: '📊',
                title: 'Análisis de Rendimiento',
                desc: 'Trackea tus estadísticas y mejora tu juego con datos detallados.',
              },
              {
                icon: '👥',
                title: 'Comunidad Activa',
                desc: 'Conecta con otros jugadores y forma equipos.',
              }
            ].map((feature, idx) => (
              <div 
                key={idx} 
                className="w-full max-w-xs bg-white rounded-3xl p-10 border border-slate-200 hover:border-purple-300 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-2"
              >
                <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 hover:bg-purple-600 transition-all duration-300 hover:scale-110">
                  <span className="text-5xl">
                    {feature.icon}
                  </span>
                </div>
                <h3 className="text-slate-900 text-xl font-bold mb-4 hover:text-purple-600 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-slate-600 text-base leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Why Choose Bizoc Section */}
        <div className="w-full max-w-6xl bg-gradient-to-br from-purple-50 to-white rounded-3xl p-16 md:p-20 border border-purple-100 my-24 shadow-lg">
          <h2 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 text-center">
            ¿Por qué elegir <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-purple-800">Bizoc</span>?
          </h2>
          <p className="text-slate-600 text-center mb-20 text-lg">La mejor experiencia de pádel digital</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 justify-items-center">
            {[
              {
                icon: '⚡',
                title: 'Rápido y Fácil',
                desc: 'Reserva en segundos, sin complicaciones ni largas esperas telefónicas.',
              },
              {
                icon: '🎯',
                title: 'Personalizado',
                desc: 'Recomendaciones basadas en tu nivel, ubicación y horarios preferidos.',
              },
              {
                icon: '💯',
                title: 'Confiable',
                desc: 'Clubes verificados, pagos seguros y confirmación instantánea.',
              }
            ].map((item, idx) => (
              <div key={idx} className="text-center w-full max-w-sm">
                <div className="w-24 h-24 mx-auto mb-8 bg-white rounded-2xl flex items-center justify-center border-2 border-purple-200 hover:border-purple-400 hover:scale-110 transition-all duration-300 shadow-lg">
                  <span className="text-5xl">{item.icon}</span>
                </div>
                <h4 className="text-slate-900 text-xl font-bold mb-4">
                  {item.title}
                </h4>
                <p className="text-slate-600 text-base leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA Section */}
        <div className="w-full max-w-5xl my-24">
          <div className="bg-gradient-to-r from-purple-600 to-purple-800 rounded-3xl p-16 md:p-20 shadow-2xl shadow-purple-500/20 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8 leading-tight">
              ¿Listo para llevar tu pádel al siguiente nivel?
            </h2>
            <p className="text-purple-100 text-xl mb-12 leading-relaxed max-w-3xl mx-auto">
              Únete a <span className="text-white font-bold">miles de jugadores</span> que ya disfrutan de la mejor experiencia de pádel digital
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link href="/players/auth/login">
                <button className="px-14 py-5 bg-white text-purple-700 font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Iniciar Sesión
                </button>
              </Link>
              <Link href="/players/auth/register">
                <button className="px-14 py-5 bg-purple-500/20 backdrop-blur-sm border-2 border-white/50 text-white font-bold text-lg rounded-2xl hover:bg-white/10 transition-all duration-300 hover:scale-105">
                  Crear Cuenta Gratis
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 backdrop-blur-lg mt-40">
        <div className="max-w-7xl mx-auto px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <span className="text-slate-900 font-bold text-2xl">Bizoc</span>
            </div>
            <p className="text-slate-500 text-sm">
              © 2024 Bizoc. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}