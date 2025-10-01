'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { ArrowLeft, Save, Edit3, User, Phone, MapPin, Calendar, Trophy, Shield } from 'lucide-react'

type PlayerProfile = {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  province: string | null
  city: string | null
  category: string
  matches_played: number
  matches_won: number
  phone_verified: boolean
  created_at: string
  email?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    province: '',
    city: '',
    category: ''
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.replace('/players/auth/login')
        return
      }
      
      const { data: profile, error } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      
      const profileWithEmail = {
        ...profile,
        email: user.email
      }
      
      setProfile(profileWithEmail)
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        phone: profile.phone || '',
        province: profile.province || '',
        city: profile.city || '',
        category: profile.category || ''
      })
      
    } catch (error) {
      console.error('Error loading profile:', error)
      router.replace('/players/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    try {
      setSaving(true)
      setMessage('')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')

      const { error } = await supabase
        .from('player_profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          province: formData.province,
          city: formData.city,
          category: formData.category
        })
        .eq('id', user.id)

      if (error) throw error
      
      setMessage('Perfil actualizado correctamente')
      setEditing(false)
      await loadProfile() // Recargar datos
      
      setTimeout(() => setMessage(''), 3000)
      
    } catch (error: any) {
      console.error('Error saving profile:', error)
      setMessage('Error al actualizar el perfil: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ color: '#cbd5e1', fontSize: '18px' }}>Cargando perfil...</div>
      </div>
    )
  }

  const displayName = profile?.first_name && profile?.last_name 
    ? `${profile.first_name} ${profile.last_name}`
    : profile?.first_name || 'Jugador'

  const memberSince = profile?.created_at 
    ? new Date(profile.created_at).getFullYear()
    : new Date().getFullYear()

  const winRate = profile?.matches_played 
    ? Math.round((profile.matches_won / profile.matches_played) * 100)
    : 0

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <Link href="/players/dashboard" style={{ 
            color: '#60a5fa', 
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            <ArrowLeft size={16} />
            Volver al Dashboard
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ color: '#ffffff', fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
              Mi Perfil
            </h1>
            
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  padding: '12px 20px',
                  color: '#60a5fa',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              >
                <Edit3 size={16} />
                Editar Perfil
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    setEditing(false)
                    setFormData({
                      first_name: profile?.first_name || '',
                      last_name: profile?.last_name || '',
                      phone: profile?.phone || '',
                      province: profile?.province || '',
                      city: profile?.city || '',
                      category: profile?.category || ''
                    })
                  }}
                  style={{
                    background: 'rgba(107, 114, 128, 0.2)',
                    border: '1px solid rgba(107, 114, 128, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
                
                <button
                  onClick={saveProfile}
                  disabled={saving}
                  style={{
                    background: 'rgba(34, 197, 94, 0.2)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 20px',
                    color: '#22c55e',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    opacity: saving ? 0.7 : 1
                  }}
                >
                  <Save size={16} />
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Message */}
        {message && (
          <div style={{
            background: message.includes('Error') 
              ? 'rgba(239, 68, 68, 0.1)' 
              : 'rgba(34, 197, 94, 0.1)',
            border: message.includes('Error')
              ? '1px solid rgba(239, 68, 68, 0.3)'
              : '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '24px',
            color: message.includes('Error') ? '#ef4444' : '#22c55e',
            fontSize: '14px'
          }}>
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '32px' }}>
          {/* Player Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            height: 'fit-content'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '120px',
                height: '120px',
                background: 'linear-gradient(135deg, #3b82f6, #1e40af)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '48px',
                fontWeight: 'bold',
                margin: '0 auto 16px'
              }}>
                {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              
              <h2 style={{ color: '#ffffff', fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0' }}>
                {displayName}
              </h2>
              
              <div style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '16px' }}>
                Categoría {profile?.category}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8', fontSize: '14px' }}>
                <MapPin size={16} />
                {profile?.city}, {profile?.province}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#60a5fa', fontSize: '24px', fontWeight: 'bold' }}>
                  {profile?.matches_played || 0}
                </div>
                <div style={{ color: '#ffffff', fontSize: '14px' }}>Partidos Jugados</div>
              </div>
              
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#4ade80', fontSize: '24px', fontWeight: 'bold' }}>
                  {winRate}%
                </div>
                <div style={{ color: '#ffffff', fontSize: '14px' }}>Efectividad</div>
              </div>
              
              <div style={{
                background: 'rgba(168, 85, 247, 0.1)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{ color: '#a855f7', fontSize: '24px', fontWeight: 'bold' }}>
                  {memberSince}
                </div>
                <div style={{ color: '#ffffff', fontSize: '14px' }}>Miembro desde</div>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(16px)',
            borderRadius: '16px',
            padding: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{ color: '#ffffff', fontSize: '20px', fontWeight: '600', marginBottom: '24px' }}>
              Información Personal
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Email (Read Only) */}
              <div>
                <label style={{ 
                  color: '#94a3b8', 
                  fontSize: '14px', 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Email
                </label>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#94a3b8',
                  fontSize: '14px'
                }}>
                  {profile?.email} (No se puede modificar)
                </div>
              </div>

              {/* Name Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ 
                    color: '#94a3b8', 
                    fontSize: '14px', 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    Nombre
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => handleInputChange('first_name', e.target.value)}
                      style={{
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#ffffff',
                        width: '100%',
                        fontSize: '14px'
                      }}
                      placeholder="Ingresa tu nombre"
                    />
                  ) : (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}>
                      {profile?.first_name || 'No especificado'}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ 
                    color: '#94a3b8', 
                    fontSize: '14px', 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    Apellido
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      style={{
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#ffffff',
                        width: '100%',
                        fontSize: '14px'
                      }}
                      placeholder="Ingresa tu apellido"
                    />
                  ) : (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}>
                      {profile?.last_name || 'No especificado'}
                    </div>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label style={{ 
                  color: '#94a3b8', 
                  fontSize: '14px', 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Teléfono
                </label>
                {editing ? (
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#ffffff',
                      width: '100%',
                      fontSize: '14px'
                    }}
                    placeholder="Ingresa tu teléfono"
                  />
                ) : (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}>
                    {profile?.phone || 'No especificado'}
                  </div>
                )}
              </div>

              {/* Location */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ 
                    color: '#94a3b8', 
                    fontSize: '14px', 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    Provincia
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      style={{
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#ffffff',
                        width: '100%',
                        fontSize: '14px'
                      }}
                      placeholder="Ej: Entre Ríos"
                    />
                  ) : (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}>
                      {profile?.province || 'No especificado'}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ 
                    color: '#94a3b8', 
                    fontSize: '14px', 
                    display: 'block', 
                    marginBottom: '8px',
                    fontWeight: '500'
                  }}>
                    Ciudad
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      style={{
                        background: 'rgba(0, 0, 0, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#ffffff',
                        width: '100%',
                        fontSize: '14px'
                      }}
                      placeholder="Ej: Concepción del Uruguay"
                    />
                  ) : (
                    <div style={{
                      background: 'rgba(0, 0, 0, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#ffffff',
                      fontSize: '14px'
                    }}>
                      {profile?.city || 'No especificado'}
                    </div>
                  )}
                </div>
              </div>

              {/* Category */}
              <div>
                <label style={{ 
                  color: '#94a3b8', 
                  fontSize: '14px', 
                  display: 'block', 
                  marginBottom: '8px',
                  fontWeight: '500'
                }}>
                  Categoría
                </label>
                {editing ? (
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    style={{
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      color: '#ffffff',
                      width: '100%',
                      fontSize: '14px'
                    }}
                  >
                    <option value="">Selecciona una categoría</option>
                    <option value="Primera">Primera</option>
                    <option value="Segunda">Segunda</option>
                    <option value="Tercera">Tercera</option>
                    <option value="Cuarta">Cuarta</option>
                    <option value="Quinta">Quinta</option>
                    <option value="Sexta">Sexta</option>
                    <option value="Séptima">Séptima</option>
                    <option value="Octava">Octava</option>
                    <option value="Novena">Novena</option>
                    <option value="Décima">Décima</option>
                  </select>
                ) : (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#ffffff',
                    fontSize: '14px'
                  }}>
                    {profile?.category || 'No especificado'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}