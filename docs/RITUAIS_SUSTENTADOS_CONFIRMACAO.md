# Rituais sustentados: confirmação e recibo

## Regra e escopo

Decisão do usuário: mostrar custo e efeitos, cobrar somente depois de confirmação explícita. Livro Base v1.3 fornecido, página impressa 120 (PDF 130): 1 PE no início do turno, ação livre. Fluxo de Poder, página impressa 33 (PDF 43): dois efeitos simultâneos, custo separado, requisito NEX 60.

Esta entrega confirma manualmente cada manutenção. Não avança iniciativa, não identifica automaticamente um turno da campanha e não automatiza perda de concentração ou encerramento por falta de manutenção. A repetição do mesmo UUID recupera o recibo; uma confirmação nova é uma nova manutenção manual. O usuário deve confirmar apenas uma vez por turno. Não habilita suplementos nem altera o 20 natural personalizado ou descanso.

Sustentações novas recebem prova privada do conjurador quando a RPC existente grava a aplicação. Legados não são atribuídos retroativamente. Se a ficha recebe efeito de outro conjurador, sua manutenção permanece manual: não se cobra PE do alvo. O limite normal de um efeito, ou dois com Fluxo e NEX 60, é validado na manutenção. Esta entrega não bloqueia todas as ativações legadas; excesso exige revisão/encerramento.

## Arquivos e comunicação

| Arquivo | Papel, entradas e saídas |
|---|---|
| `src/pages/CharacterSheet.tsx` | Ficha desktop usa estado do hook, PE e recarga da ficha; encaminha ao controle comum. |
| `src/components/character/MobileCharacterSheet.tsx` | Ficha mobile usa o mesmo controle; encerra de verdade em lugar de apenas recarregar. |
| `src/components/character/SustainedRitualControl.tsx` | Recebe ficha, PE, estado e callback de recarga. Mostra seleção, custo, efeito do catálogo e confirmação. Congela UUID/snapshot, chama serviço, só anuncia sucesso após recibo confirmado. |
| `src/components/character/SustainedRitualsPanel.tsx` | Cartões desktop continuam exibindo bônus e tooltips; ação renomeada para Encerrar todos. |
| `src/components/character/mobile/MobileSustainedRitualsPanel.tsx` | Cartões mobile conservam swipe e efeitos; botão de expansão separado da ação de encerramento, sem botões aninhados. |
| `src/hooks/useSustainedRituals.ts` | Leitura canônica via serviço, origem protegida, erro visível, isolamento entre fichas/contas, recuperação por eventos e reconexão. Remove métodos diretos sem consumidores que engoliam erros. |
| `src/services/sustained-ritual-service.ts` | Valida identidade/PE, chama duas RPCs autenticadas pelo cliente atual. Rejeita recibo de outra ficha ou pendente, distingue rollback SQL e resposta incerta. |
| `src/services/character-activity-service.ts` | Tipagem das novas RPCs reutiliza timeout, cliente autenticado e tratamento de erros existentes. |
| `src/lib/character-activity-presentation.ts` | Histórico apresenta manutenção/encerramento, nomes, custo e saldo anterior/posterior. |
| `supabase/migrations/20261007010000_sustained_ritual_confirmation.sql` | Prova privada, trigger e RPCs autorizadas por vínculo real. Manutenção modifica PE e contadores em transação; encerramento remove somente instâncias ativas e efeitos comprovados, mantendo snapshots no histórico. |
| `supabase/tests/sustained_ritual_confirmation.sql` | Executa funções reais com fixtures e rollback: CAS, retry, custo canônico, Fluxo, insuficiência, alvo, legado e permissões. |
| `src/components/character/__tests__/sustained-ritual-control.test.tsx` | Confirmação/cancelamento, resposta pendente, retry estável, encerramento mobile e erros visíveis. |
| `src/hooks/__tests__/useSustainedRituals.test.tsx` | Erro não apaga efeitos, reconexão e resposta antiga não invade outra ficha. |
| `src/services/__tests__/sustained-ritual-service.test.ts` | Contrato das RPCs, validações e recibos. |
| Este documento | Fonte, fluxo, impacto, limites e aceitação. |

Fluxo: tela → controle → serviço → RPC → `characters` + `character_sustained_rituals` + `character_activity_events` → recibo → recarga/histórico. A prova privada `sustained_ritual_origins` relaciona registro ativo, evento da conjuração e ficha do conjurador. A conta autenticada não lê/escreve diretamente nessa tabela. Consulta e ação aplicam a autorização existente para proprietário ou mestre com vínculo real.

Manter usa custo canônico, PE esperado e snapshot ordenado do estado. Bloqueia a ficha antes das linhas e usa UUID/hash para repetição. Encerrar também exige snapshot; Encerrar todos rejeita lista incompleta. Erro de transporte mantém o pedido em memória para recuperar o mesmo recibo. Não é fila durável após fechar/recarregar a página.

## Efeitos e dados existentes

Encerrar elimina o registro ativo, cuja prova privada acompanha o ciclo de vida. Não elimina eventos históricos. Bônus/condições com duração sustentada são retirados apenas quando associados à mesma conjuração por recibo confirmado e ainda reconhecidos no estado. Metadados personalizados, legados, Morrendo e Enlouquecendo são conservados. Efeitos sem vínculo comprovado exigem conferência manual. Campos nulos legados não são normalizados pelo encerramento. Nenhuma migração atribui autoria ou cobra PE retroativamente.

## Validação

- Tipos completos, testes de UI/hook/serviço, regressão e build.
- PostgreSQL local usando autorização e migrações reais, sem fichas de produção.
- UAT publicado em ficha QA: cancelar mantém PE; confirmar desconta uma vez; recarregar mantém contadores; mobile encerra; histórico mostra saldo; condição personalizada sobrevive. Restaurar PE e preparação da ficha QA ao terminar.
- Há somente uma conta real. Papéis de contas diferentes são exercitados no banco local, sem declarar UAT com dois usuários reais.
