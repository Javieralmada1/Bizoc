'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Match = {
  id: string
  title: string | null
  video_url: string | null
  scheduled_at: string | null
  club?: { name: string }
  court?: { name: string }
}
type Highlight = { id: string; match_id: string; second: number; note: string | null }

export default function PublicMatchPage({ params }: { params: { id: string } }) {
  const { id } = params
  const sp = useSearchParams()
  const tParam = sp.get('t') // segundos opcionales ?t=65
  const playerRef = useRef<HTMLVideoElement>(null)

  const [match, setMatch] = useState<Match | null>(null)
  const [highs, setHighs] = useState<Highlight[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      // partido + club/cancha
      const { data: m } = await supabase
        .from('matches')
        .select('id,title,video_url,scheduled_at,club:clubs(name),court:courts(name)')
        .eq('id', id)
        .maybeSingle()

      setMatch(m as any)

      // highlights del partido
      const { data: h } = await supabase
        .from('highlights')
        .select('id,match_id,second,note')
        .eq('match_id', id)
        .order('second', { ascending: true })

      setHighs((h || []) as any)
      setLoading(false)
    })()
  }, [id])

  // saltar al segundo ?t=
  useEffect(() => {
    const sec = Number(tParam)
    if (!isFinite(sec) || !playerRef.current) return
    const v = playerRef.current
    const onReady = () => { v.currentTime = Math.max(0, sec) }
    if (v.readyState >= 1) onReady()
    else v.addEventListener('loadedmetadata', onReady, { once: true })
  }, [tParam, playerRef])

  const title = match?.title || 'Partido'
  const clubName = match?.club?.name || '—'
  const courtName = match?.court?.name || '—'

  const shareUrl = useMemo(() => (second: number) =>
    `${location.origin}/m/${id}?t=${Math.floor(second)}`, [id])

  if (loading) {
    return <div style={wrap}><p style={muted}>Cargando…</p></div>
  }
  if (!match) {
    return <div style={wrap}><p style={muted}>Partido no encontrado.</p></div>
  }

  return (
    <main style={page}>
      <div style={card}>
        <h1 style={{ margin: 0 }}>{title}</h1>
        <p style={muted}>Club: {clubName} • Cancha: {courtName}</p>

        {match.video_url ? (
          <video
            ref={playerRef}
            src={match.video_url}
            controls
            style={{ width: '100%', borderRadius: 12, background: '#000' }}
          />
        ) : (
          <p style={muted}>No hay video asociado.</p>
        )}

        <div style={{ marginTop: 16 }}>
          <h3 style={{ margin: '12px 0' }}>Highlights</h3>
          {highs.length === 0 && <p style={muted}>Aún no hay jugadas marcadas.</p>}
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {highs.map(h => (
              <li key={h.id} style={row}>
                <button
                  style={btn}
                  onClick={() => {
                    if (!playerRef.current) return
                    playerRef.current.currentTime = h.second
                    playerRef.current.play()
                  }}
                >
                  ▶ {fmt(h.second)}
                </button>
                <span style={{ opacity: .9 }}>{h.note || ''}</span>
                <button
                  style={btnGhost}
                  onClick={() => navigator.clipboard.writeText(shareUrl(h.second))}
                  title="Copiar link en este segundo"
                >
                  Copiar link
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const ss = Math.floor(s % 60).toString().padStart(2, '0')
  return `${m}:${ss}`
}

/* estilos mínimos */
const page: React.CSSProperties = {
  minHeight: '100vh',
  background: 'radial-gradient(1200px 500px at 50% -20%, rgba(255,255,255,.06), rgba(0,0,0,.9))',
  padding: 24,
  display: 'grid',
  placeItems: 'start center'
}
const card: React.CSSProperties = {
  width: 'min(980px, 100%)',
  background: 'rgba(0,0,0,.8)',
  color: '#fff',
  border: '1px solid rgba(255,255,255,.15)',
  borderRadius: 16,
  padding: 16,
  boxShadow: '0 20px 40px rgba(0,0,0,.5)'
}
const wrap: React.CSSProperties = { ...page, color: '#fff' }
const muted: React.CSSProperties = { color: 'rgba(255,255,255,.75)' }
const row: React.CSSProperties = { display: 'flex', gap: 8, alignItems: 'center' }
const btn: React.CSSProperties = {
  background: '#ffd000', color: '#000', fontWeight: 800,
  border: 'none', padding: '6px 10px', borderRadius: 10, cursor: 'pointer'
}
const btnGhost: React.CSSProperties = {
  background: 'transparent', color: 'rgba(255,255,255,.85)',
  border: '1px solid rgba(255,255,255,.25)', padding: '6px 10px',
  borderRadius: 10, cursor: 'pointer'
}
