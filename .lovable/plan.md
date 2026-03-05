

# Fase A — Chat Lateral no Mapa Fullscreen

## Objetivo
Adicionar painel de chat colapsável no mapa em tela cheia, permitindo enviar mensagens e ver rolagens sem sair do mapa.

## O que fazer

### 1. Criar `ChatSidePanel.tsx` (novo arquivo)
`src/components/campaign/v3/map/ChatSidePanel.tsx`

Wrapper fino que reutiliza o `ChatTab` (v3) existente, com:
- `motion.aside` fixado à esquerda (espelhando o `MapSidePanel` da direita)
- Largura ~300px, animação slide-in/out igual ao MapSidePanel
- Header compacto com título "Chat" e botão fechar
- Passa props de messages/sendMessage/currentUserId/masterId diretamente ao ChatTab

### 2. Modificar `TacticalMapFullscreen.tsx`
- Novo estado `chatPanelOpen` (default `false`)
- Botão toggle no header com ícone `MessageSquare`
- Badge de mensagens não lidas (opcional — baseado em `realtimeData.messages.length`)
- Renderizar `ChatSidePanel` no lado esquerdo do mapa, abaixo do header
- Passa `realtimeData.messages`, `sendMessage`, `userId`, `campaign.master_id`

### Layout resultante

```text
┌──────────────────────────────────────────────────┐
│  ← 🗺️ Nome  [👥] [💬] [🛡️] [⚙️ →]             │
├──────────┬──────────────────────┬────────────────┤
│  Chat    │                     │  MapSidePanel  │
│  Side    │    Canvas Konva     │  (ferramentas) │
│  Panel   │                     │                │
│  (novo)  │                     │                │
│──────────│                     │                │
│  [input] │                     │                │
└──────────┴──────────────────────┴────────────────┘
```

## Detalhes técnicos

- `realtimeData.messages` e `sendMessage` já estão disponíveis em `TacticalMapFullscreen` (linhas 59-65)
- `campaign.master_id` vem de `campaignData.campaign`
- O `ChatTab` aceita `onSendMessage` com signature `(content, type?, metadata?) => Promise<boolean>` — compatível com `sendMessage`
- Posicionar à esquerda para não conflitar com `MapSidePanel` (direita) e `MasterMapPanel` (direita, overlay)

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/campaign/v3/map/ChatSidePanel.tsx` | **Criar** |
| `src/pages/TacticalMapFullscreen.tsx` | **Modificar** — estado + toggle + renderização |

Esforço baixo, impacto alto. Sem migration SQL, sem biblioteca nova.

