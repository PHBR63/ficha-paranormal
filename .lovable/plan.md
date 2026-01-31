

# Plano: Reconstrução Total da Interface de Campanha

## Visão Geral

Reconstrução completa do módulo de campanha com foco em **minimalismo funcional**: interface limpa, alta densidade de informações, sem distrações visuais. O novo layout será **centralizado** sem painéis laterais fixos, com todos os elementos quebrados corrigidos.

---

## Diagnóstico dos Problemas Atuais

```text
┌─────────────────────────────────────────────────────────────────┐
│                    PROBLEMAS IDENTIFICADOS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TABULEIRO TÁTICO                                                │
│  ├─ Canvas não preenche espaço (ResizeObserver não funciona)    │
│  ├─ Camadas Konva renderizam fora da área visível               │
│  ├─ Zoom/Pan conflitam com scroll da página                     │
│  └─ Toolbar ocupa espaço demais em telas pequenas               │
│                                                                  │
│  SISTEMA DE CHAT                                                 │
│  ├─ VirtualizedChatList não calcula altura correta              │
│  ├─ Auto-scroll inconsistente                                   │
│  ├─ Input de mensagem separado do contexto                      │
│  └─ Rolador de dados e controles ocupam muito espaço            │
│                                                                  │
│  SIDEBAR DE JOGADORES                                            │
│  ├─ Modo colapsado não sincroniza com estado global             │
│  ├─ Presença online não atualiza em tempo real                  │
│  ├─ Cards muito grandes para informação mostrada                │
│  └─ Não funciona bem em mobile                                  │
│                                                                  │
│  NAVEGAÇÃO                                                       │
│  ├─ 10+ abas = difícil encontrar o que precisa                  │
│  ├─ Tabs não indicam conteúdo novo/pendente                     │
│  └─ Hierarquia confusa (tabs dentro de tabs)                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Arquitetura Proposta: Layout Único Central

```text
┌─────────────────────────────────────────────────────────────────┐
│ HEADER COMPACTO                                                  │
│ [← Voltar] [Nome da Campanha] [Sessão X] [🔴 5 online] [Config] │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ NAVEGAÇÃO CONSOLIDADA (4 abas principais)                 │  │
│  │ [📊 Painel] [💬 Chat] [🗺️ Mapa] [📋 Recursos]            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                            │  │
│  │                                                            │  │
│  │              CONTEÚDO CENTRALIZADO                         │  │
│  │              (expande para preencher tudo)                 │  │
│  │                                                            │  │
│  │                                                            │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ BARRA DE STATUS (presença + ações rápidas)                │  │
│  │ [👤 Ana ●] [👤 Carlos ●] [👤 Julia ○] │ [🎲 Rolar] [📝]   │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Componentes Novos

### 1. CampaignShell.tsx (Container Principal)

Substitui CampaignView.tsx com estrutura simplificada:

```tsx
// Estrutura básica
<div className="h-screen flex flex-col bg-background">
  <CampaignHeader />       {/* Compacto: 48px fixo */}
  <CampaignNavigation />   {/* 4 abas consolidadas */}
  <main className="flex-1 min-h-0 overflow-hidden">
    {/* Conteúdo da aba ativa */}
  </main>
  <CampaignStatusBar />    {/* Presença + ações: 56px fixo */}
</div>
```

### 2. Navegação Consolidada (4 Abas)

Reduz de 10+ abas para 4 grupos lógicos:

| Aba | Conteúdo |
|-----|----------|
| **Painel** | Status dos agentes + Condições + Sessão ativa |
| **Chat** | Mensagens + Dados + Sussurros + Atividades |
| **Mapa** | Tabuleiro Tático (full-screen) |
| **Recursos** | Notas + Handouts + Diário + Timeline |

Para o mestre, adiciona uma 5ª aba:

| Aba | Conteúdo |
|-----|----------|
| **Mestre** | NPCs + Macros + Áudio + Controles + Bônus |

### 3. CampaignStatusBar.tsx (Nova)

Barra inferior compacta com:
- Avatares dos membros online (clicáveis para detalhes)
- Indicadores de presença em tempo real
- Botão de rolagem rápida de dados
- Acesso rápido ao personagem selecionado

---

## Correções por Área

### Tabuleiro Tático

**Problema**: Canvas não preenche espaço disponível

**Solução**:
```tsx
// Novo container com altura explícita
<div className="relative w-full h-full">
  <TacticalBoardKonva
    width={containerWidth}   // Via ResizeObserver
    height={containerHeight}
    // ... props
  />
  {/* Toolbar como overlay no canto */}
  <div className="absolute top-2 left-2 z-10">
    <TacticalToolbar floating />
  </div>
</div>
```

**Mudanças**:
1. Toolbar vira overlay flutuante (não empurra canvas)
2. Stage Konva usa 100% do container
3. ResizeObserver com debounce para evitar flickering
4. Seletor de mapas vira dropdown no header

### Sistema de Chat

**Problema**: Lista virtualizada não calcula altura

**Solução**:
```tsx
// Chat com altura explícita
<div className="flex flex-col h-full">
  <div className="flex-1 min-h-0 relative">
    <VirtualizedChatList 
      messages={messages}
      className="absolute inset-0" // Preenche container
    />
  </div>
  <ChatInput className="shrink-0" />
</div>
```

**Mudanças**:
1. Container pai com altura explícita (não depende de flex)
2. Lista usa `absolute inset-0` para garantir preenchimento
3. Input de mensagem usa `shrink-0` para nunca comprimir
4. Botões de rolagem e sussurro integrados ao input

### Sidebar de Jogadores → Barra de Status

**Problema**: Ocupa muito espaço, não funciona mobile

**Solução**: Transforma em barra horizontal no rodapé

```tsx
<div className="h-14 border-t bg-card/50 flex items-center px-4 gap-2">
  {/* Avatares compactos clicáveis */}
  <div className="flex -space-x-2">
    {members.map(m => (
      <Avatar 
        key={m.id} 
        onClick={() => setSelectedMember(m)}
        className="ring-2 ring-background"
      />
    ))}
  </div>
  
  {/* Detalhes aparecem em popover/drawer */}
  <Popover>
    <PopoverContent>
      {/* Status completo do membro selecionado */}
    </PopoverContent>
  </Popover>
</div>
```

**Benefícios**:
- Sempre visível sem ocupar espaço lateral
- Funciona igual em desktop e mobile
- Clique expande detalhes on-demand

### Navegação Consolidada

**Problema**: Muitas abas, hierarquia confusa

**Solução**: 4 abas principais com sub-navegação interna

```tsx
<Tabs defaultValue="panel" className="flex-1 flex flex-col">
  <TabsList className="justify-center bg-transparent">
    <TabsTrigger value="panel" className="gap-2">
      <LayoutDashboard className="w-4 h-4" />
      Painel
    </TabsTrigger>
    <TabsTrigger value="chat" className="gap-2">
      <MessageSquare className="w-4 h-4" />
      Chat
      {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
    </TabsTrigger>
    <TabsTrigger value="map" className="gap-2">
      <Map className="w-4 h-4" />
      Mapa
    </TabsTrigger>
    <TabsTrigger value="resources" className="gap-2">
      <FolderOpen className="w-4 h-4" />
      Recursos
    </TabsTrigger>
    {isMaster && (
      <TabsTrigger value="master" className="gap-2 text-primary">
        <Crown className="w-4 h-4" />
        Mestre
      </TabsTrigger>
    )}
  </TabsList>
  
  {/* Conteúdo preenche resto da tela */}
  <TabsContent value="panel" className="flex-1 min-h-0">
    <PanelTab />
  </TabsContent>
  {/* ... outras abas */}
</Tabs>
```

---

## Estrutura de Arquivos

### Novos Arquivos

| Caminho | Descrição |
|---------|-----------|
| `src/pages/CampaignShell.tsx` | Novo container principal (substitui CampaignView) |
| `src/components/campaign/v3/CampaignHeader.tsx` | Header compacto |
| `src/components/campaign/v3/CampaignNavigation.tsx` | 4-5 abas consolidadas |
| `src/components/campaign/v3/CampaignStatusBar.tsx` | Barra de presença inferior |
| `src/components/campaign/v3/tabs/PanelTab.tsx` | Status + Condições + Sessão |
| `src/components/campaign/v3/tabs/ChatTab.tsx` | Chat redesenhado |
| `src/components/campaign/v3/tabs/MapTab.tsx` | Mapa full-screen |
| `src/components/campaign/v3/tabs/ResourcesTab.tsx` | Notas + Handouts + Diário |
| `src/components/campaign/v3/tabs/MasterTab.tsx` | Ferramentas do mestre |
| `src/components/campaign/v3/index.ts` | Barrel export |

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/App.tsx` ou router | Apontar `/campaign/:id` para CampaignShell |
| `src/components/campaign/tactical/TacticalBoard.tsx` | Toolbar flutuante, altura explícita |
| `src/components/campaign/chat/VirtualizedChatList.tsx` | Container com altura absoluta |

### Arquivos que Podem Ser Removidos (após migração)

| Arquivo | Motivo |
|---------|--------|
| `src/pages/CampaignView.tsx` | Substituído por CampaignShell |
| `src/components/campaign/layout/*` | Layout com painéis não será mais usado |
| `src/components/campaign/PlayersSidebar.tsx` | Substituído por StatusBar |

---

## Fases de Implementação

### Fase 1: Estrutura Base
1. Criar `CampaignShell.tsx` com estrutura flex
2. Criar `CampaignHeader.tsx` compacto
3. Criar `CampaignNavigation.tsx` com 4 abas
4. Criar `CampaignStatusBar.tsx` com presença

### Fase 2: Migrar Conteúdo das Abas
1. `PanelTab.tsx` - Combina Status + Condições
2. `ChatTab.tsx` - Chat com altura corrigida
3. `MapTab.tsx` - Tabuleiro full-screen
4. `ResourcesTab.tsx` - Agrupa recursos existentes
5. `MasterTab.tsx` - Ferramentas do mestre

### Fase 3: Correções de Layout
1. TacticalBoard com toolbar flutuante
2. VirtualizedChatList com altura absoluta
3. Testes em diferentes resoluções

### Fase 4: Limpeza
1. Atualizar router para usar CampaignShell
2. Remover arquivos obsoletos
3. Atualizar memórias do projeto

---

## Estilo Visual Minimalista

### Princípios

1. **Fundo neutro**: `bg-background` sem gradientes
2. **Bordas sutis**: `border-border/50` apenas onde necessário
3. **Tipografia**: Hierarquia clara, sem decorações
4. **Espaçamento**: Compacto mas respirável (`p-3` em vez de `p-6`)
5. **Cores**: Primário apenas para ações e destaques
6. **Ícones**: Lucide, tamanho consistente (16-20px)

### Paleta Reduzida

```css
/* Uso restrito de cores */
--foreground: texto principal
--muted-foreground: texto secundário
--primary: apenas ações e indicadores importantes
--destructive: apenas alertas críticos
```

---

## Resultado Esperado

```text
ANTES:
┌──────────────────────────────────────────────────────────────┐
│ [Header largo com muitos botões]                              │
├──────────────────────────────────────────────────────────────┤
│ [10 tabs pequenas difíceis de clicar]                         │
├──────────────────────────────────────┬───────────────────────┤
│                                      │                        │
│   Conteúdo cortado                   │  Sidebar ocupando     │
│   ou com espaço em branco            │  25% da tela          │
│                                      │                        │
│   Scroll não funciona                │  Cards muito grandes  │
│                                      │                        │
└──────────────────────────────────────┴───────────────────────┘

DEPOIS:
┌──────────────────────────────────────────────────────────────┐
│ [← Back] Campanha Nome      Sessão 15    [⚙️]                │
├──────────────────────────────────────────────────────────────┤
│        [📊 Painel] [💬 Chat] [🗺️ Mapa] [📋 Recursos]         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                                                              │
│                    CONTEÚDO LIMPO                            │
│                    Preenche 100% do espaço                   │
│                    Scroll funciona corretamente              │
│                                                              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ [👤●] [👤●] [👤●] [👤○] [👤○]          [🎲 Rolar] [📝 Notas]│
└──────────────────────────────────────────────────────────────┘
```

---

## Seção Técnica

### Compatibilidade
- React 19.2.3
- Framer Motion 12.x para transições
- Tanstack Virtual 3.x para listas
- React-Konva 19.x para mapa

### Hooks Reutilizados
Todos os hooks existentes em `src/hooks/campaign/` serão reutilizados:
- `useCampaignData`
- `useCampaignRealtime`
- `useCampaignPresence`
- `useTacticalBoard`
- `useMasterActions`

### Padrões Mantidos
- Singleton Pattern para hooks
- Ref-First para callbacks
- Virtualização para listas longas
- ResizeObserver para dimensões dinâmicas

