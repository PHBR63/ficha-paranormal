
# Plano: Correção dos Erros 500 (RLS Recursiva) e #185 (Loops de Re-render)

## Diagnóstico Confirmado

### Problema 1: Recursão Infinita no Banco (Erro 500)

Os logs do Postgres mostram centenas de erros:
```
infinite recursion detected in policy for relation "campaign_members_v2"
```

**Causa raiz**: A policy "Membros visíveis para todos da campanha" tem um erro de lógica:
```sql
EXISTS (
  SELECT 1 FROM campaign_members_v2 cm
  WHERE cm.campaign_id = cm.campaign_id  -- ERRO! Compara consigo mesmo
  AND cm.user_id = auth.uid()
)
```

Deveria ser:
```sql
EXISTS (
  SELECT 1 FROM campaign_members_v2 cm
  WHERE cm.campaign_id = campaign_members_v2.campaign_id  -- Referência correta
  AND cm.user_id = auth.uid()
)
```

### Problema 2: Loops de Re-render (Erro #185)

Múltiplos componentes passam **arrow functions inline** para `onValueChange` do Radix Select:

| Componente | Linha | Código problemático |
|------------|-------|---------------------|
| `CampaignTimeline.tsx` | 222 | `onValueChange={(v) => setFilterType(v as ...)}` |
| `CampaignTimeline.tsx` | 514 | `onValueChange={(v) => setEventType(v as ...)}` |
| `CampaignTimeline.tsx` | 537 | `onValueChange={(v) => setImportance(parseInt(v))}` |
| `MacroEditor.tsx` | 225 | `onValueChange={(v) => setType(v as ...)}` |
| `MacroEditor.tsx` | 273 | `onValueChange={(v) => setDiceType(parseInt(v))}` |
| `NPCManager.tsx` | 569 | `onValueChange={(v) => setCategory(v as ...)}` |
| `ConditionManager.tsx` | 361 | `onValueChange={(v) => setDurationType(v as ...)}` |
| `TacticalBoard.tsx` | 1202 | `onValueChange={(v) => setNewTokenType(v)}` |
| `HandoutsManager.tsx` | 205, 328 | `onValueChange={(v) => setNewType(v)}` |
| `InventoryPanel.tsx` | 969, 990 | `onValueChange={(v) => setNewItem({...})}` |

---

## Fase 1: Corrigir RLS Policy (Prioritário)

### Migration SQL

```sql
-- Remover policies problemáticas de campaign_members_v2
DROP POLICY IF EXISTS "Membros visíveis para todos da campanha" ON public.campaign_members_v2;

-- Recriar policy com lógica correta (sem auto-referência)
CREATE POLICY "Membros visíveis para todos da campanha" ON public.campaign_members_v2
  FOR SELECT USING (
    -- Verifica se o usuário é membro da mesma campanha
    EXISTS (
      SELECT 1 FROM public.campaign_members_v2 cm
      WHERE cm.campaign_id = campaign_members_v2.campaign_id  -- Referência EXTERNA correta
        AND cm.user_id = auth.uid()
    )
    OR
    -- Ou se é o mestre da campanha
    EXISTS (
      SELECT 1 FROM public.campaigns_v2 c
      WHERE c.id = campaign_members_v2.campaign_id
        AND c.master_id = auth.uid()
    )
  );
```

**ATENÇÃO**: Esta correção ainda pode causar recursão porque `campaign_members_v2` referencia a si mesma. A solução mais segura é usar `campaigns_v2` diretamente:

```sql
-- Alternativa sem auto-referência (recomendada)
DROP POLICY IF EXISTS "Membros visíveis para todos da campanha" ON public.campaign_members_v2;

CREATE POLICY "Membros visíveis para todos da campanha" ON public.campaign_members_v2
  FOR SELECT USING (
    -- Usa campaigns_v2 como tabela de verificação (sem recursão)
    EXISTS (
      SELECT 1 FROM public.campaigns_v2 c
      WHERE c.id = campaign_members_v2.campaign_id
        AND (
          c.master_id = auth.uid()  -- É o mestre
          OR campaign_members_v2.user_id = auth.uid()  -- É o próprio registro do usuário
        )
    )
  );
```

---

## Fase 2: Estabilizar Callbacks dos Selects

### Padrão a Aplicar

Para cada componente, converter arrow functions inline em `useCallback` estáveis:

```typescript
// ANTES (instável):
<Select onValueChange={(v) => setFilterType(v as EventType | 'all')}>

// DEPOIS (estável):
const handleFilterTypeChange = useCallback((value: string) => {
  setFilterType(value as EventType | 'all');
}, []);

<Select onValueChange={handleFilterTypeChange}>
```

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/campaign/diary/CampaignTimeline.tsx` | 3 handlers (linhas 222, 514, 537) |
| `src/components/combat/MacroEditor.tsx` | 2 handlers (linhas 225, 273) |
| `src/components/campaign/master/NPCManager.tsx` | 1 handler (linha 569) |
| `src/components/character/conditions/ConditionManager.tsx` | 1 handler (linha 361) |
| `src/components/campaign/tactical/TacticalBoard.tsx` | 1 handler (linha 1202) |
| `src/components/campaign/master/HandoutsManager.tsx` | 2 handlers (linhas 205, 328) |
| `src/components/inventory/InventoryPanel.tsx` | 2+ handlers (linhas 969, 990) |

---

## Fase 3: Corrigir Erro 406 (campaign_audio_state)

Usar `.maybeSingle()` em vez de `.single()` para queries que podem retornar vazio:

```typescript
// ANTES:
const { data } = await supabase
  .from('campaign_audio_state')
  .select('*')
  .eq('campaign_id', campaignId)
  .single();

// DEPOIS:
const { data } = await supabase
  .from('campaign_audio_state')
  .select('*')
  .eq('campaign_id', campaignId)
  .maybeSingle();
```

---

## Ordem de Implementação

1. **Fase 1** (Crítica): Corrigir RLS de `campaign_members_v2` via migration SQL
2. **Fase 2** (Alta): Estabilizar callbacks em `CampaignTimeline.tsx` (é carregado na rota atual)
3. **Fase 3** (Média): Estabilizar callbacks nos demais componentes
4. **Fase 4** (Baixa): Corrigir `.single()` para `.maybeSingle()` no áudio

---

## Resultado Esperado

- **Erro 500 eliminado**: Queries às tabelas v2 funcionarão corretamente
- **Erro #185 eliminado**: Componentes não entrarão em loop de re-render
- **Erro 406 eliminado**: Queries de áudio retornarão null em vez de erro
- **Campanha acessível**: `/campaigns/:id` carregará normalmente

---

## Notas Técnicas

### Por que a RLS causa recursão?

Quando uma policy de SELECT em uma tabela faz uma subquery na mesma tabela, o Postgres precisa aplicar a mesma policy na subquery, criando um loop infinito:

```
1. SELECT * FROM campaign_members_v2 WHERE campaign_id = X
2. Policy: EXISTS (SELECT 1 FROM campaign_members_v2 WHERE ...)
3. Postgres aplica policy ao SELECT interno
4. Policy interna: EXISTS (SELECT 1 FROM campaign_members_v2 WHERE ...)
5. Loop infinito → Erro
```

### Por que arrow functions causam loop no Radix?

O Radix Select usa refs internamente para posicionamento. Quando a prop `onValueChange` muda de referência:

1. Radix detecta "nova função"
2. Chama `setRef` internamente
3. Isso causa re-render do componente pai
4. Nova arrow function é criada
5. Volta para (1) → Loop infinito

### Conformidade com Regras do Projeto

- Segue padrão Ref-First documentado na memória do projeto
- Comentários em PT-BR
- Não modifica mecânicas de Ordem Paranormal RPG
- Usa apenas termos oficiais do sistema
