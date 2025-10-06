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
  const [loadingClubs, setLoadingClubs] = useState(false) // Inicializado a false
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
    setLoadingClubs(true) // Set loading here, después del montaje
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
    setError('')
    try {
      const response = await fetch(`/api/courts?club_id=${clubId}`)
      const data = await response.json()
      
      // EL FILTRO FUNCIONA AHORA QUE LA API DEVUELVE is_active
      const allCourts = data.courts || []
      const activeCourts = allCourts.filter((c: Court) => c.is_active)
      setCourts(activeCourts)
      setCourtId(activeCourts[0]?.id ?? '') // Selecciona la primera cancha activa
      
      if (allCourts.length > 0 && activeCourts.length === 0) {
        setError('Todas las canchas de este club están inactivas o llenas.')
      } else if (allCourts.length === 0) {
        setError('Este club no tiene canchas registradas.')
      } else if (activeCourts.length > 0) {
          setError('') // Éxito en carga de canchas
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
      // Endpoint corregido en la pregunta anterior
      const response = await fetch(`/api/schedules?courtId=${courtId}&date=${dateStr}`)
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
        
        setSelectedDate(null)
        setSelectedTime(null)
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          jugadores: '2 jugadores'
        })
        
        idempotencyKeyRef.current = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
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
    <div className="partidos-section">
      <div className="partidos-container" style={{ maxWidth: '1200px' }}>
        {/* Header */}
        <div className="partidos-header" style={{ marginBottom: '30px' }}>
          <h2 className="partidos-title">🎾 PadelReservas</h2>
          <p className="partidos-subtitle">Reserva tu cancha en segundos</p>
          {lastRefresh && (
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
              🔄 Actualizado: {lastRefresh.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Filtros de Ubicación */}
        <div className="partidos-form-card" style={{ marginBottom: '24px' }}>
          <h3 className="partidos-title" style={{ fontSize: '18px', marginBottom: '20px' }}>
            📍 Selecciona tu ubicación
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            {/* Provincia */}
            <div className="form-group">
              <label className="form-label">Provincia *</label>
              <select
                className="form-select"
                value={province}
                onChange={(e) => handleProvinceChange(e.target.value)}
                disabled={loadingClubs}
              >
                <option value="">Todas las provincias</option>
                {provinces.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>

            {/* Ciudad */}
            <div className="form-group">
              <label className="form-label">Ciudad *</label>
              <select
                className="form-select"
                value={city}
                onChange={(e) => handleCityChange(e.target.value)}
                disabled={loadingClubs || !province}
              >
                <option value="">Todas las ciudades</option>
                {cities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Club */}
            <div className="form-group">
              <label className="form-label">Club *</label>
              <select
                className="form-select"
                value={clubId}
                onChange={(e) => handleClubChange(e.target.value)}
                disabled={loadingClubs || filteredClubs.length === 0}
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
            <div className="form-group">
              <label className="form-label">Cancha *</label>
              <select
                className="form-select"
                value={courtId}
                onChange={(e) => handleCourtChange(e.target.value)}
                disabled={!clubId || loadingCourts || courts.length === 0}
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
              color: '#d97706',
              fontSize: '14px'
            }}>
              ⚠️ No hay clubes disponibles en esta ubicación
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
            <div className="partidos-form-card">
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#1e293b',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  ←
                </button>
                <h3 style={{
                  color: '#1e293b',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                  className="date-button"
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    color: '#1e293b',
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
                    color: '#64748b',
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
                {getDaysInMonth(currentDate).map((day, index) => {
                  const selected = selectedDate && selectedDate.getDate() === day;
                  const disabled = isPast(day);
                  const todayDate = isToday(day);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => day && !isPast(day) && handleDateSelect(day)}
                      disabled={disabled || !day}
                      className={`date-button ${selected ? 'selected' : ''} ${todayDate ? 'today' : ''}`}
                      style={{
                        opacity: disabled ? 0.4 : 1,
                        cursor: disabled || !day ? 'not-allowed' : 'pointer',
                        minHeight: '44px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: day && selectedDate && selectedDate.getDate() === day && selectedDate.getMonth() === currentDate.getMonth()
                          ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                          : isToday(day)
                          ? 'rgba(139, 92, 246, 0.1)'
                          : '#ffffff',
                        border: day && selectedDate && selectedDate.getDate() === day
                          ? '2px solid #8b5cf6'
                          : isToday(day)
                          ? '2px solid #8b5cf6'
                          : '1px solid #e2e8f0',
                        color: day && selectedDate && selectedDate.getDate() === day 
                          ? '#ffffff'
                          : day && !isPast(day) ? '#1e293b' : '#cbd5e1',
                        borderRadius: '8px',
                        padding: '12px 4px',
                        fontSize: '14px',
                        fontWeight: day && selectedDate && selectedDate.getDate() === day ? '600' : '400',
                        transition: 'all 0.2s'
                      }}
                    >
                      {day || ''}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horarios */}
            <div className="partidos-form-card">
              <h3 className="form-label" style={{ marginBottom: '16px', fontSize: '18px' }}>
                🕐 Horarios Disponibles
                {loadingSlots && (
                  <span className="form-loading" style={{ marginLeft: '12px', fontSize: '14px' }}>
                    Cargando...
                  </span>
                )}
              </h3>

              {!selectedDate ? (
                <div className="no-slots">
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                  <p>Selecciona una fecha para ver los horarios disponibles</p>
                </div>
              ) : loadingSlots ? (
                <div className="loading">
                  <div style={{ fontSize: '24px', marginBottom: '16px' }}>⏳</div>
                  <p>Cargando horarios disponibles...</p>
                </div>
              ) : slots.length === 0 ? (
                <div className="no-slots">
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
                  <p>No hay horarios disponibles para esta fecha</p>
                </div>
              ) : (
                <div className="time-grid">
                  {slots.map((slot, index) => {
                    const time = new Date(slot.start).toTimeString().slice(0, 5)
                    const isSelected = selectedTime === time
                    
                    return (
                      <button
                        key={index}
                        onClick={() => slot.available && handleTimeSelect(time)}
                        disabled={!slot.available}
                        className={`time-button ${isSelected ? 'selected' : ''}`}
                        style={{
                          opacity: slot.available ? 1 : 0.6,
                          cursor: slot.available ? 'pointer' : 'not-allowed',
                          background: slot.status === 'occupied' ? 'rgba(239, 68, 68, 0.2)' :
                                     slot.status === 'held' ? 'rgba(251, 191, 36, 0.2)' :
                                     isSelected ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' :
                                     '#f0fdf4',
                          border: slot.status === 'occupied' ? '1px solid #ef4444' :
                                      slot.status === 'held' ? '1px solid #f59e0b' :
                                      isSelected ? '2px solid #8b5cf6' :
                                      '1px solid #10b981',
                          borderRadius: '8px',
                          padding: '12px',
                          color: isSelected ? '#ffffff' : slot.status === 'occupied' ? '#dc2626' : '#047857',
                          fontSize: '14px',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ fontWeight: '600' }}>{time}</div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>
                          ${slot.price}
                          {slot.is_peak_hour && ' 🔥'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            
            {/* Formulario de Reserva */}
            {selectedDate && selectedTime && (
                <div className="partidos-form-card" style={{ gridColumn: 'span 3 / span 3' }}>
                  <h3 className="partidos-title" style={{ fontSize: '18px', marginBottom: '20px' }}>
                    ✏️ Completa tus datos
                  </h3>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                    marginBottom: '20px'
                  }}>
                    <div className="form-group">
                      <label className="form-label">Nombre completo *</label>
                      <input
                        type="text"
                        className="form-select"
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        placeholder="Tu nombre completo"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-select"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Teléfono *</label>
                      <input
                        type="tel"
                        className="form-select"
                        value={formData.telefono}
                        onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                        placeholder="+54 9 11 1234-5678"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Número de jugadores</label>
                      <select
                        className="form-select"
                        value={formData.jugadores}
                        onChange={(e) => setFormData({ ...formData, jugadores: e.target.value })}
                      >
                        <option value="2 jugadores">2 jugadores</option>
                        <option value="3 jugadores">3 jugadores</option>
                        <option value="4 jugadores">4 jugadores</option>
                      </select>
                    </div>
                  </div>

                  <button
                    className="form-submit-btn"
                    onClick={confirmarReserva}
                    disabled={saving || !formData.nombre || !formData.email || !formData.telefono}
                  >
                    {saving ? '⏳ Procesando...' : '🎾 Confirmar Reserva'}
                  </button>

                  <p style={{
                    color: '#64748b',
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
            
          </div>
        ) : (
          <div className="partidos-form-card" style={{
            padding: '60px 40px',
            textAlign: 'center',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎾</div>
            <h3 style={{ color: '#1e293b', fontSize: '24px', marginBottom: '16px', fontWeight: '600' }}>
              Bienvenido a PadelReservas
            </h3>
            <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '0' }}>
              Selecciona tu ubicación, club y cancha arriba para comenzar tu reserva
            </p>
          </div>
        )}

        {/* Mensajes de Error y Éxito */}
        {error && (
          <div className="partido-not-found" style={{ marginTop: '20px' }}>
            <div className="partido-not-found-icon">⚠️</div>
            <h3 className="partido-not-found-title">Error</h3>
            <p className="partido-not-found-text">{error}</p>
          </div>
        )}

        {success && (
          <div className="partido-found" style={{ marginTop: '20px' }}>
            <div className="partido-found-header">
              <div className="partido-found-icon">✓</div>
              <div>
                <h3 className="partido-found-title">¡Éxito!</h3>
                <p className="partido-found-subtitle">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Resumen de Reserva */}
        {/* ... (Sección de resumen omitida por brevedad en la corrección, pero el código original la tiene) */}
      </div>
    </div>
  )
}

export default ReservationSystemImproved