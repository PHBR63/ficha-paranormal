

# Mapa Tático em Janela Separada

## Análise da Proposta

Separar o mapa em um **projeto Lovable separado** traz complicações significativas:
- Cada projeto Lovable Cloud tem seu próprio backend isolado — não compartilham banco de dados
- Seria necessário duplicar autenticação, tabelas e lógica
- Sincronização em tempo real entre dois backends distintos seria complexa e frágil

## Recomendação: Rota dedicada no mesmo projeto

A abordagem mais eficiente é criar uma **rota dedicada** (`/map/:campaignId`) que abre em uma **nova aba do navegador**, mantendo:
- Mesmo banco de dados e autenticação
- Mesmo Realtime (tokens, desenhos, pings sincronizados)
- Zero duplicação de código

## O que muda

1. **Nova rota `/map/:campaignId`** — página standalone com o mapa em tela cheia, sem header/navigation/statusbar da campanha. Apenas o mapa + toolbar flutuante.

2. **Botão "Abrir em nova aba"** na aba Mapa do CampaignShell — abre `window.open('/map/{campaignId}')`.

3. **Aba Mapa original permanece** como opção inline para quem preferir não abrir nova janela.

4. **A nova página** reutiliza os mesmos componentes (`TacticalBoardKonva`, `TacticalToolbar`, etc.) e o mesmo hook `useTacticalBoard` — 100% do viewport dedicado ao canvas.

## Estrutura técnica

```text
CampaignShell (existente)
  └── MapTab → botão "Pop Out" → window.open('/map/:id')

/map/:campaignId (nova rota)
  └── TacticalMapFullscreen (nova página)
      ├── useTacticalBoard (mesmo hook)
      ├── TacticalBoardKonva (mesmo componente)
      └── Toolbar flutuante compacta
```

## Escopo de implementação

1. Criar `src/pages/TacticalMapFullscreen.tsx` — página standalone com autenticação, hook do mapa e canvas em tela cheia
2. Adicionar rota `/map/:campaignId` no router
3. Adicionar botão "Abrir em nova aba" no `MapTab` existente
4. Garantir que a página standalone valide autenticação e permissões

Nenhuma migração de banco necessária. Nenhuma alteração nos componentes do mapa.

