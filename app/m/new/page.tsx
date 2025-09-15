'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

export default function NewMatchPage() {
  const router = useRouter()
  const [dt, setDt] = useState<string>('') // YYYY-MM-DDTHH:mm
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/login')
    })
  }, [router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMsg(null)
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert([{ scheduled_at: dt ? new Date(dt).toISOString() : null }])
        .select('id')
        .single()
      if (error) throw error
      router.push(`/m/${data!.id}`)
    } catch (err: any) {
      setMsg(err.message ?? 'Error al crear el partido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen pt-28 px-4 flex items-start justify-center">
      <form onSubmit={onSubmit}
            className="w-full max-w-md bg-black/65 text-white border border-white/10 rounded-2xl p-6 backdrop-blur-md">
        <h1 className="text-2xl font-bold mb-4">Nuevo partido</h1>

        <label className="block text-sm mb-1">Fecha y hora (opcional)</label>
        <input type="datetime-local" value={dt} onChange={e=>setDt(e.target.value)}
               className="w-full mb-4 rounded-lg px-3 py-2 bg-white/10 border border-white/20 outline-none" />

        <button disabled={loading} className="btn btn-primary w-full">
          {loading ? 'Creando…' : 'Crear partido'}
        </button>

        {msg && <p className="mt-3 text-sm text-red-300">{msg}</p>}
      </form>
    </main>
  )
}
