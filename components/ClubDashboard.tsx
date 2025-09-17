'use client'
import { useState, useEffect } from 'react'
import ClubScheduleManagement from './ClubScheduleManagement'

interface Club {
  id: string
  name: string
  address: string
  city: string
  province: string
  phone: string
  email: string
  description: string
}

interface Court {
  id: string
  name: string
  surface_type: string
  hourly_rate: number
  is_active: boolean
}

const ClubDashboard = ({ clubId }: { clubId: string }) => {
  const [club, setClub] = useState<Club | null>(null)
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<'overview' | 'courts' | 'schedules' | 'settings'>('overview')

  // Estados para formularios
  const [showAddCourt, setShowAddCourt] = useState(false)
  const [newCourt, setNewCourt] = useState({
    name: '',
    surface_type: 'artificial_grass',
    hourly_rate: 25
  })

  useEffect(() => {
    if (clubId) {
      loadClubData()
      loadCourts()
    }
  }, [clubId])

  const loadClubData = async () => {
    try {
      const res = await fetch(`/api/clubs/${clubId}`)
      const data = await res.json()
      setClub(data.club)
    } catch (error) {
      console.error('Error loading club:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCourts = async () => {
    try {
      const res = await fetch(`/api/courts?club_id=${clubId}`)
      const data = await res.json()
      setCourts(data.courts || [])
    } catch (error) {
      console.error('Error loading courts:', error)
    }
  }

  const createCourt = async () => {
    try {
      const res = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newCourt,
          club_id: clubId
        })
      })

      if (res.ok) {
        await loadCourts()
        setNewCourt({
          name: '',
          surface_type: 'artificial_grass', 
          hourly_rate: 25
        })
        setShowAddCourt(false)
      }
    } catch (error) {
      console.error('Error creating court:', error)
    }
  }

  const toggleCourtStatus = async (courtId: string, isActive: boolean) => {
    try {
      await fetch(`/api/courts/${courtId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive })
      })
      await loadCourts()
    } catch (error) {
      console.error('Error updating court:', error)
    }
  }

  const menuItems = [
    {
      id: 'overview',
      name: 'Resumen',
      icon: '📊',
      description: 'Vista general del club'
    },
    {
      id: 'courts',
      name: 'Canchas',
      icon: '🏟️',
      description: 'Gestionar canchas del club'
    },
    {
      id: 'schedules',
      name: 'Horarios y Reservas',
      icon: '⏰',
      description: 'Configurar horarios disponibles y gestionar reservas'
    },
    {
      id: 'settings',
      name: 'Configuración',
      icon: '⚙️',
      description: 'Configuración general del club'
    }
  ]

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 25%, #374151 75%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#94a3b8', fontSize: '18px' }}>
          Cargando dashboard...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 25%, #374151 75%, #1e293b 100%)',
      display: 'flex'
    }}>
      {/* Sidebar */}
      <div style={{
        width: '280px',
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Club Header */}
        <div style={{
          marginBottom: '32px',
          paddingBottom: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>🏆</span>
          </div>
          <h2 style={{
            color: 'white',
            fontSize: '20px',
            fontWeight: '600',
            margin: '0 0 4px 0'
          }}>
            {club?.name || 'Club Dashboard'}
          </h2>
          <p style={{
            color: '#94a3b8',
            fontSize: '14px',
            margin: '0'
          }}>
            Panel de administración
          </p>
        </div>

        {/* Navigation Menu */}
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSection(item.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px',
              background: activeSection === item.id 
                ? 'rgba(16, 185, 129, 0.15)' 
                : 'transparent',
              border: activeSection === item.id 
                ? '1px solid rgba(16, 185, 129, 0.3)' 
                : '1px solid transparent',
              borderRadius: '12px',
              color: activeSection === item.id ? '#10b981' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'left'
            }}
          >
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px' }}>
                {item.name}
              </div>
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.8,
                color: activeSection === item.id ? '#10b981' : '#6b7280'
              }}>
                {item.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeSection === 'overview' && (
          <div style={{ padding: '24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <h1 style={{
                color: 'white',
                fontSize: '32px',
                fontWeight: '700',
                marginBottom: '8px'
              }}>
                Resumen del Club
              </h1>
              <p style={{
                color: '#94a3b8',
                fontSize: '16px',
                marginBottom: '32px'
              }}>
                Vista general de la actividad y estadísticas
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                marginBottom: '32px'
              }}>
                {/* Stats Cards */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '24px' }}>🏟️</span>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                        Total Canchas
                      </div>
                      <div style={{ color: 'white', fontSize: '24px', fontWeight: '600' }}>
                        {courts.length}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '24px' }}>✅</span>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                        Canchas Activas
                      </div>
                      <div style={{ color: 'white', fontSize: '24px', fontWeight: '600' }}>
                        {courts.filter(c => c.is_active).length}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '24px' }}>💰</span>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px' }}>
                        Precio Promedio
                      </div>
                      <div style={{ color: 'white', fontSize: '24px', fontWeight: '600' }}>
                        €{courts.length > 0 ? 
                          Math.round(courts.reduce((sum, c) => sum + c.hourly_rate, 0) / courts.length) : 
                          0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Club Information */}
              {club && (
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
                    marginBottom: '16px'
                  }}>
                    Información del Club
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px'
                  }}>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>
                        Dirección
                      </div>
                      <div style={{ color: 'white', fontSize: '16px' }}>
                        {club.address}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>
                        Ciudad
                      </div>
                      <div style={{ color: 'white', fontSize: '16px' }}>
                        {club.city}, {club.province}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>
                        Teléfono
                      </div>
                      <div style={{ color: 'white', fontSize: '16px' }}>
                        {club.phone}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '4px' }}>
                        Email
                      </div>
                      <div style={{ color: 'white', fontSize: '16px' }}>
                        {club.email}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'courts' && (
          <div style={{ padding: '24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px'
              }}>
                <div>
                  <h1 style={{
                    color: 'white',
                    fontSize: '32px',
                    fontWeight: '700',
                    marginBottom: '8px'
                  }}>
                    Gestión de Canchas
                  </h1>
                  <p style={{
                    color: '#94a3b8',
                    fontSize: '16px',
                    margin: '0'
                  }}>
                    Administra las canchas de tu club
                  </p>
                </div>
                <button
                  onClick={() => setShowAddCourt(!showAddCourt)}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  + Agregar Cancha
                </button>
              </div>

              {/* Add Court Form */}
              {showAddCourt && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '24px'
                }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: '600',
                    marginBottom: '16px'
                  }}>
                    Nueva Cancha
                  </h3>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        marginBottom: '6px'
                      }}>
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={newCourt.name}
                        onChange={(e) => setNewCourt(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Ej: Cancha Central"
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        marginBottom: '6px'
                      }}>
                        Tipo de superficie
                      </label>
                      <select
                        value={newCourt.surface_type}
                        onChange={(e) => setNewCourt(prev => ({ ...prev, surface_type: e.target.value }))}
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
                        <option value="artificial_grass">Césped artificial</option>
                        <option value="clay">Tierra batida</option>
                        <option value="hard_court">Pista dura</option>
                        <option value="indoor">Interior</option>
                      </select>
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        marginBottom: '6px'
                      }}>
                        Precio por hora (€)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={newCourt.hourly_rate}
                        onChange={(e) => setNewCourt(prev => ({ ...prev, hourly_rate: parseFloat(e.target.value) }))}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={createCourt}
                      disabled={!newCourt.name}
                      style={{
                        background: newCourt.name 
                          ? 'linear-gradient(135deg, #10b981, #059669)' 
                          : 'rgba(107, 114, 128, 0.5)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: newCourt.name ? 'pointer' : 'not-allowed',
                        opacity: newCourt.name ? 1 : 0.5
                      }}
                    >
                      Crear Cancha
                    </button>
                    <button
                      onClick={() => setShowAddCourt(false)}
                      style={{
                        background: 'rgba(107, 114, 128, 0.2)',
                        border: '1px solid rgba(107, 114, 128, 0.3)',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        color: '#9ca3af',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Courts List */}
              <div style={{
                display: 'grid',
                gap: '16px'
              }}>
                {courts.map((court) => (
                  <div
                    key={court.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '16px',
                      padding: '24px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h3 style={{
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '600',
                        marginBottom: '8px'
                      }}>
                        {court.name}
                      </h3>
                      <div style={{
                        display: 'flex',
                        gap: '24px',
                        color: '#94a3b8',
                        fontSize: '14px'
                      }}>
                        <span>Superficie: {court.surface_type.replace('_', ' ')}</span>
                        <span>€{court.hourly_rate}/hora</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: court.is_active 
                          ? 'rgba(16, 185, 129, 0.2)' 
                          : 'rgba(107, 114, 128, 0.2)',
                        color: court.is_active ? '#10b981' : '#6b7280'
                      }}>
                        {court.is_active ? 'Activa' : 'Inactiva'}
                      </div>
                      <button
                        onClick={() => toggleCourtStatus(court.id, court.is_active)}
                        style={{
                          background: court.is_active 
                            ? 'rgba(239, 68, 68, 0.2)' 
                            : 'rgba(16, 185, 129, 0.2)',
                          border: `1px solid ${court.is_active ? '#ef4444' : '#10b981'}`,
                          borderRadius: '8px',
                          padding: '8px 16px',
                          color: court.is_active ? '#ef4444' : '#10b981',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {court.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </div>
                ))}

                {courts.length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#94a3b8'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏟️</div>
                    <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>
                      No hay canchas registradas
                    </h3>
                    <p style={{ fontSize: '14px' }}>
                      Comienza agregando tu primera cancha
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'schedules' && (
          <ClubScheduleManagement clubId={clubId} />
        )}

        {activeSection === 'settings' && (
          <div style={{ padding: '24px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <h1 style={{
                color: 'white',
                fontSize: '32px',
                fontWeight: '700',
                marginBottom: '8px'
              }}>
                Configuración
              </h1>
              <p style={{
                color: '#94a3b8',
                fontSize: '16px',
                marginBottom: '32px'
              }}>
                Configuración general del club
              </p>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '24px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
                <h3 style={{
                  color: 'white',
                  fontSize: '18px',
                  marginBottom: '8px'
                }}>
                  Configuración en desarrollo
                </h3>
                <p style={{
                  color: '#94a3b8',
                  fontSize: '14px'
                }}>
                  Esta sección estará disponible próximamente
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClubDashboard