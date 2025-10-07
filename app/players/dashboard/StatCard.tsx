import React from 'react';

// Añadimos "export" para que esta interfaz pueda ser importada en otros archivos.
export interface StatCardProps {
  title: string;
  won: number;
  lost: number;
  notLost: number;
  percentage: number;
  color?: string;
}

const CircularChart = ({ percentage, color }: { percentage: number; color: string }) => {
  const radius = 32;
  const stroke = 5;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex-shrink-0">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-slate-700">{percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({ title, won, lost, notLost, percentage, color = '#3b82f6' }) => {
  const total = won + lost + notLost;
  const wonPercentage = total > 0 ? (won / total) * 100 : 0;
  const lostPercentage = total > 0 ? (lost / total) * 100 : 0;
  const notLostPercentage = total > 0 ? (notLost / total) * 100 : 0;

  return (
    <div className="figma-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-slate-900 text-lg font-medium">{title}</h4>
          <p className="text-sm text-slate-500">Efectividad</p>
        </div>
        <CircularChart percentage={percentage} color={color} />
      </div>

      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}></div>
            <span className="text-slate-500">Partidos Ganados</span>
          </div>
          <span className="font-medium text-slate-700">{won}</span>
        </div>
        <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
           <div className="absolute top-0 left-0 h-full rounded-full" style={{ width: `${wonPercentage}%`, backgroundColor: color }}></div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400"></div>
            <span className="text-slate-500">Partidos Perdidos</span>
          </div>
          <span className="font-medium text-slate-700">{lost}</span>
        </div>
         <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
           <div className="absolute top-0 left-0 h-full rounded-full bg-slate-400" style={{ width: `${lostPercentage}%` }}></div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
            <span className="text-slate-500">Partidos No Perdidos</span>
          </div>
          <span className="font-medium text-slate-700">{notLost}</span>
        </div>
         <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
           <div className="absolute top-0 left-0 h-full rounded-full bg-slate-200" style={{ width: `${notLostPercentage}%` }}></div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;

