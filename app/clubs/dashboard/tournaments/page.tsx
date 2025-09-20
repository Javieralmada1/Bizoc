'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Tournament = {
  id: string
  name: string
  description: string | null
  category: string
  max_teams: number
  registration_fee: number
  prize_pool: number | null
  registration_deadline: string
  start_date: string
  end_date: string | null
  status: 'draft' | 'registration' | 'active' | 'completed' | 'cancelled'
  club_id: string
  created_at: string
  registered_teams?: number
}

type ClubProfile = {
  id: string
  name: string
}

export default function TournamentsPage() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [club, setClub] = useState<ClubProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '1ª',
    max_teams: 32,
    registration_fee: 50,
    prize_pool: 1000,
    registration_deadline: '',
    start_date: '',
    end_date: ''
  })

  const categories = [
    '1ª', '2ª', '3ª', '4ª', '5ª', '6ª', '7ª', '8ª', '9ª', '10ª', 'Mixta', 'Veteranos'
  ]

  const statusOptions = [
    { value: 'draft', label: 'Borrador', color: 'bg-gray-500/20 text-gray-400' },
    { value: 'registration', label: 'Inscripciones Abiertas', color: 'bg-green-500/20 text-green-400' },
    { value: 'active', label: 'En Curso', color: 'bg-blue-500/20 text-blue-400' },
    { value: 'completed', label: 'Finalizado', color: 'bg-purple-500/20 text-purple-400' },
    { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500/20 text-red-400' }
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
      await loadTournaments(clubProfile.id)
      
    } catch (error) {
      console.error('Error checking auth:', error)
      router.replace('/clubs/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadTournaments(clubId: string) {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTournaments(data || [])
    } catch (error) {
      console.error('Error loading tournaments:', error)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: ['max_teams', 'registration_fee', 'prize_pool'].includes(name) 
        ? Number(value) || 0 
        : value
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!club) return

    try {
      const tournamentData = {
        ...formData,
        club_id: club.id,
        prize_pool: formData.prize_pool || null,
        end_date: formData.end_date || null,
        status: 'draft' as const
      }

      if (editingTournament) {
        const { error } = await supabase
          .from('tournaments')
          .update(tournamentData)
          .eq('id', editingTournament.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('tournaments')
          .insert(tournamentData)

        if (error) throw error
      }

      await loadTournaments(club.id)
      resetForm()
      
    } catch (error) {
      console.error('Error saving tournament:', error)
      alert('Error al guardar el torneo')
    }
  }

  async function updateTournamentStatus(tournamentId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('tournaments')
        .update({ status: newStatus })
        .eq('id', tournamentId)

      if (error) throw error
      
      setTournaments(tournaments.map(t => 
        t.id === tournamentId ? { ...t, status: newStatus as any } : t
      ))
    } catch (error) {
      console.error('Error updating tournament status:', error)
      alert('Error al actualizar el estado del torneo')
    }
  }

  async function deleteTournament(tournamentId: string) {
    if (!confirm('¿Estás seguro de que quieres eliminar este torneo?')) return

    try {
      const { error } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', tournamentId)

      if (error) throw error
      
      setTournaments(tournaments.filter(t => t.id !== tournamentId))
    } catch (error) {
      console.error('Error deleting tournament:', error)
      alert('Error al eliminar el torneo')
    }
  }

  function startEdit(tournament: Tournament) {
    setEditingTournament(tournament)
    setFormData({
      name: tournament.name,
      description: tournament.description || '',
      category: tournament.category,
      max_teams: tournament.max_teams,
      registration_fee: tournament.registration_fee,
      prize_pool: tournament.prize_pool || 0,
      registration_deadline: tournament.registration_deadline.split('T')[0],
      start_date: tournament.start_date.split('T')[0],
      end_date: tournament.end_date ? tournament.end_date.split('T')[0] : ''
    })
    setShowCreateForm(true)
  }

  function resetForm() {
    setEditingTournament(null)
    setFormData({
      name: '',
      description: '',
      category: '1ª',
      max_teams: 32,
      registration_fee: 50,
      prize_pool: 1000,
      registration_deadline: '',
      start_date: '',
      end_date: ''
    })
    setShowCreateForm(false)
  }

  function getStatusDisplay(status: string) {
    const statusInfo = statusOptions.find(s => s.value === status)
    return statusInfo || { label: status, color: 'bg-gray-500/20 text-gray-400' }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
        <div className="text-slate-300 text-lg">Cargando torneos...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestión de Torneos</h1>
            <p className="text-slate-400">
              Administra los torneos de {club?.name}
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
          >
            + Crear Torneo
          </button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-semibold text-white mb-4">
                {editingTournament ? 'Editar Torneo' : 'Crear Nuevo Torneo'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Nombre del Torneo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Copa de Verano 2024"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Descripción
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      placeholder="Descripción del torneo..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Categoría *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>
                          Categoría {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Máximo de Equipos
                    </label>
                    <input
                      type="number"
                      name="max_teams"
                      value={formData.max_teams}
                      onChange={handleInputChange}
                      min="4"
                      max="128"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Costo de Inscripción ($)
                    </label>
                    <input
                      type="number"
                      name="registration_fee"
                      value={formData.registration_fee}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Pozo de Premios ($)
                    </label>
                    <input
                      type="number"
                      name="prize_pool"
                      value={formData.prize_pool}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Fecha Límite de Inscripción *
                    </label>
                    <input
                      type="date"
                      name="registration_deadline"
                      value={formData.registration_deadline}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Fecha de Finalización
                    </label>
                    <input
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
                  >
                    {editingTournament ? 'Actualizar' : 'Crear'} Torneo
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tournaments List */}
        {tournaments.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {tournaments.map((tournament) => {
              const statusDisplay = getStatusDisplay(tournament.status)
              
              return (
                <div
                  key={tournament.id}
                  className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">{tournament.name}</h3>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusDisplay.color} border-opacity-30`}>
                      {statusDisplay.label}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Categoría:</span>
                        <div className="text-white font-medium">{tournament.category}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Equipos:</span>
                        <div className="text-white font-medium">
                          {tournament.registered_teams || 0}/{tournament.max_teams}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Inscripción:</span>
                        <div className="text-white font-medium">${tournament.registration_fee}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Premios:</span>
                        <div className="text-white font-medium">
                          {tournament.prize_pool ? `${tournament.prize_pool}` : 'No definido'}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Inscripciones hasta:</span>
                        <div className="text-white font-medium">
                          {formatDate(tournament.registration_deadline)}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-400">Inicio:</span>
                        <div className="text-white font-medium">
                          {formatDate(tournament.start_date)}
                        </div>
                      </div>
                    </div>

                    {tournament.description && (
                      <div>
                        <span className="text-slate-400 text-sm">Descripción:</span>
                        <div className="text-white text-sm mt-1">{tournament.description}</div>
                      </div>
                    )}
                  </div>

                  {/* Status Management */}
                  {tournament.status === 'draft' && (
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => updateTournamentStatus(tournament.id, 'registration')}
                        className="flex-1 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                      >
                        Abrir Inscripciones
                      </button>
                    </div>
                  )}

                  {tournament.status === 'registration' && (
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => updateTournamentStatus(tournament.id, 'active')}
                        className="flex-1 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
                      >
                        Iniciar Torneo
                      </button>
                      <button
                        onClick={() => updateTournamentStatus(tournament.id, 'draft')}
                        className="px-4 py-2 bg-gray-500/20 border border-gray-500/30 text-gray-400 rounded-lg hover:bg-gray-500/30 transition-colors text-sm font-medium"
                      >
                        Pausar
                      </button>
                    </div>
                  )}

                  {tournament.status === 'active' && (
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => updateTournamentStatus(tournament.id, 'completed')}
                        className="flex-1 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm font-medium"
                      >
                        Finalizar Torneo
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(tournament)}
                      className="flex-1 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
                    >
                      Editar
                    </button>
                    
                    {tournament.status === 'draft' && (
                      <button
                        onClick={() => deleteTournament(tournament.id)}
                        className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                      >
                        Eliminar
                      </button>
                    )}
                    
                    {tournament.status !== 'cancelled' && tournament.status !== 'completed' && (
                      <button
                        onClick={() => updateTournamentStatus(tournament.id, 'cancelled')}
                        className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🏆</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay torneos creados
            </h3>
            <p className="text-slate-400 mb-6">
              Comienza creando tu primer torneo para atraer más jugadores a tu club.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all"
            >
              Crear Primer Torneo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}