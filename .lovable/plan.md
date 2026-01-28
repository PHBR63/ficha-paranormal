
# Plano: Correção do Erro #185 + Otimização de Queries da Campanha

## Diagnóstico Final

### Problema 1: React Error #185 (Loop Infinito)
**Causa**: O problema NÃO é a versão do Radix UI (já está compatível com React 19). O loop está sendo causado por:
1. **Queries em cascata** no `fetchCampaignData` que disparam múltiplos setStates enquanto realtime listeners ainda estão sendo criados
2. **Cache PWA desatualizado** servindo bundles com código antigo (problema identificado anteriormente)
3. **Nenhum cleanup adequado** nas refs de scroll

### Problema 2: Erro 400 em campaign_members
**Causa**: A sintaxe do join aninhado está correta (`characters:character_id(...)`) E as FKs existem:
- `campaign_members_character_id_fkey` → `characters`
- `campaign_members_user_id_fkey` → `auth.users`

O erro 400 ocorre porque a FK `user_id` referencia `auth.users` (schema interno), não `public.profiles`. O PostgREST não consegue fazer join com a sintaxe `profiles:user_id(...)` pois não há FK direta.

### Problema 3: Erro 406 em queries
**Causa**: `.single()` usado em loops onde perfis/personagens podem não existir.

---

## Solução Proposta

### Etapa 1: Refatorar `fetchCampaignData` (Escalável e Otimizado)

**Arquivo**: `src/pages/CampaignView.tsx`

Substituir a abordagem de queries em loop por:
1. **Uma única query** para `campaign_members` com join apenas em `characters` (FK válida)
2. **Uma única query** para buscar todos os `profiles` necessários usando `IN`
3. **Mesclar** os dados no JavaScript (O(n) com Map)

```text
Antes (N+1 queries):
  - 1 query campaign_members
  - N queries profiles (1 por membro)
  - N queries characters (1 por membro com character_id)
  - 1 query messages
  - N queries profiles (1 por mensagem)
  - N queries characters (1 por mensagem)

Depois (4-6 queries total):
  - 1 query campaign_members + join characters
  - 1 query profiles WHERE user_id IN (...)
  - 1 query messages
  - 1 query profiles WHERE user_id IN (...mensagens...)
  - 1 query characters WHERE id IN (...mensagens...)
```

### Etapa 2: Corrigir `MemberBonusesPanel`

**Arquivo**: `src/components/campaign/MemberBonusesPanel.tsx`

Remover a sintaxe `profiles:user_id(...)` do select (FK inválida) e buscar profiles separadamente:

```typescript
// Busca membros com join apenas em characters (FK válida)
const { data: membersRaw } = await supabase
  .from('campaign_members')
  .select(`
    id, user_id, character_id, role, active_bonuses, bonuses_updated_at,
    characters (name, class, nex, photo_url)
  `)
  .eq('campaign_id', campaignId)
  .neq('role', 'master');

// Busca profiles em lote
const userIds = membersRaw.map(m => m.user_id);
const { data: profiles } = await supabase
  .from('profiles')
  .select('user_id, display_name')
  .in('user_id', userIds);

// Mescla
const profileMap = new Map(profiles.map(p => [p.user_id, p]));
return membersRaw.map(m => ({
  ...m,
  character: m.characters,
  profile: profileMap.get(m.user_id),
}));
```

### Etapa 3: Adicionar Guarda de Estado no useEffect Principal

**Arquivo**: `src/pages/CampaignView.tsx`

Adicionar flag `isMounted` para evitar setStates após unmount:

```typescript
useEffect(() => {
  if (!id || !user) return;
  
  let isMounted = true;
  
  const loadData = async () => {
    await fetchCampaignData(isMounted);
    await fetchActiveSession();
  };
  
  loadData();
  
  const cleanupMessages = subscribeToMessages();
  const cleanupSessions = subscribeToSessions();
  
  return () => {
    isMounted = false;
    cleanupMessages?.();
    cleanupSessions?.();
  };
}, [id, user]);
```

### Etapa 4: Substituir `.single()` por `.maybeSingle()` nas Queries Internas

**Arquivo**: `src/pages/CampaignView.tsx`

Para queries que podem retornar vazio (convite ativo, por exemplo), usar `.maybeSingle()`:

```typescript
// Linha 312-318: Fetch active invite
const { data: inviteData } = await supabase
  .from('campaign_invites')
  .select('*')
  .eq('campaign_id', id)
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle(); // Em vez de .single()
```

---

## Arquivos Afetados

| Arquivo | Alterações |
|---------|------------|
| `src/pages/CampaignView.tsx` | Refatorar `fetchCampaignData`, adicionar guard `isMounted`, usar `.maybeSingle()` |
| `src/components/campaign/MemberBonusesPanel.tsx` | Remover join inválido em profiles, buscar em lote |

---

## Benefícios da Solução

1. **Escalável**: Número fixo de queries independente do número de membros (4-6 em vez de N*2)
2. **Personalizável**: Fácil adicionar novos campos nas queries centralizadas
3. **Sem loops**: Evita setState em cascata que causava o erro #185
4. **Sem 406**: Queries em lote não usam `.single()`
5. **Sem 400**: Remove join inválido `profiles:user_id`

---

## Detalhes Técnicos

### Por que `profiles:user_id(...)` não funciona?
A FK `campaign_members.user_id` aponta para `auth.users` (schema interno do Supabase), não para `public.profiles`. O PostgREST só permite joins automáticos quando há uma FK direta entre as tabelas do schema público.

### Estrutura de Merge com Map
```typescript
// Cria Map para lookup O(1)
const profileMap = new Map(profiles.map(p => [p.user_id, p]));

// Mescla em O(n)
const membersWithProfiles = members.map(m => ({
  ...m,
  profile: profileMap.get(m.user_id) || { display_name: null },
}));
```

### Ordem de Execução Segura
```text
1. fetchCampaignData() - Carrega dados iniciais
2. fetchActiveSession() - Carrega sessão ativa
3. subscribeToMessages() - Inicia realtime (após dados carregados)
4. subscribeToSessions() - Inicia realtime (após dados carregados)
```
