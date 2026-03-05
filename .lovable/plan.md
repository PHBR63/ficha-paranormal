

# Sidebar Completa do Mapa — Inspirada na Referência Lich VTT

## Contexto

A tela do mapa atualmente usa uma toolbar vertical flutuante mínima (esquerda) e um painel do mestre separado (direita, só para GM). A referência mostra um painel lateral direito fixo e organizado por seções, com funcionalidades que ainda não temos expostas na UI: gestão de tokens, lista de jogadores online, transformações de objetos (travar/inverter/girar), toggle de névoa e reset de zoom — tudo numa sidebar coesa.

## O Que Será Feito

### 1. Novo componente `MapSidePanel.tsx` — sidebar direita fixa

Painel lateral direito (~300px) com scroll, organizado em seções colapsáveis:

| Seção | Funcionalidade | Status |
|-------|---------------|--------|
| **Cabeçalho** | Nome do mapa + código da sala + botão "← Lobby" | Novo |
| **Jogadores** | Lista de membros online com indicador de presença | Novo |
| **Seus Tokens** | Botões "Criar Token" e "Com Avatar" + contagem (0/10) | Novo (UI — hooks já existem) |
| **Adicionar Imagem** | Botão para adicionar imagem ao mapa | Novo |
| **Adicionar Texto** | Botão para inserir texto no mapa | Já existe (muda para sidebar) |
| **Desenho** | Desenhar / Borracha / Desfazer / Limpar — botões em grid 2x2 | Move da toolbar para sidebar |
| **Transformar** | Travar / Inverter / Girar 90° (token selecionado) | Novo |
| **Fog of War** | Botão "Ativar Névoa" (só mestre) | Move da toolbar para sidebar |
| **Controles** | Resetar Zoom (Todos) | Move dos controles flutuantes |
| **Todos os Tokens** | Lista completa com nome + botão deletar (🗑️) | Novo |

### 2. Refatorar `MapToolbar` para ser compacta

A toolbar esquerda mantém apenas os 4-5 botões essenciais de modo (Selecionar, Mover, Medir, Ping) + toggle grid. Desenho, texto, fog e controles avançados migram para a sidebar.

### 3. Integrar no `TacticalMapFullscreen`

- Sidebar sempre visível (colapsável via botão no header)
- `MasterMapPanel` continua como overlay separado (controles de PV/SAN/PE)
- A sidebar é acessível tanto para mestre quanto para jogadores (com seções restritas)

### 4. Funcionalidades novas da referência

- **Criar Token rápido**: Dialog simples (nome + cor/letra) direto na sidebar, usando `tacticalBoard.createToken`
- **Criar Token com Avatar**: Upload de imagem para o token
- **Transformar token selecionado**: `updateToken(id, { locked, rotation: +90 })` e flip horizontal via `scaleX: -1`
- **Lista de todos os tokens**: Exibe nome, clique seleciona, ícone 🗑️ deleta
- **Código da sala**: Exibe o `campaignId` curto para compartilhamento

### 5. Visual

Estética dark com separadores dourados/âmbar nos títulos das seções (como na referência), botões com fundo `bg-amber-600/80` para ações primárias, fundo `bg-card/95 backdrop-blur`.

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/campaign/v3/map/MapSidePanel.tsx` | **Novo** — Sidebar completa com todas as seções |
| `src/components/campaign/v3/map/MapToolbar.tsx` | **Editar** — Reduzir para apenas botões de modo essenciais |
| `src/pages/TacticalMapFullscreen.tsx` | **Editar** — Integrar `MapSidePanel`, passar props de token/desenho/fog |
| `src/components/campaign/v3/tabs/MapTab.tsx` | **Editar** — Aceitar prop `sidePanel` ou renderizar sidebar quando em fullscreen |

