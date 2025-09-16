'use client'

import React, { useState, useEffect } from 'react'
import { X, Users, User, Mail, Phone, Trophy } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

interface Tournament {
  id: string
  name: string
  category: string
  status: string
  max_teams: number
  registered_teams: number
  registration_deadline: string
  entry_fee?: string
  description?: string
}

interface TeamRegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  tournament: Tournament | null
  onSuccess: () => void
}

interface PlayerProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  category: string
}

export default function TeamRegistrationModal({
  isOpen,
  onClose,
  tournament,
  onSuccess
}: TeamRegistrationModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [error, setError] = useState('')
  const [user, setUser] = useState<any>(null)
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(null)
  
  const [formData, setFormData] = useState({
    teamName: '',
    player2Name: '',
    player2Email: '',
    player2Phone: '',
    notes: ''
  })

  // Verificar autenticación y cargar perfil del jugador
  useEffect(() => {
    if (isOpen) {
      checkAuthAndLoadProfile()
    }
  }, [isOpen])

  const checkAuthAndLoadProfile = async () => {
    setCheckingAuth(true)
    setError('')

    try {
      // Verificar si está logueado
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('Debes iniciar sesión como jugador para inscribirte')
        setCheckingAuth(false)
        return
      }

      setUser(user)

      // Obtener perfil del jugador
      const { data: profile, error: profileError } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        setError('No se encontró tu perfil de jugador. Completa tu registro primero.')
        setCheckingAuth(false)
        return
      }

      setPlayerProfile({
        id: profile.id,
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: user.email || '',
        phone: profile.phone || '',
        category: profile.category || ''
      })

    } catch (err) {
      setError('Error al verificar la autenticación')
    } finally {
      setCheckingAuth(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('')
  }

  const validateForm = () => {
    if (!formData.teamName.trim()) {
      setError('El nombre del equipo es obligatorio')
      return false
    }
    if (!formData.player2Name.trim()) {
      setError('El nombre del compañero es obligatorio')
      return false
    }
    if (!formData.player2Email.trim()) {
      setError('El email del compañero es obligatorio')
      return false
    }
    if (!formData.player2Email.includes('@')) {
      setError('El email del compañero no es válido')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !tournament || !playerProfile) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/tournaments/${tournament.id}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamName: formData.teamName.trim(),
          player1Name: `${playerProfile.first_name} ${playerProfile.last_name}`.trim(),
          player1Email: playerProfile.email,
          player1Phone: playerProfile.phone,
          player2Name: formData.player2Name.trim(),
          player2Email: formData.player2Email.trim(),
          player2Phone: formData.player2Phone.trim(),
          notes: formData.notes.trim()
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Resetear formulario
        setFormData({
          teamName: '',
          player2Name: '',
          player2Email: '',
          player2Phone: '',
          notes: ''
        })
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Error al registrar el equipo')
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleLoginRedirect = () => {
    onClose()
    router.push('/player?redirect=/torneos')
  }

  if (!isOpen || !tournament) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '32px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={24} color="#10b981" />
            <div>
              <h2 style={{ 
                color: 'white', 
                fontSize: '20px', 
                fontWeight: '700',
                margin: 0
              }}>
                Inscribir Equipo
              </h2>
              <p style={{ 
                color: '#94a3b8', 
                fontSize: '14px', 
                margin: 0 
              }}>
                {tournament.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Información del torneo */}
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Trophy size={16} color="#3b82f6" />
            <span style={{ color: '#60a5fa', fontSize: '14px', fontWeight: '600' }}>
              Información del Torneo
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', fontSize: '14px' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Categoría: </span>
              <span style={{ color: 'white', fontWeight: '500' }}>{tournament.category.toUpperCase()}</span>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Equipos: </span>
              <span style={{ color: 'white', fontWeight: '500' }}>{tournament.registered_teams}/{tournament.max_teams}</span>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Límite: </span>
              <span style={{ color: 'white', fontWeight: '500' }}>
                {new Date(tournament.registration_deadline).toLocaleDateString('es-ES')}
              </span>
            </div>
            {tournament.entry_fee && (
              <div>
                <span style={{ color: '#94a3b8' }}>Costo: </span>
                <span style={{ color: '#10b981', fontWeight: '500' }}>{tournament.entry_fee}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error o Loading */}
        {checkingAuth ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            color: '#94a3b8'
          }}>
            Verificando autenticación...
          </div>
        ) : error && !playerProfile ? (
          <div>
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'center'
            }}>
              <User size={48} color="#ef4444" style={{ margin: '0 auto 16px', display: 'block' }} />
              <h3 style={{ color: '#fca5a5', fontSize: '18px', marginBottom: '8px' }}>
                Autenticación Requerida
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>
                {error}
              </p>
              <button
                onClick={handleLoginRedirect}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #34d399)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Iniciar Sesión como Jugador
              </button>
            </div>
          </div>
        ) : playerProfile ? (
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px',
                color: '#fca5a5',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            {/* Jugador 1 (Auto-cargado) */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                color: 'white', 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <User size={16} color="#10b981" />
                Jugador 1 (Tú)
              </h3>
              
              <div style={{
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px'
              }}>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '12px', display: 'block' }}>Nombre</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>
                    {playerProfile.first_name} {playerProfile.last_name}
                  </span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '12px', display: 'block' }}>Email</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>{playerProfile.email}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '12px', display: 'block' }}>Teléfono</span>
                  <span style={{ color: 'white', fontWeight: '500' }}>{playerProfile.phone || 'No especificado'}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '12px', display: 'block' }}>Categoría</span>
                  <span style={{ color: '#10b981', fontWeight: '500' }}>{playerProfile.category}</span>
                </div>
              </div>
            </div>

            {/* Nombre del Equipo */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                color: '#94a3b8', 
                fontSize: '14px', 
                marginBottom: '8px', 
                display: 'block',
                fontWeight: '500'
              }}>
                Nombre del Equipo *
              </label>
              <input
                type="text"
                value={formData.teamName}
                onChange={(e) => handleInputChange('teamName', e.target.value)}
                placeholder="Ej: Los Campeones"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px'
                }}
                required
              />
            </div>

            {/* Jugador 2 */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ 
                color: 'white', 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <User size={16} color="#3b82f6" />
                Jugador 2 (Tu Compañero)
              </h3>

              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.player2Name}
                    onChange={(e) => handleInputChange('player2Name', e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.player2Email}
                      onChange={(e) => handleInputChange('player2Email', e.target.value)}
                      placeholder="juan@email.com"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      value={formData.player2Phone}
                      onChange={(e) => handleInputChange('player2Phone', e.target.value)}
                      placeholder="123456789"
                      style={{
                        width: '100%',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '14px'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notas adicionales */}
            <div style={{ marginBottom: '32px' }}>
              <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
                Comentarios Adicionales
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                placeholder="Información adicional, experiencia previa, etc. (opcional)"
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Botones */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  background: 'rgba(107, 114, 128, 0.2)',
                  border: '1px solid rgba(107, 114, 128, 0.3)',
                  color: '#9ca3af',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading 
                    ? 'rgba(16, 185, 129, 0.5)' 
                    : 'linear-gradient(135deg, #10b981, #34d399)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {loading ? 'Inscribiendo...' : 'Inscribir Equipo'}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )
}