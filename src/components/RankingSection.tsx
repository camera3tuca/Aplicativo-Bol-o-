import React from 'react';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import { RankItem } from '../types';

interface RankingSectionProps {
  rankingsByComp: Record<string, RankItem[]>;
  overallRanking: RankItem[];
  selectedCompetition: string;
}

export const RankingSection: React.FC<RankingSectionProps> = ({
  rankingsByComp,
  overallRanking,
  selectedCompetition,
}) => {
  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return (
          <div className="w-6 h-6 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold text-xs shadow-xs">
            🥇
          </div>
        );
      case 1:
        return (
          <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-900 flex items-center justify-center font-bold text-xs shadow-xs">
            🥈
          </div>
        );
      case 2:
        return (
          <div className="w-6 h-6 rounded-full bg-amber-700/60 text-amber-100 flex items-center justify-center font-bold text-xs shadow-xs">
            🥉
          </div>
        );
      default:
        return (
          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
            {index + 1}
          </div>
        );
    }
  };

  const renderRankingTable = (title: string, list: RankItem[]) => {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-4 last:mb-0">
        <div className="px-4 py-3 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-sm text-emerald-950">{title}</h3>
          </div>
          <span className="text-xs text-emerald-700 font-medium">
            {list.length} participantes
          </span>
        </div>

        {list.length === 0 ? (
          <div className="p-5 text-center text-slate-400 text-xs">
            Nenhum ponto registrado ainda para esta categoria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/70 text-slate-500 text-xs uppercase font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-2.5 w-16 text-center">Posição</th>
                  <th className="px-4 py-2.5">Nome</th>
                  <th className="px-4 py-2.5 text-center">Placares Exatos</th>
                  <th className="px-4 py-2.5 text-right font-bold">Pontos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((item, idx) => (
                  <tr
                    key={`${item.name}_${idx}`}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      idx === 0 ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    <td className="px-4 py-2.5 flex justify-center">
                      {getRankBadge(idx)}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">
                      {item.name}
                    </td>
                    <td className="px-4 py-2.5 text-center text-xs text-slate-500">
                      {item.exactCount ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60">
                          🎯 {item.exactCount}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-emerald-700 text-base">
                      {item.score} <span className="text-xs font-normal text-slate-500">pts</span>
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

  const compKeys = Object.keys(rankingsByComp);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>🏆 Classificação / Ranking</span>
        </h2>
        <p className="text-xs text-slate-500">
          Pontuação: <span className="font-bold text-emerald-700">3 pts</span> placar exato ·{' '}
          <span className="font-bold text-emerald-700">1 pt</span> acertar vencedor/empate
        </p>
      </div>

      {selectedCompetition !== 'Todos' ? (
        // Specific competition selected
        renderRankingTable(
          `Classificação - ${selectedCompetition}`,
          rankingsByComp[selectedCompetition] || []
        )
      ) : compKeys.length > 0 ? (
        // Render all competitions ranking
        <div className="space-y-4">
          {compKeys.map((comp) =>
            renderRankingTable(`🏆 ${comp}`, rankingsByComp[comp] || [])
          )}
          {renderRankingTable('🌟 Ranking Geral Consolidado', overallRanking)}
        </div>
      ) : (
        renderRankingTable('Classificação Geral', overallRanking)
      )}
    </div>
  );
};
