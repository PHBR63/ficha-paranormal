

# Toolbar do Mestre - Redesign Completo

## Situação Atual

A aba Mestre tem 4 sub-abas: **Jogadores** (cards com +/- fixos para PV/SAN/PE), **NPCs** (placeholder), **Macros** (placeholder) e **Áudio** (funcional). Os controles de jogadores são limitados a incrementos fixos (+5/-5 PV, +1/-1 SAN/PE) sem input customizado, sem barras de progresso visuais e sem ações em lote.

## Plano de Implementação

### 1. Redesign do PlayerControlCard

Transformar o card básico num painel de controle completo por personagem:

- **Barras de progresso coloridas** com gradiente (verde→amarelo→vermelho para PV, roxo para SAN, azul para PE)
- **Input numérico customizável** — clicar no valor atual abre um input inline para digitar dano/cura exato
- **Botões de ajuste rápido** com presets contextuais: -1, -5, -10, +1, +5, +10 (colapsáveis)
- **Indicador de perigo** — borda vermelha pulsante quando PV ≤ 25%, ícone de caveira em 0 PV
- **Badges de condições** visíveis diretamente no card (sem precisar abrir dropdown)
- **Botão de descanso rápido** (restaurar PV/PE ao máximo com confirmação)

### 2. Barra de Ações Rápidas do Mestre

Nova seção fixa no topo da aba Mestre (antes das sub-abas), com botões de ação rápida:

- **Pedir Teste** — dropdown com todas as perícias oficiais OP v1.3 (Acrobacia, Atletismo, Ciências, etc.) que envia mensagem de sistema no chat
- **Iniciar Combate** — ativa modo combate com tracker de rodadas/turnos
- **Dano em Área** — modal para aplicar dano a múltiplos personagens de uma vez (selecionar alvos + valor)
- **Descanso do Grupo** — restaura PV e PE de todos ao máximo com um clique
- **Limpar Condições** — remove todas as condições de todos os personagens

### 3. Tracker de Combate (nova sub-aba)

Substituir a sub-aba placeholder "Macros" por **Combate**:

- **Tracker de iniciativa** — lista ordenada dos personagens por valor de iniciativa (editável)
- **Contador de rodadas** com botões avançar/voltar
- **Indicador visual** de quem é o turno atual (highlight animado)
- **Botão "Próximo Turno"** que avança automaticamente na ordem

### 4. Melhorias Visuais Gerais

- Ícones `@phosphor-icons/react` com peso `duotone` para consistência
- Cards com `backdrop-blur` e borda sutil temática
- Animações com `framer-motion` na entrada e transição de sub-abas
- Cores condicionais: vermelho para perigo, verde para recuperação, amarelo para alerta

## Arquivos Modificados

| Arquivo | Ação |
|---------|------|
| `src/components/campaign/v3/tabs/MasterTab.tsx` | Reescrita completa — nova estrutura com barra de ações + sub-abas melhoradas |
| `src/components/campaign/v3/master/PlayerControlCard.tsx` | Novo — card de controle extraído e expandido |
| `src/components/campaign/v3/master/MasterQuickActions.tsx` | Novo — barra de ações rápidas (testes, dano em área, descanso) |
| `src/components/campaign/v3/master/CombatTracker.tsx` | Novo — tracker de iniciativa e rodadas |
| `src/components/campaign/v3/master/BulkDamageModal.tsx` | Novo — modal para dano em múltiplos alvos |
| `src/components/campaign/v3/master/index.ts` | Atualizado — novos exports |
| `src/pages/CampaignShell.tsx` | Atualizado — passar `sendMessage` para MasterTab (para ações rápidas no chat) |

## Estrutura Visual

```text
┌─────────────────────────────────────────────┐
│  ⚡ AÇÕES RÁPIDAS                           │
│  [Pedir Teste ▾] [Combate] [Dano Área]     │
│  [Descanso Grupo] [Limpar Condições]        │
├─────────────────────────────────────────────┤
│  [Jogadores] [Combate] [NPCs] [Áudio]      │
├─────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐         │
│  │ 🧑 Agente X  │  │ 🧑 Agente Y  │         │
│  │ ████████░░ PV│  │ ██████░░░░ PV│         │
│  │ ██████████ SN│  │ ████░░░░░░ SN│  ⚠️     │
│  │ ██████░░░░ PE│  │ ██████████ PE│         │
│  │ [-10][-5][-1]│  │ [-10][-5][-1]│         │
│  │ [+1][+5][+10]│  │ [+1][+5][+10]│         │
│  │ 🔴Sangrando  │  │              │         │
│  │ [Condições▾] │  │ [Condições▾] │         │
│  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────┘
```

