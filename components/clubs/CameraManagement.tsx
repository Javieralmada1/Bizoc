'use client'
import React, { useState, useEffect } from 'react'

type Camera = {
  id: string
  court_id: string
  name: string
  ip_address: string
  username: string
  status: string
  court?: { name: string }
}

type Court = {
  id: string
  name: string
  club_id: string
}

export default function CameraManagement() {
  const [cameras, setCameras] = useState<Camera[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Estados para descubrimiento
  const [discovering, setDiscovering] = useState(false)
  const [discoveredCameras, setDiscoveredCameras] = useState<any[]>([])
  const [networkRange, setNetworkRange] = useState('192.168.1.0/24')

  // Estados formulario manual
  const [showManualForm, setShowManualForm] = useState(false)
  const [newCamera, setNewCamera] = useState({
    court_id: '',
    name: '',
    ip_address: '192.168.1.41',
    username: 'admin',
    password: 'L26CD107',
    model: 'Dahua IPC-A22P'
  })

  // Estado para edición de cámara descubierta
  const [editCamera, setEditCamera] = useState<any | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const camerasResponse = await fetch('/api/cameras')
      const camerasData = await camerasResponse.json()
      setCameras(camerasData.cameras || [])

      const courtsResponse = await fetch('/api/courts')
      if (courtsResponse.ok) {
        const courtsData = await courtsResponse.json()
        setCourts(courtsData || [])
      }
    } catch (error) {
      setMessage('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  // Descubrimiento automático
  async function discoverCameras() {
    setDiscovering(true)
    setDiscoveredCameras([])
    setMessage('')
    try {
      const response = await fetch('/api/cameras/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ networkRange })
      })
      const result = await response.json()
      if (result.success) {
        setDiscoveredCameras(result.cameras || [])
        setMessage(`🎯 Encontradas ${result.total} cámaras, ${result.configured} configuradas`)
      } else {
        setMessage(`❌ ${result.error}`)
      }
    } catch (error) {
      setMessage('Error al escanear la red')
    } finally {
      setDiscovering(false)
    }
  }

  // Agregar cámara descubierta
  async function addDiscoveredCamera(discoveredCamera: any, courtId: string) {
    if (!courtId) {
      setMessage('Selecciona una cancha para esta cámara')
      return
    }
    try {
      const cameraData = {
        court_id: courtId,
        name: `Cámara ${discoveredCamera.ip}`,
        ip_address: discoveredCamera.ip,
        username: discoveredCamera.credentials?.username || 'admin',
        password: discoveredCamera.credentials?.password || 'L26CD107',
        model: discoveredCamera.model
      }
      const response = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cameraData)
      })
      if (response.ok) {
        setMessage(`✅ Cámara ${discoveredCamera.ip} agregada correctamente`)
        loadData()
        setDiscoveredCameras(prev => prev.filter(c => c.ip !== discoveredCamera.ip))
      } else {
        const error = await response.json()
        setMessage(`❌ ${error.error}`)
      }
    } catch (error) {
      setMessage('Error de conexión al agregar cámara')
    }
  }

  // Agregar cámara manual
  async function addManualCamera() {
    if (!newCamera.court_id || !newCamera.name || !newCamera.ip_address || !newCamera.password) {
      setMessage('Todos los campos son obligatorios')
      return
    }
    try {
      const response = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCamera)
      })
      const result = await response.json()
      if (response.ok) {
        setMessage('✅ Cámara agregada manualmente')
        setNewCamera({
          court_id: '',
          name: '',
          ip_address: '192.168.1.41',
          username: 'admin',
          password: 'L26CD107',
          model: 'Dahua IPC-A22P'
        })
        setShowManualForm(false)
        loadData()
      } else {
        setMessage(`❌ ${result.error}`)
      }
    } catch (error) {
      setMessage('Error de conexión')
    }
  }

  function handleEditDiscovered(camera: any) {
    setEditCamera({
      ...camera,
      username: camera.credentials?.username || 'admin',
      password: camera.credentials?.password || '',
      model: camera.model || 'Dahua IPC-A22P',
      court_id: ''
    })
  }

  async function saveEditedDiscoveredCamera() {
    if (!editCamera.court_id || !editCamera.ip || !editCamera.username || !editCamera.password) {
      setMessage('Completa todos los campos')
      return
    }
    try {
      const cameraData = {
        court_id: editCamera.court_id,
        name: `Cámara ${editCamera.ip}`,
        ip_address: editCamera.ip,
        username: editCamera.username,
        password: editCamera.password,
        model: editCamera.model
      }
      const response = await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cameraData)
      })
      if (response.ok) {
        setMessage(`✅ Cámara ${editCamera.ip} agregada correctamente`)
        loadData()
        setDiscoveredCameras(prev => prev.filter(c => c.ip !== editCamera.ip))
        setEditCamera(null)
      } else {
        const error = await response.json()
        setMessage(`❌ ${error.error}`)
      }
    } catch (error) {
      setMessage('Error de conexión al agregar cámara')
    }
  }

  async function deleteCamera(id: string) {
    if (!window.confirm('¿Seguro que quieres eliminar esta cámara?')) return;
    try {
      const response = await fetch(`/api/cameras/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMessage('✅ Cámara eliminada');
        loadData();
      } else {
        const error = await response.json();
        setMessage(`❌ ${error.error}`);
      }
    } catch (error) {
      setMessage('Error al eliminar cámara');
    }
  }

  if (loading) {
    return <div style={{ color: 'white', textAlign: 'center', padding: '20px' }}>
      Cargando cámaras...
    </div>
  }

  return (
    <div style={{ color: 'white' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px' 
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>
          Gestión de Cámaras IP
        </h2>
        <button
          onClick={() => setShowManualForm(!showManualForm)}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          {showManualForm ? 'Cancelar' : '➕ Agregar Manual'}
        </button>
      </div>

      {/* Mensaje */}
      {message && (
        <div style={{
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          border: '1px solid #3b82f6',
          color: '#93c5fd',
          padding: '12px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          {message}
          <button 
            onClick={() => setMessage('')}
            style={{ 
              float: 'right', 
              background: 'none', 
              border: 'none', 
              color: '#93c5fd', 
              cursor: 'pointer',
              fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Formulario manual */}
      {showManualForm && (
        <div style={{
          backgroundColor: '#374151',
          borderRadius: '10px',
          border: '1px solid #4b5563',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '15px', color: 'white' }}>
            Agregar Cámara Manualmente
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '15px',
            marginBottom: '20px'
          }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Cancha:
              </label>
              <select
                value={newCamera.court_id}
                onChange={(e) => setNewCamera({...newCamera, court_id: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: '#4b5563',
                  border: '1px solid #6b7280',
                  color: 'white'
                }}
              >
                <option value="">Seleccionar cancha...</option>
                {courts.map(court => (
                  <option key={court.id} value={court.id}>{court.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Nombre:
              </label>
              <input
                type="text"
                value={newCamera.name}
                onChange={(e) => setNewCamera({...newCamera, name: e.target.value})}
                placeholder="Ej: Cámara Cancha 1"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: '#4b5563',
                  border: '1px solid #6b7280',
                  color: 'white'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Dirección IP:
              </label>
              <input
                type="text"
                value={newCamera.ip_address}
                onChange={(e) => setNewCamera({...newCamera, ip_address: e.target.value})}
                placeholder="192.168.1.41"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: '#4b5563',
                  border: '1px solid #6b7280',
                  color: 'white'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Usuario:
              </label>
              <input
                type="text"
                value={newCamera.username}
                onChange={(e) => setNewCamera({...newCamera, username: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: '#4b5563',
                  border: '1px solid #6b7280',
                  color: 'white'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Contraseña:
              </label>
              <input
                type="password"
                value={newCamera.password}
                onChange={(e) => setNewCamera({...newCamera, password: e.target.value})}
                placeholder="Contraseña de la cámara"
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: '#4b5563',
                  border: '1px solid #6b7280',
                  color: 'white'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                Modelo:
              </label>
              <input
                type="text"
                value={newCamera.model}
                onChange={(e) => setNewCamera({...newCamera, model: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '6px',
                  backgroundColor: '#4b5563',
                  border: '1px solid #6b7280',
                  color: 'white'
                }}
              />
            </div>
          </div>

          <button
            onClick={addManualCamera}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            ✅ Agregar Cámara
          </button>
        </div>
      )}

      {/* Descubrimiento automático */}
      <div style={{
        backgroundColor: '#374151',
        borderRadius: '10px',
        border: '1px solid #4b5563',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginBottom: '15px', color: 'white' }}>
          🔍 Descubrimiento Automático
        </h3>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
            Rango de Red:
          </label>
          <input
            type="text"
            value={networkRange}
            onChange={(e) => setNetworkRange(e.target.value)}
            placeholder="192.168.1.0/24"
            style={{
              width: '200px',
              padding: '8px',
              borderRadius: '6px',
              backgroundColor: '#4b5563',
              border: '1px solid #6b7280',
              color: 'white',
              marginRight: '15px'
            }}
          />
          <button
            onClick={discoverCameras}
            disabled={discovering}
            style={{
              backgroundColor: discovering ? '#059669' : '#10b981',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: discovering ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {discovering ? '🔄 Escaneando...' : '📡 Buscar Cámaras'}
          </button>
        </div>

        {/* Cámaras encontradas */}
        {discoveredCameras.length > 0 && (
          <div>
            <h4 style={{ marginBottom: '10px' }}>Cámaras Encontradas:</h4>
            {discoveredCameras.map((camera, index) => (
              <div key={index} style={{
                backgroundColor: '#4b5563',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: '600' }}>{camera.ip}</div>
                  <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                    {camera.configured ? '✅ Configurada' : '❌ No configurada'}
                  </div>
                </div>
                {/* Mostrar botón Configurar SIEMPRE */}
                <button
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#10b981',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleEditDiscovered(camera)}
                >
                  Configurar
                </button>
              </div>
            ))}
            {/* Formulario de edición rápida */}
            {editCamera && (
              <div style={{
                backgroundColor: '#374151',
                borderRadius: '10px',
                border: '1px solid #4b5563',
                padding: '20px',
                marginTop: '10px'
              }}>
                <h4>Configurar Cámara {editCamera.ip}</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                  <div>
                    <label>Cancha:</label>
                    <select
                      value={editCamera.court_id}
                      onChange={e => setEditCamera({ ...editCamera, court_id: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#4b5563', border: '1px solid #6b7280', color: 'white' }}
                    >
                      <option value="">Seleccionar cancha...</option>
                      {courts.map(court => (
                        <option key={court.id} value={court.id}>{court.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>Usuario:</label>
                    <input type="text" value={editCamera.username} onChange={e => setEditCamera({ ...editCamera, username: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#4b5563', border: '1px solid #6b7280', color: 'white' }} />
                  </div>
                  <div>
                    <label>Contraseña:</label>
                    <input type="text" value={editCamera.password} onChange={e => setEditCamera({ ...editCamera, password: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#4b5563', border: '1px solid #6b7280', color: 'white' }} />
                  </div>
                  <div>
                    <label>Modelo:</label>
                    <input type="text" value={editCamera.model} onChange={e => setEditCamera({ ...editCamera, model: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', backgroundColor: '#4b5563', border: '1px solid #6b7280', color: 'white' }} />
                  </div>
                </div>
                <button
                  onClick={saveEditedDiscoveredCamera}
                  style={{ backgroundColor: '#10b981', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', marginTop: '15px' }}
                >
                  Guardar cámara
                </button>
                <button
                  onClick={() => setEditCamera(null)}
                  style={{ backgroundColor: '#6b7280', color: 'white', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '600', marginLeft: '10px' }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lista de cámaras configuradas */}
      <div>
        <h3 style={{ marginBottom: '15px' }}>Cámaras Configuradas</h3>
        {cameras.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
            No hay cámaras configuradas aún
          </div>
        ) : (
          cameras.map(camera => (
            <div key={camera.id} style={{
              backgroundColor: '#374151',
              padding: '20px',
              borderRadius: '10px',
              border: '1px solid #4b5563',
              marginBottom: '15px'
            }}>
              <h4 style={{ marginBottom: '10px', color: 'white' }}>
                {camera.name}
              </h4>
              <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                <div><b>ID:</b> {camera.id}</div>
                <div><b>Court ID:</b> {camera.court_id}</div>
                <div>IP: {camera.ip_address}</div>
                <div>Usuario: {camera.username}</div>
                <div>Estado: {camera.status}</div>
                {camera.court?.name && (
                  <div>Cancha: {camera.court.name}</div>
                )}
              </div>
              <button
                onClick={() => deleteCamera(camera.id)}
                style={{
                  backgroundColor: '#ef4444',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '600',
                  marginTop: '10px'
                }}
              >
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}