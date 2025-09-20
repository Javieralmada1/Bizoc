'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Match = {
  id: string
  tournament_name: string
  category: string
  date: string
  participants: number
  stage: string
  partner: string
  result: 'won' | 'lost'
  points: number
  score?: string
}

type PlayerProfile = {
  id: string
  first_name: string
  last_name: string
}

export default function PlayerMatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [player, setPlayer] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Datos simulados que coinciden con tu Figma
  const mockMatches: Match[] = [
    {
      id: '1',
      tournament_name: 'Torneo Septiembre',
      category: '7ª Cab D',
      date: '15/09/2025',
      participants: 29,
      stage: 'Campeón',
      partner: 'Juan Ramirez',
      result: 'won',
      points: 200,
      score: '6-4 6-2'
    },
    {
      id: '2', 
      tournament_name: 'Torneo de Agosto',
      category: '6ª Cab D',
      date: '25/08/2025',
      participants: 34,
      stage: 'Puesto 3 en G. D',
      partner: 'Juan Ramirez',
      result: 'lost',
      points: 75,
      score: '4-6 7-5 4-6'
    },
    {
      id: '3',
      tournament_name: 'Locos otoño',
      category: '7ª Cab D', 
      date: '30/05/2025',
      participants: 18,
      stage: 'Perdió Semifinal',
      partner: 'Juan Ramirez',
      result: 'lost',
      points: 150,
      score: '6-3 4-6 5-7'
    },
    {
      id: '4',
      tournament_name: 'Padel marzo',
      category: '7ª Cab D',
      date: '15/03/2025', 
      participants: 29,
      stage: 'Campeón',
      partner: 'Juan Ramirez',
      result: 'won',
      points: 25,
      score: '6-1 6-4'
    }
  ]

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  async function checkAuthAndLoadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.replace('/players/auth/login')
        return
      }

      await loadPlayerData(user.id)
      
    } catch (error) {
      console.error('Error checking auth:', error)
      router.replace('/players/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadPlayerData(userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from('player_profiles')
        .select('id, first_name, last_name')
        .eq('id', userId)
        .single()

      if (error) throw error
      
      setPlayer(profile)
      // En producción, aquí cargarías los partidos reales de la base de datos
      setMatches(mockMatches)
      
    } catch (error) {
      console.error('Error loading player data:', error)
    }
  }

  function getResultIcon(result: 'won' | 'lost') {
    return result === 'won' ? '✓' : '✗'
  }

  function getResultColor(result: 'won' | 'lost') {
    return result === 'won' ? 'text-green-400' : 'text-red-400'
  }

  function getStageColor(stage: string) {
    if (stage.includes('Campeón')) return 'text-yellow-400'
    if (stage.includes('Finalista')) return 'text-blue-400'
    if (stage.includes('Semifinal')) return 'text-orange-400'
    return 'text-slate-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-slate-300 text-lg">Cargando historial...</div>
      </div>
    )
  }

  const displayName = player ? `${player.first_name} ${player.last_name}` : 'Jugador'

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Historial del jugador</h1>
            <p className="text-slate-400">Registro completo de partidos de {displayName}</p>
          </div>
        </div>

        {/* Player Info */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {player?.first_name?.[0]}{player?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{displayName}</h2>
              <p className="text-slate-400">Historial completo de participaciones</p>
            </div>
          </div>
        </div>

        {/* Matches Table */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left p-4 text-slate-400 font-medium">Evento / Torneo</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Categoría</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Fecha</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Inscriptos</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Instancia Avance</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Compañero</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Asig. Ptos</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Puntos</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((match) => (
                  <tr 
                    key={match.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="text-white font-medium">{match.tournament_name}</div>
                      {match.score && (
                        <div className="text-slate-400 text-sm mt-1">{match.score}</div>
                      )}
                    </td>
                    <td className="p-4 text-slate-300">{match.category}</td>
                    <td className="p-4 text-slate-300">{match.date}</td>
                    <td className="p-4 text-slate-300">{match.participants}</td>
                    <td className="p-4">
                      <span className={`font-medium ${getStageColor(match.stage)}`}>
                        {match.stage}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{match.partner}</td>
                    <td className="p-4">
                      <div className={`flex items-center justify-center w-6 h-6 rounded-full text-sm font-bold ${
                        match.result === 'won' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {getResultIcon(match.result)}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-bold">{match.points}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {matches.length}
            </div>
            <div className="text-slate-400">Torneos Jugados</div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {matches.filter(m => m.result === 'won').length}
            </div>
            <div className="text-slate-400">Torneos Ganados</div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {matches.reduce((sum, match) => sum + match.points, 0)}
            </div>
            <div className="text-slate-400">Total Puntos</div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {matches.filter(m => m.stage.includes('Campeón')).length}
            </div>
            <div className="text-slate-400">Campeonatos</div>
          </div>
        </div>

        {/* Empty State */}
        {matches.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🎾</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay partidos registrados
            </h3>
            <p className="text-slate-400">
              Los partidos aparecerán aquí cuando participes en torneos.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}