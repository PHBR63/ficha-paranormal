

## Plano: Gerenciador de Assets do Mapa — Com Pastas e Subpastas

### Visão Geral

Sistema de arquivos completo para o mestre organizar assets (imagens, ícones, tokens) em pastas e subpastas livres, com upload, navegação estilo explorador e posicionamento no mapa.

---

### Etapa 1 — Banco de Dados

**Tabela `campaign_asset_folders`** — estrutura de pastas recursiva:
- `id`, `campaign_id`, `parent_id` (uuid nullable, FK self — null = raiz), `name`, `created_by`, `created_at`

**Tabela `campaign_assets`** — arquivos dentro das pastas:
- `id`, `campaign_id`, `folder_id` (uuid nullable, FK folders — null = raiz), `name`, `file_url`, `file_type`, `file_size`, `category` (token/decoration/effect/general), `tags` (text[]), `uploaded_by`, `created_at`

**RLS** (padrão campanha):
- Mestre: ALL em ambas tabelas (usando `is_campaign_master`)
- Membros: SELECT em ambas (usando `is_campaign_member`)

**Bucket**: `campaign-assets` (público), com RLS no `storage.objects` restringindo upload ao mestre.

**Realtime**: habilitar ambas tabelas.

---

### Etapa 2 — Hook `useCampaignAssets`

Novo `src/hooks/campaign/useCampaignAssets.ts`:
- **Pastas**: `createFolder`, `renameFolder`, `moveFolder`, `deleteFolder` (cascata nos filhos)
- **Assets**: `uploadAsset`, `renameAsset`, `moveAsset`, `deleteAsset`
- **Navegação**: `currentFolderId` (estado), `navigateToFolder`, `navigateUp`, `breadcrumbs` (caminho completo)
- **Listagem**: query filtrada por `folder_id` atual (pastas + assets do nível)
- Realtime para sincronizar entre usuários

---

### Etapa 3 — Componente `MapAssetsPanel`

Novo `src/components/campaign/tactical/MapAssetsPanel.tsx` (Sheet lateral):

- **Header**: Breadcrumbs clicáveis (Raiz > Monstros > Chefes), botão voltar
- **Ações**: "Nova Pasta", "Upload" (drag & drop + botão)
- **Grid/Lista** de conteúdo do nível atual:
  - Pastas (ícone de pasta, clique navega para dentro)
  - Assets (thumbnail, nome, categoria)
- **Context menu** por item: Renomear, Mover para..., Excluir, Categorizar
- **Filtro** por categoria e busca por nome
- **Seleção de asset**: clique no asset entra em modo `place-asset`

---

### Etapa 4 — Integração no Canvas

- Novo `activeTool: 'place-asset'` com referência ao asset selecionado
- Clique no canvas → `createToken` com `image_url` do asset
- Preview do asset no cursor durante posicionamento
- Botão `FolderOpen` na toolbar abre o painel

---

### Ordem de Implementação

1. Migração SQL (tabelas + bucket + RLS + Realtime)
2. Hook `useCampaignAssets` (CRUD pastas/assets + navegação + Realtime)
3. Componente `MapAssetsPanel` (UI explorador de arquivos)
4. Integração na toolbar + modo `place-asset` no canvas

