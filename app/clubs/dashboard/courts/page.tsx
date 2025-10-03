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
  club_id: string
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
    hourly_rate: 25,
  })

  const surfaceTypes = [
    { value: 'artificial_grass', label: 'Césped Artificial' },
    { value: 'cement', label: 'Cemento' },
    { value: 'clay', label: 'Polvo de Ladrillo' },
    { value: 'indoor', label: 'Indoor' },
  ]

  useEffect(() => { checkAuthAndLoadData() }, [])

  async function checkAuthAndLoadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.replace('/clubs/auth/login')

      const { data: clubProfile, error } = await supabase
        .from('club_profiles')
        .select('id, name, club_id')
        .eq('id', user.id)
        .single()

      if (error || !clubProfile) return router.replace('/clubs/auth/login')

      setClub(clubProfile)
      await loadCourts(clubProfile.club_id)
    } catch (e) {
      console.error('Error checking auth:', e)
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
    } catch (e) {
      console.error('Error loading courts:', e)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hourly_rate' ? Number(value) : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!club) return

    try {
      if (editingCourt) {
        const { error } = await supabase
          .from('courts')
          .update({
            name: formData.name,
            surface_type: formData.surface_type,
            hourly_rate: formData.hourly_rate,
          })
          .eq('id', editingCourt.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('courts')
          .insert({
            club_id: club.club_id,
            name: formData.name,
            surface_type: formData.surface_type,
            hourly_rate: formData.hourly_rate,
            is_active: true,
          })
        if (error) throw error
      }

      await loadCourts(club.club_id)
      setFormData({ name: '', surface_type: 'artificial_grass', hourly_rate: 25 })
      setShowAddForm(false)
      setEditingCourt(null)
    } catch (e) {
      console.error('Error saving court:', e)
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
      setCourts(courts.map(c => (c.id === court.id ? { ...c, is_active: !c.is_active } : c)))
    } catch (e) {
      console.error('Error updating court status:', e)
      alert('Error al cambiar el estado de la cancha')
    }
  }

  async function deleteCourt(courtId: string) {
    if (!confirm('¿Eliminar esta cancha?')) return
    try {
      const { error } = await supabase.from('courts').delete().eq('id', courtId)
      if (error) throw error
      setCourts(courts.filter(c => c.id !== courtId))
    } catch (e) {
      console.error('Error deleting court:', e)
      alert('Error al eliminar la cancha')
    }
  }

  function startEdit(court: Court) {
    setEditingCourt(court)
    setFormData({
      name: court.name,
      surface_type: court.surface_type,
      hourly_rate: court.hourly_rate,
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-600 text-lg">Cargando canchas…</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold heading-gradient">Gestión de Canchas</h1>
            <p className="text-slate-600">Administra las canchas de {club?.name}</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-gradient"
          >
            + Agregar Cancha
          </button>
        </div>

        {/* Modal Add/Edit */}
        {showAddForm && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
            <div className="glass-card w-full max-w-md p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-4">
                {editingCourt ? 'Editar Cancha' : 'Agregar Nueva Cancha'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Nombre de la Cancha
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="field-glass"
                    placeholder="Ej: Cancha principal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo de Superficie
                  </label>
                  <select
                    name="surface_type"
                    value={formData.surface_type}
                    onChange={handleInputChange}
                    className="select-glass"
                  >
                    {surfaceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
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
                    className="field-glass"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="btn-gradient flex-1"
                  >
                    {editingCourt ? 'Actualizar' : 'Agregar'} Cancha
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn-ghost"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Lista de canchas */}
        {courts.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courts.map((court) => (
              <div
                key={court.id}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">{court.name}</h3>
                  <span className={`pill ${court.is_active ? 'pill-success' : 'pill-danger'}`}>
                    {court.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Superficie:</span>
                    <span className="text-slate-900">
                      {surfaceTypes.find((t) => t.value === court.surface_type)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Precio/hora:</span>
                    <span className="text-slate-900 font-semibold">${court.hourly_rate}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(court)}
                    className="btn-ghost flex-1"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleCourtStatus(court)}
                    className={`btn-ghost flex-1 ${court.is_active ? 'text-amber-700' : 'text-emerald-700'}`}
                  >
                    {court.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => deleteCourt(court.id)}
                    className="btn-ghost text-rose-700"
                  >
                    Eliminar
                  </button>
                </div>
                {/* Agregar el nuevo botón de horarios */}
                <div className="mt-2">
                  <a
                    href={`/clubs/dashboard/schedules?court=${court.id}`}
                    className="btn-ghost w-full text-center"
                  >
                    Configurar horarios
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-600">No hay canchas registradas aún.</div>
        )}
      </div>
    </div>
  )
}
