import React, { useState } from 'react';
import { Send, CheckCircle2, Clock, DollarSign, MessageSquare, AlertCircle } from 'lucide-react';
import { Match } from '../types';

interface PredictionFormProps {
  matches: Match[];
  onPredictionSubmitted: () => void;
}

export const PredictionForm: React.FC<PredictionFormProps> = ({
  matches,
  onPredictionSubmitted,
}) => {
  const [activeTab, setActiveTab] = useState<'standard' | 'quickMessage'>('standard');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedMatchId, setSelectedMatchId] = useState(matches[0]?.match_id || '');
  const [scoreA, setScoreA] = useState<number | ''>(0);
  const [scoreB, setScoreB] = useState<number | ''>(0);
  const [paid, setPaid] = useState(false);
  const [quickMessage, setQuickMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Filter only active / open matches
  const openMatches = matches.filter((m) => !m.completed);
  const currentMatch = matches.find((m) => m.match_id === selectedMatchId) || openMatches[0];

  const handleSubmitStandard = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor, informe o seu nome!' });
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (phone && (cleanPhone.length < 10 || cleanPhone.length > 11)) {
      setStatusMessage({
        type: 'error',
        text: 'Por favor, informe um WhatsApp válido (DDD + número).',
      });
      return;
    }

    if (!selectedMatchId && !currentMatch) {
      setStatusMessage({ type: 'error', text: 'Selecione uma partida!' });
      return;
    }

    setIsSubmitting(true);
    try {
      const matchIdToUse = selectedMatchId || currentMatch.match_id;
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match_id: matchIdToUse,
          name: name.trim(),
          phone: cleanPhone,
          score_a: Number(scoreA || 0),
          score_b: Number(scoreB || 0),
          paid,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Falha ao registrar palpite');
      }

      setStatusMessage({
        type: 'success',
        text: `Palpite registrado com sucesso para ${currentMatch?.team_a} x ${currentMatch?.team_b}! ${
          paid ? 'Pagamento confirmado.' : 'Pagamento pendente via Pix.'
        }`,
      });
      onPredictionSubmitted();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitQuick = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!quickMessage.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Digite a mensagem no formato: "Nome: Time A 2 x 1 Time B"',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/predictions/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: quickMessage.trim(),
          phone: phone.replace(/\D/g, ''),
          paid,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Falha ao processar mensagem');
      }

      setStatusMessage({ type: 'success', text: json.message });
      setQuickMessage('');
      onPredictionSubmitted();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatMatchTime = (iso?: string | null) => {
    if (!iso) return null;
    try {
      const d = new Date(iso);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center font-bold">
            📝
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Registrar Palpite</h2>
            <p className="text-xs text-slate-500">
              Faça a sua aposta e dispute o prêmio da rodada
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-200/60 p-1 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setActiveTab('standard')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'standard'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Formulário
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('quickMessage')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all flex items-center gap-1 ${
              activeTab === 'quickMessage'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Mensagem Rápida
          </button>
        </div>
      </div>

      <div className="p-5">
        {statusMessage && (
          <div
            className={`mb-4 p-3.5 rounded-lg flex items-start gap-2.5 text-sm ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-red-50 border border-red-200 text-red-900'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {statusMessage.type === 'success' ? 'Sucesso!' : 'Atenção:'}
              </p>
              <p className="mt-0.5 text-xs sm:text-sm">{statusMessage.text}</p>
            </div>
          </div>
        )}

        {openMatches.length === 0 && activeTab === 'standard' ? (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <p className="font-semibold text-slate-700">Nenhuma partida aberta no momento.</p>
            <p className="text-xs text-slate-500 mt-1">
              Aguarde novas partidas serem adicionadas ou use o Painel de Administração para criar/importar.
            </p>
          </div>
        ) : activeTab === 'standard' ? (
          <form onSubmit={handleSubmitStandard} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seu Nome *
                </label>
                <input
                  id="pred-name-input"
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp (com DDD)
                </label>
                <input
                  id="pred-phone-input"
                  type="tel"
                  placeholder="Ex: 11999999999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selecione a Partida *
              </label>
              <select
                id="pred-match-select"
                value={selectedMatchId || openMatches[0]?.match_id || ''}
                onChange={(e) => setSelectedMatchId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                {openMatches.map((m) => (
                  <option key={m.match_id} value={m.match_id}>
                    {m.competition ? `[${m.competition}] ` : ''}
                    {m.round ? `${m.round}: ` : ''}
                    {m.team_a} x {m.team_b} {m.bet_amount ? `(R$ ${m.bet_amount.toFixed(2)})` : ''}
                  </option>
                ))}
              </select>

              {currentMatch && (
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                  {currentMatch.competition && (
                    <span className="font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
                      🏆 {currentMatch.competition}
                    </span>
                  )}
                  {currentMatch.match_time && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {formatMatchTime(currentMatch.match_time)}
                    </span>
                  )}
                  {currentMatch.bet_amount > 0 && (
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                      Aposta: R$ {currentMatch.bet_amount.toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Score input visual card */}
            <div className="bg-gradient-to-r from-emerald-50/60 via-slate-50 to-emerald-50/60 p-4 rounded-xl border border-emerald-200/70">
              <div className="grid grid-cols-2 gap-4 items-center max-w-md mx-auto">
                <div className="text-center">
                  <span className="block text-sm font-bold text-slate-800 mb-1.5 truncate">
                    {currentMatch?.team_a || 'Time A'}
                  </span>
                  <input
                    id="score-a-input"
                    type="number"
                    min="0"
                    max="99"
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-20 mx-auto text-center font-bold text-2xl py-2 bg-white border-2 border-emerald-300 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                <div className="text-center">
                  <span className="block text-sm font-bold text-slate-800 mb-1.5 truncate">
                    {currentMatch?.team_b || 'Time B'}
                  </span>
                  <input
                    id="score-b-input"
                    type="number"
                    min="0"
                    max="99"
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-20 mx-auto text-center font-bold text-2xl py-2 bg-white border-2 border-emerald-300 rounded-xl shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="paid-checkbox"
                checked={paid}
                onChange={(e) => setPaid(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="paid-checkbox" className="text-xs sm:text-sm text-slate-700 cursor-pointer select-none font-medium">
                Já realizei o pagamento da aposta via Pix
              </label>
            </div>

            <button
              id="submit-prediction-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Enviando...' : 'Enviar Palpite'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitQuick} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Formato WhatsApp / Mensagem
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Cole a mensagem enviada no grupo (ex:{' '}
                <span className="font-mono bg-slate-100 px-1 rounded text-slate-800">
                  João: Brasil 2 x 1 Argentina
                </span>
                )
              </p>
              <textarea
                id="quick-msg-input"
                rows={3}
                required
                placeholder="João: Brasil 2 x 1 Argentina"
                value={quickMessage}
                onChange={(e) => setQuickMessage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp (opcional)
                </label>
                <input
                  type="tel"
                  placeholder="Ex: 11999999999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center pt-5">
                <input
                  type="checkbox"
                  id="paid-quick-checkbox"
                  checked={paid}
                  onChange={(e) => setPaid(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="paid-quick-checkbox" className="ml-2 text-xs sm:text-sm text-slate-700 cursor-pointer select-none font-medium">
                  Aposta já paga (Pix)
                </label>
              </div>
            </div>

            <button
              id="submit-quick-msg-btn"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'Processando...' : 'Processar Mensagem Rápida'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
