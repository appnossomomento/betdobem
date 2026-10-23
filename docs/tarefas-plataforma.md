# BETdoBEM — tarefas para plataforma robusta

Documento de execução. Estado em 23 out 2026.

**No ar:** app Next.js em https://betdobem.vercel.app · código em `appnossomomento/betdobem` · Supabase Free conectado (chaves no `.env.local` e na Vercel) · rodada e 1X2 vindos do placar gratuito (ESPN) · bilhete em tela cheia debita saldo **só na memória do browser**.

**Ainda fake:** Marina, 186 moedas, ranking, ligas seed, VIP ligado no código, liquidação de aposta, reset de terça.

**Não inventar** (pontos abertos do produto): valor do marco zero · quais estaduais no lançamento · preço do VIP · frete do kit / entrega do streaming · advogado antes do público · liquidar no apito final ou no ao vivo.

---

## Como trabalhar sem o fundador acordado

1. Fazer tudo da **Fase A** e **Fase B** que não dependa de número aberto.
2. Onde faltar o marco zero, usar constante nomeada `MARCO_ZERO_COINS` com valor **temporário 186** (o que a UI já mostra) e um `TODO` no código + nota neste arquivo. Trocar quando o fundador decidir.
3. Não commitar `.env.local`. Não colar secret no chat nem no Git.
4. Depois de cada bloco útil: commit no `main` e push, para a Vercel republicar.
5. Verificar UI no browser (local e/ou https://betdobem.vercel.app) após mudanças de tela.
6. Tom afirmativo nos reports. Sem captions instrutivos sob todo controle nas telas novas.
7. Não editar a tese crítica da seção 7 de `bet-do-bem-business.md`. Não inventar parecer jurídico.

---

## Fase A — Banco e identidade (base)

### A1. Schema Supabase (SQL)

Criar migration em `next-app/supabase/migrations/` (ou SQL no editor do Supabase) com:

| Tabela | Campos mínimos |
|---|---|
| `profiles` | `id` (FK auth.users), `display_name`, `initials`, `avatar_url`, `shirt_size`, `vip` bool default false, `vip_until`, `created_at` |
| `ledger` | `id`, `user_id`, `kind` (`stake` \| `payout` \| `reset` \| `marco_zero` \| `ajuste`), `amount` (signed), `ref_type`, `ref_id`, `week_key`, `created_at` |
| `bets` | `id`, `user_id`, `stake`, `combined_odd`, `potential_return`, `status` (`open` \| `won` \| `lost` \| `void`), `placed_at`, `settled_at`, `week_key` |
| `bet_legs` | `id`, `bet_id`, `fixture_id`, `market`, `selection_key`, `phrase`, `odd` (travada), `result` |
| `weeks` | `week_key` (ex. `2026-W43`), `starts_at`, `ends_at`, `reset_at` |
| `week_capitals` | `user_id`, `week_key`, `capital` — capital da semana para ranking |
| `month_capitals` | `user_id`, `month_key`, `capital` — soma das semanas |
| `leagues` | `id`, `host_id`, `name`, `photo_url`, `duration`, `player_cap`, `visibility`, `outside_prize`, `created_at`, `ends_at`, `status` |
| `league_members` | `league_id`, `user_id`, `joined_at` — máx. 3 ligas por usuário (constraint/app) |
| `league_capital_events` | `id`, `league_id`, `user_id`, `coins`, `at` — histórico desde `created_at` da liga |

Regras:

- Saldo = soma do `ledger` do usuário (nunca um campo solto sem extrato).
- RLS ligado em tudo: usuário lê o próprio; ranking público pode ler só o necessário (`display_name`, capitais); writes de saldo/aposta só via server com `SUPABASE_SECRET_KEY` ou RPC segura.
- Grants: não deixar `anon` inserir em `ledger` / `bets`.

### A2. Auth

- Tela `/entrar` (e-mail mágico ou e-mail+senha — preferir magic link no Free).
- Criar `profiles` no primeiro login (trigger `on_auth_user_created` ou upsert server-side).
- Proxy já existe (`src/proxy.ts`): manter renovação de sessão; **não** redirecionar tudo para login enquanto o piloto público mostrar a casa — proteger rotas de carteira/envio de aposta/perfil.
- Header: saldo e iniciais vêm do `profiles` + ledger, não mais `186` / `MA` fixos.

### A3. Marco zero no cadastro

- No primeiro perfil, lançar `ledger.kind = marco_zero` com `MARCO_ZERO_COINS` (temp. 186).
- Documentar no código que o valor é provisório.

**Critério A:** usuário cria conta, vê saldo no header, F5 mantém o saldo.

---

## Fase B — Apostas de verdade

### B1. Enviar aposta

- `place()` deixa de só mutar React state: Server Action / Route Handler:
  1. Valida sessão.
  2. Recalcula odd no servidor a partir das pernas (ou confere as odds travadas enviadas).
  3. Confere saldo (soma ledger).
  4. Insere `bets` + `bet_legs` + `ledger.stake` (débito) numa transação.
  5. Limpa o slip.
- Bilhete fullscreen já existe: ligar nele.
- Stake mínimo: 1 moeda (já no UI).

### B2. Liquidação

- Worker/cron (Vercel Cron no Hobby ou job no Supabase) consulta placar final dos `fixture_id` abertos.
- Até o fundador decidir ao vivo vs apito final: **liquidar só quando status = final** (FT). Documentar a escolha provisória.
- Vitória: `ledger.payout` = stake × combined_odd; `bets.status = won`.
- Derrota: `lost`, sem payout.
- Odd travada na perna **não** muda com a cotação da tela.

### B3. Carteira

- Página `/carteira` (hoje é âncora): extrato do ledger, apostas abertas e encerradas.
- Sem depósito, sem saque, sem transferência entre usuários.

**Critério B:** aposta de 10 moedas debita no banco; após FT, ganho ou perda aparece no extrato.

---

## Fase C — Economia semanal e rankings

### C1. Chaves de semana

- `week_key` em America/Sao_Paulo; reset terça 01:00.
- Função pura `weekKey(date)` + testes.

### C2. Job de reset (terça 01:00)

1. Para cada usuário: capital_semana = soma relevante da semana (definir: máximo de saldo na semana **ou** saldo no momento do reset — **provisório: saldo atual no reset**, anotar).
2. Grava `week_capitals`.
3. Soma em `month_capitals`.
4. `ledger.reset` zera (débito do saldo restante) + `ledger.marco_zero` credita `MARCO_ZERO_COINS`.
5. Emite eventos de capital nas ligas ativas do usuário (`league_capital_events`).

### C3. Ranking

- `/ranking`: semanal e mensal leem `week_capitals` / `month_capitals`.
- Premiação do mês: título com nome do mês (já existe); cards de prêmio ficam; fulfillment continua processo manual fora do app.
- Remover rows seed (`weekly` / `monthly` em `home.ts`).

**Critério C:** depois do job (rodável manualmente na dev), ranking muda e saldo volta ao marco zero.

---

## Fase D — Ligas VIP

### D1. Persistência

- Criar / editar / encerrar / sair gravam no Supabase.
- `createdAt` + `history` como já pré-setado no cliente.
- Só `profiles.vip = true` cria liga; UI de lock já existe.
- Máx. 3 memberships.
- Foto: Storage bucket privado/público com path por liga; validar tipo/tamanho/aspecto (regras atuais).

### D2. Standings

- `standingsFromHistory` no server ou view SQL.
- Seed Resenha/Os de casa/Galera: migrar para dados reais ou remover do produto.

**Critério D:** VIP cria liga, outro user entra, ambos começam 0 na data de criação; refresh mantém.

---

## Fase E — Jogos e odds (robustez do feed)

### E1. Cache e cota

- Manter cache em arquivo/DB (hoje `.data/round.json`); em Vercel usar `unstable_cache` / KV / tabela `fixtures_cache` (filesystem efêmero).
- Preferir tabela `fixtures_cache` no Supabase atualizada por cron a cada 12h (pré-jogo) e a cada 10 min só em janela de jogo para live.

### E2. Cobertura

- Brasileirão + Libertadores masculina: já.
- Estaduais: **só depois** do fundador listar quais; ids/slugs ESPN mapeados numa constante.
- Jogos sem odd: card só com Placar (já); quando a casa publicar, entra no próximo poll.

### E3. Detalhe do jogo

- `/jogo/[id]`: placar e 1X2 reais; placar exato / BTTS só se houver fonte gratuita estável — senão esconder mercados inventados.

### E4. Documentação

- Atualizar `instructions/API.md`: provedor atual do feed (placar gratuito), intervalo 10 min ao vivo, API-Football Free limitada a 2022–2024 (não usar para temporada atual).

**Critério E:** produção não depende de `.data` local; live atualiza em janela de jogo.

---

## Fase F — Produto e segurança de lançamento

### F1. Perfil

- Editar nome, avatar, tamanho de camisa.
- Flag VIP: manual no Supabase no começo (sem Stripe até preço definido).

### F2. Hardening

- Revisar RLS com usuário A tentando ler ledger de B.
- Rate limit no `place`.
- Secret só no server (`admin.ts`).
- Headers de segurança básicos na Vercel.

### F3. Observabilidade

- Log de falha de liquidação / reset.
- Página simples de health: feed ok, supabase ok.

### F4. Domínio e comercial

- Domínio próprio opcional.
- Antes de cobrar VIP: plano Vercel Pro (Hobby = uso pessoal).

**Critério F:** checklist de segurança passado; VIP só por flag admin até preço fechado.

---

## Ordem sugerida nesta madrugada

1. A1 schema + RLS  
2. A2 auth + profile + header real  
3. A3 marco zero provisório  
4. B1 place no server  
5. B3 carteira mínima  
6. B2 liquidação FT (cron ou script manual + rota protegida)  
7. C1–C3  
8. D1–D2  
9. E1 cache no Supabase  
10. E4 docs  
11. F2 smoke de RLS  

Parar e deixar nota se: auth e-mail do Supabase exigir redirect URL (adicionar `https://betdobem.vercel.app/**` e `http://localhost:3000/**` em Auth → URL Configuration).

---

## Checklist rápido do ambiente

- [x] GitHub `appnossomomento/betdobem`  
- [x] Vercel `betdobem.vercel.app` + env Supabase  
- [x] Supabase projeto Free + keys no `.env.local`  
- [ ] Redirect URLs de Auth  
- [ ] Migration aplicada  
- [ ] Cron de liquidação / reset  
- [ ] `MARCO_ZERO_COINS` decidido pelo fundador  
- [ ] Estaduais do lançamento  
- [ ] Preço VIP  

---

## Relatório ao acordar

Ao fim do turno, atualizar este arquivo com:

- O que foi mergeado / deployado  
- URLs de teste  
- O que ficou bloqueado em ponto aberto  
- Valor provisório ainda em uso (`MARCO_ZERO_COINS`, regra de liquidação FT)

---

## Progresso da madrugada (atualizar em tempo real)

### 23 out 2026 — início

- [x] Documento `instructions/tarefas-plataforma.md` criado
- [x] Migration SQL em `next-app/supabase/migrations/20261023_init.sql` (profiles, ledger, bets, ligas, cache, RLS, trigger marco zero 186)
- [x] Constante `MARCO_ZERO_COINS` em `src/lib/economy.ts`
- [ ] **Bloqueio:** aplicar o SQL no Supabase (SQL Editor → colar o arquivo `20261023_init.sql` → Run). Sem Management API com a chave do app. Fundador pode rodar ao acordar; agente continua o código Auth/place em paralelo.
- [ ] Auth `/entrar` + header com saldo real
- [ ] `place` no server
- [ ] Push contínuo para `main`
