'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default function ClubRegisterPage() {
  const router = useRouter()
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
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // Verificar si ya está logueado
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      // Verificar si es club
      const { data: clubProfile } = await supabase
        .from('club_profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      if (clubProfile) {
        router.replace('/clubs/dashboard')
      }
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

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

    try {
      // 1. Crear cuenta de usuario
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password
      })

      if (authError) throw authError

      if (authData.user) {
        // 2. Crear perfil de club
        const { error: profileError } = await supabase
          .from('club_profiles')
          .insert({
            id: authData.user.id,
            email: formData.email,
            name: formData.clubName.trim(),
            province: formData.province.trim() || null,
            city: formData.city.trim() || null,
            address: formData.address.trim() || null,
            phone: formData.phone.trim() || null
          })

        if (profileError) {
          console.error('Error creating club profile:', profileError)
          // Si falla el perfil, intentamos eliminar el usuario creado
          await supabase.auth.signOut()
          throw new Error('Error al crear el perfil del club. Intenta nuevamente.')
        }

        // 3. Verificar si necesita confirmación por email
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
          router.push('/clubs/dashboard')
        }
      }
    } catch (error: any) {
      console.error('Registration error:', error)
      setMessage(error.message || 'Error al registrar el club')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/clubs" className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <span className="text-white text-xl">🏆</span>
            </div>
            <div className="text-left">
              <div className="text-white font-semibold text-lg">Bizoc</div>
              <div className="text-slate-400 text-sm">Panel de Clubs</div>
            </div>
          </Link>
          <h1 className="text-2xl font-bold text-white mb-2">Registrar Club</h1>
          <p className="text-slate-400">Únete a la red de clubs de pádel</p>
        </div>

        {/* Form */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="contacto@tuclub.com"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
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
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirmar Contraseña *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            {/* Club Name */}
            <div>
              <label htmlFor="clubName" className="block text-sm font-medium text-slate-300 mb-2">
                Nombre del Club *
              </label>
              <input
                id="clubName"
                name="clubName"
                type="text"
                value={formData.clubName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Club de Pádel Los Cedros"
              />
            </div>

            {/* Province and City */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="province" className="block text-sm font-medium text-slate-300 mb-2">
                  Provincia
                </label>
                <input
                  id="province"
                  name="province"
                  type="text"
                  value={formData.province}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="Buenos Aires"
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-slate-300 mb-2">
                  Ciudad
                </label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="CABA"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-slate-300 mb-2">
                Dirección
              </label>
              <input
                id="address"
                name="address"
                type="text"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Av. Libertador 1234"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                Teléfono
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="+54 11 1234-5678"
              />
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm ${
                message.includes('exitoso') || message.includes('Revisa')
                  ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                  : 'bg-red-500/20 border border-red-500/30 text-red-400'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Registrando club...' : 'Registrar Club'}
            </button>
          </form>
        </div>

        {/* Login Link */}
        <div className="text-center mt-6">
          <p className="text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link href="/clubs/auth/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>

        {/* Player Link */}
        <div className="text-center mt-4">
          <Link href="/players" className="text-slate-500 hover:text-slate-400 text-sm">
            ¿Eres jugador? Ir a la sección de jugadores →
          </Link>
        </div>
      </div>
    </div>
  )
}