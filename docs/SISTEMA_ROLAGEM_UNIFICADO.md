# Sistema de Rolagem Unificado com SUE

## Documentação Técnica - Ordem Paranormal RPG v1.3

> **Última atualização:** 2026-01-26  
> **Versão:** 1.0.0  
> **Status:** ✅ Implementado

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Hooks Adaptadores](#hooks-adaptadores)
4. [Funções do Motor de Regras](#funções-do-motor-de-regras)
5. [Fluxo de Dados](#fluxo-de-dados)
6. [Separação Arquitetural](#separação-arquitetural)
7. [Breakdowns e Transparência](#breakdowns-e-transparência)
8. [Testes](#testes)

---

## Visão Geral

O **Sistema de Rolagem Unificado** integra todas as rolagens do jogo (ataque, dano, perícia, iniciativa, resistência, ritual) com o **Sistema Unificado de Efeitos (SUE)**, garantindo que todos os bônus sejam calculados automaticamente e de forma consistente.

### Objetivos

- ✅ Centralizar todos os cálculos de bônus em rolagens via SUE
- ✅ Garantir paridade entre desktop e mobile
- ✅ Fornecer breakdowns transparentes de todas as fontes de bônus
- ✅ Aplicar regras oficiais de stacking automaticamente
- ✅ Manter retrocompatibilidade com rolagens simples (sem personagem)

### Princípios de Design

1. **Unificação**: Uma única fonte de verdade para todos os bônus
2. **Transparência**: Todo bônus tem fonte rastreável
3. **Separação**: Rolagens com contexto vs. rolagens simples
4. **Testabilidade**: 132+ testes automatizados validam a integração

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CAMADA DE APRESENTAÇÃO                        │
│  CombatRollModal  │  DiceRollModal  │  ResistanceCheckModal  │  Mobile  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           HOOKS ADAPTADORES SUE                         │
│  useCombatRollWithSUE  │  useSkillRollWithSUE  │  useResistanceRollWithSUE  │
│  useInitiativeRollWithSUE  │  useRitualDamageWithSUE                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           MOTOR DE REGRAS                               │
│  rollAttackWithContext  │  rollDamageWithContext  │  rollSkillCheckWithContext  │
│  rollInitiativeWithContext  │  rollResistanceCheckWithContext           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SUE (Sistema Unificado de Efeitos)            │
│  consolidateEffects()  │  ComputedEffects  │  Stacking Rules            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Arquivos Principais

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/hooks/sue/useCombatRollWithSUE.ts` | Rolagens de ataque e dano |
| `src/hooks/sue/useSkillRollWithSUE.ts` | Testes de perícia |
| `src/hooks/sue/useInitiativeRollWithSUE.ts` | Rolagens de iniciativa |
| `src/hooks/sue/useResistanceRollWithSUE.ts` | Testes de resistência |
| `src/hooks/sue/useRitualDamageWithSUE.ts` | Dano de rituais |
| `src/lib/rules-engine/roll-with-sue.ts` | Funções `*WithContext` |
| `src/lib/rules-engine/sue-bridge.ts` | Bridge SUE ↔ Rules Engine |

---

## Hooks Adaptadores

### `useCombatRollWithSUE`

Hook principal para rolagens de combate (ataque e dano).

```typescript
import { useCombatRollWithSUE } from '@/hooks/sue';

const {
  executeAttackRoll,
  executeDamageRoll,
  getAttackBonusBreakdown,
  getDamageBonusBreakdown,
} = useCombatRollWithSUE(characterConfig);
```

**Retorno:**

| Função | Descrição |
|--------|-----------|
| `executeAttackRoll(params)` | Executa rolagem de ataque com bônus SUE |
| `executeDamageRoll(params)` | Executa rolagem de dano com bônus SUE |
| `getAttackBonusBreakdown(weaponType)` | Retorna breakdown de bônus de ataque |
| `getDamageBonusBreakdown(weaponType)` | Retorna breakdown de bônus de dano |

### `useSkillRollWithSUE`

Hook para testes de perícia genéricos.

```typescript
import { useSkillRollWithSUE } from '@/hooks/sue';

const {
  executeSkillRoll,
  getSkillBonusBreakdown,
} = useSkillRollWithSUE(characterConfig);
```

### `useInitiativeRollWithSUE`

Hook para rolagens de iniciativa.

```typescript
import { useInitiativeRollWithSUE } from '@/hooks/sue';

const {
  executeInitiativeRoll,
  getInitiativeBonusBreakdown,
} = useInitiativeRollWithSUE(characterConfig);
```

### `useResistanceRollWithSUE`

Hook para testes de resistência (Fortitude, Reflexos, Vontade).

```typescript
import { useResistanceRollWithSUE } from '@/hooks/sue';

const {
  executeResistanceRoll,
  getResistanceBonusBreakdown,
} = useResistanceRollWithSUE(characterConfig);
```

### `useRitualDamageWithSUE`

Hook para rolagens de dano de rituais.

```typescript
import { useRitualDamageWithSUE } from '@/hooks/sue';

const {
  executeRitualDamage,
  getRitualDamageBonusBreakdown,
} = useRitualDamageWithSUE(characterConfig);
```

---

## Funções do Motor de Regras

### `rollAttackWithContext`

Executa rolagem de ataque com todos os bônus SUE.

```typescript
import { rollAttackWithContext } from '@/lib/rules-engine';

const result = rollAttackWithContext({
  state: characterState,
  computed: computedEffects,
  attackType: 'melee',
  skillBonus: 5,
  targetDefense: 15,
});
```

**Parâmetros:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `state` | `CharacterState` | Estado do personagem |
| `computed` | `ComputedEffects` | Efeitos consolidados do SUE |
| `attackType` | `'melee' \| 'ranged'` | Tipo de ataque |
| `skillBonus` | `number` | Bônus de perícia |
| `targetDefense` | `number?` | Defesa do alvo (opcional) |

**Retorno:**

```typescript
interface AttackRollResult {
  dice: number[];           // Dados rolados
  keptDie: number;          // Dado mantido
  modifier: number;         // Modificador total
  total: number;            // Resultado final
  isCritical: boolean;      // Se foi crítico
  isHit: boolean | null;    // Se acertou (null se sem defesa)
  sources: BonusSource[];   // Fontes de bônus detalhadas
}
```

### `rollDamageWithContext`

Executa rolagem de dano com todos os bônus SUE.

```typescript
import { rollDamageWithContext } from '@/lib/rules-engine';

const result = rollDamageWithContext({
  state: characterState,
  computed: computedEffects,
  weaponDamage: '2d6',
  weaponType: 'melee',
  isCritical: true,
  critMultiplier: 2,
});
```

### `rollSkillCheckWithContext`

Executa teste de perícia com bônus SUE.

### `rollInitiativeWithContext`

Executa rolagem de iniciativa com bônus de trilha.

### `rollResistanceCheckWithContext`

Executa teste de resistência com bônus SUE.

---

## Fluxo de Dados

```
┌──────────────┐    ┌───────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│  Componente  │    │ Hook Adaptador    │    │ *WithContext()  │    │  Resultado       │
│  (UI)        │    │ (useCombatRoll)   │    │                 │    │  DiceRollResult  │
└──────┬───────┘    └─────────┬─────────┘    └────────┬────────┘    └────────┬─────────┘
       │                      │                       │                      │
       │  click "Atacar"      │                       │                      │
       │─────────────────────>│                       │                      │
       │                      │                       │                      │
       │                      │  executeAttackRoll()  │                      │
       │                      │──────────────────────>│                      │
       │                      │                       │                      │
       │                      │                       │  1. Coleta bônus SUE │
       │                      │                       │  2. Aplica stacking  │
       │                      │                       │  3. Rola dados       │
       │                      │                       │  4. Calcula total    │
       │                      │                       │                      │
       │                      │  AttackRollResult     │                      │
       │                      │<──────────────────────│                      │
       │                      │                       │                      │
       │  result + breakdown  │                       │                      │
       │<─────────────────────│                       │                      │
```

---

## Separação Arquitetural

### Rolagens COM Contexto de Personagem

Usam os **hooks SUE** e funções `*WithContext`:

- `CombatRollModal` → `useCombatRollWithSUE`
- `MobileCombatRollModal` → `useCombatRollWithSUE`
- `DiceRollModal` → `useSkillRollWithSUE`
- `MobileDiceRollModal` → `useSkillRollWithSUE`
- `ResistanceCheckModal` → `useResistanceRollWithSUE`
- `RitualDamageModal` → `useRitualDamageWithSUE`
- `TrackCombatBonusesBar` → `useInitiativeRollWithSUE`

### Rolagens SEM Contexto de Personagem

Usam a biblioteca **legada** `dice-roller.ts`:

- `IntegratedDiceRoller` (chat de campanha)
- `CampaignView` (comandos `/r`)

**Motivo**: Rolagens de chat não têm personagem associado, portanto não precisam de bônus automáticos do SUE.

---

## Breakdowns e Transparência

Todas as rolagens com contexto retornam um `sources` array com breakdown completo:

```typescript
interface BonusSource {
  name: string;        // Nome da fonte (ex: "Treinamento", "Trilha: Aniquilador")
  value: number;       // Valor do bônus
  type: SourceType;    // 'skill' | 'origin' | 'track' | 'power' | 'ritual' | 'condition'
}
```

### Exemplo de Breakdown de Ataque

```
Bônus de Ataque: +8
├── Treinamento: +5 (skill)
├── Militar: +2 (origin)
├── Técnica Destruidor: +2 (track)
└── Abalado: -1 (condition)
```

### Indicadores Visuais

- **Tooltips**: Mostram fonte e descrição de cada bônus
- **Badges coloridas**: Diferenciam tipos de fonte (trilha, origem, ritual)
- **Exclusões de stacking**: Indicam bônus não aplicados e motivo

---

## Testes

### Cobertura de Testes

| Arquivo | Testes | Descrição |
|---------|--------|-----------|
| `roll-with-sue-integration.vitest.ts` | 25 | Integração hooks ↔ motor |
| `unified-effects-engine.vitest.ts` | 20 | Motor SUE base |
| `sue-stacking-rules.vitest.ts` | 24 | Regras de stacking |
| `rules-engine-e2e.vitest.ts` | 36 | Fluxos E2E completos |
| `combat-integration.vitest.ts` | 27 | Cenários de combate |
| **Total** | **132** | |

### Executar Testes

```bash
# Todos os testes de integração SUE
npm run test -- roll-with-sue

# Testes de stacking
npm run test -- sue-stacking

# Testes E2E do motor de regras
npm run test -- rules-engine-e2e

# Testes de combate
npm run test -- combat-integration
```

---

## Migração Concluída

O sistema de rolagem foi migrado do legado (`dice-roller.ts`) para o sistema unificado em 8 fases:

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Infraestrutura de Compatibilidade (hooks) | ✅ |
| 2 | Migração dos Modais de Combate | ✅ |
| 3 | Migração de Iniciativa e Resistência | ✅ |
| 4 | Migração de Dano de Rituais | ✅ |
| 5 | Migração de Testes de Perícia | ✅ |
| 6 | Documentação de Separação Arquitetural | ✅ |
| 7 | Limpeza e Depreciação | ✅ |
| 8 | Testes e Validação (132/132) | ✅ |

**Documento de migração completo**: [MIGRACAO_SUE_ROLAGEM_COMPLETA.md](./MIGRACAO_SUE_ROLAGEM_COMPLETA.md)

---

## Documentação Relacionada

- [SISTEMA_UNIFICADO_EFEITOS.md](./SISTEMA_UNIFICADO_EFEITOS.md) - Arquitetura do SUE
- [SUE_TEST_COVERAGE.md](./SUE_TEST_COVERAGE.md) - Cobertura de testes
- [ARQUITETURA.md](./ARQUITETURA.md) - Arquitetura geral do projeto

---

*Documentação do Sistema de Rolagem Unificado para Ordem Paranormal RPG v1.3*
