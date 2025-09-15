'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Tagger({ matchId, videoUrl }: { matchId: string, videoUrl: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [tIn, setTIn] = useState<number | null>(null)
  const [tOut, setTOut] = useState<number | null>(null)
  const [title, setTitle] = useState('')
  const [highlights, setHighlights] = useState<any[]>([])

  async function load() {
    const { data } = await supabase.from('highlights').select('*').eq('match_id', matchId).order('t_in')
    setHighlights(data ?? [])
  }
  useEffect(() => { load() }, [matchId])

  function setIn() {
    const t = Math.floor(videoRef.current?.currentTime ?? 0)
    setTIn(t)
  }
  function setOut() {
    const t = Math.floor(videoRef.current?.currentTime ?? 0)
    setTOut(t)
  }

  async function save() {
    if (tIn==null || tOut==null || tOut<=tIn) return alert('Ajustá IN/OUT')
    const { error } = await supabase.from('highlights').insert({ match_id: matchId, title: title || null, t_in: tIn, t_out: tOut })
    if (error) alert(error.message)
    else { setTitle(''); setTIn(null); setTOut(null); await load() }
  }

  function jump(t:number) {
    if (!videoRef.current) return
    videoRef.current.currentTime = t
    videoRef.current.play()
  }

  return (
    <div className="grid" style={{gap:12}}>
      <video ref={videoRef} src={videoUrl} controls playsInline />
      <div className="row">
        <button onClick={setIn}>IN</button>
        <button onClick={() => jump(Math.max(0, (videoRef.current?.currentTime ?? 0) - 5))}>⟲ 5s</button>
        <button onClick={() => jump((videoRef.current?.currentTime ?? 0) + 5)}>⟳ 5s</button>
        <button onClick={setOut}>OUT</button>
      </div>
      <div className="row">
        <input placeholder="Título (opcional)" value={title} onChange={e=>setTitle(e.target.value)} />
        <div className="badge">IN: {tIn ?? '-'}</div>
        <div className="badge">OUT: {tOut ?? '-'}</div>
        <button onClick={save}>Guardar highlight</button>
      </div>

      <h3>Highlights</h3>
      <table className="table">
        <thead><tr><th>Desde</th><th>Hasta</th><th>Título</th><th>Acciones</th></tr></thead>
        <tbody>
          {highlights.map(h => (
            <tr key={h.id}>
              <td>{h.t_in}s</td>
              <td>{h.t_out}s</td>
              <td>{h.title ?? ''}</td>
              <td>
                <button onClick={() => jump(h.t_in)}>▶️ Reproducir</button>
                <a className="badge" href={`?t=${h.t_in}`} target="_self">Link</a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
