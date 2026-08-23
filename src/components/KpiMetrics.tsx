import React from 'react';
import { Calendar, Users, FileText, DollarSign } from 'lucide-react';
import { DashboardData } from '../types';

interface KpiMetricsProps {
  data: DashboardData;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({ data }) => {
  const totalMatches = data.matches.length;
  const totalPredictions = data.predictions.length;
  const uniqueUsers = new Set(data.predictions.map((p) => p.user_id)).size;
  const paidPredictions = data.predictions.filter((p) => p.paid).length;

  const kpiCards = [
    {
      id: 'kpi-matches',
      label: 'Partidas',
      value: totalMatches,
      sub: `${data.matches.filter((m) => !m.completed).length} abertas`,
      icon: Calendar,
      color: 'from-emerald-50 to-green-50 border-emerald-200 text-emerald-800',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'kpi-participants',
      label: 'Participantes',
      value: uniqueUsers,
      sub: 'apostadores ativos',
      icon: Users,
      color: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-800',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'kpi-predictions',
      label: 'Palpites',
      value: totalPredictions,
      sub: 'registrados no total',
      icon: FileText,
      color: 'from-emerald-50 to-green-50 border-emerald-200 text-emerald-800',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
    {
      id: 'kpi-payments',
      label: 'Pagamentos (Pix)',
      value: `${paidPredictions}/${totalPredictions}`,
      sub: `${totalPredictions - paidPredictions} pendentes`,
      icon: DollarSign,
      color: 'from-emerald-50 to-lime-50 border-emerald-200 text-emerald-800',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
      {kpiCards.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            id={kpi.id}
            className={`p-4 rounded-xl border bg-gradient-to-br shadow-sm hover:shadow-md transition-shadow relative overflow-hidden ${kpi.color}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-emerald-900/70 uppercase tracking-wider">
                  {kpi.label}
                </p>
                <p className="text-2xl font-bold text-emerald-950 mt-1 tracking-tight">
                  {kpi.value}
                </p>
                <p className="text-xs text-emerald-700 mt-0.5">{kpi.sub}</p>
              </div>
              <div className={`p-2.5 rounded-lg ${kpi.iconBg} shadow-inner`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600/40" />
          </div>
        );
      })}
    </div>
  );
};
