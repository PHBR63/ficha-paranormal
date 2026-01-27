
# Plano de Correção: Custo de PE Dinâmico do Ataque Especial

## Resumo do Problema

O sistema de Ataque Especial exibe e cobra um custo de PE fixo baseado no tier máximo do NEX, independentemente de quantos incrementos de +5 o jogador escolhe usar.

### Comportamento Atual (Bug)
- NEX 85%+ = sempre 5 PE, mesmo com 0 incrementos usados
- NEX 55%+ = sempre 4 PE, mesmo com 0 incrementos usados
- NEX 25%+ = sempre 3 PE, mesmo com 0 incrementos usados

### Comportamento Correto (Regras Oficiais - Livro Base v1.3)
- **Custo base**: 2 PE para o primeiro incremento (+5)
- **Escalonamento**: +1 PE para cada incremento adicional
- **Custo por incrementos usados**:
  - 0 incrementos = 0 PE (não ativou)
  - 1 incremento = 2 PE
  - 2 incrementos = 3 PE
  - 3 incrementos = 4 PE
  - 4 incrementos = 5 PE

O NEX determina **quantos incrementos estão disponíveis**, não o custo fixo.

---

## Análise Técnica

### Arquivos Afetados

| Arquivo | Problema |
|---------|----------|
| `src/lib/class-powers/special-attack-utils.ts` | `getSpecialAttackOptions` retorna custo fixo; `calculateSpecialAttackFinal` usa esse custo fixo |
| `src/components/character/SpecialAttackSelector.tsx` | UI exibe `options.peCost` (custo máximo) em vez de custo dinâmico |
| `src/lib/class-powers/activatable-powers-bridge.ts` | `getAtaqueEspecialTier` também retorna custo fixo |

### Causa Raiz

1. **`getSpecialAttackOptions`** (linha 24-35): Define `peCost` como valor máximo do tier
2. **`calculateSpecialAttackFinal`** (linha 118): Retorna `options.peCost` (fixo)
3. **UI** (linhas 187, 320): Exibe `options.peCost` no badge

---

## Solução Proposta

### Estratégia: Custo Dinâmico Baseado em Incrementos Usados

Criar nova função para calcular custo real baseado nos incrementos selecionados:

```typescript
/**
 * Calcula o custo de PE baseado nos incrementos usados
 * Regra oficial: 2 PE base + 1 PE por incremento adicional
 */
export function calculateDynamicPECost(totalIncrements: number): number {
  if (totalIncrements <= 0) return 0;
  // 1 incremento = 2 PE, 2 incrementos = 3 PE, etc.
  return 1 + totalIncrements;  // ou: 2 + (totalIncrements - 1)
}
```

---

## Alterações Detalhadas

### 1. Atualizar `special-attack-utils.ts`

**Arquivo**: `src/lib/class-powers/special-attack-utils.ts`

**Adicionar nova função**:
```typescript
/**
 * Calcula o custo de PE baseado nos incrementos usados
 * Regra oficial: 2 PE para primeiro +5, +1 PE por +5 adicional
 */
export function calculateDynamicPECost(totalIncrements: number): number {
  if (totalIncrements <= 0) return 0;
  return 1 + totalIncrements; // 1 incr = 2 PE, 2 incr = 3 PE, etc.
}
```

**Modificar `getSpecialAttackOptions`**:
Renomear `peCost` para `maxPECost` para clareza (custo máximo possível no tier):
```typescript
export interface SpecialAttackOptions {
  maxPECost: number;     // Custo MÁXIMO em PE (limite do tier)
  totalBonus: number;    // Bônus total disponível (+5 por incremento)
  increments: number;    // Quantidade de incrementos de +5
  nexTier: string;       // Label do tier para UI
}
```

**Modificar `calculateSpecialAttackFinal`**:
Calcular custo dinamicamente baseado nos incrementos usados:
```typescript
// ANTES (linha 118):
peCost: options.peCost,

// DEPOIS:
peCost: calculateDynamicPECost(totalUsed),
```

**Atualizar cálculo de Força Bruta** (linha 95-98):
Usar custo dinâmico em vez de custo máximo:
```typescript
// ANTES:
const forcaBrutaBonus = options.peCost * 2;

// DEPOIS:
const actualPECost = calculateDynamicPECost(totalUsed);
const forcaBrutaBonus = actualPECost * 2;
```

### 2. Atualizar `SpecialAttackSelector.tsx`

**Arquivo**: `src/components/character/SpecialAttackSelector.tsx`

**Importar nova função**:
```typescript
import {
  // ... imports existentes
  calculateDynamicPECost,
} from '@/lib/class-powers/special-attack-utils';
```

**Calcular custo dinâmico**:
```typescript
// Novo memo para custo dinâmico
const dynamicPECost = useMemo(() => 
  calculateDynamicPECost(config.attackIncrements + config.damageIncrements),
  [config.attackIncrements, config.damageIncrements]
);
```

**Atualizar verificação `canAfford`** (linha 94):
```typescript
// ANTES:
const canAfford = currentPE >= options.peCost;

// DEPOIS:
// Pode pagar se: não ativou (0 PE) OU tem PE para pelo menos 1 incremento (2 PE)
const canAfford = currentPE >= 2;
```

**Atualizar badges de PE** (linhas 187, 320):
```typescript
// ANTES:
<Badge variant="secondary" className="text-xs">
  {options.peCost} PE
</Badge>

// DEPOIS:
<Badge variant="secondary" className={cn(
  "text-xs",
  dynamicPECost > 0 && "bg-primary text-primary-foreground"
)}>
  {dynamicPECost > 0 ? dynamicPECost : options.maxPECost} PE
</Badge>
```

**Atualizar tooltip** (linhas 329-333):
```typescript
// ANTES:
<p className="text-sm">
  Gaste {options.peCost} PE para distribuir +{options.totalBonus} entre ataque e dano.
</p>

// DEPOIS:
<p className="text-sm">
  Gaste 2 PE para +5 em ataque ou dano. Cada +5 adicional custa +1 PE (máx {options.maxPECost} PE).
</p>
```

**Atualizar aviso PE insuficiente** (linhas 287-291, 507-512):
```typescript
// ANTES:
<p className="text-xs text-destructive">
  PE insuficiente ({currentPE}/{options.peCost} necessário)
</p>

// DEPOIS:
<p className="text-xs text-destructive">
  PE insuficiente ({currentPE}/2 mínimo necessário)
</p>
```

**Atualizar badge Força Bruta** (linhas 272-274, 468):
```typescript
// ANTES:
Força Bruta (+{options.peCost * 2})

// DEPOIS:
Força Bruta (+{dynamicPECost * 2})
```

### 3. Atualizar `activatable-powers-bridge.ts`

**Arquivo**: `src/lib/class-powers/activatable-powers-bridge.ts`

**Modificar `getAtaqueEspecialTier`** (linhas 133-138):
```typescript
// Manter para limites de incrementos, mas clarificar que é o máximo
export function getAtaqueEspecialTier(nex: number): { maxCost: number; maxBonus: number; increments: number } {
  if (nex >= 85) return { maxCost: 5, maxBonus: 20, increments: 4 };
  if (nex >= 55) return { maxCost: 4, maxBonus: 15, increments: 3 };
  if (nex >= 25) return { maxCost: 3, maxBonus: 10, increments: 2 };
  return { maxCost: 2, maxBonus: 5, increments: 1 };
}
```

---

## Fluxo Corrigido

### Exemplo: Personagem NEX 85%+ com 0 incrementos
1. Toggle "Ataque Especial" = ON
2. Badge mostra: "0 PE" (nenhum incremento selecionado)
3. Incrementos disponíveis: 4, Usados: 0

### Exemplo: Personagem NEX 85%+ com 2 incrementos (+10 total)
1. Adiciona 1 incremento ao ataque (+5)
2. Badge mostra: "2 PE"
3. Adiciona 1 incremento ao dano (+5)
4. Badge mostra: "3 PE"
5. Força Bruta (se tiver): +6 dano (3 PE × 2)

### Exemplo: Personagem NEX 85%+ com 4 incrementos (+20 total)
1. Usa todos os 4 incrementos
2. Badge mostra: "5 PE" (máximo)
3. Força Bruta: +10 dano (5 PE × 2)

---

## Tabela de Custos Corrigida

| Incrementos Usados | Bônus Total | Custo PE |
|-------------------|-------------|----------|
| 0 | +0 | 0 PE |
| 1 | +5 | 2 PE |
| 2 | +10 | 3 PE |
| 3 | +15 | 4 PE |
| 4 | +20 | 5 PE |

---

## Compatibilidade com Força Bruta

O poder **Força Bruta** concede +2 de dano por PE gasto. Com o custo dinâmico:

| Incrementos | Custo PE | Força Bruta |
|-------------|----------|-------------|
| 1 | 2 PE | +4 dano |
| 2 | 3 PE | +6 dano |
| 3 | 4 PE | +8 dano |
| 4 | 5 PE | +10 dano |

---

## Arquivos a Modificar

1. **`src/lib/class-powers/special-attack-utils.ts`**
   - Adicionar `calculateDynamicPECost`
   - Modificar interface `SpecialAttackOptions` (renomear `peCost` → `maxPECost`)
   - Atualizar `getSpecialAttackOptions`
   - Atualizar `calculateSpecialAttackFinal` para usar custo dinâmico
   - Corrigir cálculo de Força Bruta

2. **`src/components/character/SpecialAttackSelector.tsx`**
   - Importar `calculateDynamicPECost`
   - Adicionar memo para custo dinâmico
   - Atualizar badges para exibir custo correto
   - Atualizar tooltips explicativos
   - Corrigir exibição de Força Bruta

3. **`src/lib/class-powers/activatable-powers-bridge.ts`**
   - Atualizar `getAtaqueEspecialTier` para clareza

---

## Impacto

- **Médio risco**: Alteração na lógica de custo pode afetar outros sistemas que usam `getSpecialAttackOptions`
- **Alta prioridade**: Bug afeta todos os Combatentes com Ataque Especial

## Tempo Estimado

~45 minutos (correções em 3 arquivos + testes manuais)
