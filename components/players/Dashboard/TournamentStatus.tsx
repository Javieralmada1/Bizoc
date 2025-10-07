import { Trophy, ShieldCheck, Calendar } from 'lucide-react';
import { Tournament } from '@/app/players/dashboard/types';

interface TournamentStatusProps {
  tournament: Tournament | null;
}

export default function TournamentStatus({ tournament }: TournamentStatusProps) {
  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-full">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Trophy className="mr-3 text-indigo-400" />
        Torneos Activos
      </h2>
      {tournament ? (
        <div className="space-y-4">
          <h3 className="font-bold text-lg text-white">{tournament.name}</h3>
          <div className="text-sm space-y-2">
            <div className="flex items-center text-slate-300">
              <ShieldCheck size={16} className="mr-2 text-slate-500" />
              <span>Organizado por: <strong>{tournament.clubs?.name || 'N/A'}</strong></span>
            </div>
            <div className="flex items-center text-slate-300">
              <Calendar size={16} className="mr-2 text-slate-500" />
              <span>Finaliza: {new Date(tournament.end_date).toLocaleDateString('es-AR')}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 pt-2 border-t border-slate-700">
            Aquí podrías mostrar la próxima ronda, posición, etc.
          </p>
           <button className="w-full mt-4 bg-transparent hover:bg-indigo-600 border border-indigo-600 text-indigo-400 hover:text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
            Ver Bracket del Torneo
          </button>
        </div>
      ) : (
        <div className="text-center flex flex-col items-center justify-center h-full pt-8">
          <Trophy size={40} className="text-slate-600 mb-4" />
          <p className="text-slate-400">No estás participando en ningún torneo actualmente.</p>
          <button className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
            Buscar Torneos
          </button>
        </div>
      )}
    </div>
  );
}
