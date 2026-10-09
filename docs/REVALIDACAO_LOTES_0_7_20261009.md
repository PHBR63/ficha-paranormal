# Revalidação dos lotes 0–7 — 09/10/2026

## Escopo e resultado

Auditoria da entrega original de interface, histórico, efeitos e sincronização. O Livro Base v1.3 continua como referência, com as decisões anteriores de 20 natural personalizado, descanso e confirmação explícita de gastos. Este documento não certifica a automatização integral do livro.

As implementações anteriores foram confrontadas com o código atual, regressão automatizada, banco ativo e interface publicada. Foram encontrados e corrigidos quatro problemas adicionais: erro tardio de ocultação em outra ficha/conta; aviso tardio de rolagem em outra ficha; leitura malsucedida apresentada como falha de uma ocultação já confirmada; registros do histórico sem altura em tela pequena. Também foi corrigida a indicação permanente de margem de Disparo Letal no resumo da ficha.

## Matriz das entregas

| Ordem | Evidência atual | Limite da conclusão |
| --- | --- | --- |
| 0 | Banco ativo; RLS habilitado; 22 políticas restritivas contra acesso anônimo; campanhas v1/v2 e sessões homônimas separadas nos testes SQL. | Banco e aplicação web são verificados separadamente. |
| 1 | Regressão de troca de ficha/conta durante requisição; erro e fila permanecem na origem; confirmação de escrita separada da atualização da leitura. | Falhas de rede são reproduzidas nos testes, sem interromper a conexão de jogadores reais. |
| 2 | Histórico usa uma região rolável para filtros, avisos e registros; cabeçalho reserva espaço para fechar. Corte anterior comprovado em 320 × 568. | Conferência publicada registrada após a publicação, abaixo. |
| 3 | Origens de bônus cobertas pelos testes de rolagens; condições externas preservadas nos testes de efeitos; Disparo Letal descrito como ativável, sem margem permanente no resumo; Intelecto em português. | Requisitos situacionais e poderes parcialmente manuais continuam identificados na página de regras. |
| 4 | Histórico por ficha no servidor; filtros de tipo, período e sessão; paginação, ocultação recuperável e fila após falha/reconexão cobertos por testes. | Ocultar não exclui registros. Histórico antigo sem identificação continua separado. |
| 5 | Aplicação real, autoria, permissões, repetição idempotente, duplicação de efeito, recursos e sustentação validados no banco. | Asserções usam fichas sintéticas e transações revertidas. |
| 6 | Publicação realtime contém fichas, campanhas v1/v2, combate v2, eventos e visibilidade; cliente invalida cache por ficha e escopo. | Teste de duas abas usa a mesma identidade; não equivale a dois jogadores reais. |
| 7 | Tipos, compilação, lint dos arquivos alterados e regressão executados; merge e publicação exigem confirmação independente. | Conferência e identificação da publicação são registradas abaixo. |

## Arquivos e comunicação

### Código de produção

- `src/hooks/character/useCharacterActivity.ts`: recebe identidade, ficha e contexto de campanha. Usa os serviços de atividade, cache do React Query, armazenamento da fila e notificações. É consumido pela ficha e pelo painel de histórico. As respostas tardias só alteram avisos do escopo original. A escrita de visibilidade confirmada não é invalidada por uma falha posterior de leitura.
- `src/components/character/CharacterActivityPanel.tsx`: recebe atividade, filtros e callbacks do hook. Exibe registros, pendências, erros e ações. Filtros, avisos e eventos compartilham uma região rolável identificada e acessível por teclado; o cabeçalho permanece separado.
- `src/components/character/CharacterSheetHelp.tsx`: recebe estado aberto, contexto da ficha e callback de fechamento. O botão de fechar passa a ter nome acessível, permitindo identificação por leitor de tela e automação.
- `src/lib/class-powers/track-effects-engine.ts`: recebe trilha, NEX e contexto; usa o registro de habilidades e retorna totais e descrições para `useClassPowerBonuses`, consumido pelo resumo da ficha. Crítico ativável fica no detalhamento, sem somar em bônus permanentes; sua ativação real continua no fluxo de ataque com confirmação de PE. O nome do atributo de dano é traduzido.

### Testes

- `src/hooks/character/__tests__/useCharacterActivity.test.tsx`: três regressões para resposta tardia de ocultação, resposta tardia de rolagem e falha de leitura após escrita confirmada.
- `src/lib/class-powers/__tests__/track-effects-engine.vitest.ts`: Disparo Letal disponível sem margem automática; custo e descrição visíveis; crítico passivo do Guerreiro preservado; atributo em português.
- `supabase/tests/character_activity.sql`: histórico, autoria, repetição, efeitos e preservação de condição externa; fixture atualizada para o contrato de custo do Paranormal.
- `supabase/tests/character_activity_filters.sql`: filtros, paginação e isolamento de sessão v1/v2; aplicação vinculada à campanha correta.
- `supabase/tests/character_activity_session_privacy.sql`: bloqueio de aplicação entre campanhas e privacidade de evento legado sintético. A inserção privilegiada ocorre somente na fixture transacional, para reproduzir dados históricos; o RPC atual continua bloqueado.
- `supabase/tests/ritual_weapon_sustain.sql`: bônus de arma, sustentação, repetição e dados externos preservados; fixture atualizada para custo do Paranormal.

Nenhuma migration, dependência ou alteração de credencial. Dados de teste SQL são revertidos por `ROLLBACK`.

### Fluxo

Tela → hook de atividade → serviço/RPC autenticado → evento no banco → cache por ficha → painel. Evento realtime invalida a leitura correspondente. A fila de tentativa pertence à combinação conta/ficha. Ocultação modifica visibilidade; não elimina o evento.

Trilha e NEX → registro de habilidades → resumo de efeitos → painel de poderes. O resumo informa possibilidades condicionais; o ataque confirma sua ativação e gasto antes de registrar sucesso.

## Validação

- Regressão inicial: **3.345 testes em 151 arquivos aprovados**.
- Verificação focada após correção do resumo: **92 testes aprovados**.
- Verificação final completa da lógica: **3.346 testes em 151 arquivos aprovados**.
- Tipos e compilação: aprovados após a correção do resumo de bônus; o rótulo de fechamento da ajuda é uma alteração adicional de acessibilidade.
- Lint dos cinco arquivos TypeScript de lógica alterados: **0 erros e 0 avisos**.
- Ajuda: **0 erros e 2 avisos preexistentes** sobre exportação de constantes; o rótulo não altera essas exportações.
- Dez suites SQL aprovadas no banco ativo: atividade, filtros, privacidade de sessão, ações do mestre, recursos agrupados, entrada por convite, perfil v2, bônus/sustentação de arma, proteções anônimas e combate v2.
- As suites usam identidades de papéis distintos no banco, mas isso não é uma nova sessão de navegador com outra conta.
- Corte publicado anterior: região de registros com altura zero em 320 × 568, enquanto os controles ocupavam mais que a altura do painel.
- Conferência das quatro famílias de IDs reservados para as fixtures alteradas: **zero fichas residuais** após `ROLLBACK`.

## Publicação e conferência de interface

Esta revisão registra a validação técnica anterior ao merge. A confirmação de publicação e os testes na versão publicada são entregues em relatório separado após o merge. Não considerar o sucesso da compilação local como prova de publicação.

## Como reproduzir

1. Abrir o histórico em 320 × 568 e rolar até os registros; filtros e fechar devem continuar alcançáveis.
2. Filtrar rolagens e efeitos, atualizar e recarregar; dados continuam na ficha correta.
3. Ocultar registros, confirmar estado vazio e recuperar; os eventos reaparecem sem duplicação.
4. Abrir duas abas da mesma ficha e alterar a visibilidade em uma; a outra deve receber a atualização sem recarregar.
5. Conferir Atirador de Elite NEX 40: Disparo Letal deve mostrar condição/custo, sem +2 permanente; a margem na rolagem depende da ativação escolhida.
6. Executar as suites automatizadas e SQL para falhas de rede, troca de conta/ficha, repetição de pedidos e acesso negado.

## Pendências fora da certificação deste lote

A página de regras mantém efeitos parciais/manuais. A conclusão desta auditoria não transforma esses efeitos em automatizações completas. A execução de mesa com duas contas físicas distintas e a automatização de requisitos situacionais de todos os poderes continuam etapas próprias.

**Decisão do usuário:** nenhuma regra nova foi assumida neste lote.
