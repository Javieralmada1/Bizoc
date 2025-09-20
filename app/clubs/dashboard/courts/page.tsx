'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Court = {
  id: string
  name: string
  surface_type: string
  hourly_rate: number
  is_active: boolean
  club_id: string
  created_at: string
}

type ClubProfile = {
  id: string
  name: string
}

export default function CourtsPage() {
  const router = useRouter()
  const [courts, setCourts] = useState<Court[]>([])
  const [club, setClub] = useState<ClubProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCourt, setEditingCourt] = useState<Court | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    surface_type: 'artificial_grass',
    hourly_rate: 25
  })

  const surfaceTypes = [
    { value: 'artificial_grass', label: 'Césped Artificial' },
    { value: 'cement', label: 'Cemento' },
    { value: 'clay', label: 'Polvo de Ladrillo' },
    { value: 'indoor', label: 'Indoor' }
  ]

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  async function checkAuthAndLoadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.replace('/clubs/auth/login')
        return
      }

      // Verificar que es un club
      const { data: clubProfile } = await supabase
        .from('club_profiles')
        .select('id, name')
        .eq('id', user.id)
        .single()

      if (!clubProfile) {
        router.replace('/clubs/auth/login')
        return
      }

      setClub(clubProfile)
      await loadCourts(clubProfile.id)
      
    } catch (error) {
      console.error('Error checking auth:', error)
      router.replace('/clubs/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadCourts(clubId: string) {
    try {
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCourts(data || [])
    } catch (error) {
      console.error('Error loading courts:', error)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hourly_rate' ? Number(value) : value
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!club) return

    try {
      if (editingCourt) {
        // Actualizar cancha existente
        const { error } = await supabase
          .from('courts')
          .update({
            name: formData.name,
            surface_type: formData.surface_type,
            hourly_rate: formData.hourly_rate
          })
          .eq('id', editingCourt.id)

        if (error) throw error
      } else {
        // Crear nueva cancha
        const { error } = await supabase
          .from('courts')
          .insert({
            club_id: club.id,
            name: formData.name,
            surface_type: formData.surface_type,
            hourly_rate: formData.hourly_rate,
            is_active: true
          })

        if (error) throw error
      }

      // Recargar canchas
      await loadCourts(club.id)
      
      // Resetear formulario
      setFormData({ name: '', surface_type: 'artificial_grass', hourly_rate: 25 })
      setShowAddForm(false)
      setEditingCourt(null)
      
    } catch (error) {
      console.error('Error saving court:', error)
      alert('Error al guardar la cancha')
    }
  }

  async function toggleCourtStatus(court: Court) {
    try {
      const { error } = await supabase
        .from('courts')
        .update({ is_active: !court.is_active })
        .eq('id', court.id)

      if (error) throw error
      
      // Actualizar estado local
      setCourts(courts.map(c => 
        c.id === court.id ? { ...c, is_active: !c.is_active } : c
      ))
    } catch (error) {
      console.error('Error updating court status:', error)
      alert('Error al cambiar el estado de la cancha')
    }
  }

  async function deleteCourt(courtId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cancha?')) return

    try {
      const { error } = await supabase
        .from('courts')
        .delete()
        .eq('id', courtId)

      if (error) throw error
      
      setCourts(courts.filter(c => c.id !== courtId))
    } catch (error) {
      console.error('Error deleting court:', error)
      alert('Error al eliminar la cancha')
    }
  }

  function startEdit(court: Court) {
    setEditingCourt(court)
    setFormData({
      name: court.name,
      surface_type: court.surface_type,
      hourly_rate: court.hourly_rate
    })
    setShowAddForm(true)
  }

  function cancelEdit() {
    setEditingCourt(null)
    setFormData({ name: '', surface_type: 'artificial_grass', hourly_rate: 25 })
    setShowAddForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
        <div className="text-slate-300 text-lg">Cargando canchas...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestión de Canchas</h1>
            <p className="text-slate-400">
              Administra las canchas de {club?.name}
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all"
          >
            + Agregar Cancha
          </button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
              <h3 className="text-xl font-semibold text-white mb-4">
                {editingCourt ? 'Editar Cancha' : 'Agregar Nueva Cancha'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Nombre de la Cancha
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ej: Cancha 1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tipo de Superficie
                  </label>
                  <select
                    name="surface_type"
                    value={formData.surface_type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {surfaceTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Precio por Hora ($)
                  </label>
                  <input
                    type="number"
                    name="hourly_rate"
                    value={formData.hourly_rate}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all"
                  >
                    {editingCourt ? 'Actualizar' : 'Agregar'} Cancha
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-6 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Courts List */}
        {courts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courts.map((court) => (
              <div
                key={court.id}
                className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{court.name}</h3>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    court.is_active 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {court.is_active ? 'Activa' : 'Inactiva'}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Superficie:</span>
                    <span className="text-white">
                      {surfaceTypes.find(t => t.value === court.surface_type)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Precio/hora:</span>
                    <span className="text-white font-semibold">${court.hourly_rate}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(court)}
                    className="flex-1 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleCourtStatus(court)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      court.is_active
                        ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
                        : 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
                    }`}
                  >
                    {court.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => deleteCourt(court.id)}
                    className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🏟️</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay canchas registradas
            </h3>
            <p className="text-slate-400 mb-6">
              Comienza agregando tu primera cancha para empezar a recibir reservas.
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all"
            >
              Agregar Primera Cancha
            </button>
          </div>
        )}
      </div>
    </div>
  )
}