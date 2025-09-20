'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type Recategorization = {
  id: string
  current_level: string
  previous_level: string
  change_date: string
  published: boolean
}

type PlayerProfile = {
  id: string
  first_name: string
  last_name: string
  category: string
}

export default function RecategorizationsPage() {
  const router = useRouter()
  const [recategorizations, setRecategorizations] = useState<Recategorization[]>([])
  const [player, setPlayer] = useState<PlayerProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Datos simulados basados en tu Figma
  const mockRecategorizations: Recategorization[] = [
    {
      id: '1',
      current_level: '6ta C',
      previous_level: '7ma C',
      change_date: '15/09/2025',
      published: true
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
        .select('id, first_name, last_name, category')
        .eq('id', userId)
        .single()

      if (error) throw error
      
      setPlayer(profile)
      // En producción, aquí cargarías las recategorizaciones reales de la base de datos
      setRecategorizations(mockRecategorizations)
      
    } catch (error) {
      console.error('Error loading player data:', error)
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-slate-300 text-lg">Cargando recategorizaciones...</div>
      </div>
    )
  }

  const displayName = player ? `${player.first_name} ${player.last_name}` : 'Jugador'

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Movimientos</h1>
            <p className="text-slate-400">Historial de cambios de categoría de {displayName}</p>
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
              <p className="text-slate-400">Categoría actual: {player?.category}</p>
            </div>
          </div>
        </div>

        {/* Recategorizations Table */}
        {recategorizations.length > 0 ? (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-6 text-slate-400 font-medium">Nivel Actual</th>
                    <th className="text-left p-6 text-slate-400 font-medium">Nivel Anterior</th>
                    <th className="text-left p-6 text-slate-400 font-medium">Fecha</th>
                    <th className="text-left p-6 text-slate-400 font-medium">Publicado</th>
                  </tr>
                </thead>
                <tbody>
                  {recategorizations.map((recategorization) => (
                    <tr 
                      key={recategorization.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-6">
                        <span className="text-white font-medium text-lg">
                          {recategorization.current_level}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className="text-slate-300">
                          {recategorization.previous_level}
                        </span>
                      </td>
                      <td className="p-6">
                        <span className="text-slate-300">
                          {formatDate(recategorization.change_date)}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center">
                          {recategorization.published ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="text-green-400 font-medium">Publicado</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                              <span className="text-yellow-400 font-medium">Pendiente</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-12 border border-white/10 text-center">
            <div className="text-6xl mb-6">🔄</div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No hay movimientos registrados
            </h3>
            <p className="text-slate-400">
              Los cambios de categoría aparecerán aquí cuando sean procesados.
            </p>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20 mt-8">
          <h3 className="text-lg font-semibold text-white mb-3">Información sobre Recategorizaciones</h3>
          <div className="space-y-2 text-sm text-slate-300">
            <p>• Las recategorizaciones se realizan en base al rendimiento en torneos oficiales.</p>
            <p>• Los cambios de categoría son evaluados periódicamente por la comisión técnica.</p>
            <p>• Una vez publicados, los cambios entran en vigencia para los próximos torneos.</p>
          </div>
        </div>
      </div>
    </div>
  )
}