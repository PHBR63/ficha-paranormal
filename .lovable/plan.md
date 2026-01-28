
# Plano: Correção do Erro #185 + Otimização de Queries da Campanha

## ✅ Status: IMPLEMENTADO

### Correções Aplicadas

1. **`src/pages/CampaignView.tsx`**:
   - Refatorado `fetchCampaignData()` de N+1 queries para batch queries
   - Members: 1 query com join em characters + 1 query batch em profiles
   - Messages: 1 query + 2 queries batch paralelas (profiles + characters)
   - Invite: Usa `.maybeSingle()` para evitar erro 406
   - Lookup via objeto Record em vez de Map (evita conflito com Lucide Map icon)

2. **`src/components/campaign/MemberBonusesPanel.tsx`**:
   - Removido join inválido `profiles:user_id(...)` 
   - Busca profiles em lote com `.in('user_id', [...])`
   - Merge via objeto Record O(n)

### Benefícios
- Número fixo de queries (4-6 em vez de N*2)
- Sem erro 400 (join inválido removido)
- Sem erro 406 (maybeSingle no invite)
- Menos setState em cascata (reduz risco de loop #185)
