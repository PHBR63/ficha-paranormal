

# Plano de Correções — Campanha v3 (em Fases)

Auditoria completa dos botões e funcionalidades identificou **6 itens não-funcionais** e **2 parcialmente funcionais**. Organizados em fases por prioridade e dependência.

---

## Fase 1 — Botões Placeholder (Rápido)

**Problema**: Dois botões na StatusBar executam apenas `console.log`.

1. **Botão "Configurações" (⚙️ no Header)** — Criar `CampaignSettingsModal` com: nome da campanha, código de convite, gerenciar membros (kick), excluir campanha.
2. **Botão "Notas Rápidas" (📝 na StatusBar)** — Criar `QuickNotesModal` com textarea + persistência local (localStorage por campanha). Acessível a todos os jogadores.

---

## Fase 2 — Aba Recursos Funcional

**Problema**: As 3 sub-abas (Notas, Handouts, Timeline) são placeholders estáticos sem backend.

1. **Sub-aba Notas** — Integrar com nova tabela `campaign_notes` (ou reutilizar lógica existente). CRUD de notas com título, conteúdo, sessão associada. Busca funcional.
2. **Sub-aba Handouts** — Conectar o `useHandouts` hook (já existe!) ao `ResourcesTab`. Exibir handouts visíveis ao jogador, com imagem e tipo. Mestre vê todos.
3. **Sub-aba Timeline** — Gerar automaticamente a partir de `campaign_sessions` + `campaign_messages` (eventos de sistema). Lista cronológica de sessões e eventos marcantes.

---

## Fase 3 — Áudio do Mestre Conectado

**Problema**: O `AudioControlPanel` no MasterTab recebe arrays vazios porque o `CampaignShell` não instancia o hook `useCampaignAudio`.

1. **CampaignShell.tsx** — Adicionar `useCampaignAudio({ campaignId })` e passar `audioLibrary`, `soundScenes`, `audioState`, e callbacks ao `MasterTab`.
2. Verificar que o botão "Nova" cena e "Upload" áudio no `AudioControlPanel` chamam callbacks reais.

---

## Fase 4 — NPCs no MasterTab v3

**Problema**: Sub-aba NPCs mostra placeholder "em desenvolvimento", mas o componente `NPCManager` já existe e é funcional na versão antiga (`CampaignMasterTab`).

1. **MasterTab.tsx** — Substituir o placeholder de NPCs pelo `NPCManager` existente, passando `campaignId`.

---

## Fase 5 — Macros e Handouts do Mestre

**Problema**: A versão antiga (`CampaignMasterTab`) tinha sub-abas de Macros, Handouts e Bônus que não foram portadas para a v3.

1. Avaliar se faz sentido adicionar sub-abas extras ao MasterTab v3 (Macros, Handouts Master, Bônus) ou se ficam acessíveis via Recursos.
2. Se aprovado, adicionar as sub-abas reutilizando `MacrosPanel`, `HandoutsManager`, `MemberBonusesPanel`.

---

## Resumo por Fase

| Fase | Escopo | Arquivos Principais |
|------|--------|-------------------|
| 1 | Configurações + Notas Rápidas | Novos modais + `CampaignShell.tsx` |
| 2 | Recursos (Notas/Handouts/Timeline) | `ResourcesTab.tsx` + hooks |
| 3 | Áudio funcional no Mestre | `CampaignShell.tsx` + `MasterTab.tsx` |
| 4 | NPCs no MasterTab v3 | `MasterTab.tsx` |
| 5 | Macros/Handouts/Bônus (mestre) | `MasterTab.tsx` |

