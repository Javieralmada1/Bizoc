import { Bookmark, Clock, MapPin, Building } from 'lucide-react';
import { Reservation } from '@/app/players/dashboard/types';

interface RecentReservationCardProps {
  reservation: Reservation | null;
}

export default function RecentReservationCard({ reservation }: RecentReservationCardProps) {
  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
      <h2 className="text-xl font-bold mb-4 flex items-center">
        <Bookmark className="mr-3 text-indigo-400" />
        Tu Última Reserva
      </h2>
      {reservation ? (
         <div className="space-y-3">
          <div className="flex items-center text-slate-300">
            <Building size={16} className="mr-3 text-slate-500 flex-shrink-0" />
            <span className="font-semibold">{reservation.clubs?.name || 'Club no especificado'}</span>
          </div>
          <div className="flex items-center text-slate-300">
            <MapPin size={16} className="mr-3 text-slate-500 flex-shrink-0" />
            <span>Cancha: <strong>{reservation.courts?.name || 'No especificada'}</strong></span>
          </div>
          <div className="flex items-center text-slate-300">
            <Clock size={16} className="mr-3 text-slate-500 flex-shrink-0" />
            <span>{new Date(reservation.start_time).toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'short' })} hs</span>
          </div>
        </div>
      ) : (
         <div className="text-center py-8">
          <p className="text-slate-400">Aún no has hecho ninguna reserva.</p>
          <button className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm">
            Reservar Cancha
          </button>
        </div>
      )}
    </div>
  );
}
