
# Plano de Correção: Habilidades de Trilha via Versatilidade

## Resumo dos Problemas

Com base no feedback do usuário e análise do código, foram identificados três bugs críticos relacionados a habilidades de trilha obtidas via Versatilidade (NEX 50%):

### Bug 1: Ataque Furtivo com Dados Incorretos
**Sintoma**: Personagem NEX 99% com Ataque Furtivo via Versatilidade recebe apenas 2d6 de dano extra, quando deveria receber 4d6.

**Causa Raiz**: No arquivo `src/lib/effects/track-effects-adapter.ts`, linha 1816:
```typescript
const mechanics = convertTrackAbilityToMechanics(ability, attributes, 50);
//                                                                 ↑
//                                            NEX FIXO EM 50 (BUG!)
```

O sistema usa NEX fixo em 50 para calcular os dados do Ataque Furtivo, ignorando o NEX real do personagem. Como o escalonamento é:
- NEX 10-39%: 1d6
- NEX 40-64%: 2d6 ← Valor usado erroneamente
- NEX 65-98%: 3d6
- NEX 99%: 4d6

### Bug 2: Sem Painel de Ativação
**Sintoma**: A habilidade aparece no card de Versatilidade, mas não há botão para ativar e gastar PE.

**Causa Raiz**: Os painéis de ativação (`InfiltradorPanel.tsx`, `MedicoDeCampoPanel.tsx`) verificam apenas a trilha principal:
```typescript
// useMedicoDeCampoTrack.ts:109
const isMedicoCampo = classTrack === 'Médico de Campo' || classTrack === 'medico-campo';

// useInfiltradorTrack.ts:109  
const isInfiltrador = classTrack === 'infiltrador';
```

Personagens que não têm essas trilhas como trilha principal (mas possuem via Versatilidade) não veem os painéis de ativação.

### Bug 3: Habilidade Automática sem Gasto de PE
**Sintoma**: Os bônus são aplicados automaticamente sem cobrar o custo de PE obrigatório.

**Causa Raiz**: Como não há painel de ativação, o sistema considera a habilidade como "passiva" e aplica os efeitos diretamente, violando a regra oficial que exige gasto de PE para ativação.

---

## Solução Proposta

### Estratégia: Expandir Hooks para Suportar Versatilidade

Em vez de criar um painel separado, a solução é:
1. Passar o NEX real para o cálculo de efeitos de Versatilidade
2. Expandir os hooks existentes (`useInfiltradorTrack`, `useMedicoDeCampoTrack`) para detectar e ativar habilidades obtidas via Versatilidade

---

## Alterações Técnicas

### Correção 1: Usar NEX Real no Cálculo de Versatilidade

**Arquivo**: `src/lib/effects/track-effects-adapter.ts`

**Alteração**: A função `getVersatilityTrackEffects` precisa receber o NEX real do personagem como parâmetro.

```typescript
// ANTES (linha 1798-1803):
export function getVersatilityTrackEffects(
  trackId: string,
  abilityId: string,
  attributes: Record<AttributeType, number>,
  activatedEffects: string[] = []
): UnifiedEffect[] {

// DEPOIS:
export function getVersatilityTrackEffects(
  trackId: string,
  abilityId: string,
  attributes: Record<AttributeType, number>,
  activatedEffects: string[] = [],
  characterNex: number = 50  // ← NOVO PARÂMETRO (default 50 para compatibilidade)
): UnifiedEffect[] {
```

```typescript
// ANTES (linha 1816):
const mechanics = convertTrackAbilityToMechanics(ability, attributes, 50);

// DEPOIS:
const mechanics = convertTrackAbilityToMechanics(ability, attributes, characterNex);
```

### Correção 2: Atualizar Chamadas para Passar NEX

**Arquivo**: `src/hooks/useUnifiedEffects.ts`

Localizar onde `getVersatilityTrackEffects` é chamada e passar o NEX do personagem:

```typescript
// Adicionar nex como parâmetro
if (characterState.versatilityTrack) {
  const versatilityEffects = getVersatilityTrackEffects(
    characterState.versatilityTrack.trackId,
    characterState.versatilityTrack.abilityId,
    characterState.attributes,
    activatedEffects,
    characterState.nex  // ← ADICIONAR
  );
  effects.push(...versatilityEffects);
}
```

### Correção 3: Expandir Hook do Infiltrador para Versatilidade

**Arquivo**: `src/components/character/tracks/especialista/useInfiltradorTrack.ts`

Adicionar prop `versatilityTrack` e verificar se a habilidade foi obtida via Versatilidade:

```typescript
// ADICIONAR à interface UseInfiltradorTrackProps:
/** Trilha de Versatilidade do personagem (se houver) */
versatilityTrack?: {
  trackId: string;
  abilityId: string;
} | null;

// MODIFICAR verificação isInfiltrador (linha 109):
// ANTES:
const isInfiltrador = classTrack === 'infiltrador';

// DEPOIS:
const isInfiltrador = classTrack === 'infiltrador';
const hasAtaqueFurtivoFromVersatility = 
  versatilityTrack?.trackId === 'infiltrador' && 
  versatilityTrack?.abilityId === 'ataque-furtivo-trilha';

// MODIFICAR verificação de hasAtaqueFurtivo (linha 112):
// ANTES:
const hasAtaqueFurtivo = nex >= 10;

// DEPOIS:
const hasAtaqueFurtivo = (isInfiltrador && nex >= 10) || hasAtaqueFurtivoFromVersatility;
```

### Correção 4: Expandir Hook do Médico de Campo para Versatilidade

**Arquivo**: `src/components/character/tracks/especialista/useMedicoDeCampoTrack.ts`

Mesma lógica aplicada ao Médico de Campo:

```typescript
// ADICIONAR à interface UseMedicoDeCampoTrackProps:
/** Trilha de Versatilidade do personagem (se houver) */
versatilityTrack?: {
  trackId: string;
  abilityId: string;
} | null;

// MODIFICAR verificação isMedicoCampo (linha 109):
// ANTES:
const isMedicoCampo = classTrack === 'Médico de Campo' || classTrack === 'medico-campo';

// DEPOIS:
const isMedicoCampo = classTrack === 'Médico de Campo' || classTrack === 'medico-campo';
const hasParamedicoFromVersatility = 
  versatilityTrack?.trackId === 'medico-campo' && 
  versatilityTrack?.abilityId === 'paramedico';

// MODIFICAR verificação de hasParamedico (linha 131):
// ANTES:
const hasParamedico = nex >= 10;

// DEPOIS:
const hasParamedico = (isMedicoCampo && nex >= 10) || hasParamedicoFromVersatility;
```

Além disso, modificar o retorno `isMedicoCampo` para incluir Versatilidade:
```typescript
return {
  // ...
  isMedicoCampo: isMedicoCampo || hasParamedicoFromVersatility,  // ← MODIFICAR
  // ...
};
```

### Correção 5: Passar Versatility Track para os Painéis

**Arquivos**: 
- `src/pages/CharacterSheet.tsx`
- `src/components/character/MobileCharacterSheet.tsx`

Adicionar prop `versatilityTrack` aos painéis:

```tsx
{/* Infiltrador */}
<InfiltradorPanel
  classTrack={character.class_track}
  nex={character.nex}
  // ... outras props ...
  versatilityTrack={character.versatility_track}  // ← ADICIONAR
/>

{/* Médico de Campo */}
<MedicoDeCampoPanel
  classTrack={character.class_track}
  nex={character.nex}
  // ... outras props ...
  versatilityTrack={character.versatility_track}  // ← ADICIONAR
/>
```

### Correção 6: Atualizar Interfaces dos Painéis

**Arquivos**:
- `src/components/character/tracks/especialista/InfiltradorPanel.tsx`
- `src/components/character/tracks/especialista/MedicoDeCampoPanel.tsx`

Adicionar a prop às interfaces:

```typescript
// InfiltradorPanelProps
interface InfiltradorPanelProps extends UseInfiltradorTrackProps {
  versatilityTrack?: { trackId: string; abilityId: string } | null;
}

// MedicoDeCampoPanelProps
interface MedicoDeCampoPanelProps extends UseMedicoDeCampoTrackProps {
  versatilityTrack?: { trackId: string; abilityId: string } | null;
}
```

---

## Arquivos Afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/effects/track-effects-adapter.ts` | Adicionar parâmetro `characterNex` a `getVersatilityTrackEffects` |
| `src/hooks/useUnifiedEffects.ts` | Passar NEX ao chamar `getVersatilityTrackEffects` |
| `src/components/character/tracks/especialista/useInfiltradorTrack.ts` | Suportar Versatilidade no Ataque Furtivo |
| `src/components/character/tracks/especialista/useMedicoDeCampoTrack.ts` | Suportar Versatilidade no Paramédico |
| `src/components/character/tracks/especialista/InfiltradorPanel.tsx` | Passar prop versatilityTrack ao hook |
| `src/components/character/tracks/especialista/MedicoDeCampoPanel.tsx` | Passar prop versatilityTrack ao hook |
| `src/pages/CharacterSheet.tsx` | Passar versatility_track aos painéis |
| `src/components/character/MobileCharacterSheet.tsx` | Passar versatility_track aos painéis |

---

## Fluxo Corrigido

### Cenário: Personagem Combatente NEX 99% com Ataque Furtivo via Versatilidade

1. No NEX 50%, usuário escolheu Ataque Furtivo (Infiltrador) via Versatilidade
2. Personagem agora é NEX 99%
3. Ao abrir a ficha:
   - `InfiltradorPanel` detecta `versatilityTrack.trackId === 'infiltrador'`
   - Hook retorna `isMedicoCampo: false`, `hasAtaqueFurtivo: true`
   - Painel de Ataque Furtivo é exibido
4. Ao clicar "Ativar":
   - Sistema deduz 1 PE
   - Calcula dados: `getAtaqueFurtivoBaseDice(99)` = 4d6
   - Exibe toast: "Ataque Furtivo ativado! +4d6 dano extra"
5. SUE recebe `characterNex: 99` e calcula corretamente os dados

### Cenário: Paramédico via Versatilidade

1. Personagem Combatente com Paramédico (Médico de Campo) via Versatilidade
2. `MedicoDeCampoPanel` detecta `versatilityTrack.trackId === 'medico-campo'`
3. Painel de Paramédico é exibido com botão "Curar"
4. Usuário pode selecionar dados extras conforme seu NEX
5. Sistema deduz PE e abre modal de rolagem de cura

---

## Regra Oficial Aplicada

### Versatilidade (Livro Base v1.3, p.50)
> "No 5º NEX, você pode escolher entre dois benefícios: (1) um poder de classe adicional, ou (2) o primeiro poder de outra trilha de sua classe."

A correção garante que:
- A habilidade escolhida funcione exatamente como na trilha original
- O escalonamento por NEX seja respeitado (Ataque Furtivo: 1d6 → 4d6)
- O custo de PE seja cobrado corretamente
- Limites de uso por rodada/cena sejam aplicados

---

## Considerações de Outras Trilhas

A correção também beneficia outras habilidades de trilha que podem ser escolhidas via Versatilidade:

| Trilha | Habilidade NEX 10% | Requer Ativação? |
|--------|-------------------|------------------|
| Aniquilador | Técnica Secreta (escolha arma) | Não |
| Infiltrador | Ataque Furtivo | Sim (1 PE) |
| Atirador de Elite | Mira de Elite | Não (passivo) |
| Médico de Campo | Paramédico | Sim (2+ PE) |
| Negociador | Eu Conheço um Cara | Sim (2 PE) |
| Operações Especiais | Iniciativa Aprimorada | Não (passivo) |
| Técnico | Inventário Otimizado | Não (passivo) |
| Flagelador | Devoção | Não (passivo) |
| Lâmina Paranormal | Corte Elemental | Sim (1 PE) |
| Conduíte | Olhar da Ruína | Não (passivo) |
| Integrante de Culto | Língua dos Anciões | Não (passivo) |
| Graduado | Teoria na Prática | Não (passivo) |

---

## Checklist de Implementação

- [ ] Adicionar parâmetro `characterNex` a `getVersatilityTrackEffects`
- [ ] Usar `characterNex` em vez de 50 fixo no cálculo de mecânicas
- [ ] Atualizar `useUnifiedEffects` para passar NEX ao chamar a função
- [ ] Adicionar prop `versatilityTrack` ao hook `useInfiltradorTrack`
- [ ] Detectar Ataque Furtivo via Versatilidade no hook
- [ ] Adicionar prop `versatilityTrack` ao hook `useMedicoDeCampoTrack`
- [ ] Detectar Paramédico via Versatilidade no hook
- [ ] Atualizar interfaces de props dos painéis
- [ ] Passar `versatility_track` aos painéis em CharacterSheet (desktop)
- [ ] Passar `versatility_track` aos painéis em MobileCharacterSheet
- [ ] Testar: Ataque Furtivo via Versatilidade em NEX 99% (deve dar 4d6)
- [ ] Testar: Paramédico via Versatilidade deve aparecer e funcionar

---

## Impacto

- **Médio risco**: Alteração em múltiplos arquivos com lógica de verificação
- **Alta prioridade**: Bug impede uso correto de habilidades obtidas via Versatilidade

## Tempo Estimado

~1.5 horas (correções em 8 arquivos + testes)
