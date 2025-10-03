'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'

type ProfileProbe = { id: string; club_id: string | null } | null

export default function ClubLoginPage() {
  const router = useRouter()
  const params = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string>('')

  // Estado de sesión actual (si la hay antes de loguear)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [profileProbe, setProfileProbe] = useState<ProfileProbe>(null)
  const [currentEmail, setCurrentEmail] = useState<string | null>(null)

  useEffect(() => {
    // Al entrar al login, NO redirigimos automáticamente.
    // Solo detectamos si ya hay sesión para mostrar opciones.
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setHasSession(true)
        setCurrentEmail(user.email ?? null)
        const { data, error } = await supabase
          .from('club_profiles')
          .select('id, club_id')
          .eq('id', user.id)
          .maybeSingle()
        if (!error) setProfileProbe(data ?? null)
      }
      setSessionChecked(true)
    })()
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) throw authError
      if (!authData.user) throw new Error('No se pudo iniciar sesión')

      // si es jugador, impedir acceso al panel de clubs
      const { data: player } = await supabase
        .from('player_profiles')
        .select('id')
        .eq('id', authData.user.id)
        .maybeSingle()
      if (player) {
        setMessage('Esta cuenta es de jugador. Inicia sesión en la sección de jugadores.')
        await supabase.auth.signOut()
        return
      }

      // verificar perfil de club
      const { data: profile } = await supabase
        .from('club_profiles')
        .select('id, club_id')
        .eq('id', authData.user.id)
        .maybeSingle()

      const redirect = params.get('redirect')

      if (!profile || !profile.club_id) {
        router.push('/clubs/onboarding')
        return
      }

      router.push(redirect || '/clubs/dashboard')
    } catch (err: any) {
      console.error('Login error:', err)
      setMessage(err.message || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword() {
    if (!email) {
      setMessage('Ingresa tu email y luego haz clic en "¿Olvidaste tu contraseña?"')
      return
    }
    try {
      setLoading(true)
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/clubs/auth/reset-password`,
      })
      setMessage('Te enviamos un correo para restablecer tu contraseña.')
    } catch (error: any) {
      setMessage(error.message || 'No se pudo enviar el correo de recuperación')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setHasSession(false)
    setProfileProbe(null)
    setCurrentEmail(null)
  }

  // UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6 hover:opacity-80 transition-opacity">
            <div className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">🏆</span>
            </div>
            <div className="text-left">
              <div className="text-white font-bold text-xl">Bizoc</div>
              <div className="text-slate-400 text-sm">Panel de Clubs</div>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-3">Iniciar Sesión</h1>
          <p className="text-slate-400 text-base">Accede al panel de control de tu club</p>
        </div>

        {/* Si ya hay sesión, NO forzamos redirect: mostramos opciones */}
        {sessionChecked && hasSession && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-5 border border-white/10 mb-6 text-slate-200">
            <div className="font-semibold mb-1">Ya estás autenticado{currentEmail ? `: ${currentEmail}` : ''}</div>
            {profileProbe?.club_id ? (
              <p className="text-sm mb-4">Tu perfil de club está listo.</p>
            ) : (
              <p className="text-sm mb-4">Aún no completaste los datos del club.</p>
            )}
            <div className="flex gap-2">
              {profileProbe?.club_id ? (
                <button
                  onClick={() => router.push('/clubs/dashboard')}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
                >
                  Ir al Dashboard
                </button>
              ) : (
                <button
                  onClick={() => router.push('/clubs/onboarding')}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700"
                >
                  Ir al Onboarding
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/10"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}

        {/* Formulario normal de login (si no hay sesión) */}
        {!hasSession && (
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                  placeholder="contacto@tuclub.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm font-medium ${
                  message.includes('enviamos')
                    ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-base rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/50"
              >
                {loading ? 'Iniciando sesión…' : 'Iniciar Sesión'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={loading}
                  className="text-sm text-slate-400 hover:text-emerald-400 transition-colors font-medium disabled:opacity-50"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="text-center mt-6 space-y-4">
          <p className="text-slate-400">
            ¿No tienes cuenta?{' '}
            <Link href="/clubs/auth/register" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors">
              Registra tu club
            </Link>
          </p>
          <div className="pt-4 border-t border-white/10">
            <Link href="/players" className="text-slate-500 hover:text-slate-400 text-sm transition-colors inline-flex items-center gap-1">
              ¿Eres jugador? Ir a la sección de jugadores
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
