
# Plano: Seleção de Alvo para Equipe de Trauma ✅

## Status: IMPLEMENTADO

## Resumo

Implementado um modal de seleção de alvo para a habilidade "Equipe de Trauma" (Médico de Campo, NEX 40%) que permite:
1. **Modo Ficha (sem campanha)**: Selecionar entre o próprio personagem ou "aliado adjacente" (narrativo)
2. **Modo Campanha**: Selecionar entre os personagens aliados da campanha, exibindo suas condições ativas para escolha informada

## Arquivos Criados

### 1. `src/components/character/tracks/especialista/EquipeTraumaModal.tsx`
Modal/Drawer responsivo para seleção de alvo e condição a remover.

**Funcionalidades implementadas:**
- Lista de alvos (próprio personagem, aliados de campanha, opção narrativa)
- Para cada alvo, exibe suas condições ativas como badges visuais
- Após selecionar alvo, exibe lista de condições removíveis (exceto "morrendo")
- Aplica bônus de Defesa do Resgate (NEX 65%) quando aplicável
- Fluxo em dois passos: 1) Seleção de alvo → 2) Seleção de condição

## Arquivos Modificados

### 2. `src/components/character/tracks/especialista/useMedicoDeCampoTrack.ts`
- Adicionado estado: `showEquipeTraumaModal`
- Adicionado handler: `handleOpenEquipeTrauma()` - abre o modal
- Modificado `handleEquipeTrauma()` para receber `targetId` e `conditionId`
- Novos valores retornados no hook para controle do modal

### 3. `src/components/character/tracks/especialista/MedicoDeCampoPanel.tsx`
- Integrado `EquipeTraumaModal` ao painel
- Props estendidas para receber dados de condições e aliados
- Botão "Usar" agora abre o modal em vez de executar diretamente

### 4. `src/pages/CharacterSheet.tsx`
- Adicionadas props `characterId`, `characterName`, `characterConditions` ao MedicoDeCampoPanel
- Conversão de condições locais para formato `ActiveCondition` compatível com o modal

## Próximos Passos (Modo Campanha)

Para habilitar a funcionalidade completa de campanha, será necessário:
1. Passar `campaignAllies` com dados dos membros da campanha
2. Implementar callback `onRemoveCondition` para remover condições de aliados via Supabase
3. Sincronização realtime das condições entre clientes
