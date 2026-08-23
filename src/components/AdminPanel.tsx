import React, { useState } from 'react';
import {
  PlusCircle,
  CheckCircle2,
  Trash2,
  DownloadCloud,
  DollarSign,
  AlertTriangle,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { Match, Prediction } from '../types';

interface AdminPanelProps {
  matches: Match[];
  predictions: Prediction[];
  onDataChanged: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  matches,
  predictions,
  onDataChanged,
}) => {
  const [password, setPassword] = useState('5075');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');

  // Create match state
  const [teamA, setTeamA] = useState('Brasil');
  const [teamB, setTeamB] = useState('Noruega');
  const [betAmount, setBetAmount] = useState<number>(10.0);
  const [matchRound, setMatchRound] = useState('Rodada 1');
  const [matchCompetition, setMatchCompetition] = useState('Amistoso');

  // Finish match state
  const [finishMatchId, setFinishMatchId] = useState(matches[0]?.match_id || '');
  const [finishScoreA, setFinishScoreA] = useState(0);
  const [finishScoreB, setFinishScoreB] = useState(0);

  // Import state
  const [importComp, setImportComp] = useState('Brasileirão Série A');
  const [importSeason, setImportSeason] = useState(2026);
  const [isImporting, setIsImporting] = useState(false);
  const [isSeeding2026, setIsSeeding2026] = useState(false);

  // Status message
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleSeed2026 = async (competitionName?: string) => {
    setIsSeeding2026(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/seed-2026', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          competition: competitionName || 'Todos',
          clearExisting: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMsg({ type: 'success', text: data.message });
      onDataChanged();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setIsSeeding2026(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '5075') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Senha de administrador incorreta (padrão: 5075)');
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          team_a: teamA,
          team_b: teamB,
          bet_amount: betAmount,
          round: matchRound,
          competition: matchCompetition,
          season: new Date().getFullYear(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMsg({
        type: 'success',
        text: `Partida ${teamA} x ${teamB} salva com sucesso! (Aposta: R$ ${betAmount.toFixed(2)})`,
      });
      onDataChanged();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleFinishMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    if (!finishMatchId) return;

    try {
      const res = await fetch('/api/admin/match/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          match_id: finishMatchId,
          score_a: finishScoreA,
          score_b: finishScoreB,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMsg({
        type: 'success',
        text: `Partida finalizada com placar ${finishScoreA} x ${finishScoreB}. Ranking e prêmios atualizados!`,
      });
      onDataChanged();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleTogglePayment = async (userId: string, matchId: string, currentPaid: boolean) => {
    try {
      const res = await fetch('/api/admin/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          user_id: userId,
          match_id: matchId,
          paid: !currentPaid,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onDataChanged();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm('Deseja realmente excluir esta partida e todos os palpites associados?')) return;
    try {
      const res = await fetch(`/api/admin/match/${matchId}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMsg({ type: 'success', text: 'Partida deletada!' });
      onDataChanged();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleDeletePrediction = async (userId: string, matchId: string) => {
    if (!confirm('Deseja excluir este palpite?')) return;
    try {
      const res = await fetch('/api/admin/prediction', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ user_id: userId, match_id: matchId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMsg({ type: 'success', text: 'Palpite deletado!' });
      onDataChanged();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          competition: importComp,
          season: importSeason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatusMsg({ type: 'success', text: data.message });
      onDataChanged();
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-xl border border-emerald-300 shadow-md p-6 max-w-md mx-auto my-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Painel de Administração</h2>
            <p className="text-xs text-slate-500">Informe a senha master para gerenciar o bolão</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Senha de Administrador (padrão: 5075)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {authError && <p className="text-xs text-red-600 mt-1">{authError}</p>}
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
          >
            Acessar Painel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-emerald-400 shadow-md overflow-hidden my-4">
      <div className="bg-emerald-800 text-white px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚙️</span>
          <h2 className="font-bold text-base">Painel de Controle do Administrador</h2>
        </div>
        <span className="text-xs bg-emerald-900/80 px-2.5 py-1 rounded-full border border-emerald-600 font-mono">
          Autenticado
        </span>
      </div>

      <div className="p-5 space-y-6">
        {statusMsg && (
          <div
            className={`p-3.5 rounded-lg text-sm ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-red-50 border border-red-200 text-red-900'
            }`}
          >
            {statusMsg.text}
          </div>
        )}

        {/* 0. Quick 2026 Registration Banner */}
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <span>🏆</span>
                <span>Cadastrar Campeonatos da Temporada 2026</span>
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                Cadastre instantaneamente os jogos e clássicos oficiais do calendário 2026 com 1 clique:
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSeed2026('Todos')}
              disabled={isSeeding2026}
              className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2 px-4 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all whitespace-nowrap disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSeeding2026 ? 'animate-spin' : ''}`} />
              <span>{isSeeding2026 ? 'Cadastrando...' : '⚡ Cadastrar Todos os 4 (2026)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleSeed2026('Brasileirão Série A')}
              disabled={isSeeding2026}
              className="bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all"
            >
              <span>🟢</span>
              <span>Série A 2026</span>
            </button>
            <button
              type="button"
              onClick={() => handleSeed2026('Brasileirão Série B')}
              disabled={isSeeding2026}
              className="bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all"
            >
              <span>🔵</span>
              <span>Série B 2026</span>
            </button>
            <button
              type="button"
              onClick={() => handleSeed2026('Copa do Brasil')}
              disabled={isSeeding2026}
              className="bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all"
            >
              <span>🟡</span>
              <span>Copa do Brasil 2026</span>
            </button>
            <button
              type="button"
              onClick={() => handleSeed2026('Libertadores')}
              disabled={isSeeding2026}
              className="bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium py-1.5 px-2.5 rounded-lg text-xs flex items-center justify-center gap-1 transition-all"
            >
              <span>🏆</span>
              <span>Libertadores 2026</span>
            </button>
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* 1. Create Match */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>➕ Criar / Atualizar Partida</span>
          </h3>

          <form onSubmit={handleCreateMatch} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Time A</label>
              <input
                type="text"
                required
                value={teamA}
                onChange={(e) => setTeamA(e.target.value)}
                placeholder="Ex: Flamengo, Sport, Real Madrid"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Time B</label>
              <input
                type="text"
                required
                value={teamB}
                onChange={(e) => setTeamB(e.target.value)}
                placeholder="Ex: Palmeiras, Coritiba, River Plate"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Aposta (R$)</label>
              <input
                type="number"
                min="0"
                step="1"
                value={betAmount}
                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Rodada / Fase</label>
              <input
                type="text"
                value={matchRound}
                onChange={(e) => setMatchRound(e.target.value)}
                placeholder="Ex: Rodada 1, Oitavas, Final"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Campeonato</label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  list="competitions-list"
                  value={matchCompetition}
                  onChange={(e) => setMatchCompetition(e.target.value)}
                  placeholder="Ex: Brasileirão Série A"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
                />
                <datalist id="competitions-list">
                  <option value="Brasileirão Série A" />
                  <option value="Brasileirão Série B" />
                  <option value="Copa do Brasil" />
                  <option value="Libertadores" />
                </datalist>
              </div>
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-sm transition-colors"
              >
                Salvar Partida
              </button>
            </div>
          </form>
        </div>

        <hr className="border-slate-200" />

        {/* 2. Finish Match */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>🏁 Finalizar Partida & Definir Placar</span>
          </h3>

          <form onSubmit={handleFinishMatch} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-600 mb-1">Partida</label>
              <select
                value={finishMatchId}
                onChange={(e) => setFinishMatchId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              >
                {matches.map((m) => (
                  <option key={m.match_id} value={m.match_id}>
                    {m.team_a} x {m.team_b} {m.completed ? `(✅ ${m.score_a} x ${m.score_b})` : '(🔵 Aberta)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">Gols Time A</label>
              <input
                type="number"
                min="0"
                value={finishScoreA}
                onChange={(e) => setFinishScoreA(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">Gols Time B</label>
              <input
                type="number"
                min="0"
                value={finishScoreB}
                onChange={(e) => setFinishScoreB(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-center"
              />
            </div>

            <div className="sm:col-span-4 flex justify-end">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-5 rounded-lg text-sm"
              >
                Encerrar & Calcular Pontos
              </button>
            </div>
          </form>
        </div>

        <hr className="border-slate-200" />

        {/* 3. Confirm Payment List */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>💸 Confirmar Pagamentos de Palpites</span>
          </h3>

          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
            {predictions.length === 0 ? (
              <p className="p-3 text-xs text-slate-400 text-center">Nenhum palpite cadastrado.</p>
            ) : (
              predictions.map((p) => (
                <div
                  key={`${p.user_id}_${p.match_id}`}
                  className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50"
                >
                  <div>
                    <span className="font-bold text-slate-800">{p.name}</span>
                    <span className="text-slate-500 ml-2">
                      ({p.team_a} {p.score_a} x {p.score_b} {p.team_b})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTogglePayment(p.user_id, p.match_id, p.paid)}
                      className={`px-2.5 py-1 rounded font-semibold transition-all ${
                        p.paid
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                          : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                      }`}
                    >
                      {p.paid ? '✅ Pago (clique p/ pendente)' : '⏳ Pendente (clique p/ pago)'}
                    </button>

                    <button
                      onClick={() => handleDeletePrediction(p.user_id, p.match_id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                      title="Deletar palpite"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <hr className="border-slate-200" />

        {/* 4. Import from Football API */}
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <DownloadCloud className="w-4 h-4 text-emerald-600" />
            <span>🌐 Importar Campeonato (APIs de Futebol)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Campeonato</label>
              <select
                value={importComp}
                onChange={(e) => setImportComp(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              >
                <option value="Brasileirão Série A">Brasileirão Série A (football-data)</option>
                <option value="Libertadores">Libertadores (football-data)</option>
                <option value="Brasileirão Série B">Brasileirão Série B (TheSportsDB)</option>
                <option value="Copa do Brasil">Copa do Brasil (TheSportsDB)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">Temporada (Ano)</label>
              <input
                type="number"
                value={importSeason}
                onChange={(e) => setImportSeason(parseInt(e.target.value, 10) || 2026)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-3 rounded-lg text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <DownloadCloud className="w-4 h-4" />
                <span>{isImporting ? 'Importando...' : 'Importar Rodadas'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. Matches cleanup */}
        <hr className="border-slate-200" />
        <div>
          <h3 className="text-sm font-bold text-red-900 mb-2 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Excluir Partidas</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {matches.map((m) => (
              <button
                key={m.match_id}
                onClick={() => handleDeleteMatch(m.match_id)}
                className="px-2.5 py-1 text-xs bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-md flex items-center gap-1"
              >
                <span>{m.team_a} x {m.team_b}</span>
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
