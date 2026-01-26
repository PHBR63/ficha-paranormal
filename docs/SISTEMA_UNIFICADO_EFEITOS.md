# Sistema Unificado de Efeitos (SUE)

## Documentação Técnica - Ordem Paranormal RPG v1.3

> **Última atualização:** 2026-01-26  
> **Versão:** 2.0.0

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Fontes de Efeitos](#fontes-de-efeitos)
5. [Hooks Principais](#hooks-principais)
6. [Motor de Consolidação](#motor-de-consolidação)
7. [Regras de Stacking](#regras-de-stacking)
8. [Efeitos Ativáveis](#efeitos-ativáveis)
9. [Persistência](#persistência)
10. [Integração com Combate](#integração-com-combate)
11. [Testes](#testes)
12. [Glossário](#glossário)

---

## Visão Geral

O **Sistema Unificado de Efeitos (SUE)** é o motor central de cálculo de bônus e modificadores do sistema Ordem Paranormal RPG. Ele consolida efeitos de múltiplas fontes em um resultado único, aplicando as regras oficiais de stacking.

### Objetivos

- ✅ Centralizar todos os cálculos de bônus em um único sistema
- ✅ Garantir consistência entre diferentes partes da aplicação
- ✅ Facilitar debugging e auditoria de bônus
- ✅ Suportar efeitos condicionais e ativáveis
- ✅ Integrar com o sistema de combate

### Princípios de Design

1. **Imutabilidade**: Efeitos são objetos imutáveis, calculados a cada renderização
2. **Composição**: Efeitos de diferentes fontes são compostos, não herdados
3. **Transparência**: Todo bônus tem uma fonte rastreável (breakdown)
4. **Performance**: Uso intensivo de `useMemo` para evitar recálculos

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CAMADA DE APRESENTAÇÃO                        │
│  CharacterSheet.tsx  │  CombatRollModal.tsx  │  ActiveBonusesPanel.tsx  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              HOOKS DE INTEGRAÇÃO                        │
│       useUnifiedEffects()  │  useActivatedEffects()  │  useBonusSummaryFromSUE()       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              MOTOR CENTRAL (SUE)                        │
│                         unified-effects-engine.ts                       │
│                                                                         │
│   consolidateEffects()  │  checkEffectConditions()  │  ComputedEffects  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              ADAPTADORES                                │
│                                                                         │
│  origin-effects-adapter.ts      │  Converte origens para UnifiedEffect  │
│  track-effects-adapter.ts       │  Converte trilhas para UnifiedEffect  │
│  condition-effects-adapter.ts   │  Converte condições para UnifiedEffect│
│  ritual-effects-adapter.ts      │  Converte rituais para UnifiedEffect  │
│  paranormal-powers-effects-adapter.ts │ Converte poderes paranormais   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              DADOS BASE                                 │
│                                                                         │
│  origins.ts  │  track-registry.ts  │  conditions.ts  │  rituals/*.ts    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Arquivos Principais

| Arquivo | Responsabilidade |
|---------|------------------|
| `src/lib/unified-effects-engine.ts` | Motor central de consolidação |
| `src/hooks/useUnifiedEffects.ts` | Hook principal que orquestra tudo |
| `src/hooks/useActivatedEffects.ts` | Gerencia efeitos ativados manualmente |
| `src/lib/effects/*.ts` | Adaptadores por fonte de efeito |

---

## Fluxo de Dados

### Diagrama de Sequência

```
┌──────────────┐    ┌───────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│  Componente  │    │ useUnifiedEffects │    │   Adaptadores   │    │  consolidate     │
│  (UI)        │    │                   │    │                 │    │  Effects()       │
└──────┬───────┘    └─────────┬─────────┘    └────────┬────────┘    └────────┬─────────┘
       │                      │                       │                      │
       │  characterState      │                       │                      │
       │─────────────────────>│                       │                      │
       │                      │                       │                      │
       │                      │  getOriginEffects()   │                      │
       │                      │──────────────────────>│                      │
       │                      │      UnifiedEffect[]  │                      │
       │                      │<──────────────────────│                      │
       │                      │                       │                      │
       │                      │  getTrackEffects()    │                      │
       │                      │──────────────────────>│                      │
       │                      │      UnifiedEffect[]  │                      │
       │                      │<──────────────────────│                      │
       │                      │                       │                      │
       │                      │  ... outros adapters  │                      │
       │                      │──────────────────────>│                      │
       │                      │<──────────────────────│                      │
       │                      │                       │                      │
       │                      │  allEffects[]         │                      │
       │                      │──────────────────────────────────────────────>│
       │                      │                       │                      │
       │                      │                       │   ComputedEffects    │
       │                      │<──────────────────────────────────────────────│
       │                      │                       │                      │
       │  UnifiedEffectsResult│                       │                      │
       │<─────────────────────│                       │                      │
       │                      │                       │                      │
```

### Etapas do Fluxo

1. **Entrada**: O componente passa `CharacterStateForEffects` para `useUnifiedEffects`
2. **Coleta**: O hook chama cada adaptador para coletar efeitos da respectiva fonte
3. **Combinação**: Todos os efeitos são combinados em um único array
4. **Contexto**: É criado um `EffectCalculationContext` com estado atual
5. **Consolidação**: `consolidateEffects()` aplica regras de stacking
6. **Saída**: Retorna `ComputedEffects` com todos os bônus calculados

---

## Fontes de Efeitos

O SUE suporta **5 fontes principais** de efeitos:

### 1. Origens (`origin`)

Bônus passivos da origem do personagem.

```typescript
// Exemplo: Militar
{
  id: 'origin-militar-combate',
  name: 'Treinamento de Combate',
  source: 'origin',
  mechanics: {
    attackBonus: 2,
    damageBonus: 2,
  }
}
```

**Adaptador:** `src/lib/effects/origin-effects-adapter.ts`

### 2. Trilhas (`track`)

Habilidades de classe desbloqueadas por NEX.

```typescript
// Exemplo: Aniquilador - Técnica Destruidor
{
  id: 'track-tecnica-destruidor',
  name: 'Técnica Destruidor',
  source: 'track',
  mechanics: {
    damageBonus: 5,
  },
  conditions: {
    requiresActivation: true,
    costPE: 2,
  }
}
```

**Adaptador:** `src/lib/effects/track-effects-adapter.ts`

### 3. Condições (`condition`)

Modificadores de condições ativas (positivas e negativas).

```typescript
// Exemplo: Abalado
{
  id: 'condition-abalado',
  name: 'Abalado',
  source: 'condition',
  mechanics: {
    attackBonus: -2,
    skillBonus: { /* todas: -2 */ },
  }
}
```

**Adaptador:** `src/lib/effects/condition-effects-adapter.ts`

### 4. Rituais (`ritual`)

Bônus de rituais sustentados ou ativos.

```typescript
// Exemplo: Armadura Arcana
{
  id: 'ritual-armadura-arcana',
  name: 'Armadura Arcana',
  source: 'ritual',
  mechanics: {
    defenseBonus: 5,
  }
}
```

**Adaptador:** `src/lib/effects/ritual-effects-adapter.ts`

### 5. Poderes Paranormais (`paranormal_power`)

Modificadores dos 22 poderes paranormais oficiais.

```typescript
// Exemplo: Resistir ao Outro Lado
{
  id: 'power-resistir-outro-lado',
  name: 'Resistir ao Outro Lado',
  source: 'paranormal_power',
  mechanics: {
    paranormalDamageReduction: 5,
  }
}
```

**Adaptador:** `src/lib/effects/paranormal-powers-effects-adapter.ts`

---

## Hooks Principais

### `useUnifiedEffects`

Hook central que orquestra a coleta e consolidação de efeitos.

```typescript
import { useUnifiedEffects } from '@/hooks/useUnifiedEffects';

const { computed, allEffects, bySource, hasEffect, isEffectActive } = useUnifiedEffects(
  characterState,
  combatContext
);
```

**Parâmetros:**

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `characterState` | `CharacterStateForEffects` | Estado do personagem |
| `combatContext` | `CombatContextInput` | Contexto de combate (opcional) |

**Retorno:**

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `allEffects` | `UnifiedEffect[]` | Todos os efeitos brutos |
| `computed` | `ComputedEffects` | Efeitos consolidados |
| `bySource` | `Record<source, UnifiedEffect[]>` | Efeitos agrupados por fonte |
| `hasEffect` | `(id: string) => boolean` | Verifica se efeito existe |
| `isEffectActive` | `(id: string) => boolean` | Verifica se efeito está ativo |

### `useActivatedEffects`

Gerencia efeitos que precisam ser ativados manualmente pelo jogador.

```typescript
import { useActivatedEffects } from '@/hooks/useActivatedEffects';

const {
  activatedEffectIds,
  activateEffect,
  deactivateEffect,
  isEffectActive,
  consumeAttackEffects,
  consumeRoundEffects,
} = useActivatedEffects({
  characterId: character.id,
  enablePersistence: true,
});
```

**Opções:**

| Opção | Tipo | Descrição |
|-------|------|-----------|
| `characterId` | `string` | ID do personagem para persistência |
| `enablePersistence` | `boolean` | Salvar no banco de dados |
| `saveDebounceMs` | `number` | Debounce para salvamento (default: 500ms) |

**Durações de Efeito:**

| Duração | Descrição | Persistência |
|---------|-----------|--------------|
| `instant` | Efeito imediato | Não persiste |
| `next-attack` | Até o próximo ataque | Não persiste |
| `next-turn` | Até o próximo turno | Não persiste |
| `round` | Até o final da rodada | Não persiste |
| `scene` | Até o final da cena | **Persiste** |
| `concentration` | Enquanto concentrar | **Persiste** |

---

## Motor de Consolidação

### `consolidateEffects()`

Função principal que aplica regras de stacking e retorna `ComputedEffects`.

```typescript
import { consolidateEffects } from '@/lib/unified-effects-engine';

const computed = consolidateEffects(allEffects, calculationContext);
```

### Estrutura de `ComputedEffects`

```typescript
interface ComputedEffects {
  attack: {
    general: number;      // Bônus geral de ataque
    melee: number;        // Bônus específico corpo a corpo
    ranged: number;       // Bônus específico distância
    breakdown: Array<{ source: string; value: number }>;
  };
  damage: {
    general: number;
    melee: number;
    ranged: number;
    extraDice: string[];  // Ex: ['1d6', '2d4']
    breakdown: Array<{ source: string; value: number | string }>;
  };
  critical: {
    marginBonus: number;       // Ex: +2 = ameaça em 18-20
    multiplierBonus: number;   // Ex: +1 = ×3 em vez de ×2
    breakdown: Array<{ source: string; value: number }>;
  };
  defense: {
    general: number;
    vsMelee: number;
    vsRanged: number;
    breakdown: Array<{ source: string; value: number }>;
  };
  resistances: {
    fortitude: number;
    reflexos: number;
    vontade: number;
    breakdown: Array<{ source: string; value: number }>;
  };
  damageReduction: {
    physical: number;
    paranormal: number;
    byType: Partial<Record<DamageType, number>>;
    breakdown: Array<{ source: string; value: number }>;
  };
  skills: Record<string, { bonus: number; sources: string[] }>;
  resources: {
    hpBonus: number;
    peBonus: number;
    sanityBonus: number;
    tempHP: number;
  };
  movement: { bonus: number; multiplier: number };
  initiative: { bonus: number; breakdown: Array<...> };
  flags: {
    cannotAct: boolean;
    cannotReact: boolean;
    cannotMove: boolean;
    isHelpless: boolean;
    isUnconscious: boolean;
  };
}
```

---

## Regras de Stacking

### Regras Gerais (Ordem Paranormal RPG)

1. **Bônus de mesma fonte NÃO acumulam** - usa o maior
2. **Bônus de fontes diferentes ACUMULAM** - somam
3. **Penalidades SEMPRE acumulam** - somam

### Implementação no SUE

```typescript
// Exemplo de stacking por fonte
const effects = [
  { source: 'origin', mechanics: { attackBonus: 2 } },
  { source: 'track', mechanics: { attackBonus: 3 } },
  { source: 'condition', mechanics: { attackBonus: -2 } }, // Penalidade
];

// Resultado: 2 + 3 + (-2) = 3
```

### Exceções

| Tipo | Regra |
|------|-------|
| Rituais | Mesmo ritual não acumula consigo |
| Dados extras | Sempre acumulam (lista de strings) |
| Flags | OR lógico (se qualquer fonte ativa, está ativo) |

---

## Efeitos Ativáveis

Alguns efeitos requerem ativação manual do jogador.

### Identificação

Efeitos ativáveis têm:
- `isToggleable: true`
- `conditions.requiresActivation: true`

### Fluxo de Ativação

```
┌─────────────────┐     ┌───────────────────────┐     ┌─────────────────┐
│  UI (Botão)     │────>│  useActivatedEffects  │────>│  SUE            │
│  "Ativar"       │     │  activateEffect()     │     │  isActive=true  │
└─────────────────┘     └───────────────────────┘     └─────────────────┘
```

### IDs de Efeitos de Trilha

Os IDs seguem o padrão `track-{ability-id}`:

```typescript
// src/hooks/useActivatedEffects.ts
export const TRACK_EFFECT_IDS = {
  DISPARO_LETAL: 'track-disparo-letal',
  ATAQUE_FURTIVO: 'track-ataque-furtivo-trilha',
  TECNICA_DESTRUIDOR: 'track-tecnica-destruidor',
  // ...
};
```

### Correspondência com Mappings

```typescript
// src/lib/effects/track-effects-adapter.ts
export const TRACK_EFFECT_MAPPINGS = {
  atiradorElite: {
    trackId: 'atirador-elite',
    effects: {
      'track-disparo-letal': { name: 'Disparo Letal', minNex: 40, peCost: 1 },
    }
  }
};
```

---

## Persistência

### Salvamento Automático

Efeitos com duração `scene` ou `concentration` são salvos automaticamente no banco.

```typescript
// Tabela: characters.activated_effects (JSON)
[
  {
    "id": "track-disparo-letal",
    "name": "Disparo Letal",
    "duration": "scene",
    "activatedAt": 1703419200000
  }
]
```

### Debounce

Salvamento com debounce de 500ms para evitar writes excessivos.

```typescript
const activatedEffects = useActivatedEffects({
  characterId: character.id,
  enablePersistence: true,
  saveDebounceMs: 500, // default
});
```

### Força Salvamento

```typescript
// Salva imediatamente (ex: antes de fechar modal)
await activatedEffects.forceSave();
```

---

## Integração com Combate

### `getTrackCombatBonuses()`

Função especializada para obter bônus de trilha aplicáveis ao combate.

```typescript
import { getTrackCombatBonuses } from '@/lib/effects/track-effects-adapter';

const bonuses = getTrackCombatBonuses(
  trackId,
  nex,
  attributes,
  attackType, // 'melee' | 'ranged'
  activatedEffectIds
);
```

**Retorno:**

```typescript
{
  attackBonus: number;
  damageBonus: number;
  criticalMarginBonus: number;
  criticalMultiplierBonus: number;
  extraDamageDice: string[];
  specialEffects: string[];
  maximumDamageOnCrit: boolean;
}
```

### Uso no CombatRollModal

```typescript
// Em CombatRollModal.tsx
const trackBonuses = getTrackCombatBonuses(
  character.class_track,
  character.nex,
  attributes,
  isRangedWeapon ? 'ranged' : 'melee',
  activatedEffects.activatedEffectIds
);

const totalDamageBonus = baseDamage + trackBonuses.damageBonus;
```

---

## Testes

### Documentação de Testes

Para documentação completa de testes (~366 testes), consulte **[SUE_TEST_COVERAGE.md](./SUE_TEST_COVERAGE.md)**.

### Executar Testes

```bash
# Todos os testes do SUE (~366 testes)
npm run test -- --grep "SUE|effects-adapter|BonusSummary"

# Testes de integração E2E
npm run test -- src/lib/__tests__/sue-integration-e2e.vitest.ts

# Testes de adaptadores específicos
npm run test -- src/lib/effects/__tests__/
```

### Cobertura de Cenários

- ✅ ~366 testes cobrindo todos os adaptadores
- ✅ 15 trilhas oficiais (Combatente + Especialista + Ocultista)
- ✅ 8 origens base + suplementos
- ✅ 30+ condições com mecânicas
- ✅ Poderes paranormais e de classe
- ✅ Rituais sustentados
- ✅ Testes E2E de fluxos completos

---

## Glossário

| Termo | Definição |
|-------|-----------|
| **SUE** | Sistema Unificado de Efeitos |
| **UnifiedEffect** | Estrutura padrão de um efeito no SUE |
| **ComputedEffects** | Resultado consolidado de todos os efeitos |
| **Adaptador** | Módulo que converte dados específicos para UnifiedEffect |
| **Stacking** | Regras de acumulação de bônus |
| **Breakdown** | Lista detalhada de fontes de um bônus |
| **Toggleable** | Efeito que pode ser ativado/desativado |
| **NEX** | Nível de Experiência (5% a 99%) |

---

## Funções Utilitárias do Ritual Adapter

### `getSustainableRituals()`

Retorna lista de todos os rituais que podem ser sustentados.

```typescript
import { getSustainableRituals } from '@/lib/effects/ritual-effects-adapter';

const rituais = getSustainableRituals();
// Retorna array com:
// - id: string
// - name: string
// - circle: number
// - element: string
// - hasCombatEffects: boolean
// - description: string
// - cost: number
```

Critérios de filtragem:
- `isSustainable: true` no ritual, OU
- `duration: 'Sustentada'`

---

## Manutenção

> **IMPORTANTE:** Sempre que modificar o SUE, atualize esta documentação!

### Checklist de Atualização

- [ ] Atualizar diagrama de arquitetura se adicionar novos adaptadores
- [ ] Documentar novos tipos em `ComputedEffects`
- [ ] Adicionar novos IDs de efeitos ao glossário
- [ ] Atualizar changelog com versão e data
- [ ] Verificar se testes cobrem novos cenários

---

## Changelog

| Versão | Data | Alterações |
|--------|------|------------|
| 1.3.0 | 2025-12-31 | Documentação consolidada, link para SUE_TEST_COVERAGE.md, atualização de versões |
| 1.2.0 | 2025-12-30 | Implementado getSustainableRituals(), paridade desktop/mobile, ~30 novos testes |
| 1.1.0 | 2025-12-24 | Persistência de efeitos, testes E2E, suporte a durações, 15 trilhas oficiais |
| 1.0.0 | 2025-12-20 | Motor central, 5 adaptadores, hook useUnifiedEffects, integração com CombatRollModal |
