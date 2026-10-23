# BETdoBEM — lista da madrugada (23 out 2026)

Documento de execução. Quando o fundador disser para começar, seguir esta lista de cima para baixo, sem parar para perguntar gosto, ordem de campo ou cópia. Só interromper um item se ele depender de um clique que só o fundador pode dar (SQL no editor do Supabase ou URL de redirect do Auth). Nesse caso, deixar o arquivo pronto, anotar o bloqueio no fim deste doc e seguir o próximo item.

## Como executar

1. Não commitar `.env.local` nem `.data`. Não colar secret no chat nem no Git.
2. Depois de cada bloco que compila e foi visto no browser: commit no `main` e push, para a Vercel republicar. O comando de começar autoriza esses commits.
3. Verificar no browser o fluxo inteiro da tela mexida (clicar, preencher, enviar, voltar). Conferir também a outra rota que lê o mesmo estado. No carrossel e no login, olhar largura de celular.
4. Sem legenda explicativa debaixo de cada controle. Label de campo fica. Trava real fica (VIP, 3 ligas, saldo, odd que mudou).
5. Tom afirmativo. Não editar a seção 7 de `instructions/bet-do-bem-business.md`. Não escrever parecer jurídico.
6. Não inventar odd, placar exato, ambos marcam, cash out, bônus, depósito, saque ou transferência.
7. Não reintroduzir Marina, 186, ligas seed nem `viewer.vip = true`.
8. Marco zero é 50. Terça-feira, 01h00, America/Sao_Paulo.
9. Odd combinada é o produto das pernas. Mostrar a conta (`1.37 × 1.95`) no bilhete. Não inverter.
10. Um palpite por jogo: a mesma tecla tira; outra tecla no mesmo jogo substitui e manda o jogo para o fim da ordem.

## Já feito — não refazer

- [x] Next.js em https://betdobem.vercel.app e GitHub `appnossomomento/betdobem`
- [x] Supabase com `20261023_init.sql`, grants e gatilho de 50 (`20261023_marco_zero_50.sql`)
- [x] Rodada e 1X2 pelo placar gratuito (ESPN). Sem odd inventada: o card fica só com Placar
- [x] `MARCO_ZERO_COINS = 50` em `src/lib/economy.ts`
- [x] `weekKey()` no formato do SQL: `W43-2026`
- [x] Clientes Supabase, proxy, `placeBet` no server (`src/lib/place.ts`) gravando `bets`, `bet_legs` e débito no `ledger`
- [x] Ranking e ligas seed removidos da UI
- [x] Mercados inventados de placar e ambos marcam removidos de `GameScreen`
- [ ] Redirect URLs de Auth ainda não cadastradas
- [ ] O que está neste arquivo abaixo ainda não foi para o ar

## Decisões fechadas nesta conversa

- Visitante sem conta cai numa tela de login, não na home.
- O bloco fica no centro da tela preta. No topo do bloco, centralizada, a logo `public/logo-bet-do-bem/LogoPrincipal-completo.png`.
- Ordem dos botões: **Entrar**, depois **Criar conta**, depois **Ver jogos**.
- **Ver jogos** leva a `/jogos` e o visitante fica só nessa jornada. A barra de baixo mostra apenas Jogos. Início, Carteira, Ranking e Perfil somem.
- URL direta de Início, Carteira, Ranking ou Perfil sem sessão volta para a tela de login.
- `/jogo/[id]` faz parte da jornada de Jogos (voltar para `/jogos`). Não é aba.
- No Jogos ele monta o bilhete. Enviar a aposta exige login. O retorno possível pode aparecer antes do login. O saldo não aparece, e nada é debitado.
- Cadastro pede, nesta ordem visual: apelido, e-mail, senha, idade, cidade, time que torce, tamanho da camisa, tamanho do short/calça.
- Apelido é o nome do ranking. Único, sem diferenciar maiúscula.
- Início (só logado): o carrossel do topo abre no primeiro card. A lista já vem ao vivo primeiro e, depois, o apito mais próximo. O código hoje centraliza `children[1]` em `HomeScreen` (`RoundStrip`). Passar para `children[0]`.

## Fora desta noite

Preço do VIP, Stripe, Vercel Pro, frete do kit, entrega do Premiere/Globoplay, texto de advogado, afiliado, push do sistema operacional, divisões Bronze/Prata/Ouro, cash out, bônus, apagar usuário, entrar na conta de outro usuário.

---

## 1. Porta de entrada

Arquivos: `src/app/page.tsx`, `src/app/entrar/page.tsx`, `src/components/EntrarForm.tsx`, `src/components/AppShell.tsx`, `src/app/layout.tsx`.

- [ ] Sem sessão, `/` renderiza a tela de login **fora** da casca (sem header de saldo, sem barra de baixo, sem bilhete).
- [ ] Fundo `#0b0b0b`. Um bloco `max-w-md` no centro vertical e horizontal, `bg-card`, borda `border-line`, raio 18.
- [ ] Logo no topo do bloco, centralizada, altura cerca de 48–56px, `alt="BETdoBEM"`.
- [ ] Modo entrar: e-mail, senha, botão Entrar (accent, largura cheia).
- [ ] Abaixo, botão de texto **Criar conta**. Abaixo dele, botão de largura cheia **Ver jogos** (fundo `card-2`, texto claro).
- [ ] Criar conta troca os campos no mesmo bloco. Não abre outra página com outra casca. Link **Já tenho conta** volta ao modo entrar.
- [ ] Ver jogos vai para `/jogos`.
- [ ] Com sessão, `/` é a home de sempre (Início). `/entrar` com sessão mostra o nome e o botão Sair vermelho `#c4292e`.
- [ ] Esqueci a senha: no modo entrar, um texto-botão abre e-mail + “Enviar link”. Usa `resetPasswordForEmail` com `redirectTo` `${origin}/auth/callback`. Sem parágrafo de instrução.

Critério: abrir `localhost:3000` sem cookie mostra logo, Entrar, Criar conta e Ver jogos. Nenhum menu de baixo.

## 2. Visitante preso em Jogos

Arquivos: `AppShell.tsx`, `src/proxy.ts` ou um guard nas páginas, `src/app/jogos/page.tsx`, `src/app/jogo/[id]/page.tsx`.

- [ ] Sem sessão, a barra de baixo tem um único item: Jogos. Sem Início, Carteira, Ranking, Perfil.
- [ ] Header em Jogos: logo e um Entrar que volta à porta. Sem moeda e sem iniciais.
- [ ] `/`, `/ranking`, `/carteira`, `/perfil` sem sessão redirecionam para `/` (a porta). Não para Jogos.
- [ ] `/jogos` e `/jogo/[id]` abrem para o visitante. Voltar do jogo vai para `/jogos`.
- [ ] O bilhete de baixo continua. Dá para marcar 1, X e 2. A múltipla multiplica.
- [ ] No bilhete, o botão principal do visitante é **Entrar para enviar**. Não debita.
- [ ] Antes de ir à porta, gravar as pernas em `sessionStorage` (`betdobem.slip`). Depois do login ou do cadastro, restaurar o slip e reabrir o bilhete em `/jogos`.

Critério: deslogado, a barra só tem Jogos; digitar `/ranking` cai na porta; marcar uma odd e abrir o rodapé mostra o bilhete com Entrar para enviar.

## 3. Campos do cadastro

Arquivo SQL novo: `next-app/supabase/migrations/20261023_profile.sql`.

Colunas em `profiles` (as que já existem ficam):

| Coluna | Regra |
|---|---|
| `nick` | texto, 3–16, único em `lower(nick)`, o que o ranking mostra |
| `age` | inteiro, 10–120. Não é trava jurídica |
| `city` | texto, até 48 |
| `favorite_team` | texto |
| `shirt_size` | já existe. PP, P, M, G, GG, XG |
| `bottom_size` | mesmo conjunto da camisa |

- [ ] `display_name` e `initials` passam a nascer do apelido (2 letras).
- [ ] Atualizar `handle_new_user` para ler `raw_user_meta_data` (`nick`, `age`, `city`, `favorite_team`, `shirt_size`, `bottom_size`) e lançar o `marco_zero` de 50.
- [ ] Índice único `profiles_nick_lower_idx` em `lower(nick)`.
- [ ] View `public_profiles` com `id`, `nick`, `initials`, `avatar_url`, `vip`. Ranking lê essa view. Idade, cidade, tamanhos e e-mail não saem para outro usuário.
- [ ] O arquivo SQL fica pronto. Se o app não conseguir gravar porque a coluna não existe no banco ao vivo, anotar no fim deste doc e seguir com o resto. Não inventar um segundo banco.

Formulário, na ordem:

1. Apelido
2. E-mail
3. Senha (mínimo 6, regra do Auth)
4. Idade
5. Cidade
6. Time que torce — lista fixa dos 20 da Série A que o placar já traz (Athletico-PR, Atlético-MG, Bahia, Botafogo, Chapecoense, Corinthians, Coritiba, Cruzeiro, Flamengo, Fluminense, Grêmio, Internacional, Mirassol, Palmeiras, Red Bull Bragantino, Remo, Santos, São Paulo, Vasco, Vitória) e a opção Outro. Guardar o nome.
7. Camisa — PP P M G GG XG
8. Short ou calça — o mesmo conjunto

- [ ] Sem texto de ajuda debaixo dos campos. Erro curto se o apelido já existe, se a idade está fora, ou se o Auth recusar o e-mail.
- [ ] Se o Auth exigir confirmação de e-mail, a mensagem é uma linha: “Conta criada. Abra o link enviado para o e-mail.” O slip guardado sobrevive até ele voltar pelo `/auth/callback`.
- [ ] Callback já existe em `src/app/auth/callback/route.ts`. Manter. Destino depois do link: `/jogos` se houver slip guardado, senão `/`.

Critério: conta nova fica com apelido, 50 no header e F5 mantém os 50. Isso só fecha de ponta a ponta depois do SQL aplicado e das redirect URLs.

## 4. Carrossel do Início

Arquivo: `src/components/HomeScreen.tsx`, função `RoundStrip`.

- [ ] Trocar `node.children[1]` por `node.children[0]`.
- [ ] Centralizar esse primeiro card na largura do celular. Com um card só, centralizar esse. No desktop, se a faixa inteira cabe, `scrollLeft = 0`.
- [ ] Não inverter a ordem. `byKickoff` em `src/lib/round.ts` já põe ao vivo na frente e, depois, o apito mais cedo. O primeiro card é o jogo da vez.
- [ ] Rodar de novo quando `cards` mudar.

Critério: no celular, o card visível ao abrir o Início é o jogo ao vivo ou o apito mais próximo, não o segundo da lista.

## 5. Bilhete profissional

Arquivo: o ticket em `src/components/AppShell.tsx`. Pode extrair `src/components/Ticket.tsx` se o arquivo passar de um tamanho incômodo.

O bilhete cobre a tela (`z-40`, fundo `#0b0b0b`).

- [ ] Barra de cima: Fechar à esquerda, título **Bilhete** no centro, saldo à direita só se houver sessão. Visitante não vê moeda.
- [ ] Cada perna é um card: frase da seleção em destaque, odd à direita num pill accent, competição e horário numa linha menor se o jogo ainda estiver na rodada. Botão de remover a perna. Remover a última fecha o bilhete e esvazia o slip.
- [ ] Odd combinada grande, accent. Múltipla mostra a linha `1.37 × 1.95` embaixo. Simples não mostra essa linha.
- [ ] Campo **Valor**. Atalhos 5, 10, 25 e, só logado, **Tudo** (o saldo). Valor mínimo 1. Vírgula vira ponto.
- [ ] Linha **Retorno** com o número em accent. Conta: valor × odd combinada, em centavos.
- [ ] Botão fixo no pé: **Enviar aposta**. Desligado enquanto o valor for inválido ou passar do saldo. Durante o envio, o rótulo é **Enviando**.
- [ ] Visitante: o mesmo bilhete, atalhos 5, 10 e 25, retorno visível, botão **Entrar para enviar**. Grava o slip e abre a porta.
- [ ] Erros, uma linha: odd mudou, jogo saiu da rodada, saldo insuficiente, não foi possível enviar.
- [ ] Sucesso no mesmo painel: **Aposta enviada**, valor, odd, retorno, saldo novo, os 8 primeiros caracteres do id da aposta, botão Fechar. Sem ícone de emoji.
- [ ] `placeBet` continua no server: sessão, odd recalculada, saldo, `bets` + `bet_legs` + `ledger` negativo. Falha no meio apaga a aposta. Não aceitar chave que não seja `1`, `X` ou `2`.

Critério: visitante vê retorno e não debita. Logado envia 10 numa odd 1.37, o header cai 10, F5 mantém, a linha `stake` existe no ledger.

## 6. Carteira

Nova página `src/app/carteira/page.tsx` e `src/components/CarteiraScreen.tsx`. A aba deixa de apontar para `/#carteira`.

- [ ] Só com sessão. Sem sessão, porta de login.
- [ ] Saldo grande, vindo da soma do ledger.
- [ ] Bloco **Abertas**: frase, odd travada, valor, retorno possível, status.
- [ ] Bloco **Encerradas**: ganha, perdida ou anulada, com o retorno pago ou zero.
- [ ] Bloco **Extrato**: marco zero, stake, payout, reset, ajuste. Data em America/Sao_Paulo. Valor com sinal.
- [ ] Nenhum botão de depositar, sacar ou transferir.
- [ ] Toque numa aposta abre as pernas no próprio card (frase, odd, resultado da perna quando existir).
- [ ] Vazio: uma linha “Nenhuma aposta” no bloco, sem texto de tutorial.

Critério: a aposta do item 5 aparece em Abertas. F5 mantém.

## 7. Perfil

Nova página `src/app/perfil/page.tsx` e `src/components/PerfilScreen.tsx`. A aba deixa de apontar para `/#perfil`.

- [ ] Apelido, idade, cidade, time, camisa, short/calça. Mesmas regras do cadastro. Salvar grava no próprio `profiles` (policy de update já existe; colunas novas dependem do SQL).
- [ ] Iniciais no círculo accent. VIP com `avatar_url` mostra a foto. Sem VIP, sem upload.
- [ ] Sair em `#c4292e`, largura cheia, no pé.
- [ ] E-mail visível, sem edição nesta tela.
- [ ] Não mostrar saldo editável.

Critério: trocar a cidade, F5 mostra a cidade nova. Ranking passa a usar o apelido novo.

## 8. Início logado

Arquivos: `HomeScreen.tsx`, `src/app/page.tsx`.

- [ ] Faixa de jogos com o conserto do item 4.
- [ ] Ranking da home lê o banco, não array vazio eterno disfarçado de gente. Sem linhas: “Ninguém no ranking ainda”.
- [ ] Semanal, enquanto a terça não fechou: saldo atual de cada perfil (é o capital que o reset vai guardar).
- [ ] Mensal: soma de `month_capitals` do mês. Sem fechamento ainda: “Ninguém no ranking ainda”.
- [ ] Ligas da home leem `leagues` em que o usuário entra. Nenhuma: “Nenhuma liga”. Sem seta de ciclo em lista vazia.
- [ ] Odds da rodada continuam reais. Filtro Todos / Brasileirão / Estadual / Libertadores.

## 9. Ranking

Arquivo: `src/components/RankingScreen.tsx`.

- [ ] Semanal e mensal com a mesma regra do item 8. Apelido, não e-mail. A linha do usuário leva o selo Você.
- [ ] Card de posição só quando o usuário está na lista.
- [ ] Premiação de {mês} permanece: kit, item, Premiere ou Globoplay. Sem frase de frete.
- [ ] Ligas vazias: “Nenhuma liga” e “0 de 3”.
- [ ] Criar liga com `profiles.vip = false` abre o aviso de VIP que já existe. Não criar liga falsa na memória.
- [ ] A lista não inclui idade, cidade nem tamanho.

## 10. Ligas de verdade

- [ ] Criar, editar, encerrar e sair gravam em `leagues` e `league_members`. Só VIP cria. Máximo 3 memberships, checado no server.
- [ ] Foto obrigatória sobe para um bucket `league-photos` (público de leitura, escrita só pelo server). JPG, PNG, WEBP ou GIF, até 2 MB, proporção 0.6–1.7. Sem a coluna e o bucket, a UI de criar fica no aviso de VIP para quem não é VIP e, para um VIP de teste, mostra o erro curto se o storage não existir.
- [ ] `created_at` da liga é a época. Membros começam em 0. `standingsFromHistory` só soma evento com `at >= created_at`.
- [ ] Pública: outro logado entra por um botão Entrar na liga, até o `player_cap`.
- [ ] Privada: código de 6 caracteres na liga. Entrar pede o código. Sem código, a liga não aparece para quem está de fora.
- [ ] Anfitrião vê Administrar. Participante vê Sair em `#c4292e`. Encerrar liga também nesse vermelho.
- [ ] Prêmio por fora é texto opcional do anfitrião. A plataforma não paga.

Critério: dois usuários na mesma liga aparecem com 0. F5 mantém a liga. Um terceiro membership além de 3 é recusado.

## 11. Liquidação no apito

Rota de server `src/app/api/settle/route.ts`, protegida por um segredo `CRON_SECRET` no header. Sem o segredo, 401.

- [ ] Busca apostas `open`. Para cada `fixture_id`, consulta o placar gratuito.
- [ ] Só liquida quando o status do jogo é final. Ao vivo não paga e não perde. Essa escolha é provisória e fica anotada.
- [ ] Todas as pernas ganhas: `ledger.payout` = stake × odd combinada travada, `bets.status = won`.
- [ ] Alguma perna perdida: `lost`, sem payout.
- [ ] Jogo anulado ou adiado sem placar: `void` e devolve o stake (`ledger` positivo, kind `ajuste`).
- [ ] A odd da perna não muda com a cotação nova da tela.
- [ ] Vercel Cron, no `vercel.json`, a cada 10 minutos. Hobby aceita cron diário com folga; se o plano recusar `*/10`, deixar a rota pronta e um cron horário, e anotar.
- [ ] Log de falha no console do server. A carteira mostra o status novo.

Critério: uma aposta de teste com fixture já final (se houver no cache) muda para ganha ou perdida. Sem fixture final, a rota responde 200 e não mexe em aposta ao vivo.

## 12. Reset de terça

Rota `src/app/api/reset/route.ts`, mesmo `CRON_SECRET`.

- [ ] Hora: terça, 01h00, America/Sao_Paulo. No cron da Vercel isso é 04h00 UTC (`0 4 * * 2`), porque o relógio de Brasília está em UTC−3.
- [ ] Para cada perfil: capital da semana = saldo na hora do reset. Grava `weeks` + `week_capitals`. Soma em `month_capitals` do `monthKey`.
- [ ] `ledger` kind `reset` com o valor negativo do saldo (zera). Em seguida `marco_zero` com +50.
- [ ] Para cada liga ativa do usuário, um `league_capital_events` com esse capital e `at = now()`.
- [ ] `week_key` igual a `weekKey()` (`W43-2026`).
- [ ] Dá para chamar a rota na mão em dev, com o segredo, para ver o ranking mudar e o saldo voltar a 50.
- [ ] Não agendar um disparo acidental contra produção no meio da semana. O cron só na expressão de terça.

Critério: chamada manual num usuário com saldo 30 grava capital 30, deixa o saldo em 50 e o extrato mostra reset e marco zero.

## 13. Placar que sobrevive à Vercel

- [ ] A rodada também grava em `fixtures_cache` (id `round`, payload, `saved_at`). O arquivo `.data/round.json` pode continuar em dev. Em produção o disco some; a tabela não.
- [ ] Leitura: cache com menos de 12 h fora de jogo. Dentro de uma janela com jogo ao vivo, refrescar se o cache tiver mais de 10 minutos.
- [ ] Estaduais sem slug (Pernambucano, Goiano, Catarinense, Baiano, Cearense, Potiguar) continuam sem jogo inventado. O filtro Estadual pode ficar vazio em outubro.
- [ ] Não trazer a final de março quando o placar do estadual responde sem data.

## 14. Segurança mínima

- [ ] `SUPABASE_SECRET_KEY` só em `src/lib/supabase/admin.ts` (`server-only`).
- [ ] Visitante não lê ledger. Usuário A não lê ledger de B (policy já é `user_id = auth.uid()`). Conferir com dois tokens ou anotar o teste que não deu para rodar sem dois logins.
- [ ] Ranking não seleciona `age`, `city`, `shirt_size`, `bottom_size`.
- [ ] Enviar duas vezes seguidas o mesmo bilhete não cria duas apostas: o botão trava em Enviando, e o server recusa um segundo insert idêntico (mesmo usuário, mesmas pernas, mesmos centavos) nos 15 segundos seguintes.
- [ ] Headers básicos já podem ir no `next.config.ts` se não atrasar o resto: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`.

## 15. Auth no painel (bloqueio do fundador)

Se o cadastro não devolver sessão, o link do e-mail precisa destas URLs em Authentication → URL Configuration:

- Site URL: `https://betdobem.vercel.app`
- Redirect: `http://localhost:3000/**`
- Redirect: `https://betdobem.vercel.app/**`

Não dá para gravar isso daqui. Se o teste de cadastro parar no e-mail, anotar e seguir nos itens que não precisam de sessão nova.

## 16. Painel de administrador

Área só de quem tem `profiles.is_admin`. Fora da barra de baixo do apostador. Quem não é admin, em `/admin`, volta para `/`. O primeiro admin nasce por SQL, com o e-mail do fundador preenchido por ele. Não chutar e-mail.

Arquivo SQL: `next-app/supabase/migrations/20261023_admin.sql`.

### Acesso e casca

- [ ] `profiles.is_admin boolean not null default false`.
- [ ] `profiles.banned_at timestamptz`. `profiles.last_seen_at timestamptz`. `getAccount` atualiza `last_seen_at`. `placeBet` recusa banido.
- [ ] No fim do SQL, comentário com o update do primeiro admin: `update public.profiles set is_admin = true where id = (select id from auth.users where email = 'EMAIL_DO_FUNDADOR');`
- [ ] `getAccount` devolve `admin: boolean`.
- [ ] Rotas em `src/app/admin/`. Layout próprio: fundo `#0b0b0b`, barra lateral no desktop (Visão, Usuários, Times, Segmentos, Enquetes, Avisos, Auditoria), lista no celular. Logo pequena e link **Voltar ao app**. Sem a barra de apostas.
- [ ] No Perfil, só o admin vê o link **Painel**.
- [ ] Toda leitura e escrita do painel passa por server action que confere `is_admin` e usa `createAdminClient()`. A policy do apostador não abre ledger alheio, idade, cidade nem tamanho. O admin vê isso pelo server, não por um `select` liberado no browser.

### Visão

Página `/admin`. Números da hora, sem biblioteca nova de gráfico. Barras em CSS.

- [ ] Contas, contas novas em 7 dias, VIPs, banidos, ligas ativas.
- [ ] Apostas abertas, apostas nos últimos 7 dias, moedas apostadas nos últimos 7 dias (soma do stake), saldo médio.
- [ ] Simples contra múltipla (perna única contra duas ou mais).
- [ ] Funil: contas → apostou ao menos uma vez → apostou na semana corrente (`weekKey()`).
- [ ] Distribuição de saldo: 0, 1–49, 50, 51–100, mais de 100.
- [ ] Cadastros por dia, nos últimos 14 dias.

### Usuários

`/admin/usuarios` e `/admin/usuarios/[id]`.

- [ ] Tabela: apelido, e-mail, time, cidade, idade, VIP, saldo, apostas, desde. Busca por apelido ou e-mail. Filtro: VIP, banido, time, cidade.
- [ ] Ficha: cadastro completo (camisa e short inclusive), saldo, extrato, apostas com pernas, ligas, enquetes que respondeu, avisos recebidos.
- [ ] Comparar com quem torce para o mesmo time: saldo médio e acerto das pernas já liquidadas.
- [ ] Conceder VIP e retirar VIP. Não mexe no saldo. `vip_until` vazio significa até alguém retirar.
- [ ] Ajuste de moedas: valor com sinal e motivo obrigatório. Grava `ledger.kind = ajuste` e uma linha em `admin_actions`. O saldo continua sendo a soma do ledger.
- [ ] Banir e reativar. Banido não envia aposta e, ao abrir o app, vê uma linha na porta: “Conta suspensa.” Sem tutorial.
- [ ] Não apagar perfil nem ledger.

### Times

`/admin/times`.

- [ ] Uma linha por `favorite_team`, mais “Outro” e “sem time”.
- [ ] Colunas: torcedores, apostas em que a seleção é vitória daquele time, stake médio dessas pernas, acerto entre as já liquidadas.
- [ ] Daqui para a frente, `bet_legs` guarda `competition` (Brasileirão, Paulista, Libertadores, …) para o corte por campeonato. Perna antiga fica sem esse corte.
- [ ] Toque no time abre a lista de torcedores, que leva na ficha do usuário.

### Segmentos

`/admin/segmentos`. Tabela `segments`: `id`, `name`, `filter jsonb`, `created_by`, `created_at`.

O filtro combina, todos opcionais:

- time
- cidade contém
- idade mínima e máxima
- VIP sim ou não
- banido sim ou não
- apostou nos últimos N dias, ou nunca apostou
- saldo mínimo e máximo
- membro de alguma liga

- [ ] Ao montar, mostrar a contagem antes de salvar.
- [ ] Segmento salvo pode ser reusado em enquete e em aviso.
- [ ] “Todos” não é um segmento: é a opção explícita na hora de enviar.

### Enquetes

Tabelas `polls`, `poll_options`, `poll_votes` (único por `poll_id, user_id`).

- [ ] Criar: pergunta, 2 a 6 opções, segmento ou todos, encerra em data e hora de São Paulo.
- [ ] Quem está no segmento e ainda não votou vê o card no Início, abaixo da faixa de jogos. Um toque na opção grava o voto. Acabou o prazo, o card some.
- [ ] Visitante não vê enquete.
- [ ] No painel: abertas e encerradas, contagem e percentual por opção, e o segmento usado.
- [ ] Não editar opção depois que existir voto. Dá para encerrar antes da data.

### Avisos

Tabelas `notices` (`id`, `title`, `body`, `segment_id` nulo = todos, `created_by`, `created_at`) e `notice_recipients` (`notice_id`, `user_id`, `read_at`).

- [ ] Escrever título e texto, escolher segmento ou todos, enviar. Cada destinatário ganha uma linha.
- [ ] No app logado, sino no header com a contagem não lida. A lista abre em `/avisos`: título, texto, hora. Abrir marca como lida.
- [ ] Sem notificação do sistema operacional.
- [ ] No painel: histórico com enviados e lidos.

### Auditoria

Tabela `admin_actions`: `id`, `admin_id`, `action` (`vip_on`, `vip_off`, `ajuste`, `ban`, `unban`, `poll`, `notice`), `target_user_id`, `payload jsonb`, `created_at`.

- [ ] Toda ação de VIP, ajuste, banimento, enquete e aviso grava uma linha.
- [ ] `/admin/auditoria` lista as últimas 100: quem fez, o quê, em quem, quando.
- [ ] Apostador não lê essa tabela.

Critério: um admin concede VIP e o usuário passa a poder criar liga, com o mesmo saldo de antes. Um aviso para o segmento de um time aparece só para quem marcou esse time. Ajuste de +10 aparece no extrato da carteira e na auditoria. Conta comum em `/admin` volta para a home.

## 17. Fechamento

- [ ] `npm` typecheck limpo (`node .\node_modules\typescript\bin\tsc --noEmit`).
- [ ] Browser, nesta ordem: porta de login, Ver jogos, slip de visitante, URL `/ranking` barrada, login, Início no primeiro jogo, enviar aposta, carteira, perfil, ranking vazio ou com o próprio apelido, Sair, voltar à porta.
- [ ] Com o admin marcado: Visão com números reais, ficha de um usuário, VIP concedido sem mudar o saldo, segmento de um time, enquete só para esse time, aviso só para esse time, linha na auditoria. Conta comum em `/admin` volta para a home.
- [ ] Celular (largura ~390) na porta, no carrossel e no bilhete.
- [ ] Commit e push do que estiver verde. Não incluir `.env.local` nem `.data`.
- [ ] Atualizar o relatório abaixo.

## Relatório (preencher ao terminar)

- No ar: o app local sobe em `http://localhost:3000`. O push vai para `main` e a Vercel publica em `https://betdobem.vercel.app`. A conta `wellerson.lima96@gmail.com` já existe e entra no painel pelo e-mail, sem depender da coluna `is_admin`.
- Commit: ver o hash no git depois deste fechamento.
- SQL que o fundador ainda precisa colar: `next-app/supabase/migrations/20261023_profile.sql` (apelido, idade, cidade, time, short, `is_admin`, `banned_at`, `competition` nas pernas, e o update de admin do e-mail). Sem esse SQL o app segue: o apelido fica no metadata do Auth e o painel usa a lista de e-mails.
- Redirect URLs: pendente. Site URL `https://betdobem.vercel.app`, redirects `http://localhost:3000/**` e `https://betdobem.vercel.app/**`. O cadastro não depende disso. O “Esqueci a senha” só entrega o link depois desses redirects.
- `CRON_SECRET` está no `.env.local` e ainda não na Vercel. Sem ele, `/api/settle` e `/api/reset` respondem 401. O reset não foi disparado.
- O que ficou de fora de propósito: preço VIP, Stripe, frete, texto jurídico, afiliados, push do sistema, divisões Bronze/Prata/Ouro, apagar usuário, impersonação. Enquetes, segmentos, avisos e banimento ficam num JSON privado no Storage (`admin-data` / `board.json`) enquanto as tabelas SQL não existem.
- Conferido no browser: porta de login, Ver jogos com menu só de Jogos, bilhete de visitante, `/ranking` sem sessão volta para a porta, cadastro com os campos novos, saldo 50, carteira com marco zero, perfil preenchido, ranking com apelido, aviso vazio, conta comum em `/admin` volta para o início. O primeiro card da faixa, em 390px, é o Cruzeiro. O clique de odd no browser do Cursor quebra por um atributo `data-cursor-ref` que o próprio browser injeta; no primeiro acesso a Jogos a seleção e o bilhete funcionaram. A conta de teste usada nessa conferência foi apagada em seguida.
