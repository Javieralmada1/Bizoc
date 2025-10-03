'use client'
import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'

// Tipos
type Club = { 
  id: string
  name: string
  province: string | null
  city: string | null
  address?: string
  phone?: string
}

type Court = { 
  id: string
  name: string
  club_id: string
  surface_type: string
  hourly_rate: number
  is_active: boolean
}

type TimeSlot = { 
  start: string
  end: string
  available: boolean
  price: number
  is_peak_hour: boolean
  status: 'available' | 'occupied' | 'held'
  booking_info?: {
    customer_name?: string
    booking_reference?: string
  }
}

const ReservationSystemImproved = () => {
  // Estados principales
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  
  // Estados de datos
  const [clubs, setClubs] = useState<Club[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loadingClubs, setLoadingClubs] = useState(true)
  const [loadingCourts, setLoadingCourts] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Estados de filtros
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [clubId, setClubId] = useState('')
  const [courtId, setCourtId] = useState('')
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    jugadores: '2 jugadores'
  })
  
  // Estados de UI
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const idempotencyKeyRef = useRef<string>('')

  // Generar clave de idempotencia inicial
  useEffect(() => {
    idempotencyKeyRef.current = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }, [])

  // Cargar clubes al inicio
  useEffect(() => {
    loadClubs()
  }, [])

  // Cargar canchas cuando cambia el club
  useEffect(() => {
    if (clubId) {
      loadCourts(clubId)
    } else {
      setCourts([])
      setCourtId('')
    }
  }, [clubId])

  // Cargar slots cuando cambian cancha y fecha
  useEffect(() => {
    if (courtId && selectedDate) {
      loadSlots(courtId, selectedDate)
    } else {
      setSlots([])
      setSelectedTime(null)
    }
  }, [courtId, selectedDate])

  // Funciones de carga
  const loadClubs = async () => {
    setLoadingClubs(true)
    try {
      const response = await fetch('/api/clubs')
      const data = await response.json()
      setClubs(data.clubs || [])
    } catch (err) {
      console.error('Error loading clubs:', err)
      setError('Error al cargar los clubes')
    } finally {
      setLoadingClubs(false)
    }
  }

  const loadCourts = async (clubId: string) => {
    setLoadingCourts(true)
    try {
      const response = await fetch(`/api/courts?club_id=${clubId}`)
      const data = await response.json()
      const activeCourts = (data.courts || []).filter((c: Court) => c.is_active)
      setCourts(activeCourts)
      
      if (activeCourts.length === 0) {
        setError('Este club no tiene canchas disponibles')
      }
    } catch (err) {
      console.error('Error loading courts:', err)
      setError('Error al cargar las canchas')
      setCourts([])
    } finally {
      setLoadingCourts(false)
    }
  }

  const loadSlots = async (courtId: string, date: Date) => {
    setLoadingSlots(true)
    setError('')
    const dateStr = date.toISOString().slice(0, 10)
    
    try {
      const response = await fetch(`/api/schedules?court_id=${courtId}&date=${dateStr}`)
      const data = await response.json()
      
      if (response.ok) {
        setSlots(data.slots || [])
        setLastRefresh(new Date())
        
        if (!data.slots || data.slots.length === 0) {
          setError('No hay horarios disponibles para esta fecha')
        }
      } else {
        setError(data.error || 'Error al cargar horarios')
        setSlots([])
      }
    } catch (err) {
      console.error('Error loading slots:', err)
      setError('Error al cargar los horarios disponibles')
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  // Datos computados para filtros
  const provinces = useMemo(() => {
    const uniqueProvinces = Array.from(
      new Set(clubs.map(c => c.province).filter(Boolean))
    ) as string[]
    return uniqueProvinces.sort()
  }, [clubs])

  const cities = useMemo(() => {
    const filteredClubs = province 
      ? clubs.filter(c => c.province === province)
      : clubs
    const uniqueCities = Array.from(
      new Set(filteredClubs.map(c => c.city).filter(Boolean))
    ) as string[]
    return uniqueCities.sort()
  }, [clubs, province])

  const filteredClubs = useMemo(() => {
    return clubs.filter(c => {
      if (province && c.province !== province) return false
      if (city && c.city !== city) return false
      return true
    })
  }, [clubs, province, city])

  // Handlers de filtros
  const handleProvinceChange = (newProvince: string) => {
    setProvince(newProvince)
    setCity('')
    setClubId('')
    setCourtId('')
    setSelectedDate(null)
    setSelectedTime(null)
    setError('')
    setSuccess('')
  }

  const handleCityChange = (newCity: string) => {
    setCity(newCity)
    setClubId('')
    setCourtId('')
    setSelectedDate(null)
    setSelectedTime(null)
    setError('')
    setSuccess('')
  }

  const handleClubChange = (newClubId: string) => {
    setClubId(newClubId)
    setCourtId('')
    setSelectedDate(null)
    setSelectedTime(null)
    setError('')
    setSuccess('')
  }

  const handleCourtChange = (newCourtId: string) => {
    setCourtId(newCourtId)
    setSelectedDate(null)
    setSelectedTime(null)
    setError('')
    setSuccess('')
  }

  // Manejo del calendario
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days: (number | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day)
    }
    return days
  }

  const isToday = (day: number | null) => {
    if (!day) return false
    const today = new Date()
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    return date.toDateString() === today.toDateString()
  }

  const isPast = (day: number | null) => {
    if (!day) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    date.setHours(0, 0, 0, 0)
    return date < today
  }

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    setSelectedDate(newDate)
    setSelectedTime(null)
    setError('')
    setSuccess('')
  }

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    setError('')
    setSuccess('')
  }

  // Confirmar reserva
  const confirmarReserva = async () => {
    // Validaciones
    if (!selectedDate || !selectedTime || !courtId || !clubId) {
      setError('Por favor completa todos los campos requeridos')
      return
    }

    if (!formData.nombre || !formData.email || !formData.telefono) {
      setError('Por favor completa tus datos de contacto')
      return
    }

    setSaving(true)
    setError('')

    const selectedSlot = slots.find(s => {
      const slotTime = new Date(s.start).toTimeString().slice(0, 5)
      return slotTime === selectedTime
    })

    if (!selectedSlot || !selectedSlot.available) {
      setError('El horario seleccionado ya no está disponible')
      setSaving(false)
      if (courtId && selectedDate) {
        loadSlots(courtId, selectedDate)
      }
      return
    }

    try {
      const reservationData = {
        club_id: clubId,
        court_id: courtId,
        customer_name: formData.nombre,
        customer_email: formData.email,
        customer_phone: formData.telefono,
        reservation_date: selectedDate.toISOString().slice(0, 10),
        start_time: selectedSlot.start.slice(11, 16),
        end_time: selectedSlot.end.slice(11, 16),
        duration_hours: 1,
        total_price: selectedSlot.price,
        notes: formData.jugadores,
        idempotency_key: idempotencyKeyRef.current
      }

      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservationData)
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(`¡Reserva confirmada! Referencia: ${data.booking_reference}. Te enviaremos un email de confirmación.`)
        
        // Resetear formulario
        setSelectedDate(null)
        setSelectedTime(null)
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          jugadores: '2 jugadores'
        })
        
        // Generar nueva clave
        idempotencyKeyRef.current = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Recargar slots
        setTimeout(() => {
          if (courtId && selectedDate) {
            loadSlots(courtId, selectedDate)
          }
        }, 1000)
      } else {
        if (response.status === 409) {
          setError(data.error || 'Este horario ya fue reservado. Por favor selecciona otro.')
          if (courtId && selectedDate) {
            loadSlots(courtId, selectedDate)
          }
          setSelectedTime(null)
        } else {
          setError(data.error || 'Error al crear la reserva')
        }
      }
    } catch (err) {
      setError('Error de conexión. Por favor intenta de nuevo.')
      console.error('Booking error:', err)
    } finally {
      setSaving(false)
    }
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      padding: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 30px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '20px 30px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px'
          }}>
            🎾
          </div>
          <div>
            <h1 style={{
              color: '#10b981',
              fontSize: '28px',
              fontWeight: '700',
              margin: '0',
              letterSpacing: '-0.5px'
            }}>
              PadelReservas
            </h1>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              margin: '0'
            }}>
              Reserva tu cancha en segundos
            </p>
          </div>
        </div>
        
        {lastRefresh && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#94a3b8',
            fontSize: '13px'
          }}>
            <span>🔄</span>
            <span>Actualizado: {lastRefresh.toLocaleTimeString()}</span>
          </div>
        )}
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Filtros de Ubicación */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>📍</span>
            Selecciona tu ubicación
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {/* Provincia */}
            <div>
              <label style={{
                display: 'block',
                color: '#e2e8f0',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Provincia *
              </label>
              <select
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                disabled={loadingClubs}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="">Todas las provincias</option>
                {provinces.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            {/* Ciudad */}
            <div>
              <label style={{
                display: 'block',
                color: '#e2e8f0',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Ciudad *
              </label>
              <select
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={loadingClubs || !province}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  opacity: !province ? 0.5 : 1
                }}
              >
                <option value="">Todas las ciudades</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Club */}
            <div>
              <label style={{
                display: 'block',
                color: '#e2e8f0',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Club *
              </label>
              <select
                value={clubId}
                onChange={(e) => handleClubChange(e.target.value)}
                disabled={loadingClubs || filteredClubs.length === 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  opacity: filteredClubs.length === 0 ? 0.5 : 1
                }}
              >
                <option value="">Selecciona un club</option>
                {filteredClubs.map(club => (
                  <option key={club.id} value={club.id}>
                    {club.name} {club.city && `- ${club.city}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Cancha */}
            <div>
              <label style={{
                display: 'block',
                color: '#e2e8f0',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '8px'
              }}>
                Cancha *
              </label>
              <select
                value={courtId}
                onChange={(e) => handleCourtChange(e.target.value)}
                disabled={!clubId || loadingCourts || courts.length === 0}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  color: 'white',
                  fontSize: '14px',
                  cursor: 'pointer',
                  opacity: !clubId || courts.length === 0 ? 0.5 : 1
                }}
              >
                <option value="">Selecciona una cancha</option>
                {courts.map(court => (
                  <option key={court.id} value={court.id}>
                    {court.name} - ${court.hourly_rate}/hora
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredClubs.length === 0 && province && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: 'rgba(251, 191, 36, 0.1)',
              border: '1px solid rgba(251, 191, 36, 0.3)',
              borderRadius: '8px',
              color: '#fbbf24',
              fontSize: '14px'
            }}>
              No hay clubes disponibles en esta ubicación
            </div>
          )}
        </div>

        {/* Calendario y Horarios */}
        {courtId ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
          }}>
            {/* Calendario */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  ←
                </button>
                <h3 style={{
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  →
                </button>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px',
                marginBottom: '8px'
              }}>
                {dayNames.map(day => (
                  <div key={day} style={{
                    color: '#94a3b8',
                    fontSize: '12px',
                    textAlign: 'center',
                    fontWeight: '500',
                    padding: '8px 0'
                  }}>
                    {day}
                  </div>
                ))}
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '4px'
              }}>
                {getDaysInMonth(currentDate).map((day, index) => (
                  <button
                    key={index}
                    onClick={() => day && !isPast(day) && handleDateSelect(day)}
                    disabled={!day || isPast(day)}
                    style={{
                      background: day && selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth()
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : isToday(day)
                        ? 'rgba(16, 185, 129, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: day && selectedDate && selectedDate.getDate() === day
                        ? '2px solid #10b981'
                        : isToday(day)
                        ? '1px solid #10b981'
                        : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px 4px',
                      color: day && !isPast(day) ? 'white' : '#64748b',
                      fontSize: '14px',
                      cursor: day && !isPast(day) ? 'pointer' : 'not-allowed',
                      opacity: !day || isPast(day) ? 0.4 : 1,
                      transition: 'all 0.2s',
                      minHeight: '44px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: day && selectedDate && selectedDate.getDate() === day ? '600' : '400'
                    }}
                  >
                    {day || ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Horarios */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{
                color: 'white',
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>🕐 Horarios Disponibles</span>
                {loadingSlots && (
                  <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                    Cargando...
                  </span>
                )}
              </h3>

              {!selectedDate ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#94a3b8'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                  <p>Selecciona una fecha del calendario</p>
                </div>
              ) : slots.length === 0 && !loadingSlots ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: '#94a3b8'
                }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                  <p>No hay horarios disponibles para esta fecha</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  maxHeight: '400px',
                  overflowY: 'auto'
                }}>
                  {slots.map((slot, index) => {
                    const time = new Date(slot.start).toTimeString().slice(0, 5)
                    const isSelected = selectedTime === time
                    
                    return (
                      <button
                        key={index}
                        onClick={() => slot.available && handleTimeSelect(time)}
                        disabled={!slot.available}
                        style={{
                          background: isSelected
                            ? 'linear-gradient(135deg, #10b981, #059669)'
                            : slot.available
                            ? 'rgba(16, 185, 129, 0.1)'
                            : 'rgba(239, 68, 68, 0.1)',
                          border: isSelected
                            ? '2px solid #10b981'
                            : slot.available
                            ? '1px solid rgba(16, 185, 129, 0.3)'
                            : '1px solid rgba(239, 68, 68, 0.3)',
                          borderRadius: '8px',
                          padding: '12px',
                          color: slot.available ? 'white' : '#ef4444',
                          fontSize: '14px',
                          cursor: slot.available ? 'pointer' : 'not-allowed',
                          opacity: slot.available ? 1 : 0.6,
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ fontWeight: '600' }}>{time}</div>
                        <div style={{ fontSize: '12px', opacity: 0.8 }}>
                          ${slot.price}
                          {slot.is_peak_hour && ' 🔥'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '60px 40px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎾</div>
            <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '16px', fontWeight: '600' }}>
              Bienvenido a PadelReservas
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '0' }}>
              Selecciona tu ubicación, club y cancha arriba para comenzar tu reserva
            </p>
          </div>
        )}

        {/* Formulario de Reserva */}
        {selectedDate && selectedTime && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{
              color: 'white',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>✍️</span>
              Completa tus datos
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}>
              <div>
                <label style={{
                  display: 'block',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  placeholder="Tu nombre completo"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="tu@email.com"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+54 9 11 1234-5678"
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{
                  display: 'block',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px'
                }}>
                  Número de jugadores
                </label>
                <select
                  value={formData.jugadores}
                  onChange={(e) => setFormData({ ...formData, jugadores: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '10px',
                    color: 'white',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                >
                  <option value="2 jugadores">2 jugadores</option>
                  <option value="3 jugadores">3 jugadores</option>
                  <option value="4 jugadores">4 jugadores</option>
                </select>
              </div>
            </div>

            <button
              onClick={confirmarReserva}
              disabled={saving || !formData.nombre || !formData.email || !formData.telefono}
              style={{
                width: '100%',
                padding: '16px',
                background: saving || !formData.nombre || !formData.email || !formData.telefono
                  ? 'rgba(100, 116, 139, 0.5)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: saving || !formData.nombre || !formData.email || !formData.telefono ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {saving ? '⏳ Procesando...' : '🎾 Confirmar Reserva'}
            </button>

            <p style={{
              color: '#94a3b8',
              fontSize: '13px',
              textAlign: 'center',
              marginTop: '12px',
              marginBottom: '0'
            }}>
              Al confirmar tu reserva aceptas nuestros términos y condiciones.
              Recibirás un email de confirmación con todos los detalles.
            </p>
          </div>
        )}

        {/* Mensajes de Error y Éxito */}
        {error && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            color: '#f87171',
            fontSize: '14px'
          }}>
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div style={{
            marginTop: '20px',
            padding: '16px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            color: '#10b981',
            fontSize: '14px'
          }}>
            ✅ {success}
          </div>
        )}

        {/* Resumen de Reserva */}
        {(selectedDate || selectedTime) && courtId && (
          <div style={{
            marginTop: '24px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '20px',
            color: '#10b981'
          }}>
            <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600' }}>
              📋 Resumen de tu reserva
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              fontSize: '14px'
            }}>
              {clubId && filteredClubs.find(c => c.id === clubId) && (
                <div>
                  <strong>Club:</strong> {filteredClubs.find(c => c.id === clubId)?.name}
                </div>
              )}
              {courtId && courts.find(c => c.id === courtId) && (
                <div>
                  <strong>Cancha:</strong> {courts.find(c => c.id === courtId)?.name}
                </div>
              )}
              {selectedDate && (
                <div>
                  <strong>Fecha:</strong> {selectedDate.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              )}
              {selectedTime && (
                <div>
                  <strong>Horario:</strong> {selectedTime}
                </div>
              )}
              <div>
                <strong>Duración:</strong> 1 hora
              </div>
              {selectedTime && slots.length > 0 && (
                <div>
                  <strong>Precio:</strong> ${slots.find(s => new Date(s.start).toTimeString().slice(0, 5) === selectedTime)?.price || 0}
                  {slots.find(s => new Date(s.start).toTimeString().slice(0, 5) === selectedTime)?.is_peak_hour && ' 🔥 (Hora pico)'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReservationSystemImproved