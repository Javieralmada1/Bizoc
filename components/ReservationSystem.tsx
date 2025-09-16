'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

type Club = { id: string; name: string; province: string|null; city: string|null }
type Court = { id: string; name: string; club_id: string }
type Slot = { start: string; end: string; available: boolean }

const ReservationSystem = () => {
  // Estados principales para la UI del calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Estados para datos del backend
  const [clubs, setClubs] = useState<Club[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Estados para filtros y selección
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [clubId, setClubId] = useState('')
  const [courtId, setCourtId] = useState('')
  
  // Estados del formulario - ahora pre-completados automáticamente
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    jugadores: '2 jugadores'
  })

  // Estados para usuario autenticado
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)

  // Cargar datos del usuario y pre-completar formulario
  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      
      // Intentar cargar perfil de jugador
      const { data: playerProfile } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (playerProfile) {
        setProfile(playerProfile)
        // Pre-completar formulario con datos del jugador
        setFormData({
          nombre: `${playerProfile.first_name} ${playerProfile.last_name}`,
          email: user.email || '',
          telefono: playerProfile.phone || '',
          jugadores: '4 jugadores'
        })
        
        // Si tiene provincia/ciudad, pre-seleccionarlas
        if (playerProfile.province) setProvince(playerProfile.province)
        if (playerProfile.city) setCity(playerProfile.city)
      }
    }
  }

  // Cargar clubes al montar el componente
  useEffect(() => {
    fetch('/api/clubs').then(r=>r.json()).then(d=>setClubs(d.clubs||[]))
    .catch(() => {
      // Si no hay API, cargar directamente de Supabase
      supabase.from('clubs').select('id, name, province, city').order('name')
        .then(({data}) => setClubs(data || []))
    })
  }, [])

  // Cargar canchas cuando se selecciona un club
  useEffect(() => {
    if (!clubId) { setCourts([]); setCourtId(''); return }
    
    fetch(`/api/courts?club_id=${clubId}`)
      .then(r=>r.json())
      .then(d=> setCourts(d.courts || []))
      .catch(() => {
        // Si no hay API, cargar directamente de Supabase
        supabase.from('courts').select('id, name, club_id').eq('club_id', clubId).order('name')
          .then(({data}) => setCourts(data || []))
      })
  }, [clubId])

  // Cargar horarios disponibles cuando se selecciona cancha y fecha
  useEffect(() => {
    if (courtId && selectedDate) {
      loadAvailableSlots()
    }
  }, [courtId, selectedDate])

  async function loadAvailableSlots() {
    if (!courtId || !selectedDate) return
    
    setLoadingSlots(true)
    
    try {
      // Obtener día de la semana (0=domingo, 6=sábado)
      const dayOfWeek = new Date(selectedDate).getDay()
      
      // 1. Obtener horarios configurados por el club para ese día y cancha
      const { data: schedules, error: schedulesError } = await supabase
        .from('club_schedules')
        .select('start_time, end_time, price_per_hour')
        .eq('court_id', courtId)
        .eq('day_of_week', dayOfWeek)
        .eq('active', true)
        .order('start_time')
      
      if (schedulesError) {
        console.error('Error cargando horarios:', schedulesError)
        setAvailableSlots([])
        return
      }

      if (!schedules || schedules.length === 0) {
        setAvailableSlots([])
        return
      }

      // 2. Obtener reservas existentes para ese día y cancha
      const { data: reservations, error: reservationsError } = await supabase
        .from('reservations')
        .select('start_time, status')
        .eq('court_id', courtId)
        .eq('reservation_date', selectedDate)
        .in('status', ['pending', 'confirmed']) // Solo reservas activas bloquean horarios
      
      if (reservationsError) {
        console.error('Error cargando reservas:', reservationsError)
      }

      // 3. Generar todos los slots disponibles
      const allSlots = []
      for (const schedule of schedules) {
        const start = new Date(`2000-01-01T${schedule.start_time}`)
        const end = new Date(`2000-01-01T${schedule.end_time}`)
        
        while (start < end) {
          allSlots.push(start.toTimeString().slice(0, 5)) // formato HH:MM
          start.setHours(start.getHours() + 1)
        }
      }

      // 4. Filtrar slots que están reservados
      const reservedTimes = reservations ? reservations.map(r => r.start_time?.slice(0, 5)) : []
      const availableSlots = allSlots.filter(slot => !reservedTimes.includes(slot))
      
      setAvailableSlots([...new Set(availableSlots)].sort()) // eliminar duplicados y ordenar
      
    } catch (error) {
      console.error('Error:', error)
      setAvailableSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  // Cargar slots cuando se selecciona cancha y fecha (actualizar esta parte)
  useEffect(() => {
    if (!courtId || !selectedDate) { setSlots([]); return }
    
    setLoadingSlots(true)
    
    // Usar los horarios dinámicos en lugar de los fijos
    const generatedSlots: Slot[] = availableSlots.map(timeSlot => ({
      start: timeSlot,
      end: `${(parseInt(timeSlot.split(':')[0]) + 1).toString().padStart(2, '0')}:${timeSlot.split(':')[1]}`,
      available: Math.random() > 0.3 // 70% disponibilidad aleatoria
    }))
    
    setTimeout(() => {
      setSlots(generatedSlots)
      setLoadingSlots(false)
    }, 500)
  }, [courtId, selectedDate, availableSlots])

  // Filtrar clubes por provincia y ciudad
  const filteredClubs = useMemo(() => {
    let filtered = clubs
    if (province) {
      filtered = filtered.filter(club => 
        club.province?.toLowerCase().includes(province.toLowerCase())
      )
    }
    if (city) {
      filtered = filtered.filter(club => 
        club.city?.toLowerCase().includes(city.toLowerCase())
      )
    }
    return filtered
  }, [clubs, province, city])

  // Obtener provincias y ciudades únicas
  const provinces = useMemo(() => 
    [...new Set(clubs.map(c => c.province).filter(Boolean))], [clubs]
  )
  const cities = useMemo(() => 
    [...new Set(clubs.filter(c => !province || c.province === province)
      .map(c => c.city).filter(Boolean))], [clubs, province]
  )

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const confirmarReserva = async () => {
    if (!selectedDate || !selectedTime || !clubId || !courtId) {
      setError('Por favor completa toda la información requerida')
      return
    }

    if (!formData.nombre || !formData.email || !formData.telefono) {
      setError('Por favor completa todos los campos del formulario')
      return
    }

    if (!user) {
      setError('Debes estar logueado para hacer una reserva')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // Crear fecha y hora completa
      const reservationDate = selectedDate.toISOString().split('T')[0]
      const [hours, minutes] = selectedTime.split(':').map(Number)
      
      const startTime = `${selectedTime}:00`
      const endHours = hours + 1 // Asumimos 1 hora por defecto
      const endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
      
      const startTimestamp = new Date(`${reservationDate}T${selectedTime}:00`)
      const endTimestamp = new Date(startTimestamp.getTime() + 60 * 60 * 1000) // +1 hora

      // Insertar en la tabla reservations usando la estructura correcta
      const { error } = await supabase
        .from('reservations')
        .insert({
          club_id: clubId,
          court_id: courtId,
          customer_name: formData.nombre,
          customer_email: formData.email,
          customer_phone: formData.telefono,
          reservation_date: reservationDate,
          start_time: startTime,
          end_time: endTime,
          start_timestamp: startTimestamp.toISOString(),
          end_timestamp: endTimestamp.toISOString(),
          duration_hours: 1,
          total_price: 0, // Por ahora gratis, después integraremos precios
          status: 'pending',
          notes: `Reserva para ${formData.jugadores}. Categoría: ${profile?.category || 'N/A'}`,
          created_by: user.id
        })

      if (error) throw error

      setSuccess('¡Reserva confirmada! El club confirmará tu reserva pronto.')
      
      // Limpiar selecciones pero mantener datos del usuario
      setSelectedDate(null)
      setSelectedTime(null)
      setSlots([])
      
    } catch (err: any) {
      setError(`Error al confirmar la reserva: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Generar días del calendario
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      
      const isCurrentMonth = date.getMonth() === month
      const isToday = date.getTime() === today.getTime()
      const isPast = date < today
      const isSelected = selectedDate && date.getTime() === selectedDate.getTime()

      days.push({
        date,
        day: date.getDate(),
        isCurrentMonth,
        isToday,
        isPast,
        isSelected,
        isDisabled: isPast || !isCurrentMonth
      })
    }
    return days
  }

  const calendarDays = generateCalendarDays()
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const weekDays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a202c 0%, #2d3748 25%, #4a5568 50%, #2d3748 75%, #1a202c 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '40px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h1 style={{ 
            fontSize: '36px', 
            fontWeight: '800', 
            margin: '0 0 8px 0', 
            color: 'white',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)'
          }}>
            Reserva tu Cancha
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: 'rgba(255,255,255,0.8)', 
            margin: '0'
          }}>
            Encuentra y reserva la cancha perfecta para tu partido
          </p>
        </div>

        {/* Filtros */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: '20px',
          padding: '24px',
          marginBottom: '32px',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h2 style={{ 
            color: 'white', 
            fontSize: '20px', 
            fontWeight: '700', 
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            Selecciona tu club y cancha
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '16px' 
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                color: 'rgba(255,255,255,0.9)', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Provincia
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="" style={{background: '#2d3748'}}>Todas las provincias</option>
                {provinces.map(prov => (
                  <option key={prov ?? ''} value={prov ?? ''} style={{background: '#2d3748'}}>{prov}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                color: 'rgba(255,255,255,0.9)', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Ciudad
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="" style={{background: '#2d3748'}}>Todas las ciudades</option>
                {cities.map(c => (
                  <option key={c ?? ''} value={c ?? ''} style={{background: '#2d3748'}}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                color: 'rgba(255,255,255,0.9)', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Club
              </label>
              <select
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '14px'
                }}
              >
                <option value="" style={{background: '#2d3748'}}>Selecciona un club</option>
                {filteredClubs.map(club => (
                  <option key={club.id} value={club.id} style={{background: '#2d3748'}}>
                    {club.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ 
                display: 'block', 
                color: 'rgba(255,255,255,0.9)', 
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                Cancha
              </label>
              <select
                value={courtId}
                onChange={(e) => setCourtId(e.target.value)}
                disabled={!clubId}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'white',
                  fontSize: '14px',
                  opacity: !clubId ? 0.5 : 1
                }}
              >
                <option value="" style={{background: '#2d3748'}}>Selecciona una cancha</option>
                {courts.map(court => (
                  <option key={court.id} value={court.id} style={{background: '#2d3748'}}>
                    {court.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contenido principal */}
        {courtId && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '24px',
            alignItems: 'start'
          }}>
            {/* Calendario */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
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
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  ‹
                </button>
                <h3 style={{ 
                  color: 'white', 
                  fontSize: '18px', 
                  fontWeight: '700',
                  margin: '0'
                }}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h3>
                <button
                  onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '18px'
                  }}
                >
                  ›
                </button>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(7, 1fr)', 
                gap: '4px',
                marginBottom: '8px'
              }}>
                {weekDays.map(day => (
                  <div key={day} style={{ 
                    textAlign: 'center', 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: '12px',
                    fontWeight: '600',
                    padding: '8px 0'
                  }}>
                    {day}
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {calendarDays.map((day, index) => (
                  <button
                    key={index}
                    onClick={() => !day.isDisabled && setSelectedDate(day.date)}
                    disabled={day.isDisabled}
                    style={{
                      padding: '12px 4px',
                      borderRadius: '8px',
                      border: 'none',
                      background: day.isSelected 
                        ? 'linear-gradient(135deg, #16a085, #10b981)'
                        : day.isToday 
                        ? 'rgba(255, 255, 255, 0.2)'
                        : day.isDisabled 
                        ? 'transparent'
                        : 'rgba(255, 255, 255, 0.05)',
                      color: day.isDisabled 
                        ? 'rgba(255,255,255,0.3)' 
                        : 'white',
                      cursor: day.isDisabled ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: day.isSelected || day.isToday ? '700' : '400',
                      opacity: !day.isCurrentMonth ? 0.3 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {day.day}
                  </button>
                ))}
              </div>
            </div>

            {/* Horarios */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ 
                color: 'white', 
                fontSize: '18px', 
                fontWeight: '700', 
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                Selecciona Hora
              </h3>

              {!selectedDate ? (
                <p style={{ 
                  color: 'rgba(255,255,255,0.6)', 
                  textAlign: 'center',
                  fontStyle: 'italic'
                }}>
                  Primero selecciona una fecha
                </p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {loadingSlots ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '20px' }}>
                      Cargando horarios disponibles...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '20px' }}>
                      No hay horarios configurados para este día.
                      <br />
                      <small>El club debe configurar los horarios desde su dashboard.</small>
                    </div>
                  ) : (
                    availableSlots.map(time => (
                      <button 
                        key={time} 
                        onClick={() => setSelectedTime(time)} 
                        style={{ 
                          padding: '10px', 
                          borderRadius: '8px', 
                          border: selectedTime === time ? '2px solid #16a085' : '1px solid rgba(255,255,255,0.2)', 
                          background: selectedTime === time ? 'rgba(22,160,133,0.2)' : 'rgba(255,255,255,0.05)', 
                          color: 'white', 
                          cursor: 'pointer', 
                          fontSize: '13px', 
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {time}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Formulario */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px)',
              borderRadius: '20px',
              padding: '24px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <h3 style={{ 
                color: 'white', 
                fontSize: '18px', 
                fontWeight: '700', 
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                Datos de Reserva
              </h3>

              {/* Mostrar datos pre-cargados */}
              {profile && (
                <div style={{ 
                  background: 'rgba(22, 160, 133, 0.1)', 
                  border: '1px solid rgba(22, 160, 133, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{ color: '#16a085', fontSize: '14px', fontWeight: '600', margin: '0 0 12px 0' }}>
                    Datos del usuario (auto-completados)
                  </h4>
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px', lineHeight: '1.5' }}>
                    <p style={{ margin: '4px 0' }}><strong>Nombre:</strong> {formData.nombre}</p>
                    <p style={{ margin: '4px 0' }}><strong>Email:</strong> {formData.email}</p>
                    <p style={{ margin: '4px 0' }}><strong>Teléfono:</strong> {formData.telefono || 'No especificado'}</p>
                    {profile && (
                      <p style={{ margin: '4px 0' }}><strong>Categoría:</strong> {profile.category}</p>
                    )}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'rgba(255,255,255,0.9)', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Tu nombre completo"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'rgba(255,255,255,0.9)', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="tu@email.com"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'rgba(255,255,255,0.9)', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    placeholder="+34 900 123 456"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: 'block', 
                    color: 'rgba(255,255,255,0.9)', 
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}>
                    Número de jugadores
                  </label>
                  <select
                    value={formData.jugadores}
                    onChange={(e) => handleInputChange('jugadores', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  >
                    <option value="2 jugadores" style={{background: '#2d3748'}}>2 jugadores</option>
                    <option value="3 jugadores" style={{background: '#2d3748'}}>3 jugadores</option>
                    <option value="4 jugadores" style={{background: '#2d3748'}}>4 jugadores</option>
                  </select>
                </div>

                <button
                  onClick={confirmarReserva}
                  disabled={saving || !selectedDate || !selectedTime || !formData.nombre || !formData.email || !formData.telefono}
                  style={{
                    width: '100%',
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: saving || !selectedDate || !selectedTime 
                      ? 'rgba(22, 160, 133, 0.3)'
                      : 'linear-gradient(135deg, #16a085, #10b981)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '700',
                    cursor: saving || !selectedDate || !selectedTime ? 'not-allowed' : 'pointer',
                    marginTop: '8px'
                  }}
                >
                  {saving ? '⏳ Procesando...' : 'Confirmar Reserva'}
                </button>

                {/* Mensajes */}
                {error && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    {error}
                  </div>
                )}

                {success && (
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    color: '#86efac',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    {success}
                  </div>
                )}

                <p style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.6)',
                  textAlign: 'center',
                  marginTop: '16px',
                  lineHeight: '1.4'
                }}>
                  Al confirmar tu reserva aceptas nuestros términos y condiciones. 
                  Recibirás un email de confirmación con todos los detalles.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ReservationSystem