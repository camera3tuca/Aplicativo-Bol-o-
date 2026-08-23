import express, { Request, Response } from 'express';
import path from 'path';
import cors from 'cors';
import { Pool } from 'pg';
import { createServer as createViteServer } from 'vite';
import { ALL_DEFINED_MATCHES_2026 } from './src/fixtures2026';

// Types
export interface User {
  user_id: string;
  name: string;
  phone?: string;
  score?: number;
}

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
  name?: string;
  phone?: string;
  team_a?: string;
  team_b?: string;
  completed?: boolean;
  bet_amount?: number;
  round?: string | null;
  competition?: string | null;
  match_time?: string | null;
}

// Default 2026 Competitions Fixtures (All defined matches for the 4 competitions)
export const DEFAULT_MATCHES_2026: Match[] = ALL_DEFINED_MATCHES_2026;

// In-Memory Database Store (Used as robust fallback when real DB is offline or for preview)
const initialMatchesMap = new Map<string, Match>();
DEFAULT_MATCHES_2026.forEach((m) => initialMatchesMap.set(m.match_id, { ...m }));

const memStore = {
  users: new Map<string, User>([
    ['joao', { user_id: 'joao', name: 'João Silva', phone: '11999887766', score: 0 }],
    ['maria', { user_id: 'maria', name: 'Maria Santos', phone: '21988776655', score: 0 }],
    ['pedro', { user_id: 'pedro', name: 'Pedro Alves', phone: '31977665544', score: 0 }],
    ['ana', { user_id: 'ana', name: 'Ana Oliveira', phone: '41966554433', score: 0 }],
    ['carlos', { user_id: 'carlos', name: 'Carlos Ferreira', phone: '31988887777', score: 0 }],
  ]),
  matches: initialMatchesMap,
  predictions: new Map<string, Prediction>([
    [
      'joao_bsa_2026_r24_pal_vas',
      {
        user_id: 'joao',
        match_id: 'bsa_2026_r24_pal_vas',
        score_a: 2,
        score_b: 1,
        paid: true,
        created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
      },
    ],
    [
      'maria_bsa_2026_r24_pal_vas',
      {
        user_id: 'maria',
        match_id: 'bsa_2026_r24_pal_vas',
        score_a: 2,
        score_b: 0,
        paid: true,
        created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
      },
    ],
    [
      'pedro_bsa_2026_r24_cfc_cor',
      {
        user_id: 'pedro',
        match_id: 'bsa_2026_r24_cfc_cor',
        score_a: 1,
        score_b: 1,
        paid: true,
        created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
      },
    ],
    [
      'joao_cdb_2026_qf_ida_cru_cam',
      {
        user_id: 'joao',
        match_id: 'cdb_2026_qf_ida_cru_cam',
        score_a: 1,
        score_b: 2,
        paid: true,
        created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
      },
    ],
    [
      'ana_cdb_2026_qf_ida_pal_san',
      {
        user_id: 'ana',
        match_id: 'cdb_2026_qf_ida_pal_san',
        score_a: 2,
        score_b: 1,
        paid: true,
        created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString(),
      },
    ],
    [
      'carlos_lib_2026_qf_ida_est_cor',
      {
        user_id: 'carlos',
        match_id: 'lib_2026_qf_ida_est_cor',
        score_a: 1,
        score_b: 1,
        paid: true,
        created_at: new Date().toISOString(),
      },
    ],
  ]),
};

// PostgreSQL Connection Setup (with safe mock fallback)
const DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || '';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '5075';
const FOOTBALLDATA_KEY = process.env.FOOTBALLDATA_KEY || process.env.FOOTBALL_DATA_KEY || '';
const THESPORTSDB_KEY = process.env.THESPORTSDB_KEY || '3';

let pool: Pool | null = null;
let dbConnected = false;

if (DB_URL) {
  try {
    pool = new Pool({
      connectionString: DB_URL,
      ssl: DB_URL.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    pool
      .query('SELECT 1')
      .then(async () => {
        dbConnected = true;
        console.log('Connected successfully to PostgreSQL database.');
        await initPostgresDb();
      })
      .catch((err) => {
        console.warn('PostgreSQL connection failed. Using in-memory database store:', err.message);
        dbConnected = false;
      });
  } catch (err) {
    console.warn('PostgreSQL initialization error. Fallback to in-memory store:', err);
    dbConnected = false;
  }
}

async function initPostgresDb() {
  if (!pool || !dbConnected) return;
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          user_id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          score INTEGER DEFAULT 0
        );
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;

        CREATE TABLE IF NOT EXISTS matches (
          match_id TEXT PRIMARY KEY,
          team_a TEXT NOT NULL,
          team_b TEXT NOT NULL,
          score_a INTEGER,
          score_b INTEGER,
          completed BOOLEAN DEFAULT FALSE,
          bet_amount REAL DEFAULT 0.0,
          external_id TEXT,
          round TEXT,
          match_time TIMESTAMPTZ,
          competition TEXT,
          season INTEGER
        );

        CREATE TABLE IF NOT EXISTS predictions (
          user_id TEXT,
          match_id TEXT,
          score_a INTEGER NOT NULL,
          score_b INTEGER NOT NULL,
          paid BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT now(),
          PRIMARY KEY (user_id, match_id),
          FOREIGN KEY (user_id) REFERENCES users (user_id),
          FOREIGN KEY (match_id) REFERENCES matches (match_id)
        );
      `);
      console.log('PostgreSQL database schemas verified/initialized.');

      // Check if matches table is empty, if so seed 2026 competitions
      const matchCountRes = await client.query('SELECT COUNT(*) FROM matches');
      const count = parseInt(matchCountRes.rows[0].count, 10);
      if (count === 0) {
        console.log('Seeding 2026 default matches into PostgreSQL...');
        for (const m of DEFAULT_MATCHES_2026) {
          await client.query(
            `INSERT INTO matches (match_id, team_a, team_b, score_a, score_b, completed, bet_amount, round, competition, season, match_time)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             ON CONFLICT (match_id) DO NOTHING`,
            [
              m.match_id,
              m.team_a,
              m.team_b,
              m.score_a,
              m.score_b,
              m.completed,
              m.bet_amount,
              m.round,
              m.competition,
              m.season,
              m.match_time,
            ]
          );
        }

        // Insert initial users & sample predictions
        const defaultUsers = [
          { user_id: 'joao', name: 'João Silva', phone: '11999887766' },
          { user_id: 'maria', name: 'Maria Santos', phone: '21988776655' },
          { user_id: 'pedro', name: 'Pedro Alves', phone: '31977665544' },
          { user_id: 'ana', name: 'Ana Oliveira', phone: '41966554433' },
          { user_id: 'carlos', name: 'Carlos Ferreira', phone: '31988887777' },
        ];
        for (const u of defaultUsers) {
          await client.query(
            `INSERT INTO users (user_id, name, phone, score) VALUES ($1, $2, $3, 0) ON CONFLICT (user_id) DO NOTHING`,
            [u.user_id, u.name, u.phone]
          );
        }

        // Seed sample predictions
        const samplePreds = [
          { user_id: 'joao', match_id: 'bsa_2026_r24_pal_vas', score_a: 2, score_b: 1, paid: true },
          { user_id: 'maria', match_id: 'bsa_2026_r24_pal_vas', score_a: 2, score_b: 0, paid: true },
          { user_id: 'pedro', match_id: 'bsa_2026_r24_cfc_cor', score_a: 1, score_b: 1, paid: true },
          { user_id: 'joao', match_id: 'cdb_2026_qf_ida_cru_cam', score_a: 1, score_b: 2, paid: true },
          { user_id: 'ana', match_id: 'cdb_2026_qf_ida_pal_san', score_a: 2, score_b: 1, paid: true },
          { user_id: 'carlos', match_id: 'lib_2026_qf_ida_est_cor', score_a: 1, score_b: 1, paid: true },
        ];
        for (const sp of samplePreds) {
          await client.query(
            `INSERT INTO predictions (user_id, match_id, score_a, score_b, paid) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (user_id, match_id) DO NOTHING`,
            [sp.user_id, sp.match_id, sp.score_a, sp.score_b, sp.paid]
          );
        }
        console.log('PostgreSQL database seeded successfully with 2026 competitions!');
      }
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error initializing PostgreSQL schemas:', err);
  }
}

// Helpers
function calculateScore(predictedA: number, predictedB: number, actualA: number, actualB: number): number {
  if (predictedA === actualA && predictedB === actualB) {
    return 3;
  }
  const predDiff = predictedA - predictedB;
  const actDiff = actualA - actualB;
  if ((predDiff === 0 && actDiff === 0) || (predDiff > 0 && actDiff > 0) || (predDiff < 0 && actDiff < 0)) {
    return 1;
  }
  return 0;
}

function getUserId(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

// Database query wrappers
async function getAllData() {
  if (pool && dbConnected) {
    try {
      const matchesRes = await pool.query('SELECT * FROM matches ORDER BY completed, match_time NULLS LAST, team_a');
      const predictionsRes = await pool.query(`
        SELECT p.user_id, p.match_id, p.score_a, p.score_b, p.paid, p.created_at,
               u.name, u.phone, m.team_a, m.team_b, m.completed, m.bet_amount,
               m.round, m.competition, m.match_time, m.score_a as match_score_a, m.score_b as match_score_b
        FROM predictions p
        JOIN users u ON p.user_id = u.user_id
        JOIN matches m ON p.match_id = m.match_id
        ORDER BY p.created_at DESC NULLS LAST
      `);
      const usersRes = await pool.query('SELECT * FROM users');

      return {
        matches: matchesRes.rows,
        predictions: predictionsRes.rows,
        users: usersRes.rows,
      };
    } catch (e) {
      console.warn('DB query error, fallback to memory store:', e);
    }
  }

  // Memory store fallback
  const matches = Array.from(memStore.matches.values());
  const predictions: any[] = [];
  for (const pred of memStore.predictions.values()) {
    const user = memStore.users.get(pred.user_id);
    const match = memStore.matches.get(pred.match_id);
    predictions.push({
      ...pred,
      name: user?.name || pred.user_id,
      phone: user?.phone || '',
      team_a: match?.team_a || '',
      team_b: match?.team_b || '',
      completed: match?.completed || false,
      bet_amount: match?.bet_amount || 0,
      round: match?.round || null,
      competition: match?.competition || null,
      match_time: match?.match_time || null,
      match_score_a: match?.score_a ?? null,
      match_score_b: match?.score_b ?? null,
    });
  }
  predictions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return {
    matches,
    predictions,
    users: Array.from(memStore.users.values()),
  };
}

async function saveUser(name: string, phone: string = ''): Promise<string> {
  const userId = getUserId(name);
  if (pool && dbConnected) {
    try {
      const client = await pool.connect();
      try {
        const userRes = await client.query('SELECT * FROM users WHERE user_id = $1', [userId]);
        if (userRes.rows.length === 0) {
          await client.query('INSERT INTO users (user_id, name, phone, score) VALUES ($1, $2, $3, 0)', [
            userId,
            name,
            phone,
          ]);
        } else if (phone && !userRes.rows[0].phone) {
          await client.query('UPDATE users SET phone = $1 WHERE user_id = $2', [phone, userId]);
        }
      } finally {
        client.release();
      }
      return userId;
    } catch (e) {
      console.warn('Postgres user save error, using memory:', e);
    }
  }

  // In-memory
  const existing = memStore.users.get(userId);
  if (!existing) {
    memStore.users.set(userId, { user_id: userId, name, phone, score: 0 });
  } else if (phone && !existing.phone) {
    existing.phone = phone;
  }
  return userId;
}

async function createOrUpdateMatch(
  teamA: string,
  teamB: string,
  betAmount: number = 0.0,
  matchTime?: string | null,
  round?: string | null,
  competition?: string | null,
  season?: number | null,
  matchIdOverride?: string
): Promise<string> {
  const matchId =
    matchIdOverride ||
    `${teamA}_${teamB}`
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');

  if (pool && dbConnected) {
    try {
      const client = await pool.connect();
      try {
        const res = await client.query('SELECT * FROM matches WHERE match_id = $1', [matchId]);
        if (res.rows.length === 0) {
          await client.query(
            `INSERT INTO matches (match_id, team_a, team_b, completed, bet_amount, match_time, round, competition, season)
             VALUES ($1, $2, $3, false, $4, $5, $6, $7, $8)`,
            [matchId, teamA, teamB, Number(betAmount), matchTime || null, round || null, competition || null, season || null]
          );
        } else {
          await client.query('UPDATE matches SET bet_amount = $1 WHERE match_id = $2', [Number(betAmount), matchId]);
        }
      } finally {
        client.release();
      }
      return matchId;
    } catch (e) {
      console.warn('Postgres match save error, using memory:', e);
    }
  }

  // In-memory
  const existing = memStore.matches.get(matchId);
  if (!existing) {
    memStore.matches.set(matchId, {
      match_id: matchId,
      team_a: teamA,
      team_b: teamB,
      score_a: null,
      score_b: null,
      completed: false,
      bet_amount: Number(betAmount),
      round: round || null,
      competition: competition || null,
      season: season || null,
      match_time: matchTime || null,
    });
  } else {
    existing.bet_amount = Number(betAmount);
  }
  return matchId;
}

async function registerPrediction(
  matchId: string,
  name: string,
  phone: string,
  scoreA: number,
  scoreB: number,
  paid: boolean
): Promise<{ success: boolean; message: string }> {
  if (!name.trim()) {
    return { success: false, message: 'Por favor, preencha o seu nome!' };
  }
  const userId = await saveUser(name, phone);

  if (pool && dbConnected) {
    try {
      const client = await pool.connect();
      try {
        await client.query(
          `INSERT INTO predictions (user_id, match_id, score_a, score_b, paid, created_at)
           VALUES ($1, $2, $3, $4, $5, now())
           ON CONFLICT(user_id, match_id) DO UPDATE SET
             score_a = excluded.score_a,
             score_b = excluded.score_b,
             paid = excluded.paid,
             created_at = now()`,
          [userId, matchId, Number(scoreA), Number(scoreB), Boolean(paid)]
        );
      } finally {
        client.release();
      }
      return { success: true, message: 'Palpite registrado com sucesso!' };
    } catch (e: any) {
      console.warn('Postgres registerPrediction error:', e);
    }
  }

  // In-memory
  const key = `${userId}_${matchId}`;
  memStore.predictions.set(key, {
    user_id: userId,
    match_id: matchId,
    score_a: Number(scoreA),
    score_b: Number(scoreB),
    paid: Boolean(paid),
    created_at: new Date().toISOString(),
  });
  return { success: true, message: 'Palpite registrado com sucesso!' };
}

// APIs Fetchers
const COMPETITIONS: Record<string, { provider: string; code?: string; league_id?: string }> = {
  'Brasileirão Série A': { provider: 'footballdata', code: 'BSA' },
  Libertadores: { provider: 'footballdata', code: 'CLI' },
  'Copa Libertadores': { provider: 'footballdata', code: 'CLI' },
  'Brasileirão Série B': { provider: 'thesportsdb', league_id: '4352' },
  'Copa do Brasil': { provider: 'thesportsdb', league_id: '4438' },
};

async function fetchFromExternalApi(competitionName: string, season: number) {
  const cfg = COMPETITIONS[competitionName];
  if (!cfg) throw new Error('Campeonato não suportado');

  if (cfg.provider === 'footballdata') {
    if (!FOOTBALLDATA_KEY) {
      throw new Error('Configure FOOTBALLDATA_KEY nas variáveis de ambiente (.env) para importar esta competição.');
    }
    const res = await fetch(`https://api.football-data.org/v4/competitions/${cfg.code}/matches?season=${season}`, {
      headers: { 'X-Auth-Token': FOOTBALLDATA_KEY },
    });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Erro football-data.org: ${res.status} - ${errBody}`);
    }
    const data = await res.json();
    const matches = (data.matches || []).map((m: any) => ({
      external_id: `fd_${m.id}`,
      match_id: `fd_${m.id}`,
      round: m.matchday ? `Rodada ${m.matchday}` : m.stage?.replace(/_/g, ' ') || null,
      team_a: m.homeTeam?.name || '?',
      team_b: m.awayTeam?.name || '?',
      score_a: m.status === 'FINISHED' ? m.score?.fullTime?.home ?? null : null,
      score_b: m.status === 'FINISHED' ? m.score?.fullTime?.away ?? null : null,
      completed: m.status === 'FINISHED',
      match_time: m.utcDate,
      competition: competitionName,
      season: Number(season),
      bet_amount: 10.0,
    }));
    return matches;
  } else {
    // TheSportsDB
    const res = await fetch(`https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_KEY}/eventsseason.php?id=${cfg.league_id}&s=${season}`);
    if (!res.ok) throw new Error(`Erro TheSportsDB: ${res.status}`);
    const data = await res.json();
    const events = data.events || [];
    return events.map((e: any) => {
      const hs = e.intHomeScore;
      const aw = e.intAwayScore;
      const completed = hs !== null && hs !== '' && aw !== null && aw !== '';
      const ts = e.strTimestamp || (e.dateEvent ? `${e.dateEvent}T${e.strTime || '00:00:00'}Z` : null);
      return {
        external_id: `tsdb_${e.idEvent}`,
        match_id: `tsdb_${e.idEvent}`,
        round: e.intRound && Number(e.intRound) > 0 ? `Rodada ${e.intRound}` : null,
        team_a: e.strHomeTeam || '?',
        team_b: e.strAwayTeam || '?',
        score_a: completed ? parseInt(hs, 10) : null,
        score_b: completed ? parseInt(aw, 10) : null,
        completed,
        match_time: ts,
        competition: competitionName,
        season: Number(season),
        bet_amount: 10.0,
      };
    });
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/status', (req: Request, res: Response) => {
    res.json({
      dbConnected,
      provider: DB_URL.includes('neon') ? 'neon' : DB_URL.includes('supabase') ? 'supabase' : DB_URL ? 'postgresql' : 'in-memory',
      maskedUrl: DB_URL ? DB_URL.replace(/:\/\/[^:]+:([^@]+)@/, '://user:***@') : 'Em memória (Simulador Ativo)',
    });
  });

  app.get('/api/data', async (req: Request, res: Response) => {
    try {
      const data = await getAllData();

      // Compute rankings by competition & overall
      const rankingsByComp: Record<string, { name: string; score: number; exactCount: number }[]> = {};
      const overallRankMap = new Map<string, { name: string; score: number; exactCount: number }>();

      // Group predictions by match
      const matchMap = new Map<string, any>();
      data.matches.forEach((m: any) => matchMap.set(m.match_id, m));

      // Calculate scores
      data.predictions.forEach((p: any) => {
        const m = matchMap.get(p.match_id);
        const comp = m?.competition || 'Avulsas';
        if (!rankingsByComp[comp]) rankingsByComp[comp] = [];

        let pts = 0;
        let isExact = false;
        if (m?.completed && m.score_a !== null && m.score_b !== null) {
          pts = calculateScore(p.score_a, p.score_b, m.score_a, m.score_b);
          if (pts === 3) isExact = true;
        }

        // Add to comp
        let compEntry = rankingsByComp[comp].find((r) => r.name === p.name);
        if (!compEntry) {
          compEntry = { name: p.name, score: 0, exactCount: 0 };
          rankingsByComp[comp].push(compEntry);
        }
        compEntry.score += pts;
        if (isExact) compEntry.exactCount += 1;

        // Add to overall
        let ovEntry = overallRankMap.get(p.user_id);
        if (!ovEntry) {
          ovEntry = { name: p.name, score: 0, exactCount: 0 };
          overallRankMap.set(p.user_id, ovEntry);
        }
        ovEntry.score += pts;
        if (isExact) ovEntry.exactCount += 1;
      });

      // Sort rankings
      Object.keys(rankingsByComp).forEach((k) => {
        rankingsByComp[k].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
      });
      const overallRanking = Array.from(overallRankMap.values()).sort(
        (a, b) => b.score - a.score || a.name.localeCompare(b.name)
      );

      // Prize pools calculations
      const prizePools: Record<string, any> = {};
      data.matches.forEach((m: any) => {
        const matchPreds = data.predictions.filter((p: any) => p.match_id === m.match_id);
        const paidPreds = matchPreds.filter((p: any) => p.paid);
        const bet = m.bet_amount || 0;
        const totalPot = paidPreds.length * bet;
        const expectedPot = matchPreds.length * bet;

        let winners: string[] = [];
        if (m.completed && m.score_a !== null && m.score_b !== null) {
          winners = matchPreds
            .filter((p: any) => calculateScore(p.score_a, p.score_b, m.score_a, m.score_b) === 3)
            .map((p: any) => p.name);
        }
        const prizePerWinner = winners.length > 0 ? totalPot / winners.length : 0;

        prizePools[m.match_id] = {
          totalParticipants: matchPreds.length,
          paidParticipants: paidPreds.length,
          expectedPot,
          confirmedPot: totalPot,
          pendingPot: expectedPot - totalPot,
          winners,
          prizePerWinner,
        };
      });

      res.json({
        matches: data.matches,
        predictions: data.predictions,
        rankingsByComp,
        overallRanking,
        prizePools,
      });
    } catch (e: any) {
      console.error('Error fetching dashboard data:', e);
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/predictions', async (req: Request, res: Response) => {
    try {
      const { match_id, name, phone, score_a, score_b, paid } = req.body;
      const result = await registerPrediction(match_id, name, phone, score_a, score_b, paid);
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Message parser endpoint (e.g. "João: Brasil 2 x 1 Argentina")
  app.post('/api/predictions/parse', async (req: Request, res: Response) => {
    try {
      const { message, phone = '', paid = false } = req.body;
      const pattern = /^([^:]+):\s*(.+?)\s+(\d+)\s*[xX-]\s*(\d+)\s+(.+)$/;
      const match = (message || '').trim().match(pattern);

      if (!match) {
        return res.status(400).json({
          error: "Formato inválido. Use 'Nome: Time A 2 x 1 Time B' (ex: João: Brasil 2 x 1 Argentina)",
        });
      }

      const userName = match[1].trim();
      const teamA = match[2].trim();
      const scoreA = parseInt(match[3], 10);
      const scoreB = parseInt(match[4], 10);
      const teamB = match[5].trim();

      const matchId = await createOrUpdateMatch(teamA, teamB, 10.0);
      const result = await registerPrediction(matchId, userName, phone, scoreA, scoreB, paid);

      res.json({
        success: true,
        message: `Palpite de ${userName} registrado com sucesso para ${teamA} ${scoreA} x ${scoreB} ${teamB}.`,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Admin middleware check
  const checkAdmin = (req: Request, res: Response, next: any) => {
    const authPass = req.headers['x-admin-password'] || req.body?.admin_password;
    if (authPass !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Senha de administrador inválida.' });
    }
    next();
  };

  app.post('/api/admin/match', checkAdmin, async (req: Request, res: Response) => {
    try {
      const { team_a, team_b, bet_amount, round, competition, season, match_time, match_id } = req.body;
      const savedId = await createOrUpdateMatch(
        team_a,
        team_b,
        bet_amount,
        match_time,
        round,
        competition,
        season,
        match_id
      );
      res.json({ success: true, match_id: savedId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/match/finish', checkAdmin, async (req: Request, res: Response) => {
    try {
      const { match_id, score_a, score_b } = req.body;
      if (pool && dbConnected) {
        await pool.query('UPDATE matches SET score_a = $1, score_b = $2, completed = true WHERE match_id = $3', [
          Number(score_a),
          Number(score_b),
          match_id,
        ]);
      } else {
        const m = memStore.matches.get(match_id);
        if (m) {
          m.score_a = Number(score_a);
          m.score_b = Number(score_b);
          m.completed = true;
        }
      }
      res.json({ success: true, message: 'Partida finalizada e pontuações atualizadas!' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/payment', checkAdmin, async (req: Request, res: Response) => {
    try {
      const { user_id, match_id, paid } = req.body;
      if (pool && dbConnected) {
        await pool.query('UPDATE predictions SET paid = $1 WHERE user_id = $2 AND match_id = $3', [
          Boolean(paid),
          user_id,
          match_id,
        ]);
      } else {
        const key = `${user_id}_${match_id}`;
        const p = memStore.predictions.get(key);
        if (p) p.paid = Boolean(paid);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/admin/match/:id', checkAdmin, async (req: Request, res: Response) => {
    try {
      const matchId = req.params.id;
      if (pool && dbConnected) {
        await pool.query('DELETE FROM predictions WHERE match_id = $1', [matchId]);
        await pool.query('DELETE FROM matches WHERE match_id = $1', [matchId]);
      } else {
        memStore.matches.delete(matchId);
        for (const [key, p] of memStore.predictions.entries()) {
          if (p.match_id === matchId) memStore.predictions.delete(key);
        }
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/admin/prediction', checkAdmin, async (req: Request, res: Response) => {
    try {
      const { user_id, match_id } = req.body;
      if (pool && dbConnected) {
        await pool.query('DELETE FROM predictions WHERE user_id = $1 AND match_id = $2', [user_id, match_id]);
      } else {
        memStore.predictions.delete(`${user_id}_${match_id}`);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/admin/competition', checkAdmin, async (req: Request, res: Response) => {
    try {
      const { competition, season } = req.body;
      let count = 0;
      if (pool && dbConnected) {
        const client = await pool.connect();
        try {
          const idsRes = await client.query('SELECT match_id FROM matches WHERE competition = $1 AND season = $2', [
            competition,
            Number(season),
          ]);
          const ids = idsRes.rows.map((r) => r.match_id);
          if (ids.length > 0) {
            await client.query('DELETE FROM predictions WHERE match_id = ANY($1)', [ids]);
            await client.query('DELETE FROM matches WHERE match_id = ANY($1)', [ids]);
          }
          count = ids.length;
        } finally {
          client.release();
        }
      } else {
        for (const [mid, m] of memStore.matches.entries()) {
          if (m.competition === competition && m.season === Number(season)) {
            memStore.matches.delete(mid);
            count++;
            for (const [pk, p] of memStore.predictions.entries()) {
              if (p.match_id === mid) memStore.predictions.delete(pk);
            }
          }
        }
      }
      res.json({ success: true, count, message: `${count} partidas removidas.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/import', checkAdmin, async (req: Request, res: Response) => {
    try {
      const { competition, season } = req.body;
      const fixtures = await fetchFromExternalApi(competition, Number(season));
      let count = 0;

      for (const fx of fixtures) {
        await createOrUpdateMatch(
          fx.team_a,
          fx.team_b,
          fx.bet_amount,
          fx.match_time,
          fx.round,
          fx.competition,
          fx.season,
          fx.match_id
        );
        if (fx.completed && fx.score_a !== null && fx.score_b !== null) {
          if (pool && dbConnected) {
            await pool.query('UPDATE matches SET score_a = $1, score_b = $2, completed = true WHERE match_id = $3', [
              fx.score_a,
              fx.score_b,
              fx.match_id,
            ]);
          } else {
            const m = memStore.matches.get(fx.match_id);
            if (m) {
              m.score_a = fx.score_a;
              m.score_b = fx.score_b;
              m.completed = true;
            }
          }
        }
        count++;
      }

      res.json({ success: true, count, message: `${count} jogos de ${competition} importados com sucesso.` });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/admin/seed-2026', checkAdmin, async (req: Request, res: Response) => {
    try {
      const { competition, clearExisting } = req.body || {};
      const matchesToSeed = competition && competition !== 'Todos'
        ? DEFAULT_MATCHES_2026.filter((m) => m.competition === competition)
        : DEFAULT_MATCHES_2026;

      if (clearExisting) {
        if (pool && dbConnected) {
          if (competition && competition !== 'Todos') {
            await pool.query('DELETE FROM predictions WHERE match_id IN (SELECT match_id FROM matches WHERE competition = $1)', [competition]);
            await pool.query('DELETE FROM matches WHERE competition = $1', [competition]);
          } else {
            await pool.query('DELETE FROM predictions');
            await pool.query('DELETE FROM matches');
          }
        } else {
          if (competition && competition !== 'Todos') {
            for (const [mid, m] of memStore.matches.entries()) {
              if (m.competition === competition) {
                memStore.matches.delete(mid);
                for (const [pid, p] of memStore.predictions.entries()) {
                  if (p.match_id === mid) memStore.predictions.delete(pid);
                }
              }
            }
          } else {
            memStore.matches.clear();
            memStore.predictions.clear();
          }
        }
      }

      let count = 0;
      for (const fx of matchesToSeed) {
        await createOrUpdateMatch(
          fx.team_a,
          fx.team_b,
          fx.bet_amount,
          fx.match_time,
          fx.round,
          fx.competition,
          fx.season,
          fx.match_id
        );
        count++;
      }

      res.json({
        success: true,
        count,
        message: `${count} partidas reais e confirmadas de 2026 cadastradas com sucesso!`,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚽ Bolão de Futebol server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
