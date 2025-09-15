'use client'
import React, { useState, useRef, useEffect } from 'react'

type ClipTag = 'buen_punto' | 'smash_x3' | 'x4' | 'blooper' | 'jugada_destacada' | 'error'

type Clip = {
  id: string
  startTime: number
  endTime: number
  duration: number
  tag: ClipTag
  title: string
  created_at: string
}

const tagLabels: Record<ClipTag, { label: string; color: string }> = {
  buen_punto: { label: 'Buen Punto', color: '#10b981' },
  smash_x3: { label: 'Smash x3', color: '#f59e0b' },
  x4: { label: 'X4', color: '#ef4444' },
  blooper: { label: 'Blooper', color: '#8b5cf6' },
  jugada_destacada: { label: 'Jugada Destacada', color: '#3b82f6' },
  error: { label: 'Error', color: '#6b7280' }
}

interface AdvancedVideoPlayerProps {
  src: string
  matchTitle?: string
  onClipSaved?: (clip: Clip) => void
}

export default function AdvancedVideoPlayer({ 
  src, 
  matchTitle = 'Video', 
  onClipSaved 
}: AdvancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  
  // Clipping state
  const [isClipping, setIsClipping] = useState(false)
  const [clipStartTime, setClipStartTime] = useState<number | null>(null)
  const [clipEndTime, setClipEndTime] = useState<number | null>(null)
  const [showClipModal, setShowClipModal] = useState(false)
  const [clipTitle, setClipTitle] = useState('')
  const [clipTag, setClipTag] = useState<ClipTag>('buen_punto')
  const [clips, setClips] = useState<Clip[]>([])
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const formatTime = (time: number): string => {
    const hours = Math.floor(time / 3600)
    const minutes = Math.floor((time % 3600) / 60)
    const seconds = Math.floor(time % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Video event handlers
  const handleLoadedData = (): void => {
    setIsLoading(false)
    setLoadError(null)
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }

  const handleError = (): void => {
    setIsLoading(false)
    setLoadError('Error al cargar el video. Verifica la URL y formato.')
  }

  const handleTimeUpdate = (): void => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime)
    }
  }

  const togglePlay = (): void => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (progressRef.current && videoRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const newTime = (clickX / rect.width) * duration
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const skipTime = (seconds: number): void => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const changePlaybackRate = (rate: number): void => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }

  const handleVolumeChange = (newVolume: number): void => {
    if (videoRef.current) {
      videoRef.current.volume = newVolume
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
    }
  }

  const toggleMute = (): void => {
    if (videoRef.current) {
      const newMuted = !isMuted
      videoRef.current.muted = newMuted
      setIsMuted(newMuted)
    }
  }

  const toggleFullscreen = (): void => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle mouse movement for controls visibility
  const handleMouseMove = (): void => {
    setShowControls(true)
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current)
    }
    
    if (isFullscreen) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }
  }

  // Clipping functions
  const startClipping = (): void => {
    setIsClipping(true)
    setClipStartTime(currentTime)
    setClipEndTime(null)
  }

  const stopClipping = (): void => {
    if (clipStartTime !== null) {
      setClipEndTime(currentTime)
      setShowClipModal(true)
    }
  }

  const cancelClipping = (): void => {
    setIsClipping(false)
    setClipStartTime(null)
    setClipEndTime(null)
  }

  const saveClip = (): void => {
    if (clipStartTime !== null && clipEndTime !== null && clipTitle.trim()) {
      const newClip: Clip = {
        id: Date.now().toString(),
        startTime: Math.min(clipStartTime, clipEndTime),
        endTime: Math.max(clipStartTime, clipEndTime),
        duration: Math.abs(clipEndTime - clipStartTime),
        tag: clipTag,
        title: clipTitle.trim(),
        created_at: new Date().toISOString()
      }
      
      setClips(prevClips => [...prevClips, newClip])
      
      if (onClipSaved) {
        onClipSaved(newClip)
      }
      
      // Reset clipping state
      setShowClipModal(false)
      setIsClipping(false)
      setClipStartTime(null)
      setClipEndTime(null)
      setClipTitle('')
      setClipTag('buen_punto')
    }
  }

  const playClip = (clip: Clip): void => {
    if (videoRef.current) {
      videoRef.current.currentTime = clip.startTime
      videoRef.current.play()
      setIsPlaying(true)
      
      const handleTimeUpdateForClip = (): void => {
        if (videoRef.current && videoRef.current.currentTime >= clip.endTime) {
          videoRef.current.pause()
          setIsPlaying(false)
          videoRef.current.removeEventListener('timeupdate', handleTimeUpdateForClip)
        }
      }
      
      videoRef.current.addEventListener('timeupdate', handleTimeUpdateForClip)
    }
  }

  const downloadClip = (clip: Clip): void => {
    const clipData = {
      title: clip.title,
      startTime: formatTime(clip.startTime),
      endTime: formatTime(clip.endTime),
      duration: formatTime(clip.duration),
      tag: tagLabels[clip.tag].label,
      videoUrl: src,
      timestamps: {
        startSeconds: clip.startTime,
        endSeconds: clip.endTime,
        durationSeconds: clip.duration
      }
    }
    
    const dataStr = JSON.stringify(clipData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `${clip.title.replace(/[^a-z0-9]/gi, '_')}_clip.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent): void => {
      if (showClipModal) return
      
      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          togglePlay()
          break
        case 'arrowleft':
          skipTime(-10)
          break
        case 'arrowright':
          skipTime(10)
          break
        case 'c':
          if (isClipping) {
            stopClipping()
          } else {
            startClipping()
          }
          break
        case 'f':
          toggleFullscreen()
          break
        case 'm':
          toggleMute()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isPlaying, isClipping, currentTime, showClipModal, clipStartTime])

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = (): void => {
      setIsFullscreen(!!document.fullscreenElement)
      if (!document.fullscreenElement) {
        setShowControls(true)
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current)
        }
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  return (
    <div 
      ref={containerRef}
      style={{
        background: '#000',
        borderRadius: isFullscreen ? '0' : '12px',
        overflow: 'hidden',
        position: 'relative',
        maxWidth: '100%',
        width: '100%'
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setShowControls(true)}
    >
      {/* Video Container */}
      <div style={{ 
        position: 'relative', 
        width: '100%',
        height: isFullscreen ? '100vh' : 'auto',
        aspectRatio: isFullscreen ? 'unset' : '16/9',
        backgroundColor: '#000'
      }}>
        <video
          ref={videoRef}
          src={src}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
          onLoadedData={handleLoadedData}
          onTimeUpdate={handleTimeUpdate}
          onError={handleError}
          onClick={togglePlay}
        />
        
        {/* Loading Spinner */}
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTop: '3px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Cargando video 2K...
          </div>
        )}

        {/* Error Message */}
        {loadError && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ef4444',
            textAlign: 'center',
            padding: '20px'
          }}>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>⚠️ Error de reproducción</div>
            <div style={{ fontSize: '14px' }}>{loadError}</div>
          </div>
        )}

        {/* Clipping Overlay */}
        {isClipping && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'rgba(239, 68, 68, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            zIndex: 1000
          }}>
            🎬 Grabando clip... Presiona C para finalizar
          </div>
        )}

        {/* Controls overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
          opacity: showControls ? 1 : 0,
          transition: 'opacity 0.3s ease',
          zIndex: 100
        }}>
          {/* Progress Bar */}
          <div style={{
            height: '4px',
            background: 'rgba(255,255,255,0.3)',
            position: 'relative',
            cursor: 'pointer',
            margin: '0 16px'
          }}
          ref={progressRef}
          onClick={handleSeek}
          >
            <div style={{
              height: '100%',
              background: '#3b82f6',
              width: `${(currentTime / duration) * 100}%`,
              transition: 'width 0.1s'
            }} />
            
            {/* Clip markers */}
            {clips.map(clip => (
              <div key={clip.id} style={{
                position: 'absolute',
                left: `${(clip.startTime / duration) * 100}%`,
                width: `${((clip.endTime - clip.startTime) / duration) * 100}%`,
                height: '100%',
                background: tagLabels[clip.tag].color,
                opacity: 0.7
              }} />
            ))}
            
            {/* Current clipping range */}
            {clipStartTime !== null && (
              <div style={{
                position: 'absolute',
                left: `${(clipStartTime / duration) * 100}%`,
                width: clipEndTime ? `${((clipEndTime - clipStartTime) / duration) * 100}%` : `${((currentTime - clipStartTime) / duration) * 100}%`,
                height: '100%',
                background: '#ef4444',
                opacity: 0.8
              }} />
            )}
          </div>

          {/* Control buttons */}
          <div style={{
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: 'white'
          }}>
            {/* Play/Pause */}
            <button onClick={togglePlay} style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '8px',
              fontSize: '20px'
            }}>
              {isPlaying ? '⏸️' : '▶️'}
            </button>

            {/* Skip buttons */}
            <button onClick={() => skipTime(-10)} style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '14px'
            }}>
              ⏮️10s
            </button>
            
            <button onClick={() => skipTime(10)} style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '14px'
            }}>
              10s⏭️
            </button>

            {/* Time display */}
            <span style={{ fontSize: '14px', minWidth: '100px' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Speed control */}
            <select
              value={playbackRate}
              onChange={(e) => changePlaybackRate(Number(e.target.value))}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px'
              }}
            >
              <option value={0.25}>0.25x</option>
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* Clipping controls */}
            {!isClipping ? (
              <button
                onClick={startClipping}
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              >
                ✂️ Crear Clip
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={stopClipping}
                  style={{
                    background: '#ef4444',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                >
                  Finalizar
                </button>
                <button
                  onClick={cancelClipping}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* Volume */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={toggleMute} style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '16px'
              }}>
                {isMuted || volume === 0 ? '🔇' : '🔊'}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                style={{ width: '60px' }}
              />
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} style={{
              background: 'none',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: '4px',
              fontSize: '16px'
            }}>
              {isFullscreen ? '🗗' : '🗖'}
            </button>
          </div>
        </div>
      </div>

      {/* Clip Modal */}
      {showClipModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: '#1f2937',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            color: 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Guardar Clip</h3>
              <button
                onClick={() => setShowClipModal(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '20px' }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Título del clip
              </label>
              <input
                type="text"
                value={clipTitle}
                onChange={(e) => setClipTitle(e.target.value)}
                placeholder="Ej: Smash ganador punto 15"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  background: '#111827',
                  color: 'white',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Etiqueta
              </label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '8px'
              }}>
                {Object.entries(tagLabels).map(([key, { label, color }]) => (
                  <button
                    key={key}
                    onClick={() => setClipTag(key as ClipTag)}
                    style={{
                      padding: '8px 12px',
                      border: clipTag === key ? `2px solid ${color}` : '1px solid #374151',
                      borderRadius: '6px',
                      background: clipTag === key ? `${color}20` : '#111827',
                      color: clipTag === key ? color : 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px', fontSize: '14px', color: '#9ca3af' }}>
              <div>Inicio: {formatTime(clipStartTime || 0)}</div>
              <div>Fin: {formatTime(clipEndTime || 0)}</div>
              <div>Duración: {formatTime(Math.abs((clipEndTime || 0) - (clipStartTime || 0)))}</div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowClipModal(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #374151',
                  borderRadius: '6px',
                  background: 'transparent',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={saveClip}
                disabled={!clipTitle.trim()}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  background: clipTitle.trim() ? '#3b82f6' : '#374151',
                  color: 'white',
                  cursor: clipTitle.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                💾 Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clips List */}
      {clips.length > 0 && (
        <div style={{
          background: '#111827',
          borderTop: '1px solid #374151',
          padding: '16px'
        }}>
          <h4 style={{ color: 'white', margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
            Clips Guardados ({clips.length})
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px'
          }}>
            {clips.map(clip => (
              <div key={clip.id} style={{
                background: '#1f2937',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid #374151'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    background: tagLabels[clip.tag].color + '20',
                    color: tagLabels[clip.tag].color,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500'
                  }}>
                    {tagLabels[clip.tag].label}
                  </span>
                  <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                    {formatTime(clip.duration)}
                  </span>
                </div>
                
                <div style={{ color: 'white', fontWeight: '500', marginBottom: '8px', fontSize: '14px' }}>
                  {clip.title}
                </div>
                
                <div style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '12px' }}>
                  {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => playClip(clip)}
                    style={{
                      flex: 1,
                      padding: '6px 8px',
                      border: '1px solid #3b82f6',
                      borderRadius: '4px',
                      background: 'rgba(59, 130, 246, 0.1)',
                      color: '#3b82f6',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ▶️ Reproducir
                  </button>
                  <button
                    onClick={() => downloadClip(clip)}
                    style={{
                      padding: '6px 8px',
                      border: '1px solid #10b981',
                      borderRadius: '4px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    📥 Descargar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}