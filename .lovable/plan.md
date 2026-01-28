
# Plano: Seleção de Alvo para Equipe de Trauma

## Resumo

Implementar um modal de seleção de alvo para a habilidade "Equipe de Trauma" (Médico de Campo, NEX 40%) que permita:
1. **Modo Ficha (sem campanha)**: Selecionar entre o próprio personagem ou "aliado adjacente" (narrativo)
2. **Modo Campanha**: Selecionar entre os personagens aliados da campanha, exibindo suas condições ativas para escolha informada

## Fluxo de Uso

```text
┌──────────────────────────────────────────────────────────────────┐
│  1. Usuário clica "Usar" em Equipe de Trauma                     │
├──────────────────────────────────────────────────────────────────┤
│  2. Abre Modal/Drawer de seleção de alvo                         │
│     ┌────────────────────────────────────────┐                   │
│     │  🎯 Selecionar Alvo                    │                   │
│     │                                        │                   │
│     │  ○ Você mesmo                          │                   │
│     │    [Abalado] [Fatigado]                │                   │
│     │                                        │                   │
│     │  ─── Aliados da Campanha ───           │ (se em campanha)  │
│     │  ○ Nome do Aliado 1                    │                   │
│     │    [Envenenado] [Debilitado]           │                   │
│     │  ○ Nome do Aliado 2                    │                   │
│     │    [Atordoado]                         │                   │
│     │                                        │                   │
│     │  ○ Outro aliado adjacente (narrativo)  │ (se sem campanha) │
│     └────────────────────────────────────────┘                   │
├──────────────────────────────────────────────────────────────────┤
│  3. Após selecionar alvo, abre Modal de Condição a Remover       │
│     ┌────────────────────────────────────────┐                   │
│     │  💊 Remover Condição                   │                   │
│     │                                        │                   │
│     │  Condições de [Nome do Alvo]:          │                   │
│     │  ○ Abalado (-1 em testes)              │                   │
│     │  ○ Fatigado (-2 em testes)             │                   │
│     │                                        │                   │
│     │  ⚠️ Não pode remover: Morrendo         │                   │
│     └────────────────────────────────────────┘                   │
├──────────────────────────────────────────────────────────────────┤
│  4. Confirma → Gasta 2 PE, Remove condição, Aplica bônus Resgate │
└──────────────────────────────────────────────────────────────────┘
```

## Arquivos a Criar

### 1. `src/components/character/tracks/especialista/EquipeTraumaModal.tsx`
Modal/Drawer responsivo para seleção de alvo e condição a remover.

**Funcionalidades:**
- Lista de alvos (próprio personagem, aliados de campanha, opção narrativa)
- Para cada alvo, exibe suas condições ativas como badges visuais
- Após selecionar alvo, exibe lista de condições removíveis (exceto "morrendo")
- Integração com sistema de condições existente (`useConditions`)
- Aplica bônus de Defesa do Resgate (NEX 65%) quando aplicável

**Props:**
```typescript
interface EquipeTraumaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Dados do personagem atual
  characterId: string;
  characterName: string;
  characterConditions: ActiveCondition[];
  // Aliados de campanha (opcional)
  campaignAllies?: CampaignAlly[];
  // Callbacks
  onConfirm: (targetId: 'self' | 'narrative' | string, conditionId: string) => void;
  // Bônus de Resgate
  hasResgate: boolean;
  defenseBonus: number;
}

interface CampaignAlly {
  id: string;
  characterId: string;
  name: string;
  photoUrl?: string;
  conditions: ActiveCondition[];
}
```

## Arquivos a Modificar

### 2. `src/components/character/tracks/especialista/useMedicoDeCampoTrack.ts`
Adicionar estado e lógica para o modal de Equipe de Trauma.

**Alterações:**
- Novo estado: `showEquipeTraumaModal: boolean`
- Novo handler: `handleOpenEquipeTrauma()` - abre o modal
- Modificar `handleEquipeTrauma()` para receber targetId e conditionId
- Adicionar lógica para remover condição do alvo selecionado
- Retornar novos estados e handlers

### 3. `src/components/character/tracks/especialista/MedicoDeCampoPanel.tsx`
Integrar o novo modal ao painel.

**Alterações:**
- Importar `EquipeTraumaModal`
- Passar props de condições do personagem
- Passar props de aliados de campanha (quando disponível)
- Renderizar o modal

### 4. `src/pages/CharacterSheet.tsx`
Fornecer dados de campanha e condições ao MedicoDeCampoPanel.

**Alterações:**
- Passar `characterConditions` ao MedicoDeCampoPanel
- Passar `campaignAllies` (do contexto de campanha, se disponível)
- Adicionar callback `onRemoveCondition` para integração com useConditions

## Detalhes Técnicos

### Integração com Sistema de Condições
- Usar `useConditions` hook existente para obter e remover condições
- Respeitar a regra oficial: não pode remover "morrendo"
- Filtrar apenas condições negativas (debuffs e conditions, não buffs)

### Integração com Modo Campanha
- Verificar se `isInCampaign` está ativo
- Se sim, buscar membros da campanha via `useCampaignMembers` ou dados existentes
- Cada membro terá suas condições carregadas via realtime ou fetch

### Remoção de Condição em Aliados (Campanha)
Para o modo campanha, a remoção de condição em aliados requer:
1. Identificar o `characterId` do aliado selecionado
2. Chamar função que remove a condição no banco de dados
3. O realtime sync propagará a mudança para todos os clientes

### Preparação para Futuro
O modal será projetado para suportar:
- Lista dinâmica de aliados de campanha
- Sincronização em tempo real de condições
- Efeitos de bônus de Defesa propagados para o alvo
