'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { User } from 'lucide-react'

type PlayerProfile = {
  id: string
  first_name: string
  last_name: string
  phone: string | null
  province: string | null
  city: string | null
  category: string
  matches_played: number
  matches_won: number
  phone_verified: boolean
  created_at: string
}

interface CircularChartProps {
  won: number
  lost: number
  total: number
  percentage: number
  color?: string
}

interface StatCardProps {
  title: string
  won: number
  lost: number
  notLost: number
  percentage: number
  color: string
}

export default function PlayerStatsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<PlayerProfile | null>(null)
  const [activeTab, setActiveTab] = useState<string>('Estadisticas')
  const [loading, setLoading] = useState<boolean>(true)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2025')

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

      await loadProfile(user.id)
      
    } catch (error) {
      console.error('Error checking auth:', error)
      router.replace('/players/auth/login')
    } finally {
      setLoading(false)
    }
  }

  async function loadProfile(userId: string) {
    try {
      const { data: profileData, error } = await supabase
        .from('player_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      setProfile(profileData)
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  // Datos de ejemplo basados en las imágenes - reemplazar con datos reales de Supabase
  const playerData = {
    name: profile ? `${profile.first_name} ${profile.last_name}` : 'Benjamin González',
    category: profile?.category || '6ta C',
    birthDate: '19/02/1997',
    country: 'Argentina',
    province: profile?.province || 'Entre Ríos',
    city: profile?.city || 'Concepción del Uruguay',
    
    // Datos históricos
    historical: {
      partidos: { ganados: profile?.matches_won || 39, perdidos: 20, noPerdidos: 13 },
      sets: { ganados: 92, perdidos: 56, noPerdidos: 38 },
      games: { ganados: 867, perdidos: 611, noPerdidos: 416 }
    },
    
    // Datos del período actual (Circuito 2025)
    periodo2025: {
      partidos: { ganados: 32, perdidos: 21, noPerdidos: 11 },
      sets: { ganados: 78, perdidos: 48, noPerdidos: 28 },
      games: { ganados: 736, perdidos: 390, noPerdidos: 338 }
    },
    
    // Puntajes
    puntajes: {
      circuito2025: { categoria: '7ma', total: 57 },
      circuito2024: { categoria: '6ta', total: 25 }
    },
    
    // Historial de partidos
    historial: [
      { torneo: 'Torneo Septiembre', categoria: '7° Cab D', fecha: '15/09/2025', inscriptos: 29, instancia: 'Campeón', compañero: 'Juan Ramirez', puntos: 200 },
      { torneo: 'Torneo de Agosto', categoria: '6° Cab D', fecha: '25/08/2025', inscriptos: 34, instancia: 'Puesto 3 en G. D', compañero: 'Juan Ramirez', puntos: 75 },
      { torneo: 'Locos otoño', categoria: '7° Cab D', fecha: '30/05/2025', inscriptos: 18, instancia: 'Perdió Semifinal', compañero: 'Juan Ramirez', puntos: 150 },
      { torneo: 'Padel marzo', categoria: '7° Cab D', fecha: '15/08/2025', inscriptos: 29, instancia: 'Campeón', compañero: 'Juan Ramirez', puntos: 25 }
    ]
  }

  const tabs: string[] = ['Datos', 'Historial', 'Estadisticas', 'Recategorizaciones', 'Sanciones', 'Fiscales', 'Enfrentamientos']

  // Componente para gráficos circulares
  const CircularChart = ({ won, lost, total, percentage, color = '#3b82f6' }: CircularChartProps) => {
    const radius = 45
    const strokeWidth = 8
    const normalizedRadius = radius - strokeWidth * 2
    const circumference = normalizedRadius * 2 * Math.PI
    const strokeDasharray = `${percentage / 100 * circumference} ${circumference}`

    return (
      <div className="relative w-24 h-24">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white font-bold text-sm">{percentage.toFixed(1)}%</span>
        </div>
      </div>
    )
  }

  const StatCard = ({ title, won, lost, notLost, percentage, color }: StatCardProps) => (
    <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-white text-lg font-medium">{title}</h4>
        <span className="text-slate-400 text-sm">{percentage.toFixed(1)}%</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-blue-400 text-sm font-medium">{won}</span>
              <span className="text-slate-400 text-sm">Partidos ganados</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-400"></div>
              <span className="text-slate-300 text-sm font-medium">{lost}</span>
              <span className="text-slate-400 text-sm">Partidos perdidos</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-slate-600"></div>
              <span className="text-slate-300 text-sm font-medium">{notLost}</span>
              <span className="text-slate-400 text-sm">Partidos perdidos</span>
            </div>
          </div>
        </div>
        
        <CircularChart 
          won={won}
          lost={lost}
          total={won + lost + notLost}
          percentage={percentage}
          color={color}
        />
      </div>
    </div>
  )

  const renderContent = () => {
    switch(activeTab) {
      case 'Datos':
        return (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
            <div className="flex items-center gap-6 mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {playerData.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <h2 className="text-white text-2xl font-bold">{playerData.name}</h2>
                <p className="text-slate-400">Categoría {playerData.category}</p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Información Personal</h3>
                <div className="space-y-3 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fecha de nacimiento</span>
                    <span>{playerData.birthDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">País</span>
                    <span>{playerData.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Provincia</span>
                    <span>{playerData.province}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ciudad</span>
                    <span>{playerData.city}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-white text-lg font-semibold mb-4">Movimientos</h3>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">Nivel Actual</span>
                    <span className="text-slate-400">Nivel Anterior</span>
                    <span className="text-slate-400">Fecha</span>
                    <span className="text-slate-400">Publicado</span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-white">6ta C</span>
                    <span className="text-white">7ma C</span>
                    <span className="text-white">15/09/2025</span>
                    <span className="text-green-400">✓</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'Historial':
        return (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-white text-xl font-semibold mb-6">Historial del jugador</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left text-slate-400 py-3">Evento / Torneo</th>
                      <th className="text-left text-slate-400 py-3">Categoría</th>
                      <th className="text-left text-slate-400 py-3">Fecha</th>
                      <th className="text-left text-slate-400 py-3">Inscriptos</th>
                      <th className="text-left text-slate-400 py-3">Instancia Avance</th>
                      <th className="text-left text-slate-400 py-3">Compañero</th>
                      <th className="text-left text-slate-400 py-3">Asig. Ptos</th>
                      <th className="text-left text-slate-400 py-3">Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerData.historial.map((match, index) => (
                      <tr key={index} className="border-b border-white/5">
                        <td className="text-white py-4">{match.torneo}</td>
                        <td className="text-slate-300 py-4">{match.categoria}</td>
                        <td className="text-slate-300 py-4">{match.fecha}</td>
                        <td className="text-slate-300 py-4">{match.inscriptos}</td>
                        <td className="text-slate-300 py-4">{match.instancia}</td>
                        <td className="text-slate-300 py-4">{match.compañero}</td>
                        <td className="text-green-400 py-4">✓</td>
                        <td className="text-white font-semibold py-4">{match.puntos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
        
      case 'Estadisticas':
        return (
          <div className="space-y-8">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
              <h2 className="text-white text-2xl font-bold">Estadísticas</h2>
              <select 
                className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <option>Circuito 2025</option>
                <option>Todos los tiempos</option>
              </select>
            </div>
            
            {/* Historical Stats */}
            <div>
              <h3 className="text-white text-xl font-semibold mb-6">Totales Históricos</h3>
              <div className="grid gap-6">
                <StatCard 
                  title="Partidos"
                  won={playerData.historical.partidos.ganados}
                  lost={playerData.historical.partidos.perdidos} 
                  notLost={playerData.historical.partidos.noPerdidos}
                  percentage={68.7}
                  color="#3b82f6"
                />
                
                <StatCard 
                  title="Sets"
                  won={playerData.historical.sets.ganados}
                  lost={playerData.historical.sets.perdidos}
                  notLost={playerData.historical.sets.noPerdidos}
                  percentage={68.7}
                  color="#3b82f6"
                />
                
                <StatCard 
                  title="Games"
                  won={playerData.historical.games.ganados}
                  lost={playerData.historical.games.perdidos}
                  notLost={playerData.historical.games.noPerdidos}
                  percentage={63.8}
                  color="#3b82f6"
                />
              </div>
            </div>
            
            {/* Period Stats */}
            <div>
              <h3 className="text-white text-xl font-semibold mb-6">Totales Período - Circuito 2025</h3>
              <div className="grid gap-6">
                <StatCard 
                  title="Partidos"
                  won={playerData.periodo2025.partidos.ganados}
                  lost={playerData.periodo2025.partidos.perdidos}
                  notLost={playerData.periodo2025.partidos.noPerdidos}
                  percentage={69.8}
                  color="#6366f1"
                />
                
                <StatCard 
                  title="Sets"
                  won={playerData.periodo2025.sets.ganados}
                  lost={playerData.periodo2025.sets.perdidos}
                  notLost={playerData.periodo2025.sets.noPerdidos}
                  percentage={61.3}
                  color="#6366f1"
                />
                
                <StatCard 
                  title="Games"
                  won={playerData.periodo2025.games.ganados}
                  lost={playerData.periodo2025.games.perdidos}
                  notLost={playerData.periodo2025.games.noPerdidos}
                  percentage={53.7}
                  color="#6366f1"
                />
              </div>
            </div>
            
            {/* Points Section */}
            <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
              <h3 className="text-white text-xl font-semibold mb-6">Puntajes obtenidos</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <span className="text-white">Circuito 2025</span>
                    <div className="text-slate-400 text-sm">Categoría 7ma</div>
                  </div>
                  <div>
                    <span className="text-white text-lg font-semibold">57</span>
                    <div className="text-slate-400 text-sm">Total de Puntos</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                  <div>
                    <span className="text-white">Circuito 2025</span>
                    <div className="text-slate-400 text-sm">Categoría 6ta</div>
                  </div>
                  <div>
                    <span className="text-white text-lg font-semibold">25</span>
                    <div className="text-slate-400 text-sm">Total de Puntos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 'Enfrentamientos':
        return (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10">
            <h3 className="text-white text-xl font-semibold mb-6">Listado de Partidos Jugados</h3>
            <p className="text-slate-400 mb-6">Total: 39 encuentros.</p>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-slate-400 py-3">Evento / Torneo</th>
                    <th className="text-left text-slate-400 py-3">Horario</th>
                    <th className="text-left text-slate-400 py-3">Sede</th>
                    <th className="text-left text-slate-400 py-3">Instancia</th>
                    <th className="text-left text-slate-400 py-3">Pareja A</th>
                    <th className="text-left text-slate-400 py-3">Pareja B</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-white/5">
                    <td className="text-white py-4">Torneo septiembre 2025<br/>Caballeros 6ta</td>
                    <td className="text-slate-300 py-4">14/09/2025<br/>12:00</td>
                    <td className="text-slate-300 py-4">Locos C2</td>
                    <td className="text-slate-300 py-4">Octavos de Final</td>
                    <td className="text-slate-300 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>Benjamin Gonzalez</span>
                        <span className="text-blue-400">4/6</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <User size={16} />
                        <span>Juan Ramirez</span>
                        <span className="text-blue-400">2/6</span>
                      </div>
                    </td>
                    <td className="text-slate-300 py-4">
                      <div className="flex items-center gap-2">
                        <User size={16} />
                        <span>Franco Lopez</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <User size={16} />
                        <span>Alejo Gomez</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
        
      case 'Sanciones':
        return (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10 text-center">
            <h3 className="text-white text-xl font-semibold mb-4">Sanciones</h3>
            <p className="text-slate-400">No se encuentran Sanciones aplicadas al jugador</p>
          </div>
        )
        
      case 'Fiscales':
        return (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10 text-center">
            <h3 className="text-white text-xl font-semibold mb-4">Fiscalizaciones históricas</h3>
            <p className="text-slate-400">El Jugador no ha sido Fiscalizado en este evento</p>
          </div>
        )
        
      default:
        return (
          <div className="bg-white/5 backdrop-blur-lg rounded-xl p-8 border border-white/10 text-center">
            <h3 className="text-white text-xl font-semibold mb-4">Recategorizaciones</h3>
            <p className="text-slate-400">Sección en construcción</p>
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="text-slate-300 text-lg">Cargando estadísticas...</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {playerData.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">{playerData.name}</h1>
              <p className="text-slate-400">Perfil del jugador</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 mb-8">
          <div className="flex flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 transition-colors ${
                  activeTab === tab
                    ? 'text-white bg-white/10 border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {renderContent()}
      </div>
    </div>
  )
}