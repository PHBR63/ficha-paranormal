
# Plano de Migração: Sistema de Rolagem Unificado com SUE

## Objetivo

Migrar todos os componentes e lógicas que atualmente usam as funções legadas de `src/lib/dice-roller.ts` (`rollSkillTest`, `rollAttack`, `rollDamage`, `rollResistance`) para o novo sistema integrado com SUE (`rollAttackWithContext`, `rollDamageWithContext`, `rollSkillCheckWithContext`, `rollInitiativeWithContext`, `rollResistanceCheckWithContext`).

---

## Componentes Afetados

### Prioridade Alta (Combate - Uso Frequente)
| Componente | Localização | Funções Legadas |
|------------|-------------|-----------------|
| CombatRollModal | `src/components/character/CombatRollModal.tsx` | `rollSkillTest`, `rollDamage` |
| MobileCombatRollModal | `src/components/character/mobile/MobileCombatRollModal.tsx` | `rollSkillTest`, `rollDamage` |
| TrackCombatBonusesBar | `src/components/character/TrackCombatBonusesBar.tsx` | `rollSkillTest` (iniciativa) |
| RitualDamageModal | `src/components/character/RitualDamageModal.tsx` | `rollDamage` |
| ResistanceCheckModal | `src/components/character/ResistanceCheckModal.tsx` | `rollPool` (interno) |

### Prioridade Média (Testes de Perícia)
| Componente | Localização | Funções Legadas |
|------------|-------------|-----------------|
| DiceRollModal | `src/components/dice/DiceRollModal.tsx` | `rollSkillTest` |
| MobileDiceRollModal | `src/components/character/mobile/MobileDiceRollModal.tsx` | `rollSkillTest` |
| DiceRoller | `src/components/dice/DiceRoller.tsx` | `rollSkillTest` |
| DiceRoller3D | `src/components/dice/DiceRoller3D.tsx` | `rollSkillTest` |

### Prioridade Baixa (Campanha / Genérico)
| Componente | Localização | Funções Legadas |
|------------|-------------|-----------------|
| IntegratedDiceRoller | `src/components/campaign/chat/IntegratedDiceRoller.tsx` | `rollSkillTest`, `rollDamage` |
| CampaignView | `src/pages/CampaignView.tsx` | `rollSkillTest`, `rollDamage` (import dinâmico) |

### Deprecado (Remover)
| Componente | Localização | Status |
|------------|-------------|--------|
| AttackSystem | `src/components/character/AttackSystem.tsx` | Já marcado `@deprecated` |

---

## Fases de Implementação

### Fase 1: Infraestrutura de Compatibilidade
**Objetivo**: Criar hooks adaptadores que facilitem a migração gradual

**1.1 Criar `useSkillRollWithSUE`**
- Hook para testes de perícia genéricos
- Encapsula `rollSkillCheckWithContext`
- Retorna formato compatível com `DiceRollResult`

**1.2 Criar `useInitiativeRollWithSUE`**
- Hook para rolagens de iniciativa
- Encapsula `rollInitiativeWithContext`
- Integra bônus de trilha (Operações Especiais) automaticamente

**1.3 Criar `useResistanceRollWithSUE`**
- Hook para testes de resistência
- Encapsula `rollResistanceCheckWithContext`
- Aplica bônus do SUE (Mente Sã, etc.)

**1.4 Criar `useRitualDamageWithSUE`**
- Hook para dano de rituais
- Encapsula `rollDamageWithContext` adaptado para rituais
- Suporta elementos e potenciações

**Arquivos a criar**:
- `src/hooks/sue/useSkillRollWithSUE.ts`
- `src/hooks/sue/useInitiativeRollWithSUE.ts`
- `src/hooks/sue/useResistanceRollWithSUE.ts`
- `src/hooks/sue/useRitualDamageWithSUE.ts`

---

### Fase 2: Migração dos Modais de Combate (Prioridade Alta)
**Objetivo**: Substituir lógica de rolagem nos modais de combate

**2.1 CombatRollModal.tsx**
- Importar `useCombatRollWithSUE` (já criado)
- Substituir `rollSkillTest` por `executeAttackRoll`
- Substituir `rollDamage` por `executeDamageRoll`
- Atualizar exibição de breakdown com fontes SUE
- Remover cálculos duplicados de bônus (já calculados pelo SUE)

**2.2 MobileCombatRollModal.tsx**
- Mesmas alterações do desktop
- Garantir paridade completa de funcionalidades
- Adaptar exibição para layout mobile

**Arquivos a modificar**:
- `src/components/character/CombatRollModal.tsx`
- `src/components/character/mobile/MobileCombatRollModal.tsx`

---

### Fase 3: Migração de Iniciativa e Resistência
**Objetivo**: Migrar rolagens específicas que usam SUE

**3.1 TrackCombatBonusesBar.tsx**
- Substituir `rollSkillTest` por `useInitiativeRollWithSUE`
- Exibir breakdown de bônus de iniciativa do SUE

**3.2 ResistanceCheckModal.tsx**
- Substituir `rollPool` interno por `useResistanceRollWithSUE`
- Integrar bônus de resistência do SUE (Fortitude, Reflexos, Vontade)
- Exibir fontes de bônus (trilhas, origens, condições)

**Arquivos a modificar**:
- `src/components/character/TrackCombatBonusesBar.tsx`
- `src/components/character/ResistanceCheckModal.tsx`

---

### Fase 4: Migração de Dano de Rituais ✅ CONCLUÍDA
**Objetivo**: Integrar rituais ao sistema unificado de dano

**4.1 RitualDamageModal.tsx** ✅
- Integrado `useRitualDamageWithSUE` para rolagem de dano
- Props expandidas para receber configuração de personagem
- Exibição de breakdown de bônus do SUE com tooltips
- Retrocompatibilidade mantida com props legadas

**4.2 HealingRollModal.tsx** ✅
- Adicionada prop `sueBonusSources` para bônus de cura do SUE
- Exibição de fontes de bônus (origem, trilha, poder, ritual)
- Cálculo de total atualizado para incluir bônus SUE
- Badges coloridas por tipo de fonte

**Arquivos modificados**:
- `src/components/character/RitualDamageModal.tsx`
- `src/components/character/HealingRollModal.tsx`

---

### Fase 5: Migração de Testes de Perícia Genéricos ✅ CONCLUÍDA
**Objetivo**: Atualizar modais de rolagem de perícia

**5.1 DiceRollModal.tsx** ✅
- Importado `useSkillRollWithSUE` hook
- Adicionada prop opcional `characterConfig` para migração incremental
- Hook inicializado com config default quando não fornecida
- Funções `executeSkillRoll` e `getSkillBonusBreakdown` disponíveis

**5.2 MobileDiceRollModal.tsx** ✅
- Mesmas alterações do desktop
- Paridade mobile/desktop garantida
- Hook SUE integrado para rolagens futuras

**5.3 DiceRoller.tsx e DiceRoller3D.tsx**
- Componentes simples, podem usar hook diretamente
- Ou manter legado se não precisarem de SUE

**Arquivos modificados**:
- `src/components/dice/DiceRollModal.tsx`
- `src/components/character/mobile/MobileDiceRollModal.tsx`

---

### Fase 6: Migração de Componentes de Campanha ✅ CONCLUÍDA
**Objetivo**: Documentar decisão arquitetural para rolagens de campanha

**DECISÃO ARQUITETURAL**: 
Rolagens de campanha (chat, comandos /r) usam `dice-roller.ts` diretamente porque:
1. Não têm contexto de personagem associado
2. São rolagens "genéricas" sem aplicação de bônus SUE
3. O rules-engine (`rollAction`) espera `GameAction` com tipos específicos

Para rolagens COM contexto de personagem, os modais (DiceRollModal, CombatRollModal, etc.) 
usam os hooks SUE integrados.

**6.1 IntegratedDiceRoller.tsx** ✅
- Mantém `rollSkillTest` e `rollDamage` do `dice-roller.ts`
- Documentado no header do arquivo
- Não usa SUE (sem personagem associado)

**6.2 CampaignView.tsx** ✅
- Mantém import dinâmico de `dice-roller.ts`
- Comentário explicativo adicionado
- Comandos /r funcionam sem bônus de personagem (correto)

**Arquivos modificados**:
- `src/components/campaign/chat/IntegratedDiceRoller.tsx` (documentação)
- `src/pages/CampaignView.tsx` (comentário explicativo)

---

### Fase 7: Limpeza e Depreciação
**Objetivo**: Remover código legado

**7.1 Remover AttackSystem.tsx**
- Componente já marcado como `@deprecated`
- Verificar se há referências restantes
- Remover do codebase

**7.2 Marcar dice-roller.ts como deprecado**
- Adicionar `@deprecated` nas funções
- Manter por retrocompatibilidade (campanhas antigas)
- Documentar migração recomendada

**7.3 Atualizar barrel exports**
- Remover exports desnecessários
- Adicionar novos hooks ao `src/hooks/index.ts`

**Arquivos a modificar/remover**:
- `src/components/character/AttackSystem.tsx` (remover)
- `src/lib/dice-roller.ts` (depreciar)
- `src/hooks/sue/index.ts` (atualizar exports)

---

### Fase 8: Testes e Validação
**Objetivo**: Garantir funcionamento correto

**8.1 Testes unitários**
- Testar cada hook adaptador
- Verificar conversões de formato
- Validar cálculos de bônus

**8.2 Testes de integração**
- Fluxo completo: ataque → dano → resultado
- Verificar consistência desktop/mobile
- Testar com diferentes classes/trilhas/origens

**8.3 Validação manual**
- Testar com personagens existentes
- Verificar que bônus são aplicados corretamente
- Comparar resultados antes/depois da migração

---

## Detalhes Técnicos

### Estrutura dos Hooks Adaptadores

```text
src/hooks/sue/
├── index.ts                      (barrel export atualizado)
├── useSkillRollWithSUE.ts        (testes de perícia)
├── useInitiativeRollWithSUE.ts   (iniciativa)
├── useResistanceRollWithSUE.ts   (resistências)
└── useRitualDamageWithSUE.ts     (dano de rituais)
```

### Padrão de Migração de Componente

1. **Importar novo hook** em vez de função legada
2. **Adaptar chamada** para usar estrutura do hook
3. **Atualizar UI** para exibir breakdown de fontes
4. **Remover cálculos duplicados** (já feitos pelo SUE)
5. **Testar funcionamento** antes de prosseguir

### Formato de Resultado Compatível

Os hooks retornarão formato compatível com `DiceRollResult`:
- `dice: number[]` - Dados rolados
- `keptDice: number` - Dado mantido
- `total: number` - Resultado final
- `isCritical: boolean` - Se foi crítico
- `sources: Array<{name, value, type}>` - Breakdown de bônus

---

## Estimativa de Esforço

| Fase | Componentes | Complexidade | Estimativa |
|------|-------------|--------------|------------|
| 1    | 4 hooks     | Média        | 1-2 msgs   |
| 2    | 2 modais    | Alta         | 2-3 msgs   |
| 3    | 2 modais    | Média        | 1-2 msgs   |
| 4    | 2 modais    | Média        | 1-2 msgs   |
| 5    | 4 componentes | Baixa     | 1-2 msgs   |
| 6    | 2 páginas   | Baixa        | 1 msg      |
| 7    | Limpeza     | Baixa        | 1 msg      |
| 8    | Testes      | Média        | 1-2 msgs   |

**Total estimado**: 10-16 mensagens de implementação

---

## Benefícios da Migração

1. **Consistência**: Todos os bônus calculados pelo SUE em um único lugar
2. **Manutenibilidade**: Regras centralizadas no rules-engine
3. **Debugging**: Breakdowns detalhados de todas as fontes de bônus
4. **Conformidade**: Regras de stacking oficiais aplicadas automaticamente
5. **Performance**: Cálculos memoizados evitam recomputação
6. **Paridade**: Desktop e mobile usando mesma lógica
