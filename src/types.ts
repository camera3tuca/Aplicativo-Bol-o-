export interface Match {
  match_id: string;
  team_a: string;
  team_b: string;
  score_a: number | null;
  score_b: number | null;
  completed: boolean;
  bet_amount: number;
  external_id?: string | null;
  round?: string | null;
  match_time?: string | null;
  competition?: string | null;
  season?: number | null;
}

export interface Prediction {
  user_id: string;
  match_id: string;
  score_a: number;
  score_b: number;
  paid: boolean;
  created_at: string;
  name: string;
  phone?: string;
  team_a?: string;
  team_b?: string;
  completed?: boolean;
  bet_amount?: number;
  round?: string | null;
  competition?: string | null;
  match_time?: string | null;
  match_score_a?: number | null;
  match_score_b?: number | null;
}

export interface RankItem {
  name: string;
  score: number;
  exactCount?: number;
}

export interface PrizePoolInfo {
  totalParticipants: number;
  paidParticipants: number;
  expectedPot: number;
  confirmedPot: number;
  pendingPot: number;
  winners: string[];
  prizePerWinner: number;
}

export interface DashboardData {
  matches: Match[];
  predictions: Prediction[];
  rankingsByComp: Record<string, RankItem[]>;
  overallRanking: RankItem[];
  prizePools: Record<string, PrizePoolInfo>;
}
