
# Verificação Completa do Painel Administrativo de Campanhas

## Resumo da Análise

O painel `/admin/campaigns` foi implementado corretamente em termos de interface e lógica de negócio. No entanto, a verificação revelou **um problema crítico de acesso a dados** e **três melhorias funcionais** necessárias para que o painel funcione conforme o esperado.

---

## Problema Crítico: RLS Bloqueando o Admin

### O que está errado

As políticas de segurança (RLS) das tabelas de campanhas **não concedem acesso irrestrito a administradores**. As políticas atuais permitem visualizar apenas as campanhas onde o usuário logado é mestre ou membro:

```text
campaigns          → SELECT: apenas master_id = auth.uid() OU membro
campaigns_v2       → SELECT: apenas master_id = auth.uid() OU membro (via is_campaign_member_v2)
campaign_members   → SELECT: apenas user_id = auth.uid() OU mestre/membro da campanha
campaign_members_v2 → SELECT: apenas membro ou mestre da campanha
```

**Consequência real:** Um administrador que não seja mestre de nenhuma campanha verá o painel completamente vazio. Mesmo sendo admin, as queries falham silenciosamente e retornam 0 campanhas.

### Confirmação no banco

O banco possui 3 campanhas (2 v1 + 1 v2) com 6 membros no total. Apenas 1 usuário é mestre dessas campanhas. Se o admin logado for outro usuário, verá tudo vazio.

### A correção

Adicionar políticas RLS que usem a função `is_admin()` já existente no banco:

```sql
-- Para campaigns
CREATE POLICY "Admins can view all campaigns"
ON public.campaigns FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update all campaigns"
ON public.campaigns FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete all campaigns"
ON public.campaigns FOR DELETE
USING (is_admin(auth.uid()));

-- Repetir para campaigns_v2, campaign_members e campaign_members_v2
```

---

## Melhorias Funcionais Identificadas

### 1. Log de Auditoria com target_user_id incorreto

Na função `changeCampaignStatus` (linha 437), o campo `target_user_id` é preenchido com `currentUser?.id` (o próprio admin), quando deveria ser o `master_id` da campanha afetada — que é o usuário impactado pela ação.

```typescript
// ERRADO (atual):
target_user_id: currentUser?.id || '',

// CORRETO:
target_user_id: campaigns.find(c => c.id === campaignId)?.master_id || currentUser?.id || '',
```

### 2. Monitor em tempo real não atualiza campanhas v1

O canal Realtime (linha 388-414) escuta mudanças em `campaigns_v2` mas não em `campaigns`. Novas campanhas v1 ou mudanças de status em v1 não serão refletidas automaticamente.

```typescript
// Falta este listener:
.on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, () => fetchCampaigns())
```

### 3. Ausência de ação "Arquivar"

O menu de ações por campanha oferece Pausar, Retomar, Encerrar e Excluir, mas não tem "Arquivar" — que é um status válido no sistema (`CampaignStatus = 'archived'`). Campanhas encerradas poderiam ser arquivadas como etapa seguinte.

---

## Plano de Implementação

### Fase 1 - Migração de banco (crítica)

Criar migração SQL para adicionar políticas RLS que concedam ao administrador acesso total de leitura e moderação em:
- `campaigns` (SELECT, UPDATE, DELETE)
- `campaigns_v2` (SELECT, UPDATE, DELETE)
- `campaign_members` (SELECT)
- `campaign_members_v2` (SELECT)

### Fase 2 - Correções no código (`AdminCampaigns.tsx`)

1. Corrigir `target_user_id` no log de auditoria da função `changeCampaignStatus`
2. Adicionar listener Realtime para tabela `campaigns` (v1)
3. Adicionar opção "Arquivar" no menu de ações para campanhas já encerradas (`completed`)

---

## Detalhes Técnicos

**Arquivo a modificar:**
- `src/pages/AdminCampaigns.tsx` — 3 correções pontuais

**Migração de banco:**
- 8 novas políticas RLS usando `is_admin(auth.uid())` — função SECURITY DEFINER já existente

**Nenhum novo arquivo necessário.** Todas as correções são ajustes sobre o que já foi implementado.
