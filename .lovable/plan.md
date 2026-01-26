
# Plano de Correção: Grau de Treinamento

## Problemas Identificados

### Problema 1: Modal não Fecha Após Confirmar Seleção
O modal `TrainingGradeSelectModal` não fecha automaticamente após o usuário confirmar a seleção de perícias para melhorar.

**Causa Raiz:**
No arquivo `src/components/character/TrainingGradeSelectModal.tsx`, linhas 213-216:
```tsx
const handleConfirm = useCallback(() => {
  if (!isValid) return;
  onConfirm({ nex, choices });
  // ← FALTA: onClose() não é chamado após onConfirm
}, [isValid, onConfirm, nex, choices]);
```

O `handleConfirm` apenas chama `onConfirm()` mas **não chama `onClose()`** para fechar o modal após a confirmação.

### Problema 2: Avisos Falsos de "Expert Sem Registro"
Após configurar corretamente o Grau de Treinamento no NEX 70%, a auditoria gera avisos de "Expert Sem Registro" para perícias que foram corretamente elevadas a Expert.

**Causa Raiz:**
No arquivo `src/lib/character-audit-engine.ts`, linhas 670-682, a validação apenas verifica se o `skillId` está presente no array `nex70`:

```tsx
else if (!grade70SkillIds.has(skillId)) {
  // Aviso: sem registro no Grau de Treinamento
  issues.push({...});
}
```

Mas o `grade70SkillIds` é construído apenas com os `skillId` dos registros, **sem verificar se o `toLevel` é realmente 3 (Expert)**:

```tsx
// Linha 650-651
const grade70Choices = trainingGradeChoices[TRAINING_GRADE_KEYS.NEX_70] || [];
const grade70SkillIds = new Set(grade70Choices.map(c => c.skillId)); // ← Ignora toLevel!
```

Isso causa problemas porque:
1. Uma perícia no NEX 70% pode ter sido elevada para Veterano (`toLevel: 2`), não Expert
2. O `skillId` está presente, mas o nível final não é Expert
3. A auditoria deveria verificar se há um registro com `toLevel === 3`

---

## Solução Proposta

### Correção 1: Fechar Modal Após Confirmar

Adicionar chamada a `onClose()` no `handleConfirm`:

```tsx
const handleConfirm = useCallback(() => {
  if (!isValid) return;
  onConfirm({ nex, choices });
  onClose(); // ← ADICIONAR: Fecha o modal após confirmar
}, [isValid, onConfirm, nex, choices, onClose]);
```

### Correção 2: Validar Expert com Base no toLevel

Modificar a construção de `grade70SkillIds` para incluir apenas perícias que foram elevadas **para Expert** (toLevel === 3):

```tsx
// Antes (incorreto):
const grade70SkillIds = new Set(grade70Choices.map(c => c.skillId));

// Depois (correto):
const grade70ExpertSkillIds = new Set(
  grade70Choices
    .filter(c => c.toLevel === 3)
    .map(c => c.skillId)
);
```

E atualizar a verificação:
```tsx
else if (!grade70ExpertSkillIds.has(skillId)) {
  // Aviso: sem registro de upgrade para Expert no Grau de Treinamento
  issues.push({...});
}
```

**Nota adicional sobre Veterano no NEX 70%:**
Uma perícia Veterana também pode estar registrada no `nex70` (foi Treinada → Veterana no NEX 70% em vez do NEX 35%). A lógica precisa considerar isso para evitar avisos duplicados.

Lógica ajustada completa:
```tsx
// Para Expert: verificar se há registro com toLevel === 3 em nex70
const grade70ExpertSkillIds = new Set(
  grade70Choices.filter(c => c.toLevel === 3).map(c => c.skillId)
);

// Para Veterano: verificar se há registro em nex35 OU nex70 com toLevel === 2
const allVeteranSkillIds = new Set([
  ...grade35Choices.filter(c => c.toLevel === 2).map(c => c.skillId),
  ...grade70Choices.filter(c => c.toLevel === 2).map(c => c.skillId),
]);
```

---

## Arquivos Afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/character/TrainingGradeSelectModal.tsx` | Adicionar `onClose()` ao `handleConfirm` |
| `src/lib/character-audit-engine.ts` | Corrigir lógica de validação de Expert/Veterano |

---

## Detalhes Técnicos

### TrainingGradeSelectModal.tsx - Linha 213-216

**Antes:**
```tsx
const handleConfirm = useCallback(() => {
  if (!isValid) return;
  onConfirm({ nex, choices });
}, [isValid, onConfirm, nex, choices]);
```

**Depois:**
```tsx
const handleConfirm = useCallback(() => {
  if (!isValid) return;
  onConfirm({ nex, choices });
  onClose(); // Fecha o modal após confirmar
}, [isValid, onConfirm, nex, choices, onClose]);
```

### character-audit-engine.ts - Linhas 648-686

**Antes:**
```tsx
// Linha 650-651
const grade70Choices = trainingGradeChoices[TRAINING_GRADE_KEYS.NEX_70] || 
                       trainingGradeChoices[LEGACY_TRAINING_GRADE_KEYS.NEX_70] || [];
const grade70SkillIds = new Set(grade70Choices.map(c => c.skillId));

// Linha 670
} else if (!grade70SkillIds.has(skillId)) {
```

**Depois:**
```tsx
// Filtrar apenas upgrades para Expert (toLevel === 3)
const grade70Choices = trainingGradeChoices[TRAINING_GRADE_KEYS.NEX_70] || 
                       trainingGradeChoices[LEGACY_TRAINING_GRADE_KEYS.NEX_70] || [];
const grade70ExpertSkillIds = new Set(
  grade70Choices.filter(c => c.toLevel === 3).map(c => c.skillId)
);

// Linha 670 - usar o novo Set
} else if (!grade70ExpertSkillIds.has(skillId)) {
```

**Veterano também precisa considerar upgrades do NEX 70%:**
```tsx
// Linha 608-609 - Adicionar fallback para nex70 com toLevel === 2
const grade35Choices = trainingGradeChoices[TRAINING_GRADE_KEYS.NEX_35] || 
                       trainingGradeChoices[LEGACY_TRAINING_GRADE_KEYS.NEX_35] || [];
const grade70VeteranChoices = (trainingGradeChoices[TRAINING_GRADE_KEYS.NEX_70] || 
                               trainingGradeChoices[LEGACY_TRAINING_GRADE_KEYS.NEX_70] || [])
                              .filter(c => c.toLevel === 2);

// Combinar ambos para verificação de Veterano
const allVeteranSkillIds = new Set([
  ...grade35Choices.filter(c => c.toLevel === 2).map(c => c.skillId),
  ...grade70VeteranChoices.map(c => c.skillId),
]);

// Linha 629 - usar o novo Set combinado
} else if (level === 2 && !allVeteranSkillIds.has(skillId)) {
```

---

## Checklist de Implementação

- [ ] Adicionar `onClose()` ao `handleConfirm` em `TrainingGradeSelectModal.tsx`
- [ ] Adicionar `onClose` à lista de dependências do `useCallback`
- [ ] Criar `grade70ExpertSkillIds` filtrando `toLevel === 3` em `character-audit-engine.ts`
- [ ] Criar `allVeteranSkillIds` combinando NEX 35% e NEX 70% com `toLevel === 2`
- [ ] Atualizar verificação de Expert para usar `grade70ExpertSkillIds`
- [ ] Atualizar verificação de Veterano para usar `allVeteranSkillIds`
- [ ] Testar: Configurar Grau de Treinamento no NEX 70% e verificar que não gera avisos falsos
- [ ] Testar: Modal fecha automaticamente após confirmar seleção

---

## Impacto

- **Baixo risco**: Correções pontuais em lógica de validação e UX
- **Alta prioridade**: Bugs afetam usabilidade do sistema de progressão de perícias

## Tempo Estimado

~30 minutos
