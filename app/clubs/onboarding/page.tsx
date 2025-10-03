'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function ClubOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form: ahora incluye email (prellenado si viene del user)
  const [form, setForm] = useState({
    name: '',
    city: '',
    province: '',
    email: '',          // <-- NEW
  })

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/clubs/auth/login')
        return
      }

      // intenta obtener el email de distintas fuentes
      const userEmail =
        user.email ||
        // en algunos casos puede venir en metadatos
        (user.user_metadata && (user.user_metadata.email || user.user_metadata.user_email)) ||
        ''

      setForm(prev => ({ ...prev, email: userEmail }))
    })()
  }, [router])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Sesión inválida')

      // validación: si tu DB requiere email NOT NULL, aquí debe estar presente
      if (!form.email?.trim()) {
        throw new Error('Tu cuenta no tiene email asociado. Ingrésalo para continuar.')
      }

      // 1) Crear el club con datos obligatorios
      const { data: club, error: clubErr } = await supabase
        .from('clubs')
        .insert({
          name: form.name,
          city: form.city,
          province: form.province,
          owner_id: user.id,
        })
        .select('id')
        .single()
      if (clubErr) throw clubErr

      // 2) Crear/actualizar el perfil del club con email y club_id (UPSERT)
      const { error: profErr } = await supabase
        .from('club_profiles')
        .upsert(
          {
            id: user.id,          // = auth.user.id
            name: form.name,
            email: form.email,    // <-- aseguramos NOT NULL
            club_id: club.id,     // FK al club creado
          },
          { onConflict: 'id' }
        )
      if (profErr) throw profErr

      router.replace('/clubs/dashboard')
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'No se pudo crear el club')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
      <div className="bg-white rounded-xl shadow p-8 w-full max-w-lg">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Configura tu Club</h1>
          <button
            onClick={() => router.push('/clubs/auth/login')}
            className="text-sm text-slate-500 hover:text-slate-700 underline"
          >
            Volver al login
          </button>
        </div>
        <p className="text-slate-600 mb-6">Completa los datos para crear el perfil de tu club.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre del Club</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Ciudad</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Provincia</label>
            <input
              name="province"
              value={form.province}
              onChange={handleChange}
              required
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {/* Email sólo para garantizar NOT NULL (se prellena; si faltó, lo pedimos) */}
          <div>
            <label className="block text-sm font-medium mb-1">Email del Club</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required     // <- porque tu DB lo exige NOT NULL
              className="w-full border rounded px-3 py-2"
            />
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 px-3 py-2 rounded">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 text-white font-semibold py-3 rounded hover:bg-emerald-700"
          >
            {loading ? 'Creando…' : 'Crear Club'}
          </button>
        </form>
      </div>
    </div>
  )
}
