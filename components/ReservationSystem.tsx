'use client'
import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

// Tipos mejorados
type Club = { id: string; name: string; province: string|null; city: string|null }
type Court = { id: string; name: string; club_id: string }
type TimeSlot = { 
  start: string; 
  end: string; 
  available: boolean;
  price: number;
  is_peak_hour: boolean;
  status: 'available' | 'occupied' | 'held';
  booking_info?: {
    customer_name?: string;
    booking_reference?: string;
  }
}

const EnhancedReservationSystem = () => {
  // Estados principales para la UI del calendario
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  // Estados para datos del backend
  const [clubs, setClubs] = useState<Club[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Estados para filtros y selección
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

  // Estados para tiempo real
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const idempotencyKeyRef = useRef<string>(uuidv4())

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [refreshInterval])

  // Cargar clubes al montar el componente
  useEffect(() => {
    fetch('/api/clubs')
      .then(r=>r.json())
      .then(d=>setClubs(d.clubs||[]))
      .catch(e => console.error('Error loading clubs:', e))
  }, [])

  // Cargar canchas cuando se selecciona un club
  useEffect(() => {
    if (!clubId) { 
      setCourts([])
      setCourtId('')
      return 
    }
    
    fetch(`/api/courts?club_id=${clubId}`)
      .then(r=>r.json())
      .then(d=> setCourts(d.courts || []))
      .catch(()=> setCourts([]))
  }, [clubId])

  // Función para cargar slots
  const loadSlots = useCallback(async (courtId: string, selectedDate: Date) => {
    setLoadingSlots(true)
    const dateStr = selectedDate.toISOString().slice(0, 10)
    
    try {
      const response = await fetch(`/api/schedules?court_id=${courtId}&date=${dateStr}`)
      const data = await response.json()
      setSlots(data.slots || [])
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error loading slots:', error)
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  // Cargar slots cuando se selecciona cancha y fecha
  useEffect(() => {
    if (!courtId || !selectedDate) { 
      setSlots([])
      // Limpiar refresh automático
      if (refreshInterval) {
        clearInterval(refreshInterval)
        setRefreshInterval(null)
      }
      return 
    }

    // Cargar slots inmediatamente
    loadSlots(courtId, selectedDate)

    // Configurar refresh automático cada 30 segundos
    const interval = setInterval(() => {
      loadSlots(courtId, selectedDate)
    }, 30000)
    
    setRefreshInterval(interval)

    // Limpiar interval anterior
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
      }
    }
  }, [courtId, selectedDate, loadSlots])

  // Datos computados para filtros
  const provinces = useMemo(
    () => Array.from(new Set(clubs.map(c=>c.province).filter(Boolean))) as string[],
    [clubs]
  )
  const cities = useMemo(
    () => Array.from(new Set(clubs.filter(c=>!province || c.province===province).map(c=>c.city).filter(Boolean))) as string[],
    [clubs, province]
  )
  const filteredClubs = useMemo(
    () => clubs.filter(c =>
      (!province || c.province===province) &&
      (!city || c.city===city)
    ), [clubs, province, city]
  )

  // Funciones del calendario
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const changeMonth = (direction: number) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const selectDate = (day: number | null) => {
    if (!day) return;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(date);
    setSelectedTime(null);
    // Generar nueva clave de idempotencia para nueva fecha
    idempotencyKeyRef.current = uuidv4();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Función para refrescar manualmente
  const handleRefresh = () => {
    if (courtId && selectedDate) {
      loadSlots(courtId, selectedDate);
    }
  };

  // Función para confirmar reserva con protección mejorada
  async function confirmarReserva() {
    if (!clubId || !courtId || !selectedDate || !selectedTime || 
        !formData.nombre || !formData.email || !formData.telefono) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    setSaving(true); 
    setError('');
    setSuccess('');
    
    const selectedSlot = slots.find(s => {
      const slotTime = new Date(s.start).toTimeString().slice(0,5);
      return slotTime === selectedTime;
    });

    if (!selectedSlot) {
      setError('Horario no válido');
      setSaving(false);
      return;
    }

    if (!selectedSlot.available) {
      setError('Este horario ya no está disponible. Por favor selecciona otro.');
      setSaving(false);
      // Refrescar automáticamente
      handleRefresh();
      return;
    }

    try {
      const reservationData = {
        club_id: clubId,
        court_id: courtId,
        customer_name: formData.nombre,
        customer_email: formData.email,
        customer_phone: formData.telefono,
        reservation_date: selectedDate.toISOString().slice(0, 10),
        start_time: selectedSlot.start.slice(11, 16), // HH:MM
        end_time: selectedSlot.end.slice(11, 16), // HH:MM
        duration_hours: 1,
        total_price: selectedSlot.price,
        notes: `${formData.jugadores}`,
        idempotency_key: idempotencyKeyRef.current
      };

      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(reservationData)
      });

      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 409) {
          setError(data.error || 'Este horario ya fue reservado por otro usuario. Por favor selecciona otro horario.');
          // Refrescar automáticamente para mostrar estado actualizado
          handleRefresh();
          setSelectedTime(null);
        } else {
          setError(data.error || 'Error al crear la reserva');
        }
      } else {
        setSuccess(`¡Reserva confirmada! Referencia: ${data.booking_reference}. Recibirás un email de confirmación.`);
        
        // Reset form
        setSelectedDate(null);
        setSelectedTime(null);
        setFormData({
          nombre: '',
          email: '',
          telefono: '',
          jugadores: '2 jugadores'
        });
        
        // Generar nueva clave de idempotencia
        idempotencyKeyRef.current = uuidv4();
        
        // Refrescar slots para mostrar el nuevo estado
        setTimeout(() => {
          handleRefresh();
        }, 1000);
      }
    } catch (error) {
      setError('Error de conexión. Por favor intenta de nuevo.');
      console.error('Booking error:', error);
    } finally {
      setSaving(false);
    }
  }

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  const today = new Date();
  const isToday = (day: number | null) => {
    if (!day) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return date.toDateString() === today.toDateString();
  };

  const isPast = (day: number | null) => {
    if (!day) return false;
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    date.setHours(23, 59, 59, 999);
    return date < today;
  };

  // Convertir slots a horarios disponibles con estados
  const slotsWithStatus = useMemo(() => {
    return slots.map(slot => ({
      time: new Date(slot.start).toTimeString().slice(0,5),
      ...slot
    }));
  }, [slots]);

  return (
    <div className="reservation-system">
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '40px',
        padding: '0 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            🎾
          </div>
          <div>
            <h1 style={{
              color: '#10b981',
              fontSize: '24px',
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
              Tu cancha, tu momento
            </p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
            <span>📞</span>
            <span>+34 900 123 456</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
            <span>📍</span>
            <span>Madrid, España</span>
          </div>
          {lastRefresh && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
              <span>🔄</span>
              <span>Actualizado: {lastRefresh.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Filtros de selección */}
      <div className="reservation-container">
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: '0' }}>
              Selecciona tu club y cancha
            </h3>
            {courtId && selectedDate && (
              <button
                onClick={handleRefresh}
                disabled={loadingSlots}
                style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  border: '1px solid #10b981',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  color: '#10b981',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{loadingSlots ? '🔄' : '↻'}</span>
                {loadingSlots ? 'Actualizando...' : 'Refrescar'}
              </button>
            )}
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px'
          }}>
            <div>
              <label style={{ display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '6px' }}>
                Provincia
              </label>
              <select 
                value={province} 
                onChange={e=>{setProvince(e.target.value); setCity(''); setClubId(''); setCourtId(''); setSlots([])}} 
                className="form-group input"
              >
                <option value="">(Todas)</option>
                {provinces.map(p=> <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '6px' }}>
                Ciudad
              </label>
              <select 
                value={city} 
                onChange={e=>{setCity(e.target.value); setClubId(''); setCourtId(''); setSlots([])}} 
                className="form-group input"
              >
                <option value="">(Todas)</option>
                {cities.map(c=> <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '6px' }}>
                Club
              </label>
              <select 
                value={clubId} 
                onChange={e=>{setClubId(e.target.value); setCourtId(''); setSlots([])}} 
                className="form-group input"
              >
                <option value="">Selecciona...</option>
                {filteredClubs.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#e2e8f0', fontSize: '14px', marginBottom: '6px' }}>
                Cancha
              </label>
              <select 
                value={courtId} 
                onChange={e=>{setCourtId(e.target.value); setSelectedTime(null)}} 
                disabled={!clubId}
                className="form-group input"
                style={{ opacity: !clubId ? 0.5 : 1 }}
              >
                <option value="">Selecciona...</option>
                {courts.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button onClick={() => setError('')}>✕</button>
          </div>
        )}

        {success && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '16px',
            color: '#10b981',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <span style={{ lineHeight: '1.5' }}>{success}</span>
            <button 
              onClick={() => setSuccess('')}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#10b981', 
                cursor: 'pointer',
                fontSize: '18px',
                marginLeft: '10px',
                flexShrink: 0
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Main Content - Solo mostrar si hay club y cancha seleccionados */}
        {clubId && courtId ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '30px'
          }}>
            {/* Calendario */}
            <div className="step-content">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  📅
                </div>
                <h3 style={{
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0'
                }}>
                  Selecciona Fecha
                </h3>
              </div>

              {/* Calendar Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px'
              }}>
                <button
                  onClick={() => changeMonth(-1)}
                  className="date-button"
                  style={{ width: '32px', height: '32px' }}
                >
                  ‹
                </button>
                <h4 style={{
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  margin: '0'
                }}>
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h4>
                <button
                  onClick={() => changeMonth(1)}
                  className="date-button"
                  style={{ width: '32px', height: '32px' }}
                >
                  ›
                </button>
              </div>

              {/* Day Names */}
              <div className="date-grid" style={{ marginBottom: '8px' }}>
                {dayNames.map(day => (
                  <div key={day} style={{
                    color: '#94a3b8',
                    fontSize: '12px',
                    fontWeight: '500',
                    textAlign: 'center',
                    padding: '8px 4px'
                  }}>
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="date-grid">
                {getDaysInMonth(currentDate).map((day, index) => {
                  const selected = selectedDate && selectedDate.getDate() === day;
                  const disabled = isPast(day);
                  const todayDate = isToday(day);
                  
                  return (
                    <button
                      key={index}
                      onClick={() => !disabled && selectDate(day)}
                      disabled={disabled || !day}
                      className={`date-button ${selected ? 'selected' : ''} ${todayDate ? 'today' : ''}`}
                      style={{
                        opacity: disabled ? 0.4 : 1,
                        cursor: disabled || !day ? 'not-allowed' : 'pointer',
                        minHeight: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selección de Hora */}
            <div className="step-content">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  ⏰
                </div>
                <h3 style={{
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0'
                }}>
                  Selecciona Hora
                </h3>
              </div>

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
              ) : slotsWithStatus.length === 0 ? (
                <div className="no-slots">
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
                  <p>No hay horarios disponibles para esta fecha</p>
                </div>
              ) : (
                <div className="time-grid">
                  {slotsWithStatus.map(slot => {
                    const selected = selectedTime === slot.time;
                    const isOccupied = slot.status === 'occupied';
                    const isHeld = slot.status === 'held';
                    
                    return (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`time-button ${selected ? 'selected' : ''} ${isOccupied ? 'occupied' : ''} ${isHeld ? 'held' : ''}`}
                        style={{
                          opacity: slot.available ? 1 : 0.5,
                          cursor: slot.available ? 'pointer' : 'not-allowed',
                          background: isOccupied ? 'rgba(239, 68, 68, 0.2)' :
                                     isHeld ? 'rgba(251, 191, 36, 0.2)' :
                                     selected ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)' :
                                     'rgba(255, 255, 255, 0.08)',
                          borderColor: isOccupied ? '#ef4444' :
                                      isHeld ? '#f59e0b' :
                                      selected ? '#8b5cf6' :
                                      'rgba(255, 255, 255, 0.15)'
                        }}
                        title={isOccupied ? `Ocupado por: ${slot.booking_info?.customer_name || 'Cliente'}` :
                               isHeld ? 'Temporalmente reservado por otro usuario' :
                               `€${slot.price} ${slot.is_peak_hour ? '(Hora pico)' : ''}`}
                      >
                        <div className="time">{slot.time}</div>
                        <div className="price" style={{ fontSize: '11px', opacity: 0.8 }}>
                          {isOccupied ? '❌ Ocupado' :
                           isHeld ? '⏳ En espera' :
                           `€${slot.price}${slot.is_peak_hour ? ' 🔥' : ''}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Datos de Reserva */}
            <div className="step-content">
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px'
                }}>
                  👤
                </div>
                <h3 style={{
                  color: 'white',
                  fontSize: '18px',
                  fontWeight: '600',
                  margin: '0'
                }}>
                  Datos de Reserva
                </h3>
              </div>

              <div className="form-grid">
                {/* Nombre completo */}
                <div className="form-group">
                  <label>Nombre completo *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => handleInputChange('nombre', e.target.value)}
                    placeholder="Tu nombre completo"
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="tu@email.com"
                  />
                </div>

                {/* Teléfono */}
                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleInputChange('telefono', e.target.value)}
                    placeholder="+34 900 123 456"
                  />
                </div>

                {/* Número de jugadores */}
                <div className="form-group">
                  <label>Número de jugadores</label>
                  <select
                    value={formData.jugadores}
                    onChange={(e) => handleInputChange('jugadores', e.target.value)}
                  >
                    <option value="2 jugadores">2 jugadores</option>
                    <option value="3 jugadores">3 jugadores</option>
                    <option value="4 jugadores">4 jugadores</option>
                  </select>
                </div>

                {/* Botón Confirmar */}
                <div className="form-group full-width">
                  <button
                    onClick={confirmarReserva}
                    disabled={saving || !selectedDate || !selectedTime || !formData.nombre || !formData.email || !formData.telefono}
                    className="confirm-button"
                  >
                    {saving ? '⏳ Procesando...' : '🎾 Confirmar Reserva'}
                  </button>
                </div>

                {/* Términos */}
                <div className="form-group full-width">
                  <p className="confirmation-note">
                    Al confirmar tu reserva aceptas nuestros términos y condiciones. 
                    Recibirás un email de confirmación con todos los detalles.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '20px',
            padding: '60px 40px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎾</div>
            <h3 style={{ color: 'white', fontSize: '24px', marginBottom: '16px' }}>
              Bienvenido a PadelReservas
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '0' }}>
              Selecciona un club y cancha arriba para comenzar tu reserva
            </p>
          </div>
        )}

        {/* Resumen de reserva */}
        {(selectedDate || selectedTime) && clubId && courtId && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '16px',
            padding: '20px',
            color: '#10b981',
            marginTop: '30px'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
              Resumen de tu reserva
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
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
              {selectedTime && slotsWithStatus.length > 0 && (
                <div>
                  <strong>Precio:</strong> €{slotsWithStatus.find(s => s.time === selectedTime)?.price || 25}
                  {slotsWithStatus.find(s => s.time === selectedTime)?.is_peak_hour && ' (Hora pico)'}
                </div>
              )}
              {clubId && (
                <div>
                  <strong>Club:</strong> {filteredClubs.find(c => c.id === clubId)?.name}
                </div>
              )}
              {courtId && (
                <div>
                  <strong>Cancha:</strong> {courts.find(c => c.id === courtId)?.name}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedReservationSystem;