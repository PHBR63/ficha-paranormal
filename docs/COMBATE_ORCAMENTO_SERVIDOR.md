# Ataques e orçamento confirmado de PE

## Regra e escopo

Livro Base v1.3: limite por turno e exceção do custo mínimo (p. 23), Ataque Especial e trilhas Combatente/Especialista. Preserva o 20 natural personalizado. O controle só acumula gasto em combate v2 ou turno manual ativo; fora dele registra o custo sem inventar turno.

Custos calculados no servidor: Ataque Especial, técnicas do Aniquilador, Ataque Furtivo e Disparo Letal. Valida classe, trilha, NEX, arma equipada e favorita nas técnicas. Não recebe custo arbitrário como verdade. Combinações não recebem a exceção de uma habilidade no custo mínimo. O bônus exclusivo de ritual do Intuitivo não amplia o limite dos ataques.

## Arquivos e comunicação

- `CharacterSheet.tsx` e `MobileCharacterSheet.tsx`: leem ficha, orçamento e temporários; fornecem confirmação aos modais; atualizam consultas após recibo. Não gravam outro histórico para o ataque já confirmado.
- `CombatWeaponsTable.tsx`: encaminha dados da ficha/arma ao modal desktop.
- `CombatRollModal.tsx` e `MobileCombatRollModal.tsx`: recebem recursos, arma, poderes e callback; criam seleção, sorteio e UUID uma vez. Bloqueiam nova rolagem se o turno não puder ser consultado. Seletores consideram PE temporários.
- `useConfirmedDiceRoll.ts`: mantém a intenção durante conexão incerta, bloqueia duplicação e só apresenta resultado após confirmação. Recusa explícita libera correção; não produz resultado nem dano.
- `combat-attack-service.ts`: serializa seleção/resultado e chama RPC autenticada; valida ficha, UUID, categoria, estado e custo do recibo. Marca o resultado com `activityOperationId` para evitar gravação legada duplicada.
- `character-activity-service.ts`: contrato tipado da RPC e tradução segura das falhas. Não transmite detalhes internos do banco na interface.
- `dice-roller.ts`: tipo do resultado com referência opcional ao recibo confirmado.
- `character-activity-presentation.ts`: mostra custo, saldo, temporários e orçamento no mesmo registro do ataque; recibos antigos continuam legíveis.
- `PETurnBudgetPanel.tsx` e `base-rule-coverage.ts`: explicam cobertura atual e requisitos ainda manuais.
- Migration `20261007200000_combat_attack_pe_budget.sql`: permite `ability` no livro de gastos; cria RPC transacional e restringe execução a usuários autenticados com autorização da ficha.
- Testes `combat_attack_pe_budget.sql`, `combat-attack-service.test.ts`, `combat-attack-confirmation.test.tsx` e `character-activity-presentation.test.ts`: verificam banco, transporte, interface desktop/mobile e texto do histórico.

Fluxo: tela → modal → intenção conservada → serviço autenticado → RPC → bloqueio de ficha/turno → custo oficial + autorização + orçamento → consumo temporário/normal → evento de rolagem + livro de gastos → recibo → atualização da tela/histórico.

## Contrato e banco

RPC `confirm_character_combat_attack`: recebe UUID, ficha, PE esperado, custo mostrado, chave esperada do turno, seleção e resultado. A seleção contém arma, incrementos especiais, indicadores furtivo/letal, técnicas e repetição de Letal. Retorna um `character_activity_events` confirmado com `kind=combat_attack`, parcelas do custo/recursos e orçamento.

O UUID repetido com os mesmos dados recupera o recibo, mesmo após mudança de saldo/turno. UUID reutilizado com outros dados é rejeitado. Turno ou saldo divergente exige recarregar. Falha em qualquer etapa desfaz PE normais, temporários, histórico e gasto. Valores do resultado são validados estruturalmente e pela soma das parcelas; isso não é cálculo autoritativo de todos os bônus ou sorteio no servidor.

Tabelas afetadas: `characters.pe_current`, `character_temporary_resources.remaining`, `character_activity_events` e `character_pe_turn_spending`. O gasto referencia o evento e a ficha. Migração preserva registros anteriores e não altera escolhas de personagens.

## Limitações e testes

Ações, reações, requisitos circunstanciais, frequência do Ataque Furtivo, preparação de Mirar, munição, demais poderes pagos e aplicação de dano continuam fora desta automação. Seleção paga fora do catálogo é recusada com aviso de conferência manual. Ajuste manual de PE não vira gasto de habilidade.

Verificar: ataque gratuito; custo mínimo em NEX 5; ataque + ritual no mesmo orçamento; excesso sem alteração; turno antigo; PE temporários antes dos normais; técnica sem NEX/favorita; recibo de outra ficha; mesma intenção após falha de rede; recusa explícita permitindo fechar/corrigir; histórico único após recarregar. O ensaio SQL usa transação com rollback e não deixa usuários ou fichas de teste.
