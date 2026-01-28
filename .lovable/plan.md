
# Plano: Modal de Seleção de Habilidade para Truque de Mestre

## Resumo

Implementar um modal de seleção de habilidade para **Truque de Mestre** (Negociador, NEX 99%) que lista todas as habilidades de classe, trilha e origem do jogo (exceto rituais e poderes paranormais), permitindo ao jogador simular qualquer uma delas pagando seus custos.

## Contexto da Regra Oficial

> "Acostumado a uma vida de fingimento e manipulação, você pode gastar 5 PE para simular o efeito de qualquer habilidade que você tenha visto um de seus aliados usar durante a cena. Você ignora os pré-requisitos da habilidade, mas ainda precisa pagar todos os seus custos (incluindo ações, PE e materiais) e usar os seus parâmetros de jogo, como se você estivesse usando a habilidade em questão."

**Pontos importantes:**
- Custo base: 5 PE para ativar
- O personagem NÃO ganha a habilidade, apenas a usa naquele momento
- Ignora pré-requisitos da habilidade copiada
- Ainda precisa pagar custos adicionais da habilidade copiada
- Deve ter "visto um aliado usar" durante a cena (flexibilizado para seleção livre no sistema)

## Arquivos a Criar

### 1. `src/components/character/tracks/especialista/TruqueMestreModal.tsx`

Modal/Drawer responsivo para seleção de habilidade a copiar.

**Funcionalidades:**
- Listagem de todas as habilidades organizadas por categoria:
  - Poderes de Combatente (20+ poderes)
  - Poderes de Especialista (20+ poderes)
  - Poderes de Ocultista (20+ poderes) - exceto rituais
  - Habilidades de Trilha (60 habilidades, 4 por trilha × 15 trilhas)
  - Poderes de Origem (26 origens)
- Sistema de busca por nome
- Filtros por classe/categoria
- Exibição de custo, ação e descrição de cada habilidade
- Confirmação mostra custo total (5 PE base + custo da habilidade)

**Estrutura visual:**

```text
┌─────────────────────────────────────────────────────────────┐
│  ✨ Truque de Mestre                    Custo Base: 5 PE   │
│  Simule qualquer habilidade vista por um aliado na cena.   │
├─────────────────────────────────────────────────────────────┤
│  🔍 [Buscar habilidade...                              ]   │
│                                                             │
│  [Todos ▼] [Combatente] [Especialista] [Ocultista]         │
│  [Trilhas] [Origens]                                        │
├─────────────────────────────────────────────────────────────┤
│  📋 PODERES DE CLASSE - COMBATENTE                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚔️ Ataque Especial               2-5 PE | Livre    │   │
│  │ +5 a +20 no ataque ou dano conforme NEX            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚔️ Golpe Pesado                  Passivo           │   │
│  │ +1 dado de dano com armas corpo a corpo            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ...                                                        │
│                                                             │
│  📋 TRILHAS - MÉDICO DE CAMPO                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 💊 Paramédico                    2+ PE | Padrão    │   │
│  │ Cura 2d10 PV (escala com NEX)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ...                                                        │
├─────────────────────────────────────────────────────────────┤
│  Habilidade selecionada: Paramédico                         │
│  Custo total: 5 PE (Truque) + 2 PE (Paramédico) = 7 PE     │
│                                                             │
│  [Cancelar]                        [Usar Habilidade (7 PE)] │
└─────────────────────────────────────────────────────────────┘
```

## Arquivos a Modificar

### 2. `src/components/character/tracks/especialista/useNegociadorTrack.ts`

Adicionar estado e lógica para o modal de Truque de Mestre.

**Alterações:**
- Novo estado: `showTruqueMestreModal: boolean`
- Novo handler: `handleOpenTruqueMestre()` - abre o modal
- Modificar `handleTruqueMestre()` para receber `abilityId` e calcular custo total
- Retornar novos estados e handlers

### 3. `src/components/character/tracks/especialista/NegociadorPanel.tsx`

Integrar o novo modal ao painel.

**Alterações:**
- Importar `TruqueMestreModal`
- Modificar botão "Usar" para abrir o modal ao invés de executar diretamente
- Renderizar o modal

## Detalhes Técnicos

### Estrutura de Dados para Habilidades Copiáveis

```typescript
interface CopyableAbility {
  id: string;
  name: string;
  description: string;
  source: 'class-power' | 'track-ability' | 'origin-power';
  sourceClass?: 'Combatente' | 'Especialista' | 'Ocultista';
  sourceTrack?: string;
  sourceOrigin?: string;
  peCost: number | 'varies' | 'passive';
  actionType: 'free' | 'standard' | 'complete' | 'reaction' | 'movement' | 'none';
  minNex?: number;
  isPassive: boolean;
}
```

### Fontes de Habilidades

1. **Poderes de Classe** (`src/lib/class-powers/power-registry.ts`)
   - COMBATENTE_POWERS, ESPECIALISTA_POWERS, OCULTISTA_POWERS
   - Filtrar: excluir poderes de progressão (Aumento de Atributo, Grau de Treinamento)
   - Filtrar: excluir poderes de rituais (Escolhido pelo Outro Lado)

2. **Habilidades de Trilha** (`src/lib/class-powers/track-powers.ts`)
   - ALL_TRACK_POWERS
   - Total: 60 habilidades (5 trilhas × 4 habilidades × 3 classes)

3. **Poderes de Origem** (`src/lib/character-data.ts`)
   - CORE_ORIGINS + SUPPLEMENT_ORIGINS
   - Total: 26 origens com poderes únicos

### Cálculo de Custo Total

```typescript
// Custo total = 5 PE (base) + custo da habilidade copiada
const calculateTotalCost = (ability: CopyableAbility): number => {
  if (ability.isPassive || ability.peCost === 'passive') {
    return 5; // Apenas custo base para passivos
  }
  if (ability.peCost === 'varies') {
    return 5; // Custo variável, mostrar "5 PE + custo variável"
  }
  return 5 + ability.peCost;
};
```

### Integração Futura com Modo Campanha

O modal será projetado para suportar:
- Lista de habilidades "vistas durante a cena" por aliados da campanha
- Marcação de habilidades usadas por aliados na sessão atual
- Restrição opcional para apenas habilidades vistas (toggle para mestre)

## Habilidades Excluídas (Não Copiáveis)

- Rituais e círculos de ritual (Ocultista core powers relacionados a rituais)
- Poderes paranormais
- Poderes de progressão automática (Aumento de Atributo, Grau de Treinamento)
- Versatilidade (escolha de poder, não é um efeito copiável)

## Fluxo de Uso

```text
1. Usuário clica "Usar" em Truque de Mestre (NEX 99%)
       ↓
2. Modal abre com lista de habilidades
       ↓
3. Usuário busca/filtra e seleciona uma habilidade
       ↓
4. Sistema calcula custo total (5 PE base + custo da habilidade)
       ↓
5. Usuário confirma
       ↓
6. Sistema deduz PE e exibe toast com:
   - Nome da habilidade copiada
   - Efeito/descrição
   - Lembrete de ação necessária
```
