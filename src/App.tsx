import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { KpiMetrics } from './components/KpiMetrics';
import { Filters } from './components/Filters';
import { PredictionForm } from './components/PredictionForm';
import { PredictionsTable } from './components/PredictionsTable';
import { RankingSection } from './components/RankingSection';
import { PrizePoolsSection } from './components/PrizePoolsSection';
import { AdminPanel } from './components/AdminPanel';
import { DashboardData } from './types';

export default function App() {
  const [data, setData] = useState<DashboardData>({
    matches: [],
    predictions: [],
    rankingsByComp: {},
    overallRanking: [],
    prizePools: {},
  });
  const [statusInfo, setStatusInfo] = useState<{ dbConnected: boolean; provider: string } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Filters
  const [selectedCompetition, setSelectedCompetition] = useState('Todos');
  const [selectedRound, setSelectedRound] = useState('Todas');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [dataRes, statusRes] = await Promise.all([
        fetch('/api/data'),
        fetch('/api/status'),
      ]);

      if (dataRes.ok) {
        const d = await dataRes.json();
        setData(d);
      }
      if (statusRes.ok) {
        const s = await statusRes.json();
        setStatusInfo(s);
      }
    } catch (err) {
      console.error('Failed to load bolao data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100/60 pb-16">
      {/* Top Header */}
      <Header
        onRefresh={fetchData}
        isLoading={isLoading}
        isAdminOpen={isAdminOpen}
        onToggleAdmin={() => setIsAdminOpen(!isAdminOpen)}
        statusInfo={statusInfo}
      />

      {/* Main Single Column Content Layout (optimized for clarity and responsiveness) */}
      <main className="max-w-5xl mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* KPI Metrics */}
        <KpiMetrics data={data} />

        {/* Admin Expandable Section */}
        {isAdminOpen && (
          <AdminPanel
            matches={data.matches}
            predictions={data.predictions}
            onDataChanged={fetchData}
          />
        )}

        {/* Competition and Round Filters */}
        <Filters
          matches={data.matches}
          selectedCompetition={selectedCompetition}
          selectedRound={selectedRound}
          onCompetitionChange={setSelectedCompetition}
          onRoundChange={setSelectedRound}
        />

        {/* Register Prediction Box */}
        <PredictionForm
          matches={data.matches}
          onPredictionSubmitted={fetchData}
        />

        {/* Predictions Table */}
        <PredictionsTable
          predictions={data.predictions}
          selectedCompetition={selectedCompetition}
          selectedRound={selectedRound}
        />

        {/* Rankings by Competition & Overall */}
        <RankingSection
          rankingsByComp={data.rankingsByComp}
          overallRanking={data.overallRanking}
          selectedCompetition={selectedCompetition}
        />

        {/* Prize Pools (Pix Calculation) */}
        <PrizePoolsSection
          matches={data.matches}
          prizePools={data.prizePools}
          predictions={data.predictions}
          selectedCompetition={selectedCompetition}
          selectedRound={selectedRound}
        />
      </main>
    </div>
  );
}
