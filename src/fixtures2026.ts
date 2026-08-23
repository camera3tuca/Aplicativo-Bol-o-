import { Match } from './types';
import { SERIE_A_REMAINING_2026 } from './fixtures/serieA2026';
import { SERIE_B_REMAINING_2026 } from './fixtures/serieB2026';
import { COPA_DO_BRASIL_2026 } from './fixtures/copaDoBrasil2026';
import { LIBERTADORES_2026 } from './fixtures/libertadores2026';

// Calendário Oficial Completo 2026 - Apenas jogos que ainda irão acontecer até o fim da temporada
export const ALL_DEFINED_MATCHES_2026: Match[] = [
  ...SERIE_A_REMAINING_2026,
  ...SERIE_B_REMAINING_2026,
  ...COPA_DO_BRASIL_2026,
  ...LIBERTADORES_2026,
];
