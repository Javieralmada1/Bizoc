import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { Match } from '@/app/players/dashboard/types';

interface UpcomingMatchCardProps {
  match: Match | null;
}

// Función para formatear nombres de equipo
const formatTeamName = (team: any) => {
  if (!team || (!team.players && !team.players2)) return 'Equipo no definido';
  const p1 = team.players ? `${team.players.first_name} ${team.players.last_name}` : '';
  const p2 = team.players2 ? `${team.players2.first_name} ${team.players2.last_name}` : '';
  return [p1, p2].filter(Boolean).join(' y ');
};

export default function UpcomingMatchCard({ match }: UpcomingMatchCardProps) {
  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Calendar className="mr-3 text-indigo-400" />
        Próximo Partido
      </h2>
      {match ? (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-lg text-center">
            <p className="font-semibold text-indigo-400">{formatTeamName(match.teams1)}</p>
            <p className="text-slate-400 my-2 font-bold text-lg">VS</p>
            <p className="font-semibold text-slate-300">{formatTeamName(match.teams2)}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center text-slate-300">
              <MapPin size={16} className="mr-2 text-slate-500" />
              <span>{match.courts?.name || 'Cancha por definir'}</span>
            </div>
            <div className="flex items-center text-slate-300">
              <Calendar size={16} className="mr-2 text-slate-500" />
              <span>{new Date(match.match_date).toLocaleDateString('es-AR')}</span>
            </div>
             <div className="flex items-center text-slate-300">
              <Clock size={16} className="mr-2 text-slate-500" />
              <span>{new Date(match.match_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-slate-400">No tienes partidos programados próximamente.</p>
          <button className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
            Buscar Partidos
          </button>
        </div>
      )}
    </div>
  );
}
