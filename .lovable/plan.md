
# Plano de Correção: Origens "Agente de Saúde" e "Trabalhador Rural"

## Resumo Executivo
Dois bugs foram identificados afetando as origens **Agente de Saúde** (Técnica Medicinal) e **Trabalhador Rural** (Desbravador). Ambos são problemas de integração onde dados corretos não estão sendo passados para os componentes que precisam deles.

---

## Problema 1: Agente de Saúde - Técnica Medicinal

### Descrição
O poder "Técnica Medicinal" deveria adicionar o valor de Intelecto a **todas** as curas realizadas pelo personagem. No entanto, o bônus não está aparecendo nas rolagens de cura do Paramédico (trilha Médico de Campo).

### Causa Raiz
O componente `MedicoDeCampoPanel` na `CharacterSheet.tsx` **não recebe** a prop `computedEffects` que contém os bônus calculados pelo SUE (Sistema Unificado de Efeitos).

**Código atual** (CharacterSheet.tsx linhas 2769-2788):
```tsx
<MedicoDeCampoPanel
  classTrack={character.class_track}
  nex={character.nex}
  peCurrent={peCurrent}
  // ... outras props
  // computedEffects FALTANDO!
/>
```

### Solução
Adicionar a prop `computedEffects={unifiedEffects}` ao componente `MedicoDeCampoPanel`:

```tsx
<MedicoDeCampoPanel
  classTrack={character.class_track}
  nex={character.nex}
  peCurrent={peCurrent}
  // ... outras props existentes
  computedEffects={unifiedEffects}  // ← ADICIONAR
/>
```

### Arquivos Afetados
1. `src/pages/CharacterSheet.tsx` - Adicionar prop `computedEffects`
2. `src/components/character/MobileCharacterSheet.tsx` - Mesma correção para versão mobile

---

## Problema 2: Trabalhador Rural - Desbravador

### Descrição
O poder "Desbravador" deveria aparecer como opção ativável quando o personagem faz testes de **Adestramento** ou **Sobrevivência**, permitindo gastar 2 PE para receber +5 no teste. Porém, o poder não está aparecendo ou não está sendo filtrado corretamente.

### Causa Raiz
Há **dois problemas** na cadeia de dados:

1. **Confusão entre atributo e perícia**: O valor `rollTestedAttribute` pode estar passando o atributo (ex: "presence") em vez do nome da perícia (ex: "adestramento")

2. **Filtragem por substring inadequada**: A função `isPowerApplicable` usa `normalizedSkill.includes()` que pode falhar com variações de nome

### Solução

#### Parte A: Corrigir passagem do nome da perícia
Garantir que `currentSkill` receba o **nome da perícia** (ex: "adestramento") e não o atributo associado. Verificar onde `rollTestedAttribute` é definido e corrigir para passar o skillId.

#### Parte B: Melhorar normalização na filtragem
Atualizar a função `isPowerApplicable` para normalizar acentos e fazer comparação mais robusta:

```tsx
function isPowerApplicable(power: ActivatablePower, skillId?: string): boolean {
  if (!skillId) return true;
  
  // Normaliza removendo acentos e espaços
  const normalizedSkill = skillId
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');
  
  if (power.applicableSkills && power.applicableSkills.length > 0) {
    return power.applicableSkills.some(s => {
      const normalizedPowerSkill = s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '');
      return normalizedSkill === normalizedPowerSkill || 
             normalizedSkill.includes(normalizedPowerSkill);
    });
  }
  // ... resto da função
}
```

### Arquivos Afetados
1. `src/components/dice/PowerActivationPanel.tsx` - Melhorar normalização
2. `src/pages/CharacterSheet.tsx` - Verificar/corrigir passagem de `rollTestedAttribute`
3. `src/components/character/MobileCharacterSheet.tsx` - Mesma correção mobile

---

## Detalhes Técnicos

### Fluxo de Dados - Agente de Saúde
```text
CharacterSheet
  └── bonusSummary (useBonusSummaryFromSUE)
        └── unifiedEffects (ComputedEffects)
              └── healing.bonusFromOrigin: INT  ← calculado corretamente
                  healing.bonusFromOriginSource: "Técnica Medicinal"
  
  └── MedicoDeCampoPanel (computedEffects NÃO passado) ← BUG
        └── useMedicoDeCampoTrack
              └── sueHealing?.bonusFromOrigin ← undefined por falta de prop
```

### Fluxo de Dados - Trabalhador Rural
```text
CharacterSheet
  └── activatablePowersForCharacter (getActivatablePowersForCharacter)
        └── Desbravador: { applicableSkills: ['adestramento', 'sobrevivencia'] }
  
  └── DiceRollModal
        └── currentSkill: rollTestedAttribute ← pode ser atributo em vez de perícia
        └── PowerActivationPanel
              └── isPowerApplicable(power, currentSkill) ← falha na comparação
```

---

## Checklist de Implementação

- [x] **CharacterSheet.tsx**: Adicionar `computedEffects={unifiedEffects?.computed}` ao MedicoDeCampoPanel
- [x] **MobileCharacterSheet.tsx**: Adicionar mesma prop ao MobileMedicoDeCampoPanel
- [x] **PowerActivationPanel.tsx**: Melhorar função `isPowerApplicable` com normalização de acentos via `normalizeForComparison()`
- [x] **CharacterSheet.tsx**: `handleSkillRoll` agora passa o skillId para `rollTestedAttribute` em vez do atributo
- [x] **MobileCharacterSheet.tsx**: `handleSkillRoll` corrigido para passar skillId
- [ ] **Testes manuais**: 
  - Criar personagem com origem "Agente de Saúde" e trilha "Médico de Campo", verificar se INT é somado nas curas
  - Criar personagem com origem "Trabalhador Rural", testar Adestramento/Sobrevivência e verificar se Desbravador aparece

---

## Impacto
- **Baixo risco**: Alterações localizadas sem impacto em outros sistemas
- **Alta prioridade**: Bugs afetam funcionalidades core de duas origens oficiais

## Tempo Estimado
- Correção: ~30 minutos
- Testes: ~15 minutos
