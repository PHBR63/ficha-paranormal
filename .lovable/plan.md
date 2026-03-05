

# Plano — Melhoria Visual e Diferenciação das 5 Abas

## Contexto das Decisões

Baseado nas suas respostas:
- **PanelTab** → mantém como dashboard completo dos agentes
- **MasterTab** → mantém como centro de comando separado do mapa
- **MapListTab** → mantém como hub de seleção
- **Sem consolidação** — as 5 abas permanecem, mas cada uma precisa ter identidade visual clara e não parecer repetição

## Problema Atual

O `PanelTab` e o `CampaignStatusBar` exibem os mesmos dados (PV/SAN/PE) no mesmo formato (Progress bars). Não há diferenciação de propósito visual. O `PanelTab` é basicamente uma versão expandida do popover do StatusBar.

## Plano de Melhoria

### 1. PanelTab — Evoluir para Dashboard Tático Completo
Atualmente é um grid de cards simples com barras. Precisa se diferenciar adicionando informações que **não existem em nenhum outro lugar**:

**Adicionar aos MemberStatusCards:**
- **Origem** do personagem (já existe em `character.origin`)
- **Patente** (já existe em `character.patent`)
- **Classe e Trilha** (informação de identidade, não status)
- **Lista completa de condições** (atualmente corta em 3 e mostra "+N", expandir)
- **Foto maior** do personagem (não apenas avatar 32px)

**Adicionar ao PanelTab:**
- **Seção de Sessão** mais rica — quando tem sessão ativa, mostrar número, título e duração (tempo desde início)
- **Resumo geral** no topo — "4 agentes | 2 online | 1 em estado crítico"

**Resultado:** O PanelTab se torna um *dossier de campo* com identidade dos agentes, enquanto o StatusBar permanece como *monitor rápido de status*.

### 2. CampaignStatusBar — Simplificar Popover

O popover do StatusBar já mostra PV/SAN/PE completo, duplicando o PanelTab. Proposta:
- **Reduzir o popover** para mostrar apenas nome, classe e status de presença (sem barras)
- Manter as barras **somente no PanelTab** para diferenciação clara
- O popover funciona como "quem está online" e não como "monitor de saúde"

### 3. CampaignHeader — Polimento Visual

- Adicionar ícone/logo da campanha (se houver imagem configurada)
- Estilizar com a identidade visual OP (tons escuros, borda sutil primária)

### 4. CampaignNavigation — Melhorar Responsividade

- Ícones sempre visíveis, labels responsivos (já funciona)
- Sem mudanças estruturais, apenas garantir consistência visual

## Arquivos a Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/components/campaign/v3/tabs/PanelTab.tsx` | **Modificar** | Expandir cards com foto, origem, patente, trilha, condições completas + resumo no topo |
| `src/components/campaign/v3/CampaignStatusBar.tsx` | **Modificar** | Simplificar popover (remover barras PV/SAN/PE, manter só presença) |
| `src/components/campaign/v3/CampaignHeader.tsx` | **Modificar** | Polimento visual com estética OP |

Sem novos arquivos. Sem migrations. Mudanças puramente visuais e de UX.

