'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Reservation = {
  id: string
  user_id: string
  club_id: string
  court_id: string
  scheduled_at: string
  duration_hours: number
  total_price: number
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  notes: string | null
  created_at: string
  player_profiles: {
    first_name: string
    last_name: string
    phone: string | null
  } | null
  courts: {
    name: string
    surface_type: string
  } | null
}

type ClubProfile = {
  id: string
  name: string
}

export default function ReservationsPage() {
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [club, setClub] = useState<ClubProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'today'>('all')
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)

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
      await loadReservations(clubProfile.id)
      
    } catch (error) {
      console.error('Error checking auth:', error)
      router.replace('/clubs/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadReservations(clubId: string) {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select(`
          *,
          player_profiles:user_id (
            first_name,
            last_name,
            phone
          ),
          courts:court_id (
            name,
            surface_type
          )
        `)
        .eq('club_id', clubId)
        .order('scheduled_at', { ascending: false })

      if (error) throw error
      setReservations(data || [])
    } catch (error) {
      console.error('Error loading reservations:', error)
    }
  }

  async function updateReservationStatus(reservationId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ status: newStatus })
        .eq('id', reservationId)

      if (error) throw error
      
      // Actualizar estado local
      setReservations(reservations.map(r => 
        r.id === reservationId ? { ...r, status: newStatus as any } : r
      ))
      
      setSelectedReservation(null)
    } catch (error) {
      console.error('Error updating reservation:', error)
      alert('Error al actualizar la reserva')
    }
  }

  function getFilteredReservations() {
    const today = new Date().toISOString().split('T')[0]
    
    switch (filter) {
      case 'pending':
        return reservations.filter(r => r.status === 'pending')
      case 'confirmed':
        return reservations.filter(r => r.status === 'confirmed')
      case 'today':
        return reservations.filter(r => r.scheduled_at.startsWith(today))
      default:
        return reservations
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'completed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'confirmed': return 'Confirmada'
      case 'pending': return 'Pendiente'
      case 'cancelled': return 'Cancelada'
      case 'completed': return 'Completada'
      default: return status
    }
  }

  function formatDateTime(dateString: string) {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('es-ES', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short' 
      }),
      time: date.toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center">
        <div className="text-slate-300 text-lg">Cargando reservas...</div>
      </div>
    )
  }

  const filteredReservations = getFilteredReservations()

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestión de Reservas</h1>
            <p className="text-slate-400">
              Administra las reservas de {club?.name}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          {[
            { key: 'all', label: 'Todas', count: reservations.length },
            { key: 'pending', label: 'Pendientes', count: reservations.filter(r => r.status === 'pending').length },
            { key: 'confirmed', label: 'Confirmadas', count: reservations.filter(r => r.status === 'confirmed').length },
            { key: 'today', label: 'Hoy', count: reservations.filter(r => r.scheduled_at.startsWith(new Date().toISOString().split('T')[0])).length }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === key
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>

        {/* Reservations List */}
        {filteredReservations.length > 0 ? (
          <div className="space-y-4">
            {filteredReservations.map((reservation) => {
              const { date, time } = formatDateTime(reservation.scheduled_at)
              const playerName = reservation.player_profiles 
                ? `${reservation.player_profiles.first_name} ${reservation.player_profiles.last_name}`
                : 'Usuario desconocido'

              return (
                <div
                  key={reservation.id}
                  className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <h3 className="text-lg font-semibold text-white">
                          {reservation.courts?.name || 'Cancha no especificada'}
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(reservation.status)}`}>
                          {getStatusLabel(reservation.status)}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">Jugador:</span>
                          <div className="text-white font-medium">{playerName}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Fecha:</span>
                          <div className="text-white font-medium">{date}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Hora:</span>
                          <div className="text-white font-medium">{time}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Duración:</span>
                          <div className="text-white font-medium">{reservation.duration_hours}h</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-3">
                        <div>
                          <span className="text-slate-400">Teléfono:</span>
                          <div className="text-white font-medium">
                            {reservation.player_profiles?.phone || 'No especificado'}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-400">Precio Total:</span>
                          <div className="text-white font-medium">${reservation.total_price}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Superficie:</span>
                          <div className="text-white font-medium">
                            {reservation.courts?.surface_type || 'No especificada'}
                          </div>
                        </div>
                      </div>

                      {reservation.notes && (
                        <div className="mt-3">
                          <span className="text-slate-400 text-sm">Notas:</span>
                          <div className="text-white text-sm mt-1">{reservation.notes}</div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-6">
                      {reservation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateReservationStatus(reservation.id, 'confirmed')}
                            className="px-4 py-2 bg-green-500/20 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors text-sm font-medium"
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => updateReservationStatus(reservation.id, 'cancelled')}
                            className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm font-medium"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                      
                      {reservation.status === 'confirmed' && (
                        <button
                          onClick={() => updateReservationStatus(reservation.id, 'completed')}
                          className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-medium"
                        >
                          Marcar Completada
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedReservation(reservation)}
                        className="px-4 py-2 bg-slate-500/20 border border-slate-500/30 text-slate-400 rounded-lg hover:bg-slate-500/30 transition-colors text-sm font-medium"
                      >
                        Ver Detalles
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">📅</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay reservas {filter !== 'all' ? `con filtro "${filter}"` : ''}
            </h3>
            <p className="text-slate-400">
              {filter === 'all' 
                ? 'Las reservas aparecerán aquí cuando los jugadores hagan reservas.'
                : 'Cambia el filtro para ver otras reservas.'
              }
            </p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedReservation && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg border border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Detalles de la Reserva</h3>
                <button
                  onClick={() => setSelectedReservation(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <span className="text-slate-400">ID de Reserva:</span>
                  <div className="text-white font-mono text-sm">{selectedReservation.id}</div>
                </div>
                
                <div>
                  <span className="text-slate-400">Creada el:</span>
                  <div className="text-white">
                    {new Date(selectedReservation.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {selectedReservation.notes && (
                  <div>
                    <span className="text-slate-400">Notas completas:</span>
                    <div className="text-white bg-slate-900 p-3 rounded-lg mt-1">
                      {selectedReservation.notes}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setSelectedReservation(null)}
                    className="flex-1 py-3 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}