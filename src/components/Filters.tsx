import React from 'react';
import { Filter, Trophy, Calendar } from 'lucide-react';
import { Match } from '../types';

interface FiltersProps {
  matches: Match[];
  selectedCompetition: string;
  selectedRound: string;
  onCompetitionChange: (comp: string) => void;
  onRoundChange: (round: string) => void;
}

export const Filters: React.FC<FiltersProps> = ({
  matches,
  selectedCompetition,
  selectedRound,
  onCompetitionChange,
  onRoundChange,
}) => {
  // Extract unique competitions
  const competitions = Array.from(
    new Set(matches.map((m) => m.competition).filter(Boolean))
  ) as string[];
  competitions.sort();

  // Extract unique rounds based on selected competition
  const rounds = Array.from(
    new Set(
      matches
        .filter((m) => selectedCompetition === 'Todos' || m.competition === selectedCompetition)
        .map((m) => m.round)
        .filter(Boolean)
    )
  ) as string[];

  // Sort rounds naturally
  rounds.sort((a, b) => {
    const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
    const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
    return numA - numB || a.localeCompare(b);
  });

  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-slate-700">
        <Filter className="w-4 h-4 text-emerald-600" />
        <span>Filtro de Campeonato e Rodada</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-emerald-600" />
            Campeonato
          </label>
          <select
            id="filter-competition"
            value={selectedCompetition}
            onChange={(e) => {
              onCompetitionChange(e.target.value);
              onRoundChange('Todas');
            }}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
          >
            <option value="Todos">🏆 Todos os Campeonatos</option>
            {competitions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            Rodada / Fase
          </label>
          <select
            id="filter-round"
            value={selectedRound}
            onChange={(e) => onRoundChange(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-medium"
          >
            <option value="Todas">📅 Todas as Rodadas</option>
            {rounds.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
