# Lote 1 — regras do Livro Base v1.3

## 1. Resumo

Corrigidos catálogo de Paradoxo, tabela de Confuso, confirmação dos requisitos da conjuração, Custo do Paranormal com SAN persistida, idade obrigatória para Cicatrização, identidade de manutenção por turno e contrato de recursos temporários. Mantidas as regras de mesa aprovadas para 20 natural e descanso.

O lote corrige as falhas identificadas; não certifica a automação de todas as regras do livro. O mapa `/rules` apresenta os limites e distingue resoluções automáticas de conferências do mestre.

## 2. Arquivos e responsabilidades

- `src/lib/rituals/first-circle.ts` e `second-circle.ts`: dados do catálogo; Paradoxo e formas corrigidos; Manancial Verdadeiro não herda rolagem adicional de PV temporários.
- `src/lib/rituals/paranormal-cost.ts`: produz teste de Ocultismo com Intelecto, treinamento e bônus atuais, ou declaração de Medo sem rolagem. Usa pool/treinamento/condições já existentes.
- `src/lib/rituals/casting-concentration.ts`: valida confirmação material antes da preparação; mantém Vontade separada de Ocultismo.
- `src/lib/rituals/ritual-adapter.ts` e `legacy-exports.ts`: transportam avisos e remoção explícita de efeito para os componentes legados.
- `src/lib/conditions/base-condition-rules.ts` e `condition-definitions.ts`: centralizam a tabela e encerramento corretos de Confuso.
- `src/lib/rules/condition-turn.ts`: prepara resultado de Confuso, preservando condições desconhecidas; usado pelo resolvedor de turno.
- `src/lib/rules/base-rule-coverage.ts`: descreve a cobertura efetiva, usada pela página de regras.
- `src/lib/class-powers/base-power-reference.ts` e `power-registry.ts`: normalizam referência oficial quando comprovada e sinalizam conferência individual pendente.
- `src/lib/class-powers/combatente-powers.ts`, `especialista-powers.ts`, `ocultista-powers.ts`, `track-combatente.ts`, `track-especialista.ts`, `track-ocultista.ts`: corrigem referências de seção sem mudar IDs ou poderes das fichas existentes.
- `src/lib/catalogs/cursed-items.ts`: deixa explícita a origem não certificada do catálogo legado, sem afirmar que pertence ao livro ou a um suplemento.
- `src/components/character/AbilityDetailModal.tsx` e `PowerDetailModal.tsx`: mostram referência e aviso de conferência nos detalhes.
- `src/components/character/CastingConcentrationForm.tsx`: recebe contexto/custo e devolve a confirmação explícita de requisitos ao modal de conjuração.
- `src/components/character/ConditionTurnResolver.tsx`: permite gravar resultados informativos de Confuso mesmo sem mudança de recursos.
- `src/components/character/RitualEffectWizard.tsx` e `mobile/MobileRitualEffectWizard.tsx`: mostram avisos da forma selecionada; o resumo mobile inclui bônus fixo de PV temporários.
- `src/components/character/SustainedRitualControl.tsx`: usa o serviço de sustentação; confirma turno manual e manutenção em operações separadas.
- `src/components/character/TemporaryResourcesPanel.tsx`: mostra saldo e fontes, restrições de dano e duração; prepara concessão/encerramento conferidos com o mestre.
- `src/pages/CharacterSheet.tsx` e `src/components/character/MobileCharacterSheet.tsx`: integram custo, recursos temporários e tipo de dano no fluxo desktop/mobile; usam os hooks de aplicação e os serviços existentes.
- `src/hooks/character/useRitualApplication.ts`: conserva UUID e snapshot por tentativa; consulta idade do alvo; conserva tipo de dano informado para proteção temporária restrita.
- `src/hooks/character/useTemporaryResources.ts`: lê saldo por ficha, atualiza por evento e recupera após reconexão.
- `src/services/character-activity-service.ts`: define contratos tipados das operações novas no cliente Supabase.
- `src/services/ritual-application-service.ts`: exige confirmação do custo e concilia consumo de PE normal/temporário no recibo.
- `src/services/sustained-ritual-service.ts`: consulta identidade de turno, confirma início manual e manutenção; distingue rollback SQL de resposta incerta.
- `src/services/temporary-resource-service.ts`: valida concessões e encerramentos e exige recibos confirmados da ficha correta.
- `src/lib/character-activity-presentation.ts`: transforma recibos em texto, incluindo SAN, idade, turno, Confuso e consumo temporário.

### Banco

- `20261007160000_paranormal_cost_and_aging.sql`: tabela protegida de perdas permanentes de SAN; confirmação transacional de PE/SAN; cura e idade de Cicatrização na mesma operação. Exige idade cadastrada, conforme decisão do usuário.
- `20261007170000_sustained_turn_identity.sql`: contador manual por ficha e comprovante único por ritual/turno; usa turno v2 quando ativo. O início manual não cobra PE.
- `20261007180000_temporary_resource_contract.sql`: reservatórios separados dos máximos com fonte, saldo, tipos de dano autorizados e vínculo de cena quando comprovado; confirma concessão/encerramento; expira fontes de cena v2.
- `20261007181000_temporary_resource_consumption.sql`: consome temporários antes dos recursos normais nas operações suportadas; Sangrando continua perda de PV; Tela de Ruído exige tipo físico informado.

As novas tabelas não permitem escrita direta por `anon`/`authenticated`. Funções públicas autorizam a ficha e o contexto; auxiliares internos não ficam expostos. Não há substituição de fichas nem exclusão de históricos existentes. A instalação não aplica perdas retroativas de SAN ou envelhecimento a conjurações antigas.

### Testes

- `src/lib/rituals/__tests__/lot-one-rules.test.ts`: Paradoxo, Manancial, Confuso e Ocultismo.
- `src/lib/rituals/__tests__/casting-concentration.test.ts`: preparação com requisitos confirmados.
- `src/components/character/__tests__/RitualCastRules.test.tsx` e `RitualEffectWizardRules.test.tsx`: requisitos desktop/mobile e efeitos dos rituais.
- `src/components/character/__tests__/sustained-ritual-control.test.tsx`: confirmação separada, recuperação e bloqueios por turno.
- `src/services/__tests__/sustained-ritual-service.test.ts` e `temporary-resource-service.test.ts`: contratos, recibos, falhas e validação antes de enviar.
- `src/services/__tests__/character-activity-service.test.ts`: delegação ao servidor quando PE temporário pode cobrir o custo.
- `src/lib/__tests__/character-activity-presentation.test.ts`: detalhes e preservação de recibos antigos.
- `src/lib/rules/__tests__/base-turn.vitest.ts`: cobertura conservadora dos temporários.
- `supabase/tests/lot_one_rules.sql`: integração transacional com dados sintéticos e rollback; SAN/Medo, idade, repetição, acesso, turnos e dano físico/paranormal.
- `docs/TURNO_MANUAL_SERVIDOR.md`: contrato detalhado do turno manual.

## 3. Fluxo de comunicação

A ficha prepara o ritual e exige confirmação material. Os hooks preservam o pedido e os sorteios. O serviço envia ficha, UUID, PE/SAN esperados e contexto autorizado. O banco valida, bloqueia concorrência, confirma PE/SAN, reconcilia condições e grava o recibo. A tela só anuncia confirmação após ler esse recibo.

A aplicação seleciona explicitamente uma ficha autorizada. Cura, dano, temporários ou sustentação são operações próprias vinculadas à conjuração. Cicatrização atualiza cura/idade juntas. Dano leva seu tipo ao banco, e apenas fontes compatíveis absorvem o valor. O histórico registra o resultado; reconexão recupera o estado do servidor.

Manutenção consulta o turno atual do servidor. No combate v2 exige a vez do conjurador; fora dele exige início manual confirmado. O comprovante por ritual/turno impede cobrança duplicada mesmo com outra operação. Detalhes em `TURNO_MANUAL_SERVIDOR.md`.

## 4. Patch/contratos

```ts
getRitualTurn(characterId)
beginManualTurn(characterId, operationId, expectedTurn)
confirmSustainedAction({ characterId, operationId, expected, expectedPE, turn, action: 'maintain' })
listTemporaryResources(characterId)
confirmTemporaryGrant(characterId, { operationId, resource, amount, source, cumulative })
```

O banco persiste custo, efeitos e eventos com o mesmo UUID; repetir uma solicitação confirma o recibo existente. Alterar seus parâmetros reutilizando a identidade é rejeitado. Rejeições SQL explícitas liberam a preparação; respostas incertas conservam a mesma operação para recuperação.

## 5. Limites e cuidados

- Paradoxo Discente ainda exige confirmar movimento e exposição por alvo/rodada; a descrição correta fica visível. A morte especial de Verdadeiro exige a resistência adicional e decisão do mestre.
- Manancial Verdadeiro exige somar dano efetivamente confirmado nos alvos e registrar o temporário do conjurador. Nenhum dano presumido é convertido automaticamente em cura.
- Bônus situacionais são fornecidos pela ficha; o servidor confere dados, seleção, total, DT e perdas, sem certificar todas as combinações de poderes.
- Concessões de poderes e fontes especiais continuam explicitamente conferidas com o mestre. Uma fonte manual não ganha vínculo de cena presumido.
- Dano sem tipo informado não consome a proteção física de Tela de Ruído. Informar PV absoluto edita o recurso normal, sem inventar dano ou consumir escudos.
- Avisos de requisitos conferem declaração do jogador; não medem alcance ou linha de efeito no mapa.
- As referências individuais não comprovadas permanecem sinalizadas; o lote não transforma um catálogo legado em material oficial.
- Clientes antigos precisam recarregar para os novos contratos. Publicação deve seguir a instalação ordenada do banco e a conferência do código sincronizado.

## 6. Como testar e verificar a entrega

Executar checagem de tipos, regressão Vitest e build. Exercitar o SQL em transação revertida antes da instalação. Depois conferir as versões das migrations instaladas, SHA integrado/sincronizado, deploy e páginas publicadas.

No publicado, usar ficha isolada: confirmar concessão, reload/histórico, conjuração com Ocultismo, fonte temporária, início manual sem PE, manutenção única e recuperação. Conferir desktop e mobile, avisos e erros. Preservar fichas/campanhas reais e remover somente dados sintéticos criados para essa validação.
