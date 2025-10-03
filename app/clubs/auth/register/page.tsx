'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ClubRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    clubName: '',
    province: '',
    city: '',
    address: '',
    phone: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      // Validaciones
      if (formData.password !== formData.confirmPassword) {
        setMessage('Las contraseñas no coinciden')
        setLoading(false)
        return
      }

      if (formData.password.length < 6) {
        setMessage('La contraseña debe tener al menos 6 caracteres')
        setLoading(false)
        return
      }

      if (!formData.clubName.trim()) {
        setMessage('El nombre del club es obligatorio')
        setLoading(false)
        return
      }

      // 1. Crear usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            club_name: formData.clubName,
            user_type: 'club'
          }
        }
      })

      if (authError) throw authError

      if (!authData.user) {
        throw new Error('No se pudo crear la cuenta')
      }

      // 2. Crear perfil del club
      const { error: profileError } = await supabase
        .from('club_profiles')
        .insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.clubName,
          province: formData.province || null,
          city: formData.city || null,
          address: formData.address || null,
          phone: formData.phone || null
        })

      if (profileError) {
        console.error('Error creating club profile:', profileError)
        // No lanzar error aquí, el perfil se puede crear después
      }

      // 3. Crear entrada en la tabla clubs (si existe)
      const { error: clubError } = await supabase
        .from('clubs')
        .insert({
          id: authData.user.id,
          name: formData.clubName,
          province: formData.province || null,
          city: formData.city || null,
          address: formData.address || null,
          phone: formData.phone || null,
          owner_id: authData.user.id
        })

      if (clubError) {
        console.error('Error creating club:', clubError)
      }

      // 4. Verificar si necesita confirmación por email
      if (!authData.session) {
        setMessage('¡Registro exitoso! Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.')
        // Limpiar formulario
        setFormData({
          email: '',
          password: '',
          confirmPassword: '',
          clubName: '',
          province: '',
          city: '',
          address: '',
          phone: ''
        })
      } else {
        // Si ya está logueado automáticamente
        setMessage('¡Registro exitoso! Redirigiendo al dashboard...')
        setTimeout(() => {
          router.push('/clubs/dashboard')
        }, 1500)
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      setMessage(error.message || 'Error al registrar el club')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
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
          
          <h1 className="text-3xl font-bold text-white mb-3">Registrar Club</h1>
          <p className="text-slate-400 text-base">Únete a la red de clubs de pádel</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10 shadow-2xl">
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Información de Acceso */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>🔐</span> Información de Acceso
              </h3>
              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-200 mb-2">
                    Email *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                    placeholder="contacto@tuclub.com"
                  />
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-slate-200 mb-2">
                      Contraseña *
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-200 mb-2">
                      Confirmar *
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required
                      minLength={6}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Información del Club */}
            <div className="mb-6 pt-4 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span>🏢</span> Información del Club
              </h3>
              <div className="space-y-4">
                {/* Club Name */}
                <div>
                  <label htmlFor="clubName" className="block text-sm font-semibold text-slate-200 mb-2">
                    Nombre del Club *
                  </label>
                  <input
                    id="clubName"
                    name="clubName"
                    type="text"
                    value={formData.clubName}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                    placeholder="Club de Pádel Los Cedros"
                  />
                </div>

                {/* Province and City */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="province" className="block text-sm font-semibold text-slate-200 mb-2">
                      Provincia
                    </label>
                    <input
                      id="province"
                      name="province"
                      type="text"
                      value={formData.province}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                      placeholder="Entre Ríos"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-semibold text-slate-200 mb-2">
                      Ciudad
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleInputChange}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                      placeholder="Concepción del Uruguay"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-semibold text-slate-200 mb-2">
                    Dirección
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                    placeholder="Av. Principal 123"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-slate-200 mb-2">
                    Teléfono
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all disabled:opacity-50"
                    placeholder="+54 343 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium ${
                message.includes('exitoso')
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}>
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-base rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registrando club...
                </span>
              ) : (
                'Registrar Club'
              )}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6 space-y-4">
          <p className="text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link 
              href="/clubs/auth/login" 
              className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              Iniciar sesión
            </Link>
          </p>

          {/* Player Link */}
          <div className="pt-4 border-t border-white/10">
            <Link 
              href="/players" 
              className="text-slate-500 hover:text-slate-400 text-sm transition-colors inline-flex items-center gap-1"
            >
              ¿Eres jugador? Ir a la sección de jugadores
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}