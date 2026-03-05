

# Plano: Corrigir Upload de Token Animado + Bugs na Sidebar

## Problemas Identificados

### 1. Dialog "Criar Token Rápido" (sidebar) não tem upload de imagem
O botão "Criar Token" na sidebar usa o `CreateTokenDialog` que só tem campo de **nome** e **cor**. O dialog completo com upload de imagem existe apenas no `TacticalBoard.tsx` antigo e não é acessível pela interface fullscreen/sidebar.

### 2. Botão delete de tokens na listagem nunca aparece
O botão de delete na lista de tokens (linha 565) usa `group-hover:opacity-100`, mas o container pai (linha 546) não tem a classe `group` — mesmo bug que foi corrigido nos pins.

---

## Correções Planejadas

### A. Expandir `CreateTokenDialog` no `MapSidePanel.tsx`
- Adicionar campo de **tipo** de token (PC, NPC, Criatura, Objeto, Marcador) com `Select`
- Adicionar o componente `ImageUploader` para upload de imagem (PNG, JPG, GIF, WebM)
- Adicionar lógica de upload para o bucket `campaign-assets` antes de criar o token
- Receber `campaignId` como prop para montar o path de upload

### B. Adicionar classe `group` ao container de tokens na listagem
- Linha 546: adicionar `group` à className do `div` de cada token na lista, para que o botão de delete apareça no hover.

### C. Manter o dialog completo do `TacticalBoard.tsx` como está
- Ele serve como fallback para o modo não-fullscreen.

---

## Arquivos Modificados
- `src/components/campaign/v3/map/MapSidePanel.tsx` — expandir `CreateTokenDialog` + fix classe `group`

