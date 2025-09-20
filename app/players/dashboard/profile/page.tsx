'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type PlayerProfile = {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  province: string | null
  city: string | null
  category: string
  birth_date: string | null
  country: string | null
  avatar_url: string | null
  email: string
}

export default function PlayerProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    province: '',
    city: '',
    category: '7ª',
    birth_date: '',
    country: 'Argentina'
  })

  const categories = [
    '1ª', '2ª', '3ª', '4ª', '5ª', '6ª', '7ª', '8ª', '9ª', '10ª'
  ]

  const provinces = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 
    'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja',
    'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan',
    'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 
    'Tierra del Fuego', 'Tucumán'
  ]

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  async function checkAuthAndLoadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.replace('/players/auth/login')
        return
      }

      await loadProfile(user.id, user.email!)
      
    } catch (error) {
      console.error('Error checking auth:', error)
      router.replace('/players/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadProfile(userId: string, email: string) {
    try {
      const { data: profile, error } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      const profileWithEmail = {
        ...profile,
        email,
        country: profile.country || 'Argentina'
      }

      setProfile(profileWithEmail)
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        province: profile.province || '',
        city: profile.city || '',
        category: profile.category || '7ª',
        birth_date: profile.birth_date || '',
        country: profile.country || 'Argentina'
      })
      
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  async function handleSave() {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('player_profiles')
        .update(formData)
        .eq('id', profile.id)

      if (error) throw error

      // Actualizar el estado local
      setProfile({
        ...profile,
        ...formData
      })
      
      setEditing(false)
      
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error al actualizar el perfil')
    } finally {
      setSaving(false)
    }
  }

  function cancelEdit() {
    if (!profile) return
    
    setFormData({
      first_name: profile.first_name || '',
      last_name: profile.last_name || '',
      phone: profile.phone || '',
      province: profile.province || '',
      city: profile.city || '',
      category: profile.category || '7ª',
      birth_date: profile.birth_date || '',
      country: profile.country || 'Argentina'
    })
    setEditing(false)
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'No especificada'
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long', 
      year: 'numeric'
    })
  }

  function calculateAge(birthDate: string | null) {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-slate-300 text-lg">Cargando perfil...</div>
      </div>
    )
  }

  const displayName = profile ? `${profile.first_name} ${profile.last_name}` : 'Jugador'
  const age = calculateAge(profile?.birth_date || null)

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Datos</h1>
            <p className="text-slate-400">Información personal de {displayName}</p>
          </div>
          
          {!editing ? (
            <button
              onClick={() => setEditing(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all"
            >
              Editar Perfil
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={cancelEdit}
                className="px-6 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>

        {/* Profile Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
          <div className="flex items-center gap-6 mb-8">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {profile?.first_name?.[0]}{profile?.last_name?.[0]}
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-white">{displayName}</h2>
              <p className="text-slate-400">Categoría {profile?.category}</p>
              {age && (
                <p className="text-blue-400 text-sm mt-1">{age} años</p>
              )}
            </div>
          </div>

          {/* Profile Information */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Información Personal</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Nombre</label>
                  {editing ? (
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-white font-medium">{profile?.first_name || 'No especificado'}</div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Apellido</label>
                  {editing ? (
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="text-white font-medium">{profile?.last_name || 'No especificado'}</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Fecha de nacimiento</label>
                {editing ? (
                  <input
                    type="date"
                    name="birth_date"
                    value={formData.birth_date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-white font-medium">{formatDate(profile?.birth_date ?? null)}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">País</label>
                {editing ? (
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-white font-medium">{profile?.country || 'Argentina'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                <div className="text-white font-medium">{profile?.email}</div>
                <div className="text-xs text-slate-500 mt-1">El email no se puede modificar</div>
              </div>
            </div>

            {/* Contact & Location */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Contacto y Ubicación</h3>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Teléfono</label>
                {editing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+54 11 1234-5678"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-white font-medium">{profile?.phone || 'No especificado'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Provincia</label>
                {editing ? (
                  <select
                    name="province"
                    value={formData.province}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccionar provincia</option>
                    {provinces.map(province => (
                      <option key={province} value={province}>
                        {province}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-white font-medium">{profile?.province || 'No especificada'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Ciudad</label>
                {editing ? (
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Ej: Concepción del Uruguay"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="text-white font-medium">{profile?.city || 'No especificada'}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Categoría</label>
                {editing ? (
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        Categoría {cat}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-white font-medium">Categoría {profile?.category}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}