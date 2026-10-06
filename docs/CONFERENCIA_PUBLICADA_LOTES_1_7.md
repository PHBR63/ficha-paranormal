# Conferência publicada dos lotes 1–7

## 1. Resumo

Em 06/10/2026, a PR #11 foi integrada à main e publicada no Lovable PHZF. O banco ativo recebeu as sete migrations documentadas no contrato. A conferência autenticada encontrou ajustes adicionais de apresentação e um fluxo de edição de recursos ausente no mobile, corrigidos nesta entrega.

## 2. Arquivos alterados/criados

| Arquivo | Responsabilidade, entradas e saídas | Comunicação |
|---|---|---|
| `src/components/character/CombatStatsCard.tsx` | Editor PV/PE/SAN: recebe valores/máximos e callback; valida inteiros, aguarda confirmação, mantém valores e erro em falha. | Usado por CharacterSheet e MobileOverviewTab; utiliza Input/Button. |
| `src/components/character/MobileCharacterSheet.tsx` | Liga recursos mobile à operação atômica existente; retorna confirmação booleana. | Overview → useCharacterResourceUpdate → RPC → refetch. |
| `src/pages/CharacterSheet.tsx` | Retorna confirmação booleana para editor desktop, sem fechamento em gravação recusada. | CombatStatsCard → hook/serviço → RPC. |
| `src/components/character/mobile/MobileOverviewTab.tsx` | Reutiliza editor de recursos e exibe valores reais das origens da Defesa (`bonus`). | Sheet fornece dados/callback; usa CombatStatsCard e popover. |
| `src/components/character/mobile/MobileCombatPanel.tsx` | Nomeia expansor da arma e comunica estado expandido. | Overview fornece armas; ação abre seus detalhes. |
| `src/components/dice/DiceRollModal.tsx` | Separa treinamento/outros bônus; respeita treinamento real e Eclético; exclui Ataque Especial dos testes de perícia. | Fichas fornecem origens/poderes; motor produz resultado e callback de histórico. CombatRollModal preservado. |
| `src/components/character/RitualApplicationTargetSelector.tsx` | Aviso de alvo correto para cura, dano e condições. | Wizards fornecem alvos autorizados/seleção. |
| `src/components/character/RitualEffectWizard.tsx` e `mobile/MobileRitualEffectWizard.tsx` | Diferenciam resultado rolado/calculado e aplicação confirmada; mobile nomeia fechamento. | Recebem resultado e callbacks assíncronos de aplicação; não alteram motor. |
| `src/components/campaign/v3/CampaignHeader.tsx` e `CampaignStatusBar.tsx` | Rótulos para voltar, configurações, dados, notas, sessão e presença, inclusive mobile. | CampaignShell fornece dados/callbacks; nenhuma alteração de permissão. |
| `src/components/ui/sheet.tsx` | Traduz fechamento acessível para Fechar. | Consumido pelos painéis compartilhados. |
| `src/components/character/__tests__/combat-stats-confirmation.test.tsx` | Testa validação, espera, recusa e integração real Overview/editor. | Monta componentes com callbacks controlados. |
| `src/components/character/mobile/__tests__/defense-breakdown.test.tsx` | Testa origens positivas/negativas, excluídas e inativas. | Monta popover da Defesa. |
| `src/components/dice/__tests__/DiceRollModalBonusOrigins.test.tsx` | Testa treinamento, poder, legado, requisitos, Eclético e Ataque Especial inaplicável. | Monta modal com motor real e animação controlada. |
| `src/components/character/__tests__/RitualEffectWizardRules.test.tsx` | Acrescenta cenários de cura ainda não aplicada e erro nos dois wizards. | Callbacks pendentes/recusados. |
| `src/components/campaign/v3/__tests__/CampaignActionLabels.test.tsx` | Testa nomes acessíveis e callbacks dos dois estados da sessão. | Monta header/status bar. |
| Documentos de entrega/cliente/plano | Registram decisões, fluxos, evidências e limites. | Complementam CONTRATO_ATIVIDADE_SERVIDOR.md. |

## 3. Fluxo de comunicação

Tela → componente de edição/rolagem → hook → serviço → RPC autenticada → transação de recurso e evento → confirmação → Realtime/refetch → histórico por ficha. Falha da operação mantém o editor; falha de atualização após commit não reaplica o efeito. Os ajustes não acrescentam migrations nem dependências.

## 4. Patch

O diff da PR associada contém a implementação completa. Exemplos: `confirmed === false` mantém o editor; `skillBonus` contém treinamento e `otherBonuses` contém o restante; o popover de Defesa lê `DefenseBonusBreakdown.bonus`.

## 5. Evidências e limites

- Publicação inicial verificada pelo bundle `index-BDOCneL4.js` e pela interface autenticada.
- Iniciativa registrada no servidor e mantida após reload; ocultação deixou o evento intacto; recuperação persistiu; outra ficha não recebeu o registro.
- Cicatrização cancelada após débito: PE 18→17, evento pendente. Segunda conjuração: 17→16; dados [7,4,8]+3 = 22; aplicação confirmada com PV 26→26, respeitando máximo. Eventos de QA preservados, sem estorno automático.
- Convite v2 criado no schema correto, max_uses 10 e uses 0, na campanha isolada de QA.
- Regressão integrada: 3.049 testes/116 arquivos aprovados, além de três cenários de rótulos da campanha; tipos/build aprovados e nenhuma nova ocorrência de lint frente ao HEAD. O lint global mantém dívida anterior.
- Uma conta real disponível. Permissões entre identidades foram testadas no banco com rollback; isso não substitui teste manual com dois usuários/dispositivos. Toque físico, teclado virtual e leitor de tela não foram simulados como se executados.
- PV temporários e ajustes situacionais que o motor não suporta continuam explicitamente manuais. Esta entrega não afirma automação integral de todas as regras dos livros.
- A conferência da nova publicação usa seus próprios assets e testa os controles corrigidos; evidências finais ficam na pasta de saída da execução.

## 6. Como testar

Abrir ficha em mobile; editar PV/PE/SAN, salvar e conferir evento antes/depois após reload. Em caso de recusa, manter formulário e aviso. Abrir Defesa e conferir condição Vulnerável −2. Rolar Iniciativa e conferir treinamento e poder separados, sem Ataque Especial. Abrir histórico, filtrar, ocultar e recuperar. Conjurar ritual: exigir alvo, confirmar servidor e preservar PE consumidos ao cancelar. Conferir convites/campanha v2 e nomes acessíveis em largura reduzida.
