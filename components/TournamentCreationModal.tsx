'use client'

import React, { useState } from 'react'
import { X, Trophy, Calendar, Users, MapPin, DollarSign } from 'lucide-react'

interface TournamentCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  courts: Array<{
    id: string
    name: string
    club?: { name: string }
  }>
}

export default function TournamentCreationModal({
  isOpen,
  onClose,
  onSuccess,
  courts
}: TournamentCreationModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    category: 'primera',
    type: 'eliminacion',
    maxTeams: 32,
    venue: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    entryFee: '',
    prizes: '',
    description: ''
  })

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError('') // Limpiar error cuando el usuario empiece a escribir
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('El nombre del torneo es obligatorio')
      return false
    }
    if (!formData.venue.trim()) {
      setError('El lugar del evento es obligatorio')
      return false
    }
    if (!formData.startDate) {
      setError('La fecha de inicio es obligatoria')
      return false
    }
    if (!formData.endDate) {
      setError('La fecha de fin es obligatoria')
      return false
    }
    if (!formData.registrationDeadline) {
      setError('La fecha límite de inscripción es obligatoria')
      return false
    }

    // Validar que las fechas sean lógicas
    const regDeadline = new Date(formData.registrationDeadline)
    const startDate = new Date(formData.startDate)
    const endDate = new Date(formData.endDate)
    const now = new Date()

    if (regDeadline <= now) {
      setError('La fecha límite de inscripción debe ser futura')
      return false
    }
    if (startDate <= regDeadline) {
      setError('La fecha de inicio debe ser posterior a la fecha límite de inscripción')
      return false
    }
    if (endDate <= startDate) {
      setError('La fecha de fin debe ser posterior a la fecha de inicio')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          category: formData.category,
          type: formData.type,
          maxTeams: parseInt(formData.maxTeams.toString()),
          venue: formData.venue.trim(),
          startDate: formData.startDate,
          endDate: formData.endDate,
          registrationDeadline: formData.registrationDeadline,
          entryFee: formData.entryFee.trim() || null,
          prizes: formData.prizes.trim() || null,
          description: formData.description.trim() || null
        })
      })

      const result = await response.json()

      if (response.ok) {
        // Resetear formulario
        setFormData({
          name: '',
          category: 'primera',
          type: 'eliminacion',
          maxTeams: 32,
          venue: '',
          startDate: '',
          endDate: '',
          registrationDeadline: '',
          entryFee: '',
          prizes: '',
          description: ''
        })
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Error al crear el torneo')
      }
    } catch (err) {
      setError('Error de conexión. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

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
        maxWidth: '700px',
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
            <Trophy size={24} color="#3b82f6" />
            <h2 style={{ 
              color: 'white', 
              fontSize: '24px', 
              fontWeight: '700',
              margin: 0
            }}>
              Crear Nuevo Torneo
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            <X size={24} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '24px',
            color: '#fca5a5',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Información Básica */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Trophy size={16} color="#3b82f6" />
              Información Básica
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ 
                  color: '#94a3b8', 
                  fontSize: '14px', 
                  marginBottom: '6px', 
                  display: 'block',
                  fontWeight: '500'
                }}>
                  Nombre del Torneo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Torneo Primavera 2025"
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
                  Categoría *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="primera">Primera</option>
                  <option value="damas">Damas</option>
                  <option value="caballeros">Caballeros</option>
                  <option value="mixto">Mixto</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
                  Tipo de Sistema *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value="eliminacion">Eliminación Directa</option>
                  <option value="suma7">Suma 7</option>
                  <option value="suma11">Suma 11</option>
                  <option value="suma12">Suma 12</option>
                  <option value="suma5">Suma 5</option>
                </select>
              </div>

              <div>
                <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
                  Máximo de Equipos *
                </label>
                <select
                  value={formData.maxTeams}
                  onChange={(e) => handleInputChange('maxTeams', parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px'
                  }}
                >
                  <option value={8}>8 equipos</option>
                  <option value={16}>16 equipos</option>
                  <option value={32}>32 equipos</option>
                  <option value={64}>64 equipos</option>
                </select>
              </div>
            </div>
          </div>

          {/* Ubicación y Fechas */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <MapPin size={16} color="#10b981" />
              Ubicación y Fechas
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
                Lugar del Evento *
              </label>
              <input
                type="text"
                value={formData.venue}
                onChange={(e) => handleInputChange('venue', e.target.value)}
                placeholder="Ej: Club Deportivo Central"
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
                  Fecha de Inicio *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => handleInputChange('startDate', e.target.value)}
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
                  Fecha de Fin *
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => handleInputChange('endDate', e.target.value)}
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
                  Límite Inscripción *
                </label>
                <input
                  type="date"
                  value={formData.registrationDeadline}
                  onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
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
            </div>
          </div>

          {/* Información Económica */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              color: 'white', 
              fontSize: '16px', 
              fontWeight: '600', 
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <DollarSign size={16} color="#f59e0b" />
              Información Económica (Opcional)
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
                  Costo de Inscripción
                </label>
                <input
                  type="text"
                  value={formData.entryFee}
                  onChange={(e) => handleInputChange('entryFee', e.target.value)}
                  placeholder="Ej: $15.000"
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

              <div>
                <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
                  Premio Total
                </label>
                <input
                  type="text"
                  value={formData.prizes}
                  onChange={(e) => handleInputChange('prizes', e.target.value)}
                  placeholder="Ej: $200.000"
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

          {/* Descripción */}
          <div style={{ marginBottom: '32px' }}>
            <label style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '6px', display: 'block', fontWeight: '500' }}>
              Descripción Adicional
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              placeholder="Descripción detallada del torneo, reglas especiales, premios por categoría, etc."
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                resize: 'vertical',
                minHeight: '80px'
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
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading 
                  ? 'rgba(59, 130, 246, 0.5)' 
                  : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
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
              {loading ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creando...
                </>
              ) : (
                <>
                  <Trophy size={16} />
                  Crear Torneo
                </>
              )}
            </button>
          </div>
        </form>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  )
}