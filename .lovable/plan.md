
# Plano de Correção: Poder de Origem "Impostor" (Trambiqueiro)

## Problema Identificado

A habilidade de origem **Impostor** do Trambiqueiro está com descrição incorreta e implementação mecânica incompleta.

### Descrição Oficial (Livro Base v1.3)
> "Uma vez por cena, você pode gastar 2 PE para substituir um teste de perícia qualquer por um teste de Enganação."

### Descrição Atual no Sistema (Incorreta)
> "1x/cena: +5 em Enganação para fingir ser outra pessoa | Falha por 5+: descoberto"

### Causas Raiz

1. **Descrição incorreta no SUE** (`src/lib/effects/origin-effects-adapter.ts:258-267`):
   - Descreve como "+5 em Enganação" quando deveria ser "substituir teste por Enganação"
   - Inclui nota punitiva "Falha por 5+: descoberto" que **não existe** na regra oficial

2. **Falta de suporte mecânico a `swapToSkill`** nos modais de rolagem:
   - O bridge já define `swapToSkill: 'enganacao'` corretamente
   - Mas os modais (`DiceRollModal.tsx` e `MobileDiceRollModal.tsx`) ignoram esse campo
   - O bônus da perícia original é usado em vez do bônus de Enganação

---

## Solução Proposta

### Correção 1: Atualizar Descrição no SUE (origin-effects-adapter.ts)

Corrigir a definição do Impostor para refletir a mecânica real de substituição:

```typescript
// ANTES (incorreto):
'impostor': {
  mechanics: {
    specialEffects: [
      '1x/cena: +5 em Enganação para fingir ser outra pessoa',
      'Falha por 5+: descoberto',
    ],
  },
  description: 'Uma vez por cena, +5 em Enganação para fingir ser outra pessoa.',
  isToggleable: true,
},

// DEPOIS (correto):
'impostor': {
  mechanics: {
    specialEffects: [
      '1x/cena: Substitui teste por Enganação (2 PE)',
    ],
  },
  description: 'Uma vez por cena, substitua um teste de perícia qualquer por um teste de Enganação.',
  isToggleable: true,
  costPE: 2,
},
```

### Correção 2: Suportar `swapToSkill` nos Modais de Rolagem

Atualizar `DiceRollModal.tsx` e `MobileDiceRollModal.tsx` para:

1. **Capturar `swapToSkill`** no cálculo de efeitos ativados:
```typescript
const activatedPowerEffects = useMemo(() => {
  // ... código existente ...
  let skillSwap: string | undefined;
  
  for (const ap of activePowers) {
    const effects = calculatePowerActivationEffects(ap.powerId, nex, intellect);
    // ... bônus existentes ...
    if (effects.swapToSkill) skillSwap = effects.swapToSkill;
  }
  
  return { extraBonus, extraDice, attributeSwap, skillSwap, notes };
}, [...]);
```

2. **Buscar bônus da nova perícia** quando `skillSwap` estiver ativo:
```typescript
// Calcular bônus efetivo da perícia
const effectiveSkillBonus = useMemo(() => {
  const swap = activatedPowerEffects.skillSwap;
  if (swap && sueConfig.skills[swap] !== undefined) {
    // Usa bônus da perícia substituta (Enganação/Tecnologia)
    return sueConfig.skills[swap];
  }
  return skillBonus;
}, [activatedPowerEffects.skillSwap, sueConfig.skills, skillBonus]);
```

3. **Atualizar atributo** se a nova perícia usar atributo diferente:
```typescript
// Mapear perícia → atributo base
const SKILL_ATTRIBUTE_MAP: Record<string, string> = {
  enganacao: 'presence',
  tecnologia: 'intellect',
  // ... outras perícias conforme necessário
};

const effectiveAttribute = useMemo(() => {
  const swap = activatedPowerEffects.skillSwap;
  if (swap) {
    const newAttr = SKILL_ATTRIBUTE_MAP[swap];
    if (newAttr === 'presence') return presence;
    if (newAttr === 'intellect') return intellect;
    // ... outros atributos
  }
  // ... lógica existente de attributeSwap
  return attributeValue;
}, [...]);
```

4. **Passar `presence` como nova prop** para os modais (se não existir):
```typescript
// DiceRollModalProps
presence?: number;  // Presença para Impostor (Enganação usa Presença)
```

### Correção 3: Atualizar Documentação (docs/ORIGENS_MECANICAS_COMPLETAS.md)

Alinhar a documentação técnica com a regra oficial:

```markdown
### Trambiqueiro - Impostor
**Tipo:** Ativo (1x/cena, 2 PE)
**Efeito:** Substituir teste de perícia por Enganação

**Implementação SUE:**
'impostor': {
  mechanics: {
    specialEffects: ['1x/cena: Substitui teste por Enganação (2 PE)'],
  },
  isToggleable: true,
  costPE: 2,
}
```

---

## Arquivos Afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/lib/effects/origin-effects-adapter.ts` | Corrigir descrição do Impostor |
| `src/components/dice/DiceRollModal.tsx` | Adicionar suporte a `swapToSkill`, nova prop `presence` |
| `src/components/character/mobile/MobileDiceRollModal.tsx` | Mesmo suporte a `swapToSkill` |
| `src/pages/CharacterSheet.tsx` | Passar `presence` ao DiceRollModal |
| `src/components/character/MobileCharacterSheet.tsx` | Passar `presence` ao MobileDiceRollModal |
| `docs/ORIGENS_MECANICAS_COMPLETAS.md` | Atualizar documentação |

---

## Fluxo Corrigido

```text
Personagem Trambiqueiro faz teste de Diplomacia:

1. Modal de rolagem abre com atributo Presença e bônus de Diplomacia
2. Usuário ativa "Impostor" no painel de poderes (gasta 2 PE)
3. Sistema detecta swapToSkill: 'enganacao'
4. Modal recalcula:
   - Atributo: Presença (mesmo atributo, neste caso)
   - Bônus de Perícia: Enganação (pode ser diferente de Diplomacia)
   - Label atualiza para indicar "Teste de Enganação (via Impostor)"
5. Rolagem usa os valores de Enganação
6. Resultado final reflete a substituição correta
```

---

## Impacto em Outras Origens

A correção de suporte a `swapToSkill` também beneficia:
- **Motor de Busca (T.I.)**: Substitui por Tecnologia
- **Cicatrizes (Vítima)**: Substitui por Vontade (se implementado)

---

## Checklist de Implementação

- [ ] Corrigir descrição do Impostor em `origin-effects-adapter.ts`
- [ ] Adicionar captura de `swapToSkill` em `activatedPowerEffects` (Desktop)
- [ ] Adicionar captura de `swapToSkill` em `activatedPowerEffects` (Mobile)
- [ ] Implementar `effectiveSkillBonus` baseado na perícia substituta
- [ ] Implementar `effectiveAttribute` baseado na perícia substituta
- [ ] Adicionar prop `presence` aos modais (se necessário)
- [ ] Passar `presence` do personagem para os modais nas CharacterSheets
- [ ] Atualizar documentação em `ORIGENS_MECANICAS_COMPLETAS.md`
- [ ] Testar com Trambiqueiro: ativar Impostor em teste de Acrobacia
- [ ] Testar com T.I.: ativar Motor de Busca em teste de Investigação

---

## Tempo Estimado

~1 hora (correções em múltiplos arquivos + testes)

---

## Seção Técnica: Mapeamento Perícia → Atributo

Para que a troca de perícia funcione corretamente, precisamos saber qual atributo base cada perícia usa:

```typescript
// Perícias por Atributo (Livro Base v1.3)
const SKILL_ATTRIBUTES = {
  // Agilidade
  acrobacia: 'agility', reflexos: 'agility', furtividade: 'agility', 
  crime: 'agility', pilotagem: 'agility', pontaria: 'agility',
  
  // Força
  atletismo: 'strength', luta: 'strength',
  
  // Presença
  artes: 'presence', atuacao: 'presence', diplomacia: 'presence',
  enganacao: 'presence', intimidacao: 'presence', vontade: 'presence',
  
  // Intelecto
  ciencias: 'intellect', investigacao: 'intellect', medicina: 'intellect',
  ocultismo: 'intellect', percepcao: 'intellect', profissao: 'intellect',
  sobrevivencia: 'intellect', tatica: 'intellect', tecnologia: 'intellect',
  adestramento: 'intellect', intuicao: 'intellect', religiao: 'intellect',
  
  // Vigor (resistências)
  fortitude: 'vigor',
};
```

Este mapeamento garante que ao substituir Acrobacia (AGI) por Enganação (PRE), o sistema usa Presença como atributo base.
