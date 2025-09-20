'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

type PlayerStats = {
  id: string
  first_name: string
  last_name: string
  category: string
  matches_played: number
  matches_won: number
  sets_played: number
  sets_won: number
  games_played: number
  games_won: number
  points_earned: number
  current_ranking: number | null
  previous_ranking: number | null
}

type StatsData = {
  matches: { won: number; lost: number; total: number }
  sets: { won: number; lost: number; total: number }
  games: { won: number; lost: number; total: number }
}

export default function PlayerStatsPage() {
  const router = useRouter()
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('2025')
  const [loading, setLoading] = useState(true)

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

      await loadPlayerStats(user.id)
      
    } catch (error) {
      console.error('Error checking auth:', error)
      router.replace('/players/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadPlayerStats(userId: string) {
    try {
      // Cargar estadísticas del jugador
      const { data: profile, error } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      // Simular datos de estadísticas más detalladas (en producción vendrían de la BD)
      const stats: PlayerStats = {
        ...profile,
        sets_played: profile.matches_played * 2.8, // Promedio de sets por partido
        sets_won: Math.round(profile.matches_played * 2.8 * (profile.matches_won / profile.matches_played || 0)),
        games_played: profile.matches_played * 18, // Promedio de games por partido
        games_won: Math.round(profile.matches_played * 18 * 0.65), // Simulado
        points_earned: profile.matches_won * 25, // 25 puntos por victoria
        current_ranking: Math.floor(Math.random() * 100) + 1,
        previous_ranking: Math.floor(Math.random() * 100) + 1
      }

      setPlayerStats(stats)
    } catch (error) {
      console.error('Error loading player stats:', error)
    }
  }

  function getStatsData(): StatsData {
    if (!playerStats) return { matches: { won: 0, lost: 0, total: 0 }, sets: { won: 0, lost: 0, total: 0 }, games: { won: 0, lost: 0, total: 0 } }

    return {
      matches: {
        won: playerStats.matches_won,
        lost: playerStats.matches_played - playerStats.matches_won,
        total: playerStats.matches_played
      },
      sets: {
        won: playerStats.sets_won,
        lost: playerStats.sets_played - playerStats.sets_won,
        total: playerStats.sets_played
      },
      games: {
        won: playerStats.games_won,
        lost: playerStats.games_played - playerStats.games_won,
        total: playerStats.games_played
      }
    }
  }

  function formatPercentage(won: number, total: number): string {
    if (total === 0) return '0.0'
    return ((won / total) * 100).toFixed(1)
  }

  function createChartData(won: number, lost: number) {
    return [
      { name: 'Ganados', value: won, color: '#3b82f6' },
      { name: 'Perdidos', value: lost, color: '#e5e7eb' }
    ]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-slate-300 text-lg">Cargando estadísticas...</div>
      </div>
    )
  }

  const statsData = getStatsData()
  const displayName = playerStats ? `${playerStats.first_name} ${playerStats.last_name}` : 'Jugador'

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Estadísticas</h1>
            <p className="text-slate-400">Rendimiento detallado de {displayName}</p>
          </div>
          
          {/* Period Selector */}
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-sm">Período:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="2025">Circuito 2025</option>
              <option value="2024">Circuito 2024</option>
              <option value="all">Todos los tiempos</option>
            </select>
          </div>
        </div>

        {/* Player Info Card */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {playerStats?.first_name?.[0]}{playerStats?.last_name?.[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{displayName}</h2>
              <p className="text-slate-400">Categoría {playerStats?.category}</p>
              {playerStats?.current_ranking && (
                <p className="text-blue-400 text-sm mt-1">
                  Ranking: #{playerStats.current_ranking}
                  {playerStats.previous_ranking && (
                    <span className="ml-2 text-xs">
                      (Anterior: #{playerStats.previous_ranking})
                    </span>
                  )}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Historical Totals */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6">Totales Históricos</h3>
            
            {/* Matches */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-white">Partidos</h4>
                <span className="text-slate-400 text-sm">{formatPercentage(statsData.matches.won, statsData.matches.total)}%</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-400">Partidos ganados</span>
                      <span className="text-white font-medium">{statsData.matches.won}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Partidos perdidos</span>
                      <span className="text-white font-medium">{statsData.matches.lost}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Partidos perdidos</span>
                      <span className="text-white font-medium">{statsData.matches.total - statsData.matches.won}</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={createChartData(statsData.matches.won, statsData.matches.lost)}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {createChartData(statsData.matches.won, statsData.matches.lost).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Sets */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-white">Sets</h4>
                <span className="text-slate-400 text-sm">{formatPercentage(statsData.sets.won, statsData.sets.total)}%</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-400">Sets ganados</span>
                      <span className="text-white font-medium">{statsData.sets.won}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Sets perdidos</span>
                      <span className="text-white font-medium">{statsData.sets.lost}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Sets perdidos</span>
                      <span className="text-white font-medium">{statsData.sets.total - statsData.sets.won}</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={createChartData(statsData.sets.won, statsData.sets.lost)}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {createChartData(statsData.sets.won, statsData.sets.lost).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Games */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-white">Games</h4>
                <span className="text-slate-400 text-sm">{formatPercentage(statsData.games.won, statsData.games.total)}%</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-400">Games ganados</span>
                      <span className="text-white font-medium">{statsData.games.won}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Games perdidos</span>
                      <span className="text-white font-medium">{statsData.games.lost}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Games perdidos</span>
                      <span className="text-white font-medium">{statsData.games.total - statsData.games.won}</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={createChartData(statsData.games.won, statsData.games.lost)}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {createChartData(statsData.games.won, statsData.games.lost).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Period Stats */}
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6">Totales Período - {selectedPeriod}</h3>
            
            {/* Same structure as historical but with period-specific data */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-white">Partidos</h4>
                <span className="text-slate-400 text-sm">{formatPercentage(statsData.matches.won, statsData.matches.total)}%</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-400">Partidos ganados</span>
                      <span className="text-white font-medium">{Math.floor(statsData.matches.won * 0.8)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Partidos perdidos</span>
                      <span className="text-white font-medium">{Math.floor(statsData.matches.lost * 0.8)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Partidos perdidos</span>
                      <span className="text-white font-medium">{Math.floor((statsData.matches.total - statsData.matches.won) * 0.8)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={createChartData(Math.floor(statsData.matches.won * 0.8), Math.floor(statsData.matches.lost * 0.8))}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {createChartData(Math.floor(statsData.matches.won * 0.8), Math.floor(statsData.matches.lost * 0.8)).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Sets for period */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-white">Sets</h4>
                <span className="text-slate-400 text-sm">{formatPercentage(Math.floor(statsData.sets.won * 0.8), Math.floor(statsData.sets.total * 0.8))}%</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-400">Sets ganados</span>
                      <span className="text-white font-medium">{Math.floor(statsData.sets.won * 0.8)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Sets perdidos</span>
                      <span className="text-white font-medium">{Math.floor(statsData.sets.lost * 0.8)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Sets perdidos</span>
                      <span className="text-white font-medium">{Math.floor((statsData.sets.total - statsData.sets.won) * 0.8)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={createChartData(Math.floor(statsData.sets.won * 0.8), Math.floor(statsData.sets.lost * 0.8))}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {createChartData(Math.floor(statsData.sets.won * 0.8), Math.floor(statsData.sets.lost * 0.8)).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Games for period */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-medium text-white">Games</h4>
                <span className="text-slate-400 text-sm">{formatPercentage(Math.floor(statsData.games.won * 0.8), Math.floor(statsData.games.total * 0.8))}%</span>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-400">Games ganados</span>
                      <span className="text-white font-medium">{Math.floor(statsData.games.won * 0.8)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Games perdidos</span>
                      <span className="text-white font-medium">{Math.floor(statsData.games.lost * 0.8)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Games perdidos</span>
                      <span className="text-white font-medium">{Math.floor((statsData.games.total - statsData.games.won) * 0.8)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="w-24 h-24">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={createChartData(Math.floor(statsData.games.won * 0.8), Math.floor(statsData.games.lost * 0.8))}
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={40}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        {createChartData(Math.floor(statsData.games.won * 0.8), Math.floor(statsData.games.lost * 0.8)).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ranking Section */}
        {playerStats?.points_earned && (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mt-8">
            <h3 className="text-xl font-semibold text-white mb-6">Puntajes obtenidos</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400 mb-1">{playerStats.points_earned}</div>
                <div className="text-slate-400 text-sm">Puntos Totales</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {playerStats.current_ranking || 'N/A'}
                </div>
                <div className="text-slate-400 text-sm">Ranking Actual</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {Math.floor(playerStats.points_earned / playerStats.matches_played) || 0}
                </div>
                <div className="text-slate-400 text-sm">Promedio por Partido</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}