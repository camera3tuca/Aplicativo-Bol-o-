# ⚽ Bolão de Futebol — Dashboard

Aplicativo completo para gerenciar bolão de futebol: cadastro de palpites, ranking automático, divisão de prêmios (Pix) e importação de rodadas de campeonatos.
Suporta persistência em banco PostgreSQL ([Neon](https://neon.tech), [Supabase](https://supabase.com/) ou Cloud SQL) com fallback em memória automático para o ambiente de preview.

## Funcionalidades

- **Importação de campeonatos (APIs gratuitas)**: puxa rodadas da temporada (jogos, datas e resultados) e atualiza os placares automaticamente.
- **Ranking separado por campeonato** e filtro interativo por campeonato/rodada.
- **Layout responsivo de coluna única com indicadores (KPIs)** no topo.
- **Registro de palpites** via formulário ou mensagem de texto rápida (estilo WhatsApp) com confirmação de pagamento Pix.
- **Cálculo de ranking automático**: 3 pontos por placar exato, 1 por acertar o vencedor/empate.
- **Controle de pagamento**: status Pago/Pendente, filtro na lista de palpites e divisão de prêmio entre os acertadores.
- **Painel de administração** com senha master (`5075`): criar/encerrar partidas, confirmar pagamentos e importar campeonatos.

## Como rodar localmente

```bash
npm install
npm run dev
```

O servidor iniciará em `http://localhost:3000`.

## Variáveis de Ambiente (.env)

| Chave | Descrição |
| --- | --- |
| `DATABASE_URL` | String de conexão PostgreSQL (Neon / Supabase / Cloud SQL). Se não fornecida, usa simulador em memória. |
| `ADMIN_PASSWORD` | Senha do painel de administração (padrão: `5075`). |
| `FOOTBALLDATA_KEY` | Token da football-data.org para Série A e Libertadores (opcional). |
| `THESPORTSDB_KEY` | Chave da TheSportsDB para Série B e Copa do Brasil (padrão: `3`). |
