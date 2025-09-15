'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import BeelupPlayer from '@/components/BeelupPlayer'

type Club = { id: string; name: string }
type Court = { id: string; name: string; club_id: string }
type Match = {
  id: string
  title: string
  video_url: string | null
  scheduled_at: string | null
  club_id: string | null
  court_id: string | null
  club?: { name: string } | null
  court?: { name: string } | null
}

export default function MatchesLanding() {
  const supabase = createClientComponentClient()

  const [clubs, setClubs] = useState<Club[]>([])
  const [courts, setCourts] = useState<Court[]>([])
  const [matches, setMatches] = useState<Match[]>([])

  // Filtros
  const [clubId, setClubId] = useState<string>('')
  const [courtId, setCourtId] = useState<string>('')
  const [date, setDate] = useState<string>('')   // yyyy-mm-dd
  const [time, setTime] = useState<string>('')   // HH:mm

  // Nuevo estado para el partido buscado
  const [match, setMatch] = useState<{ video_url: string | null } | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data: clubsData } = await supabase.from('clubs').select('id,name').order('name', { ascending: true })
      setClubs(clubsData ?? [])

      const { data: courtsData } = await supabase.from('courts').select('id,name,club_id').order('name', { ascending: true })
      setCourts(courtsData ?? [])

      const { data: matchesData } = await supabase
        .from('matches')
        .select('id,title,video_url,scheduled_at,club_id,court_id, clubs:club_id(name), courts:court_id(name)')
        .order('scheduled_at', { ascending: false })
      const mapped = (matchesData ?? []).map((m: any) => ({
        ...m,
        club: m.clubs ? { name: m.clubs.name } : null,
        court: m.courts ? { name: m.courts.name } : null,
      })) as Match[]
      setMatches(mapped)
    }

    load()
  }, [supabase])

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (clubId && m.club_id !== clubId) return false
      if (courtId && m.court_id !== courtId) return false
      if (date) {
        if (!m.scheduled_at) return false
        const d = new Date(m.scheduled_at)
        const dISO = d.toISOString().slice(0, 10) // yyyy-mm-dd
        if (dISO !== date) return false
      }
      if (time) {
        if (!m.scheduled_at) return false
        const d = new Date(m.scheduled_at)
        const hh = String(d.getHours()).padStart(2, '0')
        const mm = String(d.getMinutes()).padStart(2, '0')
        const hhmm = `${hh}:${mm}`
        if (hhmm !== time) return false
      }
      return true
    })
  }, [matches, clubId, courtId, date, time])

  const goFirst = () => {
    // si hay coincidencias, vamos al primero
    if (filtered.length > 0) {
      window.location.href = `/m/${filtered[0].id}`
    }
  }

  // courts por club seleccionado
  const courtsForClub = useMemo(
    () => (clubId ? courts.filter((c) => c.club_id === clubId) : []),
    [courts, clubId]
  )

  // Nuevo: formulario para buscar partido y mostrar el reproductor
  async function buscarPartido(formData: FormData) {
    // Ejemplo: buscar por ID
    const id = formData.get('matchId') as string
    if (!id) return
    const { data } = await supabase
      .from('matches')
      .select('id,title,video_url,scheduled_at,club_id,court_id')
      .eq('id', id)
      .single()
    if (data) setMatch(data)
    else setMatch(null)
  }

  async function verPartido(id: string) {
    // Ejemplo de fetch a Supabase
    const { data } = await supabase
      .from('matches')
      .select('video_url')
      .eq('id', id)
      .single()
    setMatch(data)
  }

  return (
    <main className="min-h-screen text-white">
      {/* HERO */}
      <section className="relative min-h-[40vh] flex items-center">
        {/* Fondo: imagen + velado */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/m-hero.jpg')", // poné tu imagen en /public/m-hero.jpg
          }}
        />
        <div className="absolute inset-0 bg-black/60" />

        {/* Contenido hero */}
        <div className="relative w-full max-w-5xl mx-auto px-4 py-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            REVIVÍ TU PARTIDO
          </h1>
          <p className="mt-3 text-white/80 max-w-2xl">
            Encontrá tus mejores jugadas y compartilas con tus amigxs.
          </p>

          {/* Filtros */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-3">
            {/* Club */}
            <select
              className="ui-input"
              value={clubId}
              onChange={(e) => {
                setClubId(e.target.value)
                setCourtId('') // reset cancha
              }}
            >
              <option value="">Elegí el club</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Cancha */}
            <select
              className="ui-input disabled:opacity-40"
              disabled={!clubId}
              value={courtId}
              onChange={(e) => setCourtId(e.target.value)}
            >
              <option value="">{clubId ? 'Elegí la cancha' : 'Primero elegí club'}</option>
              {courtsForClub.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Fecha */}
            <input
              type="date"
              className="ui-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />

            {/* Horario */}
            <input
              type="time"
              className="ui-input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />

            {/* Ver video */}
            <button className="ui-btn" onClick={goFirst}>
              VER VIDEO
            </button>
          </div>
        </div>
      </section>

      {/* NUEVO: Formulario de búsqueda y reproductor */}
      <section className="relative w-full max-w-5xl mx-auto px-4 py-6">
        <form
          className="flex gap-2 items-center"
          onSubmit={async (e) => {
            e.preventDefault()
            await buscarPartido(new FormData(e.currentTarget))
          }}
        >
          <input
            name="matchId"
            type="text"
            className="ui-input"
            placeholder="ID de partido para ver video"
          />
          <button type="submit" className="ui-btn">Buscar partido</button>
        </form>

        {match?.video_url ? (
          <div className="mt-6">
            <BeelupPlayer
              src={match.video_url.startsWith('http')
                ? match.video_url
                : match.video_url}
            />
          </div>
        ) : null}
      </section>

      {/* LISTA DE PARTIDOS */}
      <section className="relative w-full max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-semibold mb-4">Partidos</h2>

        {/* Card contenedora */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-2 sm:p-3">
          {filtered.length === 0 ? (
            <div className="text-white/70 p-4">No hay partidos para los filtros seleccionados.</div>
          ) : (
            <ul className="divide-y divide-white/10">
              {filtered.map((m) => {
                const when = m.scheduled_at ? new Date(m.scheduled_at) : null
                const fecha = when
                  ? when.toLocaleDateString(undefined, {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    })
                  : 'Sin fecha'
                const hora = when
                  ? when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
                  : ''

                return (
                  <li key={m.id} className="py-3 sm:py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <p className="font-medium">{m.title || 'Partido'}</p>
                          {m.club?.name && (
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-xs">
                              {m.club.name}
                            </span>
                          )}
                          {m.court?.name && (
                            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-xs">
                              {m.court.name}
                            </span>
                          )}
                          <span className="text-white/60 text-sm">
                            {fecha} {hora && `· ${hora}`}
                          </span>
                        </div>
                        {!m.video_url && (
                          <p className="text-xs text-white/50 mt-1">Aún sin video</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/m/${m.id}`} className="ui-btn">
                          Ver
                        </Link>
                        {m.video_url && (
                          <button
                            className="ui-btn--ghost rounded-xl px-4 h-10"
                            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/m/${m.id}`)}
                            title="Copiar link"
                          >
                            Copiar link
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </main>
  )
}
