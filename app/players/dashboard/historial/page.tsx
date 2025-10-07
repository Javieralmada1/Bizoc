'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

// Asume que esta es la estructura de un partido en tu DB
interface Match {
  id: string;
  match_date: string;
  tournaments: { name: string, category: string }; // Relación con torneos
  courts: { name: string, clubs: { name: string } }; // Relación anidada
  instance: string; // Ej: 'Octavos de Final'
  team1: { name: string }; // Relación con equipos
  team2: { name: string };
  winner_team_id: string;
  sets: any[]; // Asume que 'sets' es un JSON
}

export default function HistorialPage() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: teamIds } = await supabase.from('team_players').select('team_id').eq('player_id', user.id)
        if (teamIds) {
          const playerTeamIds = teamIds.map(t => t.team_id)
          const { data, error } = await supabase
            .from('matches')
            .select('*, tournaments(name, category), courts(name, clubs(name)), team1:team1_id(name), team2:team2_id(name)')
            .or(`team1_id.in.(${playerTeamIds.join(',')}),team2_id.in.(${playerTeamIds.join(',')})`)
            .order('match_date', { ascending: false })

          if (error) console.error("Error fetching matches:", error)
          else setMatches(data as Match[])
        }
      }
      setLoading(false)
    }
    loadData()
  }, [])
  
  if (loading) {
    return <div className="text-center p-8 text-slate-500">Cargando historial de partidos...</div>
  }

  // Función para obtener el resultado final del partido a partir de los sets
  const getFinalScore = (sets: any[], team1Id: string, team2Id: string) => {
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
                <th className="px-6 py-4 font-semibold text-slate-600 text-left">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {matches.length > 0 ? matches.map(match => (
                <tr key={match.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-800">{match.tournaments?.name || 'Partido Amistoso'}</div>
                    <div className="text-slate-500">{match.tournaments?.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                    {new Date(match.match_date).toLocaleDateString('es-AR')} - {new Date(match.match_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{match.courts.clubs.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{match.instance}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{match.team1.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-600">{match.team2.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-slate-800 font-bold">
                     {getFinalScore(match.sets, match.team1_id, match.team2_id)}
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