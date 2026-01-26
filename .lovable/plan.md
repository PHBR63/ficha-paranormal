
# Plano de Correção: Bug no Grau de Treinamento (NEX 70% absorvendo slots do NEX 35%)

## Problema Identificado

O sistema permite que o modal de **Grau de Treinamento do NEX 70%** seja usado para fazer upgrades **Treinado → Veterano** que deveriam ter sido feitos no **NEX 35%**. Isso resulta em:

1. **Duplicação de upgrades**: Usuário consegue 8 perícias Veteranas em vez de 4 por milestone
2. **Avisos de auditoria falsos**: "Veterano Sem Registro" para perícias corretamente upadas via NEX 70%
3. **Violação da regra oficial**: O Grau de Treinamento de cada NEX deve ser usado no seu marco correspondente

### Cenário do Bug (Demonstrado na Imagem)

```text
Personagem: Combatente NEX 70%, INT 2 (4 upgrades por milestone)

1. Usuário NÃO configurou NEX 35% (pulou)
2. Usuário abre modal NEX 70%
3. Sistema mostra perícias Treinadas (podem virar Veteranas)
4. Usuário seleciona 4 perícias Treinadas → Veteranas
5. Sistema salva em nex70: [{skillId: X, toLevel: 2}, ...]
6. Auditoria detecta: "Veterano Sem Registro" (esperava em nex35)

Resultado: 4 upgrades usados "errado", auditoria acusa problemas inexistentes
```

### Causa Raiz

1. **TrainingGradeSelectModal (linhas 158-166)**: No NEX 70%, o modal oferece upgrades Treinado → Veterano sem verificar se o NEX 35% já foi configurado
2. **Ausência de validação de precedência**: O sistema não força que o NEX 35% seja configurado antes do NEX 70%
3. **Auditoria parcial (linhas 641-656)**: Valida Veteranos apenas contra `allVeteranSkillIds`, mas não considera corretamente upgrades do NEX 70% com `toLevel === 2`

---

## Solução Proposta

### Estratégia: Forçar Sequência e Restringir Opções

O Livro Base v1.3 não define explicitamente se você pode "pular" o NEX 35%, mas a mecânica implica uso no milestone correto. A solução mais fiel às regras:

**Opção Escolhida**: Restringir o modal do NEX 70% para só permitir upgrades **Veterano → Expert** se o NEX 35% ainda não foi configurado. Isso força o usuário a usar o NEX 35% primeiro para upgrades Treinado → Veterano.

---

## Alterações Técnicas

### 1. TrainingGradeSelectModal.tsx - Filtrar Perícias Elegíveis

**Arquivo**: `src/components/character/TrainingGradeSelectModal.tsx`

Adicionar prop `previousNexChoices` e ajustar lógica de `availableSkills`:

```tsx
// Nova prop para verificar se NEX anterior foi configurado
interface TrainingGradeSelectModalProps {
  // ... props existentes
  /** Escolhas do NEX anterior (35) - para validar sequência */
  previousNexConfigured?: boolean;
}

// Dentro de availableSkills (linhas 137-187):
if (nex === 70) {
  // Se NEX 35% NÃO foi configurado, só permite Veterano → Expert
  // (força o usuário a configurar NEX 35% primeiro para Treinado → Veterano)
  if (!previousNexConfigured && currentLevel === 1) {
    // NÃO adiciona perícias Treinadas se NEX 35% pendente
    // Isso força o usuário a ir primeiro no NEX 35%
    continue;
  }
  
  if (currentLevel === 1) {
    eligible.push({...});
  } else if (currentLevel === 2) {
    eligible.push({...});
  }
}
```

**Lógica**:
- Se `nex === 70` e `previousNexConfigured === false`:
  - Não mostrar opções Treinado → Veterano
  - Mostrar apenas Veterano → Expert (se houver)
  - Exibir aviso: "Configure primeiro o Grau de Treinamento do NEX 35%"

### 2. CharacterSheet.tsx - Passar `previousNexConfigured`

**Arquivo**: `src/pages/CharacterSheet.tsx` (e `MobileCharacterSheet.tsx`)

Calcular se NEX 35% está configurado antes de abrir modal do NEX 70%:

```tsx
<TrainingGradeSelectModal
  // ... props existentes
  previousNexConfigured={
    trainingGradeNex === 70 
      ? (character.training_grade_choices?.nex35?.length || 0) > 0
      : true // Para NEX 35%, sempre true (não há anterior)
  }
/>
```

### 3. TrainingGradeSelectModal.tsx - Aviso Visual

Adicionar aviso quando NEX 35% está pendente e usuário tenta usar NEX 70% para upgrades Treinado → Veterano:

```tsx
{/* Aviso de precedência */}
{nex === 70 && !previousNexConfigured && (
  <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
    <p className="text-xs text-warning flex items-center gap-2">
      <Info className="w-4 h-4" />
      <span>
        Configure primeiro o <strong>Grau de Treinamento do NEX 35%</strong> para 
        aumentar perícias de Treinado para Veterano.
      </span>
    </p>
  </div>
)}
```

### 4. character-audit-engine.ts - Corrigir Validação de Veterano

A correção anterior (adicionar `grade70Choices.filter(c => c.toLevel === 2)` a `allVeteranSkillIds`) já resolve o problema de avisos falsos. Verificar se está aplicada corretamente.

---

## Arquivos Afetados

| Arquivo | Alteração |
|---------|-----------|
| `src/components/character/TrainingGradeSelectModal.tsx` | Adicionar prop `previousNexConfigured`, filtrar opções, aviso visual |
| `src/pages/CharacterSheet.tsx` | Passar `previousNexConfigured` ao modal |
| `src/components/character/MobileCharacterSheet.tsx` | Passar `previousNexConfigured` ao modal |

---

## Fluxo Corrigido

```text
Personagem NEX 70% sem configurar NEX 35%:

1. Usuário abre modal NEX 70%
2. Sistema verifica: nex35 vazio? → previousNexConfigured = false
3. Modal exibe:
   - Aviso: "Configure primeiro o NEX 35%"
   - Lista VAZIA (não há Veteranos para virar Expert)
   - OU lista de Veteranos apenas (se houver de outras fontes)
4. Usuário fecha modal
5. Usuário abre modal NEX 35%
6. Seleciona 4 perícias Treinadas → Veteranas
7. Confirma e salva em nex35
8. Agora pode voltar ao modal NEX 70%
9. Sistema mostra Veteranos (já upados no passo 6) → Expert
10. Auditoria: sem avisos falsos
```

---

## Regra Oficial Aplicada

Segundo o Livro Base v1.3, o Grau de Treinamento é obtido ao atingir NEX 35% e 70%. A mecânica de "escolher X perícias para aumentar" está atrelada ao milestone específico. A correção força o respeito a essa progressão:

- **NEX 35%**: Obrigatório usar para upgrades Treinado → Veterano
- **NEX 70%**: Pode fazer Treinado → Veterano OU Veterano → Expert, **desde que NEX 35% já esteja configurado**

---

## Checklist de Implementação

- [ ] Adicionar prop `previousNexConfigured` a `TrainingGradeSelectModal`
- [ ] Filtrar opções Treinado → Veterano no NEX 70% se `previousNexConfigured === false`
- [ ] Adicionar aviso visual quando precedência não respeitada
- [ ] Atualizar `CharacterSheet.tsx` para passar a prop
- [ ] Atualizar `MobileCharacterSheet.tsx` para passar a prop
- [ ] Confirmar que `character-audit-engine.ts` reconhece upgrades do NEX 70% com `toLevel === 2`
- [ ] Testar cenário: personagem NEX 70% sem configurar NEX 35%
- [ ] Testar cenário: personagem NEX 70% com NEX 35% configurado

---

## Impacto

- **Médio risco**: Alteração na lógica de filtragem do modal
- **Alta prioridade**: Bug permite violação de regras e gera confusão com avisos falsos

## Tempo Estimado

~45 minutos
