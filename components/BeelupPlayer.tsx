'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import videojs from 'video.js'
import 'video.js/dist/video-js.css'

type Vjs = ReturnType<typeof videojs>

export default function BeelupPlayer({ src, poster }: { src: string; poster?: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [player, setPlayer] = useState<Vjs | null>(null)
  const [overlayEl, setOverlayEl] = useState<HTMLDivElement | null>(null)

  // Grabación (MediaRecorder)
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<BlobPart[]>([])
  const [showModal, setShowModal] = useState(false)
  const [clipName, setClipName] = useState(() => {
    const d = new Date(); const z=(n:number)=>String(n).padStart(2,'0')
    return `clip-${d.getFullYear()}${z(d.getMonth()+1)}${z(d.getDate())}_${z(d.getHours())}${z(d.getMinutes())}${z(d.getSeconds())}`
  })

  // Inicializa Video.js
  useEffect(() => {
    let rafId: number | null = null
    let disposed = false
    const init = () => {
      const el = videoRef.current
      if (!el || !el.isConnected || disposed) { rafId = requestAnimationFrame(init); return }

      const isHls = /\.m3u8($|\?)/i.test(src)
      const p = videojs(el, {
        controls: true,
        preload: 'auto',
        fluid: true,
        fill: true,
        autoplay: false,
        poster
      })
      p.src([{ src, type: isHls ? 'application/x-mpegURL' : 'video/mp4' }])
      setPlayer(p)

      // Crear overlay **dentro** del root del player (para que sea visible en fullscreen)
      const root = p.el() as HTMLElement
      const ov = document.createElement('div')
      ov.className = 'bp-overlay'
      root.appendChild(ov)
      setOverlayEl(ov)
    }
    init()

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (player) {
        // limpiar overlay si existe
        const root = player.el() as HTMLElement
        const ov = root.querySelector('.bp-overlay')
        if (ov) ov.remove()
        try { player.dispose() } catch {}
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  function toggleRecord() {
    const video = videoRef.current
    if (!video) return

    if (!isRecording) {
      // @ts-ignore
      const stream: MediaStream | undefined = video.captureStream?.() || (video as any).mozCaptureStream?.()
      if (!stream) { alert('Tu navegador no permite capturar este video.'); return }
      recordedChunksRef.current = []
      try {
        const mr = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9,opus' })
        mediaRecorderRef.current = mr
        mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) recordedChunksRef.current.push(e.data) }
        mr.onstop = () => setShowModal(true)
        mr.start()
        setIsRecording(true)
      } catch { alert('No se pudo iniciar la grabación en el navegador.') }
    } else {
      mediaRecorderRef.current?.stop()
      setIsRecording(false)
    }
  }

  function downloadClip() {
    setShowModal(false)
    const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${clipName || 'clip'}.webm`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div className="bp-frame">
      <video
        key={src}
        ref={videoRef}
        className="video-js vjs-big-play-centered vjs-fill"
        crossOrigin="anonymous"
        playsInline
      />

      {/* Overlay DENTRO del player (portal) */}
      {overlayEl && createPortal(
        <>
          <button
            className="bp-rec"
            onClick={toggleRecord}
            aria-label={isRecording ? 'Detener grabación' : 'Grabar clip'}
          >
            <span className={isRecording ? 'bp-stop' : 'bp-dot'} />
            <span style={{ marginLeft: 8, fontWeight: 600, color: '#fff', fontSize: 14 }}>
              {isRecording ? 'STOP' : 'REC'}
            </span>
          </button>

          {isRecording && <div className="bp-pill">Grabando…</div>}
        </>,
        overlayEl
      )}

      {/* Modal (puede vivir fuera del player) */}
      {overlayEl && showModal && createPortal(
        <div className="bp-modal-inplayer" onClick={() => setShowModal(false)}>
          <div className="bp-card" onClick={(e) => e.stopPropagation()}>
            <h3>Nombre del clip</h3>
            <input value={clipName} onChange={e => setClipName(e.target.value)} />
            <div className="bp-actions">
              <button onClick={() => setShowModal(false)}>Cancelar</button>
              <button onClick={downloadClip}>Descargar</button>
            </div>
          </div>
        </div>,
        overlayEl
      )}

      <style jsx>{`
        /* Marco 16:9 */
        .bp-frame { width:100%; max-width:1100px; margin:0 auto; aspect-ratio:16/9; position:relative; }
        :global(.video-js), :global(.vjs-tech) { width:100% !important; height:100% !important; }
        :global(.video-js .vjs-tech) { object-fit: contain !important; background:#000 !important; border-radius:16px; }

        /* Overlay dentro del player (ocupa todo para posicionar elementos) */
        :global(.bp-overlay) {
          position:absolute; inset:0;
          pointer-events:none;               /* deja pasar clicks al player */
        }
        /* Botón REC: permite clics */
        .bp-rec {
          pointer-events:auto;
          position:absolute; right:12px; top:12px; z-index:5;
          width:42px; height:42px; border:none; cursor:pointer;
          border-radius:9999px !important;
          background: rgba(0,0,0,.55) !important;
          display:flex; align-items:center; justify-content:center;
          outline:none;
        }
        .bp-dot  { width:18px; height:18px; background:#ef4444 !important; border-radius:50% !important; display:block; }
        .bp-stop { width:18px; height:18px; background:#ef4444 !important; border-radius:4px  !important; display:block; }

        .bp-pill {
          pointer-events:none;
          position:absolute; top:12px; left:50%; transform:translateX(-50%);
          background: rgba(0,0,0,.6); color:#fff; font-weight:600;
          padding:6px 12px; border-radius:999px; z-index:5;
        }

        /* Modal */
        .bp-modal { position:fixed; inset:0; background:rgba(0,0,0,.55); display:flex; align-items:center; justify-content:center; z-index:9999; }
        .bp-card  { width:380px; background:#111827; color:#fff; border-radius:16px; padding:18px; display:grid; gap:12px; }
        .bp-card h3 { margin:0; font-weight:700; }
        .bp-card input { padding:10px; border-radius:10px; border:1px solid #374151; background:#1f2937; color:#fff; }
        .bp-actions { display:flex; gap:8px; justify-content:flex-end; }
        .bp-actions button { padding:8px 12px; border-radius:10px; }
        .bp-actions button:last-child { background:#7c3aed; color:#fff; }

        /* Modal in-player */
        .bp-modal-inplayer {
          position:absolute; inset:0;
          background:rgba(0,0,0,.75);
          display:flex; align-items:center; justify-content:center;
          z-index:999;
        }
      `}</style>
    </div>
  )
}
