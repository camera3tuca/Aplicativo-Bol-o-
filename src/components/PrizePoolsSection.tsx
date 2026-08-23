import React from 'react';
import { DollarSign, Trophy, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { Match, PrizePoolInfo, Prediction } from '../types';

interface PrizePoolsSectionProps {
  matches: Match[];
  prizePools: Record<string, PrizePoolInfo>;
  predictions: Prediction[];
  selectedCompetition: string;
  selectedRound: string;
}

export const PrizePoolsSection: React.FC<PrizePoolsSectionProps> = ({
  matches,
  prizePools,
  predictions,
  selectedCompetition,
  selectedRound,
}) => {
  // Filter matches that have predictions and match current filter
  const matchesWithPredictions = matches.filter((m) => {
    if (selectedCompetition !== 'Todos' && m.competition !== selectedCompetition) return false;
    if (selectedRound !== 'Todas' && m.round !== selectedRound) return false;
    return predictions.some((p) => p.match_id === m.match_id);
  });

  if (matchesWithPredictions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <span>💰 Status dos Prêmios (Pix)</span>
        </h2>
        <p className="text-xs text-slate-500">
          O prêmio é calculado exclusivamente sobre os pagamentos confirmados
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {matchesWithPredictions.map((match) => {
          const pool = prizePools[match.match_id] || {
            totalParticipants: 0,
            paidParticipants: 0,
            expectedPot: 0,
            confirmedPot: 0,
            pendingPot: 0,
            winners: [],
            prizePerWinner: 0,
          };

          return (
            <div
              key={match.match_id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                    {match.team_a} x {match.team_b}
                    {match.round && (
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                        {match.round}
                      </span>
                    )}
                  </h3>
                  {match.competition && (
                    <p className="text-xs text-emerald-700 font-medium mt-0.5">
                      {match.competition}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {match.completed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Finalizado: {match.score_a} x {match.score_b}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                      🔵 Em Aberto
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5">
                {match.bet_amount <= 0 && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Esta partida está sem valor de aposta. Defina no Painel de Administração para calcular o pote.
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">Participantes</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">
                      {pool.totalParticipants}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      R$ {match.bet_amount.toFixed(2)} / aposta
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">Pote Esperado</p>
                    <p className="text-lg font-bold text-slate-800 mt-0.5">
                      R$ {pool.expectedPot.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-400">total estimado</p>
                  </div>

                  <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200">
                    <p className="text-xs text-emerald-800 font-medium">Confirmado (Pago)</p>
                    <p className="text-lg font-bold text-emerald-700 mt-0.5">
                      R$ {pool.confirmedPot.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-emerald-600">
                      {pool.paidParticipants} de {pool.totalParticipants} pagos
                    </p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-xs text-slate-500 font-medium">Pendente</p>
                    <p className="text-lg font-bold text-amber-700 mt-0.5">
                      R$ {pool.pendingPot.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {pool.totalParticipants - pool.paidParticipants} aguardando
                    </p>
                  </div>
                </div>

                {match.completed && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    {pool.winners.length > 0 ? (
                      <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                          <div>
                            <p className="text-xs text-emerald-800 font-semibold uppercase tracking-wider">
                              Ganhador(es) do Placar Exato:
                            </p>
                            <p className="text-sm font-bold text-emerald-950">
                              {pool.winners.join(', ')}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-xs text-emerald-700 block">Prêmio individual</span>
                          <span className="text-lg font-bold text-emerald-900">
                            R$ {pool.prizePerWinner.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 text-center">
                        Nenhum participante acertou o placar exato ({match.score_a} x {match.score_b}) nesta partida.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
