// components/ClubScheduleManagement.tsx
'use client'
import { useState, useEffect } from 'react'

interface Court {
  id: string
  name: string
  club_id: string
}

interface ScheduleConfig {
  id: string
  court_id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration: number
  is_active: boolean
}

interface PricingRule {
  id: string
  court_id: string
  start_time: string
  end_time: string
  price: number
  is_peak_hour: boolean
}

interface Reservation {
  id: string
  court_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  reservation_date: string
  start_time: string
  end_time: string
  total_price: number
  status: string
  booking_reference: string
  created_at: string
  court: {
    name: string
  }
}

const ClubScheduleManagement = ({ clubId }: { clubId: string }) => {
  const [courts, setCourts] = useState<Court[]>([])
  const [schedules, setSchedules] = useState<ScheduleConfig[]>([])
  const [pricing, setPricing] = useState<PricingRule[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'schedule' | 'pricing' | 'reservations'>('schedule')

  // Estados para formularios
  const [newSchedule, setNewSchedule] = useState({
    court_id: '',
    day_of_week: 1,
    start_time: '08:00',
    end_time: '22:00',
    slot_duration: 60
  })

  const [newPricing, setNewPricing] = useState({
    court_id: '',
    start_time: '08:00',
    end_time: '18:00',
    price: 25,
    is_peak_hour: false
  })

  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

  // Cargar datos iniciales
  useEffect(() => {
    Promise.all([
      loadCourts(),
      loadSchedules(),
      loadPricing(),
      loadReservations()
    ]).finally(() => setLoading(false))
  }, [clubId])

  const loadCourts = async () => {
    try {
      const res = await fetch(`/api/courts?club_id=${clubId}`)
      const data = await res.json()
      setCourts(data.courts || [])
    } catch (error) {
      console.error('Error loading courts:', error)
    }
  }

  const loadSchedules = async () => {
    try {
      const res = await fetch(`/api/admin/schedules?club_id=${clubId}`)
      const data = await res.json()
      setSchedules(data.schedules || [])
    } catch (error) {
      console.error('Error loading schedules:', error)
    }
  }

  const loadPricing = async () => {
    try {
      const res = await fetch(`/api/admin/pricing?club_id=${clubId}`)
      const data = await res.json()
      setPricing(data.pricing || [])
    } catch (error) {
      console.error('Error loading pricing:', error)
    }
  }

  const loadReservations = async () => {
    try {
      const res = await fetch(`/api/admin/reservations?club_id=${clubId}`)
      const data = await res.json()
      setReservations(data.reservations || [])
    } catch (error) {
      console.error('Error loading reservations:', error)
    }
  }

  // Crear horario disponible
  const createSchedule = async () => {
    try {
      const res = await fetch('/api/admin/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSchedule)
      })
      
      if (res.ok) {
        await loadSchedules()
        setNewSchedule({
          court_id: '',
          day_of_week: 1,
          start_time: '08:00',
          end_time: '22:00',
          slot_duration: 60
        })
      }
    } catch (error) {
      console.error('Error creating schedule:', error)
    }
  }

  // Crear regla de precios
  const createPricing = async () => {
    try {
      const res = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPricing)
      })
      
      if (res.ok) {
        await loadPricing()
        setNewPricing({
          court_id: '',
          start_time: '08:00',
          end_time: '18:00',
          price: 25,
          is_peak_hour: false
        })
      }
    } catch (error) {
      console.error('Error creating pricing:', error)
    }
  }

  // Toggle disponibilidad de horario
  const toggleSchedule = async (scheduleId: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      })
      await loadSchedules()
    } catch (error) {
      console.error('Error toggling schedule:', error)
    }
  }

  // Cancelar reserva
  const cancelReservation = async (reservationId: string) => {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return
    
    try {
      await fetch(`/api/admin/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      })
      await loadReservations()
    } catch (error) {
      console.error('Error cancelling reservation:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px',
        color: '#94a3b8'
      }}>
        Cargando gestión de horarios...
      </div>
    )
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ color: 'white', marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
        Gestión de Horarios y Reservas
      </h2>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {[
          { key: 'schedule', label: 'Horarios Disponibles' },
          { key: 'pricing', label: 'Precios' },
          { key: 'reservations', label: 'Reservas Activas' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '12px 24px',
              background: activeTab === tab.key ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #10b981' : '2px solid transparent',
              color: activeTab === tab.key ? '#10b981' : '#94a3b8',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'schedule' && (
        <div>
          {/* Crear nuevo horario */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '18px' }}>
              Configurar Horarios Disponibles
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '6px', fontSize: '14px' }}>
                  Cancha
                </label>
                <select
                  value={newSchedule.court_id}
                  onChange={e => setNewSchedule(prev => ({ ...prev, court_id: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Seleccionar cancha</option>
                  {courts.map(court => (
                    <option key={court.id} value={court.id}>{court.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '6px', fontSize: '14px' }}>
                  Día de la semana
                </label>
                <select
                  value={newSchedule.day_of_week}
                  onChange={e => setNewSchedule(prev => ({ ...prev, day_of_week: parseInt(e.target.value) }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  {dayNames.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '6px', fontSize: '14px' }}>
                  Hora inicio
                </label>
                <input
                  type="time"
                  value={newSchedule.start_time}
                  onChange={e => setNewSchedule(prev => ({ ...prev, start_time: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '6px', fontSize: '14px' }}>
                  Hora fin
                </label>
                <input
                  type="time"
                  value={newSchedule.end_time}
                  onChange={e => setNewSchedule(prev => ({ ...prev, end_time: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '6px', fontSize: '14px' }}>
                  Duración por slot (min)
                </label>
                <select
                  value={newSchedule.slot_duration}
                  onChange={e => setNewSchedule(prev => ({ ...prev, slot_duration: parseInt(e.target.value) }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value={60}>60 minutos</option>
                  <option value={90}>90 minutos</option>
                  <option value={120}>120 minutos</option>
                </select>
              </div>
            </div>

            <button
              onClick={createSchedule}
              disabled={!newSchedule.court_id}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: newSchedule.court_id ? 'pointer' : 'not-allowed',
                opacity: newSchedule.court_id ? 1 : 0.5,
                transition: 'all 0.2s ease'
              }}
            >
              Crear Horario
            </button>
          </div>

          {/* Lista de horarios existentes */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '18px' }}>
              Horarios Configurados
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {schedules.map(schedule => {
                const court = courts.find(c => c.id === schedule.court_id)
                return (
                  <div
                    key={schedule.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div>
                      <div style={{ color: 'white', fontWeight: '600', marginBottom: '4px' }}>
                        {court?.name} - {dayNames[schedule.day_of_week]}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                        {schedule.start_time} - {schedule.end_time} ({schedule.slot_duration}min por slot)
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500',
                          background: schedule.is_active 
                            ? 'rgba(16, 185, 129, 0.2)' 
                            : 'rgba(107, 114, 128, 0.2)',
                          color: schedule.is_active ? '#10b981' : '#6b7280'
                        }}
                      >
                        {schedule.is_active ? 'Activo' : 'Inactivo'}
                      </div>
                      <button
                        onClick={() => toggleSchedule(schedule.id, schedule.is_active)}
                        style={{
                          background: schedule.is_active 
                            ? 'rgba(239, 68, 68, 0.2)' 
                            : 'rgba(16, 185, 129, 0.2)',
                          border: `1px solid ${schedule.is_active ? '#ef4444' : '#10b981'}`,
                          borderRadius: '6px',
                          padding: '6px 12px',
                          color: schedule.is_active ? '#ef4444' : '#10b981',
                          fontSize: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {schedule.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                )
              })}
              
              {schedules.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#94a3b8'
                }}>
                  No hay horarios configurados aún
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div>
          {/* Crear nueva regla de precios */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '18px' }}>
              Configurar Precios
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '6px', fontSize: '14px' }}>
                  Cancha
                </label>
                <select
                  value={newPricing.court_id}
                  onChange={e => setNewPricing(prev => ({ ...prev, court_id: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Seleccionar cancha</option>
                  {courts.map(court => (
                    <option key={court.id} value={court.id}>{court.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '6px', fontSize: '14px' }}>
                  Hora inicio
                </label>
                <input
                  type="time"
                  value={newPricing.start_time}
                  onChange={e => setNewPricing(prev => ({ ...prev, start_time: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '6px', fontSize: '14px' }}>
                  Hora fin
                </label>
                <input
                  type="time"
                  value={newPricing.end_time}
                  onChange={e => setNewPricing(prev => ({ ...prev, end_time: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '6px', fontSize: '14px' }}>
                  Precio (€)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={newPricing.price}
                  onChange={e => setNewPricing(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '28px' }}>
                <input
                  type="checkbox"
                  checked={newPricing.is_peak_hour}
                  onChange={e => setNewPricing(prev => ({ ...prev, is_peak_hour: e.target.checked }))}
                  style={{ marginRight: '8px' }}
                />
                <label style={{ color: '#e2e8f0', fontSize: '14px' }}>
                  Es hora pico
                </label>
              </div>
            </div>

            <button
              onClick={createPricing}
              disabled={!newPricing.court_id || !newPricing.price}
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: (newPricing.court_id && newPricing.price) ? 'pointer' : 'not-allowed',
                opacity: (newPricing.court_id && newPricing.price) ? 1 : 0.5,
                transition: 'all 0.2s ease'
              }}
            >
              Crear Regla de Precios
            </button>
          </div>

          {/* Lista de precios existentes */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '18px' }}>
              Precios Configurados
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {pricing.map(price => {
                const court = courts.find(c => c.id === price.court_id)
                return (
                  <div
                    key={price.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div>
                      <div style={{ color: 'white', fontWeight: '600', marginBottom: '4px' }}>
                        {court?.name}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                        {price.start_time} - {price.end_time}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ color: '#10b981', fontWeight: '600', fontSize: '18px' }}>
                        €{price.price}
                      </div>
                      {price.is_peak_hour && (
                        <div
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: 'rgba(251, 191, 36, 0.2)',
                            color: '#fbbf24'
                          }}
                        >
                          Hora Pico
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {pricing.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#94a3b8'
                }}>
                  No hay reglas de precios configuradas aún
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reservations' && (
        <div>
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '18px' }}>
              Reservas Activas ({reservations.filter(r => r.status === 'confirmed').length})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reservations
                .filter(r => r.status === 'confirmed')
                .sort((a, b) => new Date(a.reservation_date).getTime() - new Date(b.reservation_date).getTime())
                .map(reservation => (
                <div
                  key={reservation.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontWeight: '600', marginBottom: '4px' }}>
                      {reservation.customer_name} - {reservation.court.name}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                      {new Date(reservation.reservation_date).toLocaleDateString('es-ES')} | {reservation.start_time} - {reservation.end_time}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>
                      {reservation.customer_email} | {reservation.customer_phone} | Ref: {reservation.booking_reference}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ color: '#10b981', fontWeight: '600' }}>
                      €{reservation.total_price}
                    </div>
                    <button
                      onClick={() => cancelReservation(reservation.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        borderRadius: '6px',
                        padding: '6px 12px',
                        color: '#ef4444',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ))}
              
              {reservations.filter(r => r.status === 'confirmed').length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#94a3b8'
                }}>
                  No hay reservas activas
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClubScheduleManagement