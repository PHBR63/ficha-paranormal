# SUE - Cobertura de Testes

## Sistema Unificado de Efeitos (SUE) - Ordem Paranormal RPG v1.3

Este documento descreve a cobertura de testes unitários e de integração do SUE.

---

## Visão Geral

O SUE é o motor central do game engine que controla:
- Ações e pendências
- Automações de bônus
- Condições dos personagens
- Efeitos de origens, trilhas, poderes e rituais

---

## Arquivos de Teste

| Arquivo | Testes | Cobertura |
|---------|--------|-----------|
| `condition-effects-adapter.vitest.ts` | ~25 | Condições, modificadores contextuais |
| `ritual-effects-adapter.vitest.ts` | ~20 | Rituais sustentados, cálculo de bônus |
| `class-power-effects-adapter.vitest.ts` | ~25 | Poderes de classe, escolhas |
| `useUnifiedEffects.vitest.ts` | ~15 | Hook central, helpers |
| `useBonusSummaryFromSUE.vitest.ts` | ~20 | Conversão SUE para BonusSummary |
| `unified-effects-performance.vitest.ts` | ~10 | Testes de performance |
| `sue-integration.vitest.ts` | ~20 | Fluxos end-to-end |
| **Total** | **~135** | |

---

## Detalhamento por Componente

### 1. Adaptador de Condições (`condition-effects-adapter.ts`)

#### Testes de Integridade
- ✅ Mapeamento de todas as 30+ condições oficiais
- ✅ Propriedades obrigatórias em cada condição

#### Testes de Mecânicas
- ✅ Condições críticas: `inconsciente`, `morrendo`, `paralisado`, `indefeso`
- ✅ Condições de combate: `agarrado`, `atordoado`, `desprevenido`, `surpreendido`
- ✅ Condições sensoriais: `cego`, `surdo`
- ✅ Condições físicas: `debilitado`, `doente`, `exausto`, `envenenado`
- ✅ Condições mentais: `apavorado`, `fascinado`, `perturbado`
- ✅ Condições de ritual: `velocidade-mortal-buff`, `velocidade-mortal-discente`

#### Testes Contextuais
- ✅ `caido`: -5 Defesa vs melee, +5 vs ranged
- ✅ Aplicação correta de contexto em `getConditionEffects`

#### Testes de Conversão
- ✅ `getConditionEffects` retorna UnifiedEffect válidos
- ✅ Efeitos têm `source = 'condition'`
- ✅ `getConditionModifiersSummary` calcula totais

---

### 2. Adaptador de Rituais (`ritual-effects-adapter.ts`)

#### Testes de Estrutura
- ✅ `getRitualEffects` retorna array de UnifiedEffect
- ✅ Efeitos têm `source = 'ritual'`
- ✅ ID no formato `ritual-{ritualId}`
- ✅ Duração `until_removed` com `sustainCost`

#### Testes de Cálculo
- ✅ `calculateRitualBonusTotals` aplica regra de não-acúmulo
- ✅ Maior valor prevalece para cada tipo de bônus
- ✅ Efeitos especiais são acumulados

#### Testes de Resumo
- ✅ `getRitualEffectsSummary` formata para display
- ✅ Preserva informações do ritual (nome, elemento, círculo)

---

### 3. Adaptador de Poderes de Classe (`class-power-effects-adapter.ts`)

#### Testes de Combatente
- ✅ `golpe-pesado`: +2 dano corpo a corpo
- ✅ `golpe-demolidor`: +4 dano corpo a corpo
- ✅ `golpe-brutal`: +2 margem de ameaça

#### Testes de Especialista
- ✅ `mira-firme`: +2 dano à distância
- ✅ `balistica-avancada`: +2 dano com armas de fogo

#### Testes de Ocultista
- ✅ `especialista-em-elemento`: +2 DT por elemento
- ✅ `mestre-em-elemento`: -1 PE por elemento
- ✅ `ritual-potente`: +INT em dano/cura de rituais
- ✅ `ritual-predileto`: -1 PE no ritual escolhido
- ✅ `tatuagem-ritualistica`: -1 PE em rituais pessoais

#### Testes de Validação
- ✅ `getPowersRequiringChoice` lista poderes com escolhas
- ✅ `getChoiceTypeForPower` retorna tipo de escolha
- ✅ Poderes sem escolha válida não geram efeito

---

### 4. Hook useUnifiedEffects

#### Testes de Estrutura
- ✅ Retorno tem `allEffects`, `computed`, `bySource`, helpers
- ✅ `bySource` agrupa por fonte corretamente

#### Testes de Helpers
- ✅ `hasEffect` encontra efeitos por ID
- ✅ `getEffectsFromSource` filtra por fonte
- ✅ `isEffectActive` verifica condições

#### Testes de Memoização
- ✅ Mesma referência se dependências não mudam
- ✅ Recalcula quando dados mudam

#### Testes de Contexto
- ✅ Funciona com e sem contexto de combate
- ✅ Combate influencia efeitos de trilha

---

### 5. Testes de Integração End-to-End

#### Fluxo Combatente + Guerreiro
- ✅ Bônus de poderes de combate corpo a corpo
- ✅ Consolidação com condições

#### Fluxo Ocultista + Conduíte
- ✅ Bônus de DT para elemento especializado
- ✅ Ritual Potente com INT

#### Fluxo Especialista + Atirador de Elite
- ✅ Bônus de dano à distância
- ✅ Balística Avançada com nota condicional

#### Condições em Combate
- ✅ Desprevenido: -5 Defesa
- ✅ Caído: bônus contextuais
- ✅ Paralisado: isHelpless

---

## Comandos para Execução

```bash
# Rodar todos os testes do SUE
npm run test -- --grep "SUE|unified-effects|effects-adapter|useUnifiedEffects"

# Rodar com cobertura
npm run test:coverage -- --grep "effects"

# Rodar apenas testes de condições
npm run test -- src/lib/effects/__tests__/condition-effects-adapter.vitest.ts

# Rodar apenas testes de rituais
npm run test -- src/lib/effects/__tests__/ritual-effects-adapter.vitest.ts

# Rodar apenas testes de poderes de classe
npm run test -- src/lib/effects/__tests__/class-power-effects-adapter.vitest.ts

# Rodar apenas testes do hook
npm run test -- src/hooks/__tests__/useUnifiedEffects.vitest.ts

# Rodar testes de integração
npm run test -- src/lib/__tests__/sue-integration.vitest.ts
```

---

## Métricas de Cobertura

### Funções Cobertas

| Função | Arquivo | Cobertura |
|--------|---------|-----------|
| `getConditionEffects` | condition-effects-adapter | ✅ 100% |
| `getConditionModifiersSummary` | condition-effects-adapter | ✅ 100% |
| `listAllConditionEffects` | condition-effects-adapter | ✅ 100% |
| `getRitualEffects` | ritual-effects-adapter | ✅ 100% |
| `calculateRitualBonusTotals` | ritual-effects-adapter | ✅ 100% |
| `getRitualEffectsSummary` | ritual-effects-adapter | ✅ 100% |
| `getSustainableRituals` | ritual-effects-adapter | ✅ 100% |
| `getClassPowerEffects` | class-power-effects-adapter | ✅ 100% |
| `getPowersRequiringChoice` | class-power-effects-adapter | ✅ 100% |
| `getChoiceTypeForPower` | class-power-effects-adapter | ✅ 100% |
| `hasPowerEffects` | class-power-effects-adapter | ✅ 100% |
| `listAllClassPowerEffects` | class-power-effects-adapter | ✅ 100% |
| `useUnifiedEffects` | useUnifiedEffects | ✅ 100% |
| `useBonusSummaryFromSUE` | useBonusSummaryFromSUE | ✅ 100% |
| `consolidateEffects` | unified-effects-engine | ✅ Parcial |
| `checkEffectConditions` | unified-effects-engine | ✅ Parcial |

---

## Casos de Teste Prioritários

### Alta Prioridade ✅
1. Condições críticas (inconsciente, morrendo, paralisado)
2. Modificadores contextuais (caído melee vs ranged)
3. Poderes de Ocultista com rituais
4. Consolidação de múltiplas fontes

### Média Prioridade ✅
1. Poderes de Combatente e Especialista
2. Rituais sustentados
3. Helpers do hook
4. Edge cases com dados inválidos

### Baixa Prioridade (Futuro)
1. Poderes Paranormais com afinidade
2. Efeitos de origem
3. Efeitos de trilha específicos

---

## Manutenção

### Ao Adicionar Nova Condição
1. Adicionar em `CONDITIONS` (conditions.ts)
2. Adicionar mecânicas em `CONDITION_MECHANICS`
3. Adicionar teste em `condition-effects-adapter.vitest.ts`

### Ao Adicionar Novo Poder de Classe
1. Adicionar em `CLASS_POWER_EFFECT_CONFIGS`
2. Adicionar teste em `class-power-effects-adapter.vitest.ts`
3. Se requer escolha, adicionar teste de validação

### Ao Modificar Ritual
1. Verificar `getRitualMechanics`
2. Atualizar testes em `ritual-effects-adapter.vitest.ts`

---

## Histórico de Versões

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0.0 | 2024-12-30 | Criação inicial com ~105 testes |
| 1.1.0 | 2024-12-30 | Adicionados ~30 testes (useBonusSummaryFromSUE, performance) |

---

## Documentação Relacionada

- [SISTEMA_UNIFICADO_EFEITOS.md](./SISTEMA_UNIFICADO_EFEITOS.md) - Arquitetura completa do SUE

---

*Documentação gerada para o Sistema Unificado de Efeitos (SUE) do Ordem Paranormal RPG v1.3*
