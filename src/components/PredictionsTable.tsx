import React, { useState } from 'react';
import { CheckCircle2, Clock, Calendar, User, Search, DollarSign } from 'lucide-react';
import { Prediction } from '../types';

interface PredictionsTableProps {
  predictions: Prediction[];
  selectedCompetition: string;
  selectedRound: string;
}

export const PredictionsTable: React.FC<PredictionsTableProps> = ({
  predictions,
  selectedCompetition,
  selectedRound,
}) => {
  const [filterPaid, setFilterPaid] = useState<'all' | 'paid' | 'pending'>('all');
  const [search, setSearch] = useState('');

  // Filter predictions
  const filtered = predictions.filter((p) => {
    // Competition & round
    if (selectedCompetition !== 'Todos' && p.competition !== selectedCompetition) return false;
    if (selectedRound !== 'Todas' && p.round !== selectedRound) return false;

    // Paid status
    if (filterPaid === 'paid' && !p.paid) return false;
    if (filterPaid === 'pending' && p.paid) return false;

    // Search query
    if (search.trim()) {
      const term = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(term);
      const matchTeams = `${p.team_a} ${p.team_b}`.toLowerCase().includes(term);
      if (!matchName && !matchTeams) return false;
    }

    return true;
  });

  const formatBrt = (iso?: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span>📊 Palpites Registrados</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
              {filtered.length}
            </span>
          </h2>
          <p className="text-xs text-slate-500">Histórico de apostas e palpites da comunidade</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar nome ou time..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Payment filter pills */}
          <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setFilterPaid('all')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                filterPaid === 'all'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilterPaid('paid')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                filterPaid === 'paid'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Pagos
            </button>
            <button
              onClick={() => setFilterPaid('pending')}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 ${
                filterPaid === 'pending'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3 h-3" />
              Pendentes
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-8 text-center text-slate-500">
          <p className="font-semibold text-slate-700">Nenhum palpite encontrado.</p>
          <p className="text-xs text-slate-400 mt-1">
            Selecione outros filtros ou registre o primeiro palpite!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Participante</th>
                <th className="px-4 py-3">Partida</th>
                <th className="px-4 py-3 text-center">Palpite</th>
                <th className="px-4 py-3 text-center">Pagamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p, idx) => (
                <tr
                  key={`${p.user_id}_${p.match_id}_${idx}`}
                  className="hover:bg-slate-50/80 transition-colors"
                >
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono whitespace-nowrap">
                    {formatBrt(p.created_at)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center font-bold">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {p.team_a} x {p.team_b}
                      </span>
                      {p.round && (
                        <span className="text-[11px] text-slate-400">{p.round}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md font-bold text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {p.score_a} x {p.score_b}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    {p.paid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Pago
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Pendente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
