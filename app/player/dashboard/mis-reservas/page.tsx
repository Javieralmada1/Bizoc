'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Reservation = {
  id: string
  customer_name: string
  customer_email: string
  reservation_date: string
  start_time: string
  end_time: string
  status: string
  notes: string
  court: { name: string }
  club: { name: string }
}

export default function MisReservasPage() {
  const router = useRouter()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUserReservations()
  }, [])

  async function loadUserReservations() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.replace('/player')
      return
    }
    
    setUser(user)

    // Cargar reservas del usuario actual
    const { data } = await supabase
      .from('reservations')
      .select(`
        id, customer_name, customer_email, reservation_date,
        start_time, end_time, status, notes,
        court:courts(name),
        club:clubs(name)
      `)
      .eq('created_by', user.id)
      .order('reservation_date', { ascending: false })
      .order('start_time', { ascending: false })
    
    if (data) {
      setReservations(
        data.map((reservation: any) => ({
          ...reservation,
          court: Array.isArray(reservation.court) ? reservation.court[0] : reservation.court,
          club: Array.isArray(reservation.club) ? reservation.club[0] : reservation.club,
        }))
      )
    }
    setLoading(false)
  }

  async function cancelReservation(id: string) {
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) return
    
    await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)
    
    await loadUserReservations()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', color: '#86efac' }
      case 'pending': return { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24' }
      case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }
      default: return { bg: 'rgba(156, 163, 175, 0.1)', border: 'rgba(156, 163, 175, 0.3)', color: '#9ca3af' }
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #16a085 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        Cargando tus reservas...
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #16a085 25%, #0f172a 75%, #16a085 100%)',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ color: 'white', fontSize: '24px', margin: '0', fontWeight: '700' }}>
              Mis Reservas
            </h1>
            <p style={{ color: '#9ca3af', margin: '0', fontSize: '14px' }}>
              Gestiona todas tus reservas de canchas
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => router.push('/player/dashboard/reservas')}
              style={{
                background: 'linear-gradient(135deg, #16a085, #10b981)',
                border: 'none',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              + Nueva Reserva
            </button>
            <button
              onClick={() => router.push('/player/dashboard')}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '12px 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              ← Dashboard
            </button>
          </div>
        </div>

        {/* Reservas */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {reservations.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '60px 20px' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>📅</div>
              <h3 style={{ color: 'white', marginBottom: '8px' }}>No tienes reservas aún</h3>
              <p style={{ marginBottom: '24px' }}>¡Haz tu primera reserva y comienza a jugar!</p>
              <button
                onClick={() => router.push('/player/dashboard/reservas')}
                style={{
                  background: 'linear-gradient(135deg, #16a085, #10b981)',
                  border: 'none',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Hacer Reserva
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {reservations.map(reservation => {
                const statusStyle = getStatusColor(reservation.status)
                const isUpcoming = new Date(reservation.reservation_date) >= new Date()
                const canCancel = reservation.status === 'pending' && isUpcoming
                
                return (
                  <div key={reservation.id} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '24px',
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '24px',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ display: 'flex', gap: '24px', marginBottom: '16px' }}>
                        <div>
                          <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>
                            {reservation.club?.name}
                          </h4>
                          <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0', fontSize: '14px' }}>
                            {reservation.court?.name}
                          </p>
                        </div>
                        <div>
                          <h5 style={{ color: '#16a085', margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                            {new Date(reservation.reservation_date).toLocaleDateString('es-ES', { 
                              weekday: 'long', 
                              day: 'numeric', 
                              month: 'long' 
                            })}
                          </h5>
                          <p style={{ color: 'white', margin: '0', fontSize: '14px', fontWeight: '500' }}>
                            {reservation.start_time?.slice(0, 5)} - {reservation.end_time?.slice(0, 5)}
                          </p>
                        </div>
                      </div>
                      {reservation.notes && (
                        <p style={{ color: 'rgba(255,255,255,0.6)', margin: '0', fontSize: '14px', fontStyle: 'italic' }}>
                          "{reservation.notes}"
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end' }}>
                      <span style={{
                        ...statusStyle,
                        padding: '6px 16px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: `1px solid ${statusStyle.border}`,
                        background: statusStyle.bg
                      }}>
                        {reservation.status === 'pending' ? 'Pendiente' : 
                         reservation.status === 'confirmed' ? 'Confirmada' : 
                         reservation.status === 'cancelled' ? 'Cancelada' : reservation.status}
                      </span>
                      {canCancel && (
                        <button
                          onClick={() => cancelReservation(reservation.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#fca5a5',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: '500'
                          }}
                        >
                          Cancelar Reserva
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}