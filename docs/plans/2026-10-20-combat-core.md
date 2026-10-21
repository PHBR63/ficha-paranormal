# Núcleo de combate e economia de ações — Livro Base v1.3

## Escopo e decisões

- O Livro Base v1.3 é a única fonte de regras. O 20 natural personalizado da mesa permanece.
- Combate de campanhas v2 é confirmado e sincronizado pelo servidor. O painel legado v1 continua manual e deve dizer claramente que seus PV, condições e turnos locais não atualizam fichas nem outros dispositivos.
- Fora de controle ativo de turnos, registrar gastos sem inventar rodadas; a mesa confirma a economia de ações.
- Reação e ação preparada são distintas de ação comum. Nunca liberar ataque ou ritual fora do turno apenas porque o cliente declarou uma reação.

## Critérios de aceite por fase

### 1. Identidade e orçamento do turno

`get_character_pe_budget` deve distinguir instâncias de turno do mesmo ator na mesma rodada, preservar o gasto da instância corrente durante a migração e manter recibos antigos recuperáveis. O limite de Ataque Furtivo permanece por rodada, não por turno. Testar turno A → outro ator → novo turno A na mesma rodada, com gasto compartilhado entre ritual/ataque no primeiro turno e zerado no segundo.

Arquivos: nova migration em `supabase/migrations/`; `supabase/tests/ritual_pe_turn_budget.sql` e teste dedicado. Risco alto: chave antiga aparece em registros de manutenção, Sangrando e Mirar.

### 2. Ação comum, reação e ação preparada

Uma ação comum fora do turno controlado deve falhar sem PE, PV ou histórico. Reações oficiais e ações preparadas exigem contexto e confirmação do servidor, com limite e recibo próprios. Ataque, ritual, Paramédico e Equipe de Trauma consomem um livro compartilhado de ações padrão; ações extras do mestre entram no mesmo livro. Uma ação completa consome o orçamento correspondente. Fora de turnos controlados, a mesa confirma.

Arquivos: migrations de ataque/ritual/ações, serviços e modais desktop/mobile, testes SQL e de interface. Risco alto: compatibilidade com ações médicas existentes e rituais de reação.

### 3. Dano e crítico

Multiplicar apenas os dados de dano da arma. Golpe Pesado, Máquina de Matar, Calibre Grosso e a rajada aprovada entram nesses dados; Ataque Furtivo, Amaldiçoar Arma, munição Explosiva e outros danos adicionais não multiplicam. Bônus fixos permanecem fixos. Fórmula, dados rolados e histórico devem coincidir em desktop e mobile. Dano só pode ser aplicado após confirmação e com redução/resistência declarada visível.

Arquivos: `src/components/character/CombatRollModal.tsx`, `src/components/character/mobile/MobileCombatRollModal.tsx`, `src/lib/rules-engine/helpers/damage-formula-parser.ts`, testes de fórmula e fluxos. Risco médio/alto: origens de dados extras atualmente misturadas.

### 4. Estado de combate e condições

Na v2, PV e condições exibidos no tracker devem acompanhar a ficha confirmada e reagir à reconexão. Sangrando, Em Chamas e demais efeitos de início de turno não podem duplicar aplicação. Reações especiais e testes opostos mostram claramente o que o sistema confirmou e o que ficou para a mesa. Na v1, o painel avisa que é manual/local e não afirma salvamento nas fichas.

Arquivos: `src/components/campaign/v3/master/CombatTracker.tsx`, `src/components/combat/CombatTracker.tsx`, hooks de campanha/condições, testes de sincronização. Risco médio.

### 5. Regressão e publicação

Executar tipos, testes focados e gerais, build, testes SQL em transações revertidas, revisão das permissões e teste autenticado no site publicado. Verificar duas contas, dois dispositivos, mobile/desktop, reconexão, campanha v1 manual e v2 sincronizada. Atualizar `/rules` apenas conforme o comportamento comprovado.

## Ordem de execução

Implementar uma fase por vez com teste que reproduz a falha antes da correção; integrar apenas após confirmação local, banco e interface. Não alterar fichas reais fora dos personagens QA. Não converter adjudicações de mapa, alvo, cobertura ou distância em fatos automáticos sem fonte observável.

## Estado desta rodada — 21/10/2026

Concluído localmente e no banco QA:

- Orçamento de PE identifica a instância do turno; ataque, ritual e ação padrão médica compartilham o slot do servidor.
- Dano crítico multiplica somente dados da arma; dados adicionais e bônus fixos ficam separados. Desktop e mobile usam a mesma regra.
- Campanhas v2 declaram alvo e arma antes da rolagem; o mestre confirma Bloqueio, Esquiva ou nenhuma defesa antes dos dados. O servidor vincula a escolha ao ataque, aplica PV uma vez, registra as duas fichas e mantém a regra personalizada do 20 natural.
- Dano em área v2 aplica vários alvos atomicamente, com reduções declaradas por alvo. PV e condições derivadas são salvos juntos, e os históricos mostram suas mudanças.
- Ação preparada v2 registra ação padrão, gatilho, expiração e reposicionamento da iniciativa. Confirmar o gatilho não executa ataque, ritual, dano nem custo de PE; esses efeitos ainda exigem resolução manual da mesa.
- Em Chamas e cada fonte de veneno têm trava por ficha/turno; reenvio não repete dano. Fora de turno controlado, não se inventa turno.
- Campanha v1 permanece manual/local e é identificada assim no painel.

Pendente antes de chamar o lote de publicado: merge, aplicação ordenada das migrations no banco do projeto, deploy e teste autenticado. Contra-ataque após erro e execução dos efeitos preparados permanecem manuais. Outras condições, manobras, dano não letal/massivo, cobertura e efeitos de começo de turno devem continuar marcados parciais até terem automação e testes próprios.
