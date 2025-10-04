'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function PlayerLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: playerProfile } = await supabase
        .from('player_profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      if (playerProfile) router.replace('/players/dashboard')
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: playerProfile } = await supabase
          .from('player_profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        if (playerProfile) {
          router.push('/players/dashboard')
        } else {
          setMessage('Esta cuenta no pertenece a un jugador. ¿Administras un club? Ve a la sección de clubs.')
          await supabase.auth.signOut()
        }
      }
    } catch (error: any) {
      setMessage(error.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    if (!email) {
      setMessage('Ingresa tu email y luego haz clic en "Recuperar Contraseña"')
      return
    }
    try {
      setLoading(true)
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/players/auth/reset-password`
      })
      setMessage('Te enviamos un correo para restablecer tu contraseña.')
    } catch (error: any) {
      setMessage(error.message || 'No se pudo enviar el correo de recuperación')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/players" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🎾</span>
            </div>
            <div className="text-left">
              <div className="text-white font-semibold text-lg">Bizoc</div>
              <div className="text-slate-400 text-sm">Portal de Jugadores</div>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Iniciar Sesión</h1>
          <p className="text-slate-400">Accede a tu perfil de jugador</p>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">Contraseña</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.includes('enviamos') || message.includes('exitosa')
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-6">
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full text-sm text-slate-400 hover:text-blue-400 transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-slate-400">
            ¿No tienes cuenta?{' '}
            <Link href="/players/auth/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Crear cuenta
            </Link>
          </p>
        </div>

        <div className="text-center mt-4">
          <Link href="/clubs" className="text-slate-500 hover:text-slate-400 text-sm">
            ¿Administras un club? Ir a la sección de clubs →
          </Link>
        </div>
      </div>
    </div>
  )
}
