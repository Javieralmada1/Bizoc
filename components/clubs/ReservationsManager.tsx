'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Reservation = {
  id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  reservation_date: string
  start_time: string
  end_time: string
  status: string
  notes: string
  court: { name: string }
  club: { name: string }
}

export default function ReservationsManager() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReservations()
  }, [])

  async function loadReservations() {
    const { data } = await supabase
      .from('reservations')
      .select(`
        id, customer_name, customer_email, customer_phone,
        reservation_date, start_time, end_time, status, notes,
        court:courts(name),
        club:clubs(name)
      `)
      .order('reservation_date', { ascending: false })
      .order('start_time', { ascending: false })
    
    if (data) {
      setReservations(
        data.map((r: any) => ({
          ...r,
          court: Array.isArray(r.court) ? r.court[0] : r.court,
          club: Array.isArray(r.club) ? r.club[0] : r.club,
        }))
      )
    }
    setLoading(false)
  }

  async function updateStatus(id: string, newStatus: string) {
    await supabase
      .from('reservations')
      .update({ status: newStatus })
      .eq('id', id)
    await loadReservations()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.3)', color: '#86efac' }
      case 'pending': return { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', color: '#fbbf24' }
      case 'cancelled': return { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }
      default: return { bg: 'rgba(156, 163, 175, 0.1)', border: 'rgba(156, 163, 175, 0.3)', color: '#9ca3af' }
    }
  }

  if (loading) return <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>Cargando reservas...</div>

  return (
    <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
      {reservations.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
          <p>No hay reservas aún</p>
          <small>Las reservas de los jugadores aparecerán aquí</small>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {reservations.map(reservation => {
            const statusStyle = getStatusColor(reservation.status)
            return (
              <div key={reservation.id} style={{ 
                background: 'rgba(255, 255, 255, 0.05)', 
                border: '1px solid rgba(255, 255, 255, 0.1)', 
                borderRadius: '12px', 
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '20px',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600' }}>
                        {reservation.customer_name}
                      </h4>
                      <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0', fontSize: '14px' }}>
                        {reservation.customer_email} • {reservation.customer_phone}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'white', margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>
                        {new Date(reservation.reservation_date).toLocaleDateString('es-ES')}
                      </p>
                      <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0', fontSize: '14px' }}>
                        {reservation.start_time?.slice(0, 5)} - {reservation.end_time?.slice(0, 5)}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: 'white', margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>
                        {reservation.court?.name}
                      </p>
                      {reservation.notes && (
                        <p style={{ color: 'rgba(255,255,255,0.7)', margin: '0', fontSize: '12px' }}>
                          {reservation.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <span style={{
                    ...statusStyle,
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    border: `1px solid ${statusStyle.border}`,
                    background: statusStyle.bg
                  }}>
                    {reservation.status === 'pending' ? 'Pendiente' : 
                     reservation.status === 'confirmed' ? 'Confirmada' : 
                     reservation.status === 'cancelled' ? 'Cancelada' : reservation.status}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {reservation.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateStatus(reservation.id, 'confirmed')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(34, 197, 94, 0.3)',
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#86efac',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => updateStatus(reservation.id, 'cancelled')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#fca5a5',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}