
# Plano: Testes de Snapshot para Breakdowns de Bônus na UI

## Objetivo
Adicionar testes de snapshot para garantir a consistência visual dos componentes que exibem breakdowns de bônus no sistema, detectando mudanças não-intencionais na estrutura de dados e apresentação.

## Análise da Situação Atual

### Componentes que Exibem Breakdowns
1. **TrackCombatBonusesBar** - Barra de bônus de trilha com breakdown de ataque, dano, defesa e crítico
2. **CombatRollModal** (Desktop) - Breakdown de bônus de ataque e dano com tooltips
3. **MobileCombatRollModal** - Versão mobile com badges coloridos por fonte
4. **DiceRollModal** - Breakdown de testes de perícia
5. **Iniciativa** - Breakdown de fontes de bônus de iniciativa

### Estrutura de Dados Relevante
```typescript
interface BonusBreakdown {
  source: string;        // Nome da fonte
  value: number | string; // Valor do bônus
  type: 'origin' | 'ability' | 'general_power' | ...;
  conditional?: string;  // Condição se houver
  active: boolean;       // Se está ativo
  excluded?: boolean;    // Se excluído por stacking
  excludedReason?: string; // Motivo da exclusão
}
```

### Infraestrutura Existente
- Testes de snapshot para `ComputedEffects` já existem em `computed-effects-snapshot.vitest.ts`
- Setup de testes configurado com jsdom, React Testing Library
- Hook `useBonusSummaryFromSUE` converte SUE → BonusSummary para UI

## Estratégia de Implementação

### Fase 1: Criar Utilitários de Teste para Breakdowns
Criar helpers que geram dados de breakdown consistentes para cenários de teste.

### Fase 2: Testes de Snapshot para Estrutura de Dados
Validar que a estrutura dos breakdowns permanece consistente.

### Fase 3: Testes de Snapshot para Componentes de UI
Testar a renderização dos componentes com diferentes cenários de bônus.

---

## Detalhamento Técnico

### Arquivos a Criar

#### 1. `src/components/character/__tests__/BonusBreakdownSnapshot.test.tsx`
Testes de snapshot para componentes de breakdown:

```typescript
// Cenários de teste:
describe('BonusBreakdown Snapshots', () => {
  describe('TrackCombatBonusesBar', () => {
    it('renderiza corretamente com bônus de ataque simples');
    it('renderiza corretamente com múltiplas fontes');
    it('renderiza corretamente com bônus excluídos por stacking');
    it('renderiza corretamente com bônus condicionais');
    it('renderiza corretamente breakdown de iniciativa');
  });
  
  describe('CombatBonusBreakdown', () => {
    it('snapshot de ataque com origem + poder geral');
    it('snapshot de dano com trilha + atributo');
    it('snapshot com rituais ativos');
    it('snapshot com bônus de ataque especial');
  });
  
  describe('SkillBreakdown', () => {
    it('snapshot de perícia com treinamento');
    it('snapshot com Conhecimento Aplicado ativo');
    it('snapshot com swap de perícia (Impostor)');
  });
});
```

#### 2. `src/components/character/__tests__/breakdown-test-utils.ts`
Utilitários para criar dados de teste:

```typescript
// Helpers para criar breakdowns de teste
export function createMockCombatBonuses(overrides);
export function createMockBreakdown(sources);
export function createMockInitiativeBreakdown(sources);
export function createMockDamageReduction(sources);
```

#### 3. `src/hooks/__tests__/useBonusSummaryFromSUE.snapshot.test.ts`
Testes de snapshot para a conversão SUE → BonusSummary:

```typescript
describe('useBonusSummaryFromSUE - Snapshots', () => {
  describe('Estrutura de Saída', () => {
    it('snapshot de combatente guerreiro NEX 50%');
    it('snapshot de especialista infiltrador NEX 75%');
    it('snapshot de ocultista flagelador NEX 99%');
  });
  
  describe('Breakdowns por Categoria', () => {
    it('attack breakdown com múltiplas fontes');
    it('damage breakdown com trilha + poder');
    it('defense breakdown com armadura + escudo + ritual');
    it('initiative breakdown com operações especiais');
  });
});
```

### Cenários de Teste Prioritários

| Cenário | Componente | Fontes de Bônus |
|---------|------------|-----------------|
| Guerreiro corpo-a-corpo | TrackCombatBonusesBar | Ataque Especial, Golpe Pesado, FOR |
| Atirador de Elite | CombatRollModal | Mira de Elite, Tiro Certeiro, AGI |
| Infiltrador assassino | MobileCombatRollModal | Ataque Furtivo, Assassinar, crítico |
| Operações Especiais | Iniciativa | +5 trilha, treinamento, condição |
| Tropa de Choque | DefenseBreakdown | Inquebrável, Casca Grossa, armadura |

### Estrutura de Diretórios

```text
src/
├── components/
│   └── character/
│       └── __tests__/
│           ├── BonusBreakdownSnapshot.test.tsx  [NOVO]
│           └── breakdown-test-utils.ts          [NOVO]
├── hooks/
│   └── __tests__/
│       └── useBonusSummaryFromSUE.snapshot.test.ts [NOVO]
└── lib/
    └── __tests__/
        └── computed-effects-snapshot.vitest.ts  [EXISTENTE - referência]
```

## Benefícios

1. **Detecção de Regressões**: Qualquer mudança na estrutura de breakdowns será detectada automaticamente
2. **Documentação Viva**: Snapshots servem como documentação da estrutura esperada
3. **Consistência UI**: Garante que desktop e mobile exibem os mesmos dados
4. **Validação de Stacking**: Testa que bônus excluídos aparecem corretamente com motivo

## Estimativa

- **3 arquivos novos** de teste
- **~25-30 cenários de teste** cobrindo os principais componentes
- Compatível com a infraestrutura Vitest existente
