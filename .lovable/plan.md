

# Toolbar do Mestre na Aba Fullscreen do Mapa

## Contexto

A página fullscreen do mapa (`TacticalMapFullscreen.tsx`) tem apenas um header mínimo (nome + botão fechar) e a toolbar básica de ferramentas de desenho/navegação do `MapTab`. O mestre não tem acesso a nenhuma das ferramentas de controle de jogadores (PV/SAN/PE, condições, testes de perícia, combate) enquanto está na view fullscreen do mapa — sendo obrigado a voltar para a aba da campanha para qualquer ação de mestre.

## Plano

### 1. Painel lateral colapsável do Mestre no mapa fullscreen

Adicionar um painel lateral direito (drawer) que o mestre pode abrir/fechar, contendo versões compactas dos controles existentes:

- **Mini PlayerControlCards** — barras de PV/SAN/PE com ajuste rápido (reutilizando `PlayerControlCard`)
- **Ações Rápidas** — pedir teste de perícia, dano em área, descanso do grupo (reutilizando `MasterQuickActions`)
- **Mini CombatTracker** — tracker de iniciativa e rodadas

O painel é ativado por um botão flutuante no canto superior direito (ícone de escudo/mestre).

### 2. Integração de hooks no TacticalMapFullscreen

Adicionar `useMasterActions`, `useCampaignData` (members) e `useCampaignRealtime` (sendMessage) à página fullscreen para alimentar os componentes de mestre.

### 3. Header expandido

Expandir o header mínimo para incluir:
- Indicador de sessão ativa
- Contador de jogadores online
- Botão de abrir/fechar painel do mestre (apenas se `isMaster`)

## Estrutura Visual

```text
┌──────────────────────────────────────┬─────────────┐
│ ← 🗺️ Nome da Campanha    👥3  ⚔️ M │             │
├──────────────────────────────────────┤  PAINEL DO  │
│                                      │   MESTRE    │
│  [Toolbar ferramentas]               │             │
│                                      │ ⚡Ações     │
│         CANVAS DO MAPA               │ Rápidas     │
│                                      │             │
│                                      │ 🧑 Agente X │
│                                      │ ██████ PV   │
│                                      │ ██████ SAN  │
│               [Zoom controls]        │ ██████ PE   │
└──────────────────────────────────────┴─────────────┘
```

## Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/campaign/v3/map/MasterMapPanel.tsx` | **Novo** — Painel lateral colapsável com PlayerControlCards, ações rápidas e combat tracker |
| `src/pages/TacticalMapFullscreen.tsx` | **Editado** — Integrar `useMasterActions`, `useCampaignRealtime`, `useCampaignPresence`, renderizar `MasterMapPanel` e expandir header |

Os componentes `PlayerControlCard`, `MasterQuickActions`, `CombatTracker` e `BulkDamageModal` são reutilizados diretamente — nenhuma duplicação de lógica.

