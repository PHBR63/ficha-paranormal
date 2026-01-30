

# Plano Atualizado: Correção #185 + Erros 406 + Acessibilidade de Formulários

## Visão Geral

Este plano corrige três categorias de problemas:
1. **React Error #185** - Loop infinito causado por Radix Tooltips
2. **Erros 406** - Queries Supabase com `.single()` sem resultados
3. **Acessibilidade** - Inputs sem id/name e labels não associadas

---

## FASE 1: Eliminar Loop #185 (CRÍTICO)

### 1.1 Remover Radix Tooltips em CharacterConditions.tsx

O componente ainda usa `TooltipProvider > Tooltip > TooltipTrigger` nas linhas 57-88 e 171-211, causando o loop.

**Modificação:**

```typescript
// ANTES (linha 57-88 - modo compact):
if (compact) {
  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1">
        {activeConditions.map((condition) => (
          <Tooltip key={condition.id}>
            <TooltipTrigger asChild>
              <Badge>...</Badge>
            </TooltipTrigger>
            <TooltipContent>...</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

// DEPOIS - Usar atributo title nativo:
if (compact) {
  return (
    <div className="flex flex-wrap gap-1">
      {activeConditions.length === 0 ? (
        <span className="text-xs text-muted-foreground">Sem condições</span>
      ) : (
        activeConditions.map((condition) => (
          <Badge
            key={condition.id}
            variant="outline"
            title={`${condition.name}: ${condition.effect}`}
            className={cn(...)}
          >
            {condition.icon} {condition.name}
          </Badge>
        ))
      )}
    </div>
  );
}
```

```typescript
// ANTES (linhas 171-211 - modo normal):
<TooltipProvider>
  {activeConditions.map((condition) => (
    <Tooltip key={condition.id}>
      <TooltipTrigger asChild>
        <div>...</div>
      </TooltipTrigger>
      <TooltipContent>...</TooltipContent>
    </Tooltip>
  ))}
</TooltipProvider>

// DEPOIS:
{activeConditions.map((condition) => {
  const tooltipText = [
    condition.name,
    condition.effect,
    condition.removal ? `Remoção: ${condition.removal}` : null,
  ].filter(Boolean).join(' | ');

  return (
    <div
      key={condition.id}
      title={tooltipText}
      className={cn(...)}
    >
      {/* ... conteúdo do badge ... */}
    </div>
  );
})}
```

**Remover imports não utilizados:**
```typescript
// REMOVER do topo:
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
```

### 1.2 Modificar forceMount em tabs.tsx

Atualmente, `forceMount={true}` força a renderização de TODAS as abas, incluindo componentes com Tooltips problemáticos.

```typescript
// ANTES (linha 47):
forceMount={unmountOnHide ? undefined : true}

// DEPOIS - Comportamento lazy por padrão:
forceMount={unmountOnHide === false ? true : undefined}
// Ou seja: só força montagem se explicitamente unmountOnHide=false
```

**Alternativa menos invasiva:** Adicionar `unmountOnHide={true}` nas abas pesadas em `CampaignView.tsx`.

---

## FASE 2: Corrigir Erros 406 (ALTA)

### 2.1 useCampaignData.ts

```typescript
// ANTES (linha ~105):
const { data, error } = await supabase
  .from('campaigns_v2')
  .select('*')
  .eq('id', campaignId)
  .single();

// DEPOIS:
const { data, error } = await supabase
  .from('campaigns_v2')
  .select('*')
  .eq('id', campaignId)
  .limit(1);

const campaignData = data?.[0];
```

### 2.2 useCampaignRealtime.ts

```typescript
// ANTES:
const [profileRes, charRes] = await Promise.all([
  supabase.from('profiles').select('display_name').eq('user_id', newMsg.user_id).maybeSingle(),
  ...
]);

// DEPOIS:
const [profileRes, charRes] = await Promise.all([
  supabase.from('profiles').select('display_name').eq('user_id', newMsg.user_id).limit(1),
  newMsg.character_id
    ? supabase.from('characters').select('name').eq('id', newMsg.character_id).limit(1)
    : Promise.resolve({ data: [] }),
]);

const profile = profileRes.data?.[0] || { display_name: null };
```

### 2.3 CampaignView.tsx (insert de convite)

```typescript
// ANTES:
const { data, error } = await supabase
  .from('campaign_invites')
  .insert({...})
  .select()
  .single();

// DEPOIS:
const { data, error } = await supabase
  .from('campaign_invites')
  .insert({...})
  .select()
  .limit(1);

const inviteData = data?.[0];
if (inviteData) setInvite(inviteData);
```

---

## FASE 3: Acessibilidade de Formulários (MÉDIA)

Corrigir os 7 inputs sem id/name e 1 label não associada identificados no DevTools.

### 3.1 NoteEditor.tsx (3 campos)

```typescript
// ANTES (linhas 156-171):
<Input
  value={title}
  onChange={...}
  placeholder="Título da nota"
/>
<Textarea
  value={content}
  onChange={...}
  placeholder="Escreva suas anotações..."
/>

// DEPOIS:
<div className="space-y-1">
  <Label htmlFor="note-title" className="sr-only">Título</Label>
  <Input
    id="note-title"
    name="note-title"
    value={title}
    onChange={...}
    placeholder="Título da nota"
  />
</div>
<div className="space-y-1">
  <Label htmlFor="note-content" className="sr-only">Conteúdo</Label>
  <Textarea
    id="note-content"
    name="note-content"
    value={content}
    onChange={...}
    placeholder="Escreva suas anotações..."
  />
</div>
```

### 3.2 IntellectSkillSelectModal.tsx (1 campo)

```typescript
// ANTES (linhas 122-126):
<Checkbox 
  checked={isSelected}
  onCheckedChange={() => handleToggleSkill(skill.id)}
/>

// DEPOIS - Adicionar id único via skill.id:
<Checkbox 
  id={`skill-${skill.id}`}
  checked={isSelected}
  onCheckedChange={() => handleToggleSkill(skill.id)}
  aria-label={`Selecionar ${skill.name}`}
/>
```

### 3.3 VersatilitySection.tsx (2 campos)

Usar `useId()` para gerar IDs únicos em vez de strings estáticas:

```typescript
// ANTES:
<RadioGroupItem value="class_power" id="class_power" />
<Label htmlFor="class_power">

// DEPOIS:
const classPowerId = useId();
const trackAbilityId = useId();

<RadioGroupItem value="class_power" id={classPowerId} />
<Label htmlFor={classPowerId}>
```

### 3.4 SUEDebugPanel.tsx (1 campo)

```typescript
// ANTES:
<Switch id="show-inactive" ... />
<label htmlFor="show-inactive">

// DEPOIS - useId para evitar colisões:
const showInactiveId = useId();

<Switch id={showInactiveId} ... />
<label htmlFor={showInactiveId}>
```

---

## Ordem de Execução

| Fase | Prioridade | Arquivo | Alteração |
|------|------------|---------|-----------|
| 1.1 | **CRÍTICA** | `CharacterConditions.tsx` | Remover Radix Tooltip → usar `title` |
| 1.2 | **CRÍTICA** | `tabs.tsx` | Ajustar `forceMount` para lazy por padrão |
| 2.1 | Alta | `useCampaignData.ts` | `.single()` → `.limit(1)` |
| 2.2 | Alta | `useCampaignRealtime.ts` | `.maybeSingle()` → `.limit(1)` |
| 2.3 | Alta | `CampaignView.tsx` | `.single()` → `.limit(1)` |
| 3.1 | Média | `NoteEditor.tsx` | Adicionar id/name + labels |
| 3.2 | Média | `IntellectSkillSelectModal.tsx` | Adicionar id ao Checkbox |
| 3.3 | Média | `VersatilitySection.tsx` | useId() em RadioGroup |
| 3.4 | Baixa | `SUEDebugPanel.tsx` | useId() no Switch |

---

## Resultado Esperado

- **Error #185**: Eliminado - Tooltips não disparam mais loop de `setRef`
- **Error 406**: Eliminado - Queries retornam array vazio (HTTP 200)
- **DevTools Warnings**: Eliminados - 7 inputs com id/name, 1 label associada
- **Acessibilidade**: Melhorada - Navegação por teclado e leitores de tela

---

## Notas Técnicas

### Por que usar `title` em vez de Radix Tooltip em listas?

O Radix `TooltipTrigger` usa um sistema de ref forwarding que chama `setRef()` internamente. Quando múltiplos triggers são montados em sequência (como em um `.map()` dentro de `AnimatePresence`), cada chamada a `setRef()` pode disparar um re-render do componente pai, criando o ciclo infinito.

O atributo `title` nativo do HTML é processado pelo navegador sem interferir no ciclo de renderização do React.

### Conformidade com Regras do Projeto

- Segue memória `architecture/restricao-tooltip-radix-listas-dinamicas`
- Segue memória `development/padrao-supressao-erro-406-postgrest`
- Todos os comentários em PT-BR
- Não modifica mecânicas de Ordem Paranormal RPG

