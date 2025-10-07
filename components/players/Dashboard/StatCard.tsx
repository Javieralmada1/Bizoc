import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  value: string;
}

export default function StatCard({ icon: Icon, title, value }: StatCardProps) {
  return (
    <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 flex items-center space-x-4 transition-all hover:bg-slate-800 hover:border-indigo-500">
      <div className="bg-slate-900 p-3 rounded-lg">
        <Icon className="text-indigo-400" size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
