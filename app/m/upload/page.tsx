'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Match = { id: string, created_at: string, scheduled_at: string | null }

const BUCKET = 'videos' // <-- cambia si tu bucket tiene otro nombre

export default function UploadVideoPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedId, setSelectedId] = useState<string>('new')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) return router.replace('/login')
      setUserId(data.user.id)

      const { data: m } = await supabase
        .from('matches')
        .select('id, created_at, scheduled_at')
        .order('created_at', { ascending: false })
      setMatches(m ?? [])
    })()
  }, [router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return setMsg('Elegí un archivo de video')
    if (!userId) return

    setMsg(null); setLoading(true)
    try {
      // 1) Subir a Storage
      const ext = file.name.split('.').pop() || 'mp4'
      const path = `${userId}/${Date.now()}.${ext}`

      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600', upsert: false
      })
      if (upErr) throw upErr

      const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path)
      const video_url = pub.publicUrl

      // 2) Asociar a partido (crear o actualizar)
      let matchId = selectedId
      if (selectedId === 'new') {
        const { data: created, error } = await supabase
          .from('matches').insert([{ video_url }]).select('id').single()
        if (error) throw error
        matchId = created!.id
      } else {
        const { error } = await supabase
          .from('matches').update({ video_url }).eq('id', selectedId)
        if (error) throw error
      }

      router.push(`/m/${matchId}`)
    } catch (err: any) {
      setMsg(err.message ?? 'Error al subir/guardar el video')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen pt-28 px-4 flex items-start justify-center">
      <form onSubmit={onSubmit}
            className="w-full max-w-lg bg-black/65 text-white border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <h1 className="text-2xl font-bold mb-4">Subir video</h1>

        <label className="block text-sm mb-1">Archivo</label>
        <input type="file" accept="video/*" onChange={e=>setFile(e.target.files?.[0] ?? null)}
               className="w-full mb-4" />

        <label className="block text-sm mb-1">Asociar a</label>
        <select value={selectedId} onChange={e=>setSelectedId(e.target.value)}
                className="w-full mb-4 rounded-lg px-3 py-2 bg-white/10 border border-white/20 outline-none">
          <option value="new">Crear partido nuevo</option>
          {matches.map(m => (
            <option key={m.id} value={m.id}>
              Partido #{m.id.slice(0,8)} · {m.scheduled_at ? new Date(m.scheduled_at).toLocaleString() : 'sin fecha'}
            </option>
          ))}
        </select>

        <button disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Subiendo…' : 'Subir y guardar'}
        </button>

        {msg && <p className="mt-3 text-sm text-red-300">{msg}</p>}
      </form>
    </main>
  )
}
