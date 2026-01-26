
# Plano de Correção: Poderes Ativáveis em Testes de Perícia

## Resumo Executivo
Dois bugs críticos afetam o sistema de ativação de poderes durante testes de perícia:
1. **Rolagem automática prematura**: O sistema rola os dados automaticamente ~150-200ms após abrir o modal, antes do jogador escolher quais poderes ativar
2. **Bônus de poderes não aplicados**: Mesmo ativando poderes, os bônus de perícia (+5) de várias origens não são calculados

---

## Bug 1: Rolagem Automática Prematura

### Descrição
Ao abrir o modal de rolagem (desktop ou mobile), os dados são rolados automaticamente após um curto delay, **antes** do jogador ter chance de selecionar quais poderes ativar. O painel de poderes ativáveis só aparece visualmente após os dados já terem sido rolados.

### Causa Raiz
**Desktop** (`DiceRollModal.tsx:328-338`):
```tsx
useEffect(() => {
  if (open && !hasRolledRef.current) {
    hasRolledRef.current = true;
    const timer = setTimeout(() => {
      executeRoll();  // ← Rola após 150ms
    }, 150);
    return () => clearTimeout(timer);
  }
}, [open]);
```

**Mobile** (`MobileDiceRollModal.tsx:277-283`):
```tsx
useEffect(() => {
  if (open && !hasRolledRef.current) {
    hasRolledRef.current = true;
    const timer = setTimeout(executeRoll, 200);  // ← Rola após 200ms
    return () => clearTimeout(timer);
  }
}, [open, executeRoll]);
```

### Solução
Implementar **duas fases** no modal de rolagem:

```text
┌─────────────────────────────────────────────┐
│  FASE 1: PREPARAÇÃO (Nova!)                 │
│  ─────────────────────────────              │
│  • Modal abre                               │
│  • Exibe pool de dados (placeholders)       │
│  • Exibe painel de poderes ativáveis        │
│  • Jogador escolhe quais ativar             │
│  • Botão "ROLAR DADOS" para confirmar       │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│  FASE 2: ROLAGEM (Comportamento atual)      │
│  ─────────────────────────────              │
│  • Animação de dados                        │
│  • Exibe resultado                          │
│  • Botão "Rolar Novamente" disponível       │
└─────────────────────────────────────────────┘
```

**Alterações específicas**:

1. Adicionar nova fase `'preparing'` ao estado:
   ```tsx
   const [phase, setPhase] = useState<'preparing' | 'rolling' | 'done'>('preparing');
   ```

2. Remover auto-roll no `useEffect` de abertura:
   ```tsx
   useEffect(() => {
     if (open) {
       setPhase('preparing'); // Começa na fase de preparação
     }
   }, [open]);
   ```

3. Mover painel de poderes para **antes** da área de dados quando em fase `'preparing'`

4. Adicionar botão "ROLAR DADOS" que chama `executeRoll()` após seleção

5. Se não houver poderes ativáveis disponíveis, pode manter comportamento automático (opcional)

---

## Bug 2: Bônus de Poderes de Origem Não Aplicados

### Descrição
Poderes de origem como "Desbravador" (+5), "110%" (+5), "Faro para Pistas" (+5), etc. aparecem no painel de ativação, mas quando ativados e a rolagem é feita, o bônus **não é somado** ao resultado.

### Causa Raiz
A função `calculatePowerActivationEffects` em `activatable-powers-bridge.ts` **não possui cases** para a maioria dos poderes de origem. Quando o `switch(powerId)` não encontra match, cai no `default` que retorna `skillBonusChange: 0`.

**Poderes com case implementado**: Apenas `saber-e-poder` (linhas 1067-1072)

**Poderes SEM case (faltando)**:
- `desbravador` → Deveria retornar `skillBonusChange: 5`
- `110-porcento` → Deveria retornar `skillBonusChange: 5`
- `faro-para-pistas` → Deveria retornar `skillBonusChange: 5`
- `processo-otimizado` → Deveria retornar `skillBonusChange: 5`
- `motor-de-busca` → Deveria retornar `swapToSkill: 'tecnologia'`
- `impostor` → Deveria retornar `swapToSkill: 'enganacao'`
- `magnum-opus` → Deveria retornar `skillBonusChange: 5` (com nota sobre PRE×2)
- `espirito-civico` → Deveria retornar `allyBonus: 2`

### Solução
Adicionar cases para todos os poderes de origem na função `calculatePowerActivationEffects`:

```typescript
// ========== ORIGENS ==========

case 'desbravador':
  return {
    skillBonusChange: 5,
    specialNote: '+5 em Adestramento ou Sobrevivência',
  };

case '110-porcento':
  return {
    skillBonusChange: 5,
    specialNote: '+5 no teste (FOR ou AGI, exceto Luta/Pontaria)',
  };

case 'faro-para-pistas':
  return {
    skillBonusChange: 5,
    specialNote: '+5 em Investigação/Percepção para procurar pistas',
  };

case 'processo-otimizado':
  return {
    skillBonusChange: 5,
    specialNote: '+5 em teste estendido ou revisão de documentos',
  };

case 'motor-de-busca':
  return {
    skillBonusChange: 0,
    swapToSkill: 'tecnologia',
    specialNote: 'Substitui perícia por Tecnologia (requer internet)',
  };

case 'impostor':
  return {
    skillBonusChange: 0,
    swapToSkill: 'enganacao',
    specialNote: 'Substitui perícia por Enganação (1x/cena)',
  };

case 'magnum-opus':
  return {
    skillBonusChange: 5,
    specialNote: 'PRE×2 no atributo + 5 (1x/missão, alvo reconhece trabalho)',
  };

case 'espirito-civico':
  return {
    skillBonusChange: 0,
    allyBonus: 2,
    specialNote: 'Ajudar dá +4 em vez de +2',
  };

case 'posicao-de-combate':
  return {
    skillBonusChange: 0,
    movementBonus: 1, // Ação de movimento extra
    specialNote: '+1 ação de movimento (1º turno de combate)',
  };

case 'patrulha-iniciativa':
  return {
    skillBonusChange: 0,
    attributeSwap: 'presence', // Percepção usa Presença
    specialNote: 'Usa Percepção em vez de Agilidade para Iniciativa',
  };

case 'cicatrizes-vontade':
  return {
    skillBonusChange: 0,
    swapToSkill: 'vontade',
    specialNote: 'Substitui teste de atributo por Vontade (1x/cena)',
  };
```

---

## Arquivos Afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/dice/DiceRollModal.tsx` | Adicionar fase "preparing", remover auto-roll, adicionar botão "Rolar" |
| `src/components/character/mobile/MobileDiceRollModal.tsx` | Mesmas alterações para paridade mobile |
| `src/lib/class-powers/activatable-powers-bridge.ts` | Adicionar ~15 cases de poderes de origem em `calculatePowerActivationEffects` |

---

## Fluxo Visual Proposto

```text
┌─────────────────────────────────────────────────────────────┐
│                    🎲 ATUALIDADES                           │
│                 Pool de 4d20, pega o maior                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⚡ Poderes Ativáveis (3)              PE: 55 | Custo: 0    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ▼ Poderes Disponíveis                              │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ 🧠 Conhecimento Aplicado      2 PE      ○           │   │
│  │    Usar INT no teste                                │   │
│  │ 📖 Nerd                       2 PE      ○           │   │
│  │    Info extra (1x/cena)                             │   │
│  │ ⚡ Eclético (Treinado)         2 PE      ●           │   │
│  │    +5 (treinado)                                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│       [  ]    [  ]    [  ]    [  ]     ← Placeholders       │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            🎲 ROLAR DADOS                            │   │ ← NOVO
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Checklist de Implementação

### Desktop (`DiceRollModal.tsx`)
- [ ] Adicionar estado `'preparing'` como fase inicial
- [ ] Remover useEffect de auto-roll (linhas 328-338)
- [ ] Mover painel de poderes para cima da área de dados quando em preparação
- [ ] Adicionar botão "Rolar Dados" que chama `executeRoll()` e muda para fase `'rolling'`
- [ ] Opcional: se não há poderes ativáveis, auto-rolar após curto delay

### Mobile (`MobileDiceRollModal.tsx`)
- [ ] Mesmas alterações acima para paridade
- [ ] Adaptar layout do botão para mobile

### Bridge de Poderes (`activatable-powers-bridge.ts`)
- [ ] Adicionar case `'desbravador'` com `skillBonusChange: 5`
- [ ] Adicionar case `'110-porcento'` com `skillBonusChange: 5`
- [ ] Adicionar case `'faro-para-pistas'` com `skillBonusChange: 5`
- [ ] Adicionar case `'processo-otimizado'` com `skillBonusChange: 5`
- [ ] Adicionar case `'motor-de-busca'` com `swapToSkill`
- [ ] Adicionar case `'impostor'` com `swapToSkill`
- [ ] Adicionar case `'magnum-opus'` com `skillBonusChange: 5`
- [ ] Adicionar case `'espirito-civico'` com `allyBonus: 2`
- [ ] Adicionar case `'posicao-de-combate'` com `movementBonus`
- [ ] Adicionar case `'patrulha-iniciativa'` com `attributeSwap`
- [ ] Adicionar case `'cicatrizes-vontade'` com `swapToSkill`
- [ ] Adicionar cases restantes conforme definições em `getActivatablePowersForCharacter`

### Testes
- [ ] Testar Especialista com "Conhecimento Aplicado" - selecionar antes de rolar
- [ ] Testar Trabalhador Rural com "Desbravador" - verificar +5 aplicado
- [ ] Testar Acadêmico com "Saber é Poder" - verificar +5 aplicado
- [ ] Testar fluxo sem poderes ativáveis - verificar se ainda funciona
- [ ] Testar mobile com mesmos cenários

---

## Impacto
- **Médio risco**: Mudança no UX de rolagem (adiciona etapa de confirmação)
- **Alta prioridade**: Bugs afetam usabilidade de múltiplas origens e poderes

## Tempo Estimado
- Bug 1 (Fases de rolagem): ~1 hora
- Bug 2 (Cases de poderes): ~30 minutos
- Testes: ~30 minutos

**Total**: ~2 horas
