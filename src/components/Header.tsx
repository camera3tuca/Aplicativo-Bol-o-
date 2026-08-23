import React from 'react';
import { Trophy, RefreshCw, ShieldCheck, Database } from 'lucide-react';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  isAdminOpen: boolean;
  onToggleAdmin: () => void;
  statusInfo: { dbConnected: boolean; provider: string } | null;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isLoading,
  isAdminOpen,
  onToggleAdmin,
  statusInfo,
}) => {
  return (
    <header className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white shadow-md border-b border-emerald-700/50">
      <div className="max-w-5xl mx-auto px-4 py-5 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-3xl shadow-inner">
              ⚽
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Bolão de Futebol
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-medium tracking-normal">
                  Dashboard
                </span>
              </h1>
              <p className="text-emerald-200/80 text-sm mt-0.5">
                Palpites, ranking por campeonato e divisão de prêmios Pix
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {statusInfo && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  statusInfo.dbConnected
                    ? 'bg-emerald-900/60 border-emerald-500/40 text-emerald-300'
                    : 'bg-emerald-900/40 border-emerald-600/30 text-emerald-200'
                }`}
                title={`Provedor: ${statusInfo.provider}`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{statusInfo.dbConnected ? 'PostgreSQL' : 'Simulador Local'}</span>
              </div>
            )}

            <button
              id="refresh-btn"
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-lg bg-emerald-800 hover:bg-emerald-700 border border-emerald-600/40 text-white transition-colors disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            <button
              id="admin-toggle-btn"
              onClick={onToggleAdmin}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                isAdminOpen
                  ? 'bg-emerald-400 text-emerald-950 border-emerald-300 shadow-sm'
                  : 'bg-emerald-900/80 hover:bg-emerald-800 border-emerald-600/50 text-emerald-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isAdminOpen ? 'Fechar Admin' : 'Admin'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
