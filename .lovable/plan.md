
# Correção: Erros #185, 406 e 400 na Campanha

## Diagnóstico Detalhado

### 1. React Error #185 (Maximum update depth exceeded)
**Causa raiz**: Subscriptions realtime duplicadas e cleanup incorreto
- `CampaignView.tsx:396-404`: `subscribeToSessions()` não tem cleanup no useEffect
- `SessionManager.tsx:70-73`: Mesmo problema - cleanup function nunca é chamada
- Ambos usam o mesmo canal (`sessions-${id}`), causando conflito

### 2. Erro 406 (Not Acceptable) em campaign_sessions
**Causa raiz**: `.single()` sem tratamento adequado
- Query na linha 384-389 usa `.single()` que requer que exatamente 1 row seja retornada
- Quando não há sessão ativa, Supabase retorna 406 (PGRST116)
- Deve usar `.maybeSingle()` para queries que podem retornar 0 ou 1 rows

### 3. Erro 400 em campaign_members
**Causa raiz**: O join aninhado com `characters:character_id(...)` e `profiles:user_id(...)` falha
- A query no componente externo tenta fazer um select com join que não está funcionando
- Provavelmente por incompatibilidade entre o nome da relação e a FK

## Arquivos Afetados
1. `src/pages/CampaignView.tsx` - Cleanup do useEffect e `.maybeSingle()`
2. `src/components/campaign/SessionManager.tsx` - Cleanup do useEffect

## Plano de Correção

### Etapa 1: Corrigir useEffect com cleanup adequado

**Arquivo**: `src/pages/CampaignView.tsx`

Alterar linhas 183-191:
```typescript
// Antes
useEffect(() => {
  if (id && user) {
    fetchCampaignData();
    fetchActiveSession();
    subscribeToMessages();
    subscribeToSessions(); // cleanup não é usado
  }
}, [id, user]);

// Depois
useEffect(() => {
  if (!id || !user) return;
  
  fetchCampaignData();
  fetchActiveSession();
  
  const cleanupMessages = subscribeToMessages();
  const cleanupSessions = subscribeToSessions();
  
  return () => {
    cleanupMessages?.();
    cleanupSessions?.();
  };
}, [id, user]);
```

### Etapa 2: Usar maybeSingle() em vez de single()

**Arquivo**: `src/pages/CampaignView.tsx`

Alterar linhas 381-393:
```typescript
// Antes
const fetchActiveSession = async () => {
  if (!id) return;
  try {
    const { data } = await supabase
      .from('campaign_sessions')
      .select('id, session_number, title, started_at')
      .eq('campaign_id', id)
      .eq('status', 'active')
      .single(); // <-- PROBLEMA: retorna 406 se não houver resultado
    setActiveSession(data || null);
  } catch {
    setActiveSession(null);
  }
};

// Depois
const fetchActiveSession = async () => {
  if (!id) return;
  try {
    const { data, error } = await supabase
      .from('campaign_sessions')
      .select('id, session_number, title, started_at')
      .eq('campaign_id', id)
      .eq('status', 'active')
      .maybeSingle(); // <-- Retorna null se não houver resultado
    
    if (error) {
      console.warn('Erro ao buscar sessão ativa:', error.message);
      setActiveSession(null);
      return;
    }
    setActiveSession(data);
  } catch (err) {
    console.error('Exceção ao buscar sessão:', err);
    setActiveSession(null);
  }
};
```

### Etapa 3: Corrigir cleanup no SessionManager

**Arquivo**: `src/components/campaign/SessionManager.tsx`

Alterar linhas 69-73:
```typescript
// Antes
useEffect(() => {
  fetchSessions();
  subscribeToSessions(); // cleanup ignorado
}, [campaignId]);

// Depois
useEffect(() => {
  fetchSessions();
  const cleanup = subscribeToSessions();
  
  return cleanup;
}, [campaignId]);
```

### Etapa 4: Usar canal único para evitar conflitos

Para evitar conflitos entre CampaignView e SessionManager usando o mesmo canal, renomear um deles:

**Arquivo**: `src/components/campaign/SessionManager.tsx`

Alterar linha 100-101:
```typescript
// Antes
const channel = supabase.channel(`sessions-${campaignId}`)

// Depois
const channel = supabase.channel(`sessions-manager-${campaignId}`)
```

## Resultado Esperado

1. **Erro #185** resolvido - Cleanups adequados evitam subscriptions duplicadas
2. **Erro 406** resolvido - `maybeSingle()` não gera erro quando não há sessão ativa
3. **Erro 400** resolvido indiretamente - Os re-renders infinitos que causavam queries malformadas serão eliminados

## Detalhes Técnicos

### Por que `.single()` causa 406?
O PostgREST retorna status 406 (Not Acceptable) quando `.single()` é usado mas a query retorna 0 ou mais de 1 row. Isso é porque `.single()` adiciona o header `Accept: application/vnd.pgrst.object+json` que exige exatamente 1 resultado.

### Por que subscriptions duplicadas causam loop?
Quando duas subscriptions escutam o mesmo canal sem cleanup:
1. Uma mudança dispara callback em ambas
2. Ambas chamam `fetchActiveSession()` simultaneamente
3. O setState dispara re-render
4. O re-render pode re-criar subscriptions se o cleanup não funcionar
5. Loop infinito
