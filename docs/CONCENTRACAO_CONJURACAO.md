# Concentração na conjuração — Livro Base v1.3

## Comportamento

Desktop e mobile permitem declarar situação normal, ruim ou terrível e um evento de dano ocorrido durante a execução. Confirmar conjuração rola Vontade usando Presença, treinamento, bônus atuais do SUE e modificadores atuais de dados. Situação ruim exige DT 15 + PE efetivamente cobrados; terrível exige DT 20 + PE; dano exige teste separado com DT igual ao dano informado. O 20 natural continua sem sucesso automático, conforme a regra personalizada aprovada.

O servidor valida dados, pool e soma dos bônus, calcula DT e sucesso, debita PE e grava o resultado na mesma transação. Falha consome PE, encerra a preparação sem abrir aplicação de efeitos e bloqueia a operação de efeitos também no servidor. Cancelar a preparação antes de confirmar não rola nem consome recursos.

Repetir uma confirmação após resposta perdida usa o mesmo pedido, identificador e rolagem. O histórico por ficha mostra dados, valor escolhido, bônus e suas categorias, DT, sucesso/falha e saldo de PE. Nenhum histórico é apagado por esta alteração.

## Arquivos e comunicação

| Arquivo | Responsabilidade, entradas e saída |
| --- | --- |
| `src/components/character/CastingConcentrationForm.tsx` | Recebe contexto, custo, trava e callback dos dois modais; devolve contexto validável, sem persistir ou rolar. |
| `src/components/character/RitualCastModal.tsx` e `mobile/MobileRitualCastModal.tsx` | Recebem ficha/custo e enviam contexto ao callback da ficha; resultado confirmado com efeitos proibidos impede wizard e animação de sucesso. |
| `src/lib/rituals/casting-concentration.ts` | Reutiliza treinamento, resumo SUE, penalidades e pool existente; transforma contexto e bônus em testes com dados. |
| `src/lib/rituals/casting-concentration-result.ts` | Lê recibo confirmado e retorna mensagem de falha com PE consumidos. |
| `src/pages/CharacterSheet.tsx` e `src/components/character/MobileCharacterSheet.tsx` | Obtêm bônus atuais, preparam testes, atualizam PE pelo recibo e notificam falha ou seguem o fluxo existente. |
| `src/hooks/character/useRitualConfirmation.ts` | Trava cliques simultâneos e preserva callbacks da tentativa original até confirmação. |
| `src/hooks/character/useRitualApplication.ts` | Congela payload e operação, persiste pelo serviço e recusa aplicação local de conjuração falhada. |
| `src/services/ritual-application-service.ts` | Envia RPC autenticada com timeout e valida identidade, resultado e saldo do recibo. |
| `src/services/character-activity-service.ts` | Traduz erro de bloqueio do servidor em mensagem compreensível. |
| `src/lib/character-activity-presentation.ts` e `CharacterActivityPanel.tsx` | Apresentam os testes e o estado de falha nos históricos desktop/mobile. |
| `supabase/migrations/20261007110000_casting_concentration.sql` | Envolve RPCs existentes, preservando assinatura, autorização e idempotência; grava resolução em `character_activity_events.payload` e bloqueia efeitos falhados. Funções internas não são executáveis por clientes. |
| Testes em `src/lib/rituals/__tests__`, `src/hooks/character/__tests__`, `src/components/character/__tests__` e `supabase/tests/casting_concentration.sql` | Exercitam cálculo, modais, repetição, saldo, recibos, bloqueio e compatibilidade. |

Fluxo: formulário → modal → ficha → cálculo de Vontade → hook → serviço → RPC → saldo/atividade no banco → recibo → aviso e histórico ou aplicação existente de efeitos. As RPCs continuam usando sessão autenticada do Supabase; não são introduzidas credenciais ou novas dependências.

## Limites e compatibilidade

- Situação é declarada pelo usuário com orientação do mestre: equipamento, condições e cenário ainda não selecionam automaticamente a gravidade.
- Este formulário cobre um evento de dano; não detecta reações ou dano contínuo automaticamente e não desconta PV novamente.
- Bônus ativos são calculados no cliente pelo motor existente. O servidor valida a aritmética recebida, mas não reconstrói todo o SUE nem certifica o sorteio. Não apresentar isso como proteção completa contra adulteração de cliente.
- Poderes opcionais que requerem ativação para Vontade não são ativados nem cobrados automaticamente.
- Clientes antigos sem o campo de concentração preservam o comportamento anterior. Esta migration não torna obrigatória a declaração em todo cliente nem altera registros antigos.
- Não há estorno automático e nenhuma cobrança de manutenção é introduzida aqui.

## Verificação

1. Preparar ritual com situação ruim/terrível: conferir DT pelo custo final. Cancelar e verificar saldo intacto.
2. Informar dano negativo/fracionário: confirmar deve ficar bloqueado.
3. Conjurar com teste: conferir dados e bônus no histórico. Falha deve consumir PE uma vez e impedir efeitos.
4. Simular resposta perdida e repetir: mesmo identificador, dados e custo; nenhuma segunda cobrança.
5. Rodar tipos, regressão, build e teste SQL isolado. No SQL, conferir rejeição de total forjado, natural 20 abaixo da DT, menor dado com atributo zero e bloqueio de efeitos da falha.
6. Após publicação, validar ficha de QA nos dois tamanhos e restaurar recursos/preparação usados no ensaio, preservando histórico de teste.
