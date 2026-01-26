# SUE - Cobertura de Testes

## Sistema Unificado de Efeitos (SUE) - Ordem Paranormal RPG v1.3

> **Última atualização:** 2026-01-26  
> **Total de testes:** ~640

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

### Base (~366 testes)

| Arquivo | Testes | Cobertura |
|---------|--------|-----------|
| `condition-effects-adapter.vitest.ts` | ~25 | Condições, modificadores contextuais |
| `ritual-effects-adapter.vitest.ts` | ~26 | Rituais sustentados, cálculo de bônus, getSustainableRituals |
| `class-power-effects-adapter.vitest.ts` | ~25 | Poderes de classe, escolhas |
| `origin-effects-adapter.vitest.ts` | ~40 | 8 origens base + suplementos, proficiências |
| `track-effects-adapter.vitest.ts` | ~100 | 15 trilhas oficiais (5 Combatente + 5 Especialista + 5 Ocultista) |
| `paranormal-powers-effects-adapter.vitest.ts` | ~35 | Poderes paranormais, afinidades |
| `useUnifiedEffects.vitest.ts` | ~15 | Hook central, helpers |
| `useBonusSummaryFromSUE.vitest.ts` | ~20 | Conversão SUE para BonusSummary |
| `useRitualModifiersFromSUE.vitest.ts` | ~15 | Modificadores de ritual por trilha/poderes |
| `unified-effects-performance.vitest.ts` | ~10 | Testes de performance |
| `sue-integration.vitest.ts` | ~20 | Fluxos end-to-end básicos |
| `sue-integration-e2e.vitest.ts` | ~25 | Fluxos E2E completos, progressão NEX |
| `computed-effects-snapshot.vitest.ts` | ~10 | Snapshots de estrutura ComputedEffects |
| **Subtotal Base** | **~366** | |

### FASE 7 - Testes de Integração Avançados (~120 testes)

| Arquivo | Testes | Cobertura |
|---------|--------|-----------|
| `sue-stacking-integration.vitest.ts` | ~25 | Regras de acúmulo multi-fonte (equipamento + ritual + condição) |
| `sue-conditions-integration.vitest.ts` | ~25 | checkEffectConditions completo, condições automáticas |
| `sue-paranormal-integration.vitest.ts` | ~20 | Poderes paranormais, afinidade ativa, escalamento NEX |
| `sue-combat-scenarios.vitest.ts` | ~22 | Cenários de combate real (Combatente, Especialista, Ocultista) |
| `sue-edge-cases.vitest.ts` | ~28 | Edge cases, performance, regressão |
| **Subtotal FASE 7** | **~120** | |

### Testes de Integração SUE-Rolagem (~80 testes) - NOVO

| Arquivo | Testes | Cobertura |
|---------|--------|-----------|
| `roll-with-sue-integration.vitest.ts` | ~25 | Integração hooks de rolagem ↔ motor SUE |
| `sue-stacking-rules.vitest.ts` | ~24 | Regras de stacking aplicadas em rolagens |
| `rules-engine-e2e.vitest.ts` | ~36 | Fluxos E2E completos (ataque → dano → resultado) |
| `combat-integration.vitest.ts` | ~27 | Cenários de combate com todas as classes/trilhas |
| **Subtotal SUE-Rolagem** | **~112** | |

### Testes de Validação (~35 testes)

| Arquivo | Testes | Cobertura |
|---------|--------|-----------|
| `validate-character-skills-powers.vitest.ts` | ~35 | Validação de perícias, poderes, origens, trilhas |
| **Subtotal Validação** | **~35** | |

### Testes de Campanha (~40 testes)

| Arquivo | Testes | Cobertura |
|---------|--------|-----------|
| `sue-campaign-scenarios.vitest.ts` | ~30 | Cenários de campanha completos |
| `sue-multi-character.vitest.ts` | ~25 | Interação entre múltiplos personagens |
| `sue-realtime-sync.vitest.ts` | ~20 | Edge cases de sincronização realtime |
| **Subtotal Campanha** | **~75** | |

| **TOTAL GERAL** | **~640** | |

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

### 4. Adaptador de Origens (`origin-effects-adapter.ts`)

#### Testes de Mapeamento
- ✅ 26 origens base com mecânicas definidas
- ✅ 17 origens de suplemento
- ✅ Todas as origens têm mecânicas e descrição definidas

#### Testes de Mecânicas
- ✅ Bônus de perícia por origem
- ✅ Bônus de iniciativa (Atleta, Militar)
- ✅ Bônus de Defesa
- ✅ Bônus de dano
- ✅ Bônus de PV

#### Testes de Poderes Togglable
- ✅ Poderes com custo de PE identificados corretamente
- ✅ Poderes passivos não são togglable

#### Testes de Proficiências
- ✅ Origens que concedem proficiências em armas
- ✅ Militar: armas de fogo leves

---

### 5. Adaptador de Trilhas (`track-effects-adapter.ts`)

#### Trilhas Combatente (~40 testes)
- ✅ Aniquilador: técnicas (Amplo, Destruidor, Letal, Perfurante)
- ✅ Comandante de Campo: inspiração, estratégia, brecha
- ✅ Guerreiro: revidar, força opressora
- ✅ Operações Especiais: ataque extra, surto de adrenalina
- ✅ Tropa de Choque: cai dentro, duro de matar

#### Trilhas Especialista (~30 testes)
- ✅ Atirador de Elite: disparo letal, impactante
- ✅ Infiltrador: ataque furtivo, assassinar
- ✅ Médico de Campo: paramédico, equipe de trauma
- ✅ Negociador: eloquência, discurso motivador
- ✅ Técnico: remendo, improvisar

#### Trilhas Ocultista (~30 testes)
- ✅ Condutor: ampliar ritual, acelerar ritual, anular ritual
- ✅ Flagelador: poder do flagelo, abraçar a dor, absorver angústia
- ✅ Graduado: saber ampliado, grimório ritualístico, rituais eficientes
- ✅ Intuitivo: mente sã, presença poderosa, inabalável
- ✅ Lâmina Paranormal: lâmina maldita, gladiador paranormal, conjuração marcial

#### Testes de Integração
- ✅ Escalamento por NEX (0%, 5%, 10%, 40%, 65%, 99%)
- ✅ Bônus melee vs ranged
- ✅ Efeitos ativáveis com custo de PE
- ✅ `getTrackCombatBonuses` para todas as trilhas
- ✅ `getTrackBonusSummary` para resumos

---

### 6. Testes de Validação de Personagem

#### Validação de Origens
- ✅ Perícias obrigatórias por origem
- ✅ Exceção para Amnésico (sem perícias fixas)
- ✅ Origens desconhecidas geram info
- ✅ Auto-fix sugere treinar perícias faltantes

#### Validação de Trilhas
- ✅ Pré-requisitos de perícia por trilha
- ✅ Médico de Campo requer Medicina
- ✅ Auto-fix sugere treinar perícias faltantes

#### Validação de Poderes
- ✅ Pré-requisitos de NEX
- ✅ Pré-requisitos de atributo
- ✅ Poderes duplicados

---

### 7. Hook useUnifiedEffects

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

---

## Comandos para Execução

```bash
# Rodar todos os testes do SUE (~640 testes)
npm run test -- --grep "SUE|unified-effects|effects-adapter|useUnifiedEffects|BonusSummary|validate-character|roll-with-sue"

# Rodar testes base (~366 testes)
npm run test -- src/lib/effects/__tests__/

# Rodar testes da FASE 7 (~120 testes)
npm test -- sue-

# Rodar testes de validação (~35 testes)
npm run test -- validate-character

# Rodar com cobertura
npm run test:coverage -- --grep "effects"

# Rodar apenas testes de condições
npm run test -- src/lib/effects/__tests__/condition-effects-adapter.vitest.ts

# Rodar apenas testes de rituais
npm run test -- src/lib/effects/__tests__/ritual-effects-adapter.vitest.ts

# Rodar apenas testes de poderes de classe
npm run test -- src/lib/effects/__tests__/class-power-effects-adapter.vitest.ts

# Rodar apenas testes de origens
npm run test -- src/lib/effects/__tests__/origin-effects-adapter.vitest.ts

# Rodar apenas testes de trilhas
npm run test -- src/lib/effects/__tests__/track-effects-adapter.vitest.ts

# Rodar testes de integração E2E
npm run test -- src/lib/__tests__/sue-integration-e2e.vitest.ts

# Rodar testes de integração SUE-Rolagem (NOVO)
npm run test -- roll-with-sue-integration

# Rodar testes de stacking em rolagens
npm run test -- sue-stacking-rules

# Rodar testes E2E do motor de regras
npm run test -- rules-engine-e2e

# Rodar testes de combate
npm run test -- combat-integration
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
| `getOriginEffects` | origin-effects-adapter | ✅ 100% |
| `listAllOriginEffects` | origin-effects-adapter | ✅ 100% |
| `getTrackEffects` | track-effects-adapter | ✅ 100% |
| `getTrackCombatBonuses` | track-effects-adapter | ✅ 100% |
| `getTrackBonusSummary` | track-effects-adapter | ✅ 100% |
| `getParanormalPowerEffects` | paranormal-powers-effects-adapter | ✅ 100% |
| `useUnifiedEffects` | useUnifiedEffects | ✅ 100% |
| `useBonusSummaryFromSUE` | useBonusSummaryFromSUE | ✅ 100% |
| `useRitualModifiersFromSUE` | useRitualModifiersFromSUE | ✅ 100% |
| `consolidateEffects` | unified-effects-engine | ✅ 100% |
| `checkEffectConditions` | unified-effects-engine | ✅ 100% |
| `validateCharacter` | validate-character | ✅ 100% |
| `deriveCharacter` | derive-character | ✅ 100% |
| `rollAttackWithContext` | roll-with-sue | ✅ 100% |
| `rollDamageWithContext` | roll-with-sue | ✅ 100% |
| `rollSkillCheckWithContext` | roll-with-sue | ✅ 100% |
| `rollInitiativeWithContext` | roll-with-sue | ✅ 100% |
| `rollResistanceCheckWithContext` | roll-with-sue | ✅ 100% |

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

### Ao Adicionar Nova Trilha
1. Adicionar em `TRACK_EFFECT_MAPPINGS` (track-effects-adapter.ts)
2. Registrar em `track-registry.ts`
3. Adicionar testes em `track-effects-adapter.vitest.ts`

### Ao Adicionar Nova Origem
1. Adicionar em `ORIGIN_POWER_EFFECTS` (origin-effects-adapter.ts)
2. Adicionar em `ORIGIN_GRANTED_SKILLS` (validate-character.ts)
3. Adicionar testes em `origin-effects-adapter.vitest.ts`
4. Adicionar testes em `validate-character-skills-powers.vitest.ts`

### Ao Adicionar Novo Pré-requisito de Trilha
1. Adicionar em `TRACK_SKILL_PREREQUISITES` (validate-character.ts)
2. Adicionar teste em `validate-character-skills-powers.vitest.ts`

---

## Histórico de Versões

| Versão | Data | Alterações |
|--------|------|------------|
| 1.0.0 | 2025-12-30 | Criação inicial com ~105 testes |
| 1.1.0 | 2025-12-30 | Adicionados ~30 testes (useBonusSummaryFromSUE, performance) |
| 1.2.0 | 2025-12-31 | Adicionados ~25 testes E2E, ~10 testes snapshot, getSustainableRituals |
| 2.0.0 | 2025-12-31 | Documentação atualizada para refletir cobertura real (~366 testes) |
| 3.0.0 | 2026-01-04 | **FASE 7**: +120 testes de integração avançados. Total: ~486 testes |
| 4.0.0 | 2026-01-26 | **Validação**: +35 testes de validateCharacter (origens, trilhas). Total: ~560 testes |
| 5.0.0 | 2026-01-26 | **SUE-Rolagem**: +80 testes de integração SUE com sistema de rolagem. Total: ~640 testes |

---

## Documentação Relacionada

- [SISTEMA_UNIFICADO_EFEITOS.md](./SISTEMA_UNIFICADO_EFEITOS.md) - Arquitetura completa do SUE
- [SISTEMA_ROLAGEM_UNIFICADO.md](./SISTEMA_ROLAGEM_UNIFICADO.md) - Sistema de rolagem integrado ao SUE
- [ARQUITETURA.md](./ARQUITETURA.md) - Arquitetura geral do projeto
- [MIGRACAO_SUE_ROLAGEM_COMPLETA.md](./MIGRACAO_SUE_ROLAGEM_COMPLETA.md) - Histórico da migração
- [ORIGENS_MECANICAS_COMPLETAS.md](./ORIGENS_MECANICAS_COMPLETAS.md) - Implementação de origens

---

*Documentação gerada para o Sistema Unificado de Efeitos (SUE) do Ordem Paranormal RPG v1.3*
