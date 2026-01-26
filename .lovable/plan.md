
# Plano de Correção: Poderes de Classe do Especialista

## Resumo Executivo
Cinco bugs foram identificados afetando poderes de classe do **Especialista**, envolvendo falta de UI para ativação, falta de opção de ataque desarmado, e bônus não sendo aplicados automaticamente.

---

## Bugs Identificados

### Bug 1: "Na Trilha Certa" - Sem local para ativar
**Descrição**: Poder não tem UI para ativar. Deveria permitir gastar PE cumulativamente após sucesso em "procurar pistas" para receber +1d20 nos próximos testes.

**Causa Raiz**: O poder está definido em `especialista-powers.ts:447-475` com `kind: 'triggered'`, mas **não está cadastrado** no array `ACTIVATABLE_ESPECIALISTA_POWERS` do hook `useActivatableClassPowers.ts`.

---

### Bug 2: "Pensamento Ágil" - Sem local para ativar
**Descrição**: Poder não tem UI para ativar. Deveria permitir gastar 2 PE (1x/rodada) durante investigação para fazer ação extra de procurar pistas.

**Causa Raiz**: Similar ao anterior - poder definido em `especialista-powers.ts:527-551` com `kind: 'activated'`, mas **não está no catálogo** de poderes ativáveis.

---

### Bug 3: "Primeiras Impressões" - Efeito não aplicado
**Descrição**: Deveria conceder +1d20 no **primeiro** teste de Diplomacia, Enganação, Intimidação ou Intuição de cada cena.

**Causa Raiz**: O poder está definido corretamente em `especialista-powers.ts:571-593` com `extraDice` e condição `firstInScene: true`. Porém, o sistema de rolagem de perícias **não rastreia** se é o primeiro teste da cena dessas perícias, e a lógica de `extraDice` para perícias específicas **não está integrada** ao `DiceRollModal`.

---

### Bug 4: "Artista Marcial" - Sem opção de ataque desarmado
**Descrição**: Quando nenhuma arma está equipada, deveria aparecer opção de "Ataque Desarmado" na aba de combate. O dano base é 1d4+FOR (padrão) ou escala com o poder (1d6/1d8/1d10 + Ágil).

**Causa Raiz**: 
1. O painel de combate (`MobileCombatPanel.tsx:262`) simplesmente não mostra nada se `weapons.length === 0`
2. As funções `rollAttackWithContext` e `rollDamageWithContext` exigem um `weaponId` e não suportam ataques desarmados
3. O dano desarmado **é calculado** pelo SUE em `power-effects-engine.ts:386-393`, mas **não há arma virtual** criada para representar o ataque desarmado

---

### Bug 5: "Ninja Urbano" - Passiva não aplicada em corpo a corpo
**Descrição**: +2 de dano em armas corpo a corpo (e disparo não-fogo) não está sendo aplicado nas rolagens de combate.

**Causa Raiz**: O poder está definido em `especialista-powers.ts:498-524` com `damageBonus: { value: 2, conditions: { weaponType: ['melee', 'ranged-nonfirearm'] } }`. O problema é que:
1. O adaptador de efeitos (`class-power-effects-adapter.ts`) pode não estar mapeando `melee` corretamente
2. O `rollDamageWithContext` usa `meleeDamageBonus` do SUE, mas a condição `['melee', 'ranged-nonfirearm']` pode não estar gerando esse campo

---

## Solução Proposta

### Parte 1: Adicionar "Na Trilha Certa" e "Pensamento Ágil" ao catálogo de ativáveis
**Arquivo**: `src/hooks/useActivatableClassPowers.ts`

Adicionar ambos os poderes ao array `ACTIVATABLE_ESPECIALISTA_POWERS`:

```typescript
// Na Trilha Certa
{
  id: 'na-trilha-certa',
  name: 'Na Trilha Certa',
  shortEffect: '+1d20 cumulativo após sucesso em procurar pistas',
  description: 'Sempre que tiver sucesso em um teste para procurar pistas, pode gastar PE para receber +1d20 no próximo teste. Custos e bônus são cumulativos.',
  basePECost: 1,
  scalingCost: {
    multiplier: 1,
    description: 'Custo aumenta +1 PE por uso na cena'
  },
  limit: 'perScene', // Reseta na cena, mas cumulativo dentro dela
  minNex: 15,
  icon: 'search',
  pageRef: 'Livro Base p.50',
  conditionalBonusId: 'na-trilha-certa-ativo',
},

// Pensamento Ágil
{
  id: 'pensamento-agil',
  name: 'Pensamento Ágil',
  shortEffect: 'Ação extra de procurar pistas (1x/rodada)',
  description: 'Durante cena de investigação, gaste 2 PE para fazer uma ação adicional de procurar pistas.',
  basePECost: 2,
  limit: 'perRound',
  minNex: 15,
  icon: 'search',
  pageRef: 'Livro Base p.51',
}
```

---

### Parte 2: Implementar rastreamento de "primeiro teste da cena" para Primeiras Impressões
**Arquivos**: 
- `src/hooks/useActivatableClassPowers.ts` - Adicionar poder
- `src/pages/CharacterSheet.tsx` e `MobileCharacterSheet.tsx` - Rastrear testes por cena
- `src/components/dice/DiceRollModal.tsx` e mobile - Aplicar +1d20 quando aplicável

**Lógica**:
1. Manter um Set de perícias já testadas na cena
2. Antes de rolar Diplomacia/Enganação/Intimidação/Intuição, verificar se é o primeiro teste
3. Se sim E personagem tem "Primeira Impressão", adicionar +1d20 à pool automaticamente
4. Marcar a perícia como testada para o resto da cena
5. "Reset Scene" limpa o Set

---

### Parte 3: Criar "Arma Virtual" de Ataque Desarmado
**Arquivos**:
- `src/lib/rules-engine/types.ts` - Definir constante `UNARMED_WEAPON_ID`
- `src/lib/rules-engine/helpers/attack-with-sue.ts` - Suportar weaponId especial
- `src/lib/rules-engine/apply-and-roll.ts` - Criar arma virtual quando `weaponId === 'unarmed'`
- `src/components/combat/MobileCombatPanel.tsx` e desktop equivalente - Exibir botão "Desarmado"

**Lógica**:
1. Definir constante `UNARMED_WEAPON_ID = '__unarmed__'`
2. Quando `weaponId === UNARMED_WEAPON_ID`:
   - Criar arma virtual com: `name: 'Ataque Desarmado'`, `damage: '1d4'` (padrão) ou valor do SUE `unarmedDamage` (Artista Marcial), `attackSkill: 'luta'`, `attackAttribute: 'agility'` se Artista Marcial (ágil) ou `strength`
3. No painel de combate, sempre exibir opção "Ataque Desarmado" mesmo sem armas equipadas
4. Se personagem tem Artista Marcial, mostrar dano escalado (1d6/1d8/1d10) e badge "Ágil"

---

### Parte 4: Corrigir bônus de dano do Ninja Urbano
**Arquivo**: `src/lib/effects/class-power-effects-adapter.ts`

Garantir que a condição `weaponType: ['melee', 'ranged-nonfirearm']` gere corretamente os campos:
- `meleeDamageBonus: 2` quando arma é corpo a corpo
- Campo separado para disparo não-fogo (ou usar `rangedDamageBonus` com filtro)

**Verificar**:
1. Se o adaptador está processando arrays em `conditions.weaponType`
2. Se o SUE bridge está passando o tipo de arma correto para o contexto

---

## Detalhes Técnicos

### Fluxo de Ativação de Poderes
```text
CharacterSheet
  └── ClassPowersActivationPanel
        └── useActivatableClassPowers (hook)
              └── ACTIVATABLE_ESPECIALISTA_POWERS (catálogo)
                    └── [Faltam: na-trilha-certa, pensamento-agil]
```

### Fluxo de Ataque Desarmado (Proposto)
```text
CombatPanel (weapons.length === 0)
  └── [NOVO] Botão "Ataque Desarmado"
        └── CombatRollModal(weaponId='__unarmed__')
              └── rollAttackWithContext
                    └── [NOVO] Criar arma virtual
                          └── damage: SUE.unarmedDamage || '1d4'
                          └── attackSkill: 'luta'
                          └── attackAttribute: hasArtistaMarcial ? 'agility' : 'strength'
```

### Condições de Perícias (Primeira Impressão)
```text
DiceRollModal
  └── skillId in ['diplomacia', 'enganacao', 'intimidacao', 'intuicao']
        └── isFirstInScene[skillId] === true
              └── hasPower('primeira-impressao')
                    └── [AUTOMÁTICO] Adicionar +1d20 à pool
                    └── Marcar isFirstInScene[skillId] = false
```

---

## Checklist de Implementação

### Parte 1: Poderes Ativáveis (Na Trilha Certa + Pensamento Ágil)
- [ ] Adicionar `na-trilha-certa` ao `ACTIVATABLE_ESPECIALISTA_POWERS` com custo escalável
- [ ] Adicionar `pensamento-agil` ao `ACTIVATABLE_ESPECIALISTA_POWERS` com limite perRound
- [ ] Testar se aparecem no `ClassPowersActivationPanel` para Especialistas

### Parte 2: Primeira Impressão
- [ ] Criar estado `firstTestsInScene: Set<string>` no CharacterSheet
- [ ] Modificar `handleSkillRoll` para verificar se é primeiro teste das 4 perícias
- [ ] Passar flag `isFirstInScene` para DiceRollModal
- [ ] No DiceRollModal, se `isFirstInScene && hasPower('primeira-impressao')`, adicionar +1d20
- [ ] Após rolagem, marcar perícia como usada no Set
- [ ] Resetar Set no "Reset Scene"
- [ ] Mesma lógica para mobile

### Parte 3: Ataque Desarmado
- [ ] Definir `UNARMED_WEAPON_ID` em types.ts
- [ ] Modificar `rollAttackWithContext` para criar arma virtual
- [ ] Modificar `rollDamageWithContext` para usar `unarmedDamage` do SUE
- [ ] Adicionar botão "Ataque Desarmado" no painel de combate (desktop + mobile)
- [ ] Exibir dano correto baseado em Artista Marcial (se aplicável)
- [ ] Marcar como "Ágil" se tiver Artista Marcial

### Parte 4: Ninja Urbano
- [ ] Auditar `class-power-effects-adapter.ts` para condição `weaponType: ['melee', ...]`
- [ ] Garantir que `meleeDamageBonus` é populado quando arma é corpo a corpo
- [ ] Adicionar tratamento para `ranged-nonfirearm` (arco, besta, etc.)
- [ ] Verificar se `rollDamageWithContext` aplica o bônus corretamente
- [ ] Testar com arma corpo a corpo e arma de disparo não-fogo

### Testes
- [ ] Criar personagem Especialista com cada poder e verificar funcionamento
- [ ] Testar "Na Trilha Certa" em sequência de testes de investigação
- [ ] Testar "Pensamento Ágil" 2x na mesma rodada (deve bloquear segunda)
- [ ] Testar "Primeira Impressão" - primeiro teste da cena deve ter +1d20
- [ ] Testar "Artista Marcial" sem arma - deve mostrar ataque desarmado
- [ ] Testar "Ninja Urbano" com espada - deve ter +2 dano

---

## Impacto
- **Médio-Alto risco**: Mudanças afetam sistema de combate e rolagem de perícias
- **Alta prioridade**: Bugs afetam 5 poderes oficiais do Especialista

## Tempo Estimado
- Parte 1 (Ativáveis): ~30 minutos
- Parte 2 (Primeira Impressão): ~45 minutos
- Parte 3 (Ataque Desarmado): ~1 hora
- Parte 4 (Ninja Urbano): ~30 minutos
- Testes: ~30 minutos

**Total**: ~3 horas
