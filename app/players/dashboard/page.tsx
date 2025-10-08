'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

// Asume que esta es la estructura de un partido en tu DB
// ¡Es importante que coincida con tus tablas!
interface Match {
  id: string;
  match_date: string;
  // CORRECCIÓN: Se ajusta para que sea un objeto o nulo, que es lo que Supabase devuelve
  // para una relación de clave foránea.
  tournaments: { name: string, category: string } | null; 
  // CORRECCIÓN: Se ajusta la anidación para que coincida con la consulta.
  courts: { name: string, clubs: { name: string } | null }; 
  instance: string; 
  // CORRECCIÓN: Se ajusta para que sea un objeto, no un array.
  team1: { name: string, id: number }; 
  team2: { name: string, id: number };
  winner_team_id: number | null; // El ganador puede ser nulo
  // CORRECCIÓN: Los sets pueden ser nulos si el partido no se ha jugado
  sets: { team1_score: number, team2_score: number }[] | null;
}

export default function HistorialPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: teamIds } = await supabase.from('team_players').select('team_id').eq('player_id', user.id)
        
        if (teamIds && teamIds.length > 0) {
          const playerTeamIds = teamIds.map(t => t.team_id)
          const { data, error } = await supabase
            .from('matches')
            .select('id, match_date, instance, winner_team_id, sets, tournaments(name, category), courts(name, clubs(name)), team1:team1_id(id, name), team2:team2_id(id, name)')
            .or(`team1_id.in.(${playerTeamIds.join(',')}),team2_id.in.(${playerTeamIds.join(',')})`)
            .order('match_date', { ascending: false })

          if (error) {
            console.error("Error al obtener los partidos:", error)
          } else {
            // CORRECCIÓN: Se realiza una conversión a `unknown` primero para evitar el error de tipo.
            // Esto le dice a TypeScript que confíe en que la forma de los datos es correcta.
            setMatches(data as unknown as Match[])
          }
        }
      }
      setLoading(false)
    }
    loadData()
  }, [])
  
  if (loading) {
    return <div className="text-center p-8 text-slate-500">Cargando historial de partidos...</div>
  }

  const getFinalScore = (sets: { team1_score: number, team2_score: number }[] | null) => {
    if (!sets || sets.length === 0) return "N/A";
    let team1SetsWon = 0;
    let team2SetsWon = 0;
    
    for (const set of sets) {
        if (Number(set.team1_score) > Number(set.team2_score)) {
            team1SetsWon++;
        } else if (Number(set.team2_score) > Number(set.team1_score)) {
            team2SetsWon++;
        }
    }
    return `${team1SetsWon} - ${team2SetsWon}`;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Historial de Partidos</h1>
        <p className="text-slate-500">Un registro de todos tus encuentros.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 text-left">Evento / Torneo</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-left">Horario</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-left">Sede</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-left">Instancia</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-left">Pareja A</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-left">Pareja B</th>
                <th className="px-6 py-4 font-semibold text-slate-600 text-left">Resultado (Sets)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {matches.length > 0 ? matches.map(match => (
                <tr key={match.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* CORRECCIÓN: Se accede a `tournaments` como un objeto */}
                    <div className="font-medium text-slate-800">{match.tournaments?.name || 'Partido Amistoso'}</div>
                    <div className="text-slate-500">{match.tournaments?.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {new Date(match.match_date).toLocaleDateString('es-AR')} - {new Date(match.match_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  {/* CORRECCIÓN: Se accede a `clubs` como un objeto que puede ser nulo */}
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{match.courts?.clubs?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{match.instance}</td>
                  {/* CORRECCIÓN: Se accede a `team1` y `team2` como objetos */}
                  <td className={`px-6 py-4 whitespace-nowrap ${match.winner_team_id === match.team1?.id ? 'font-bold text-emerald-600' : 'text-slate-600'}`}>{match.team1?.name}</td>
                  <td className={`px-6 py-4 whitespace-nowrap ${match.winner_team_id === match.team2?.id ? 'font-bold text-emerald-600' : 'text-slate-600'}`}>{match.team2?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-bold">
                     {getFinalScore(match.sets)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No se han encontrado partidos jugados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}