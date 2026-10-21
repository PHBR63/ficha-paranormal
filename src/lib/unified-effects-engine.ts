import { getNexLevel } from '@/lib/rules/nex-progression';
// =====================================================
// Sistema Unificado de Efeitos (SUE) - Motor Central
// Ordem Paranormal RPG v1.3
// =====================================================
// 
// Este módulo define a estrutura base para todos os efeitos
// mecânicos do sistema, permitindo que origens, trilhas,
// poderes, condições e rituais compartilhem uma interface comum.
//

/**
 * Tipo de fonte do efeito - de onde ele vem
 */
import { preprocessEffectsWithHardening } from './sue/consolidation-with-hardening';

export type EffectSource =
  | 'origin'           // Origem do personagem
  | 'class_ability'    // Habilidade de classe
  | 'class_power'      // Poder de classe
  | 'track'            // Habilidade de trilha
  | 'general_power'    // Poder geral
  | 'paranormal_power' // Poder paranormal
  | 'condition'        // Condição ativa
  | 'ritual'           // Ritual sustentado
  | 'equipment'        // Equipamento
  | 'skill_training';  // Treinamento em perícia

/**
 * Tipo de ataque - para efeitos condicionais
 */
export type AttackType = 'melee' | 'ranged' | 'any';

/**
 * Tipo de dano
 */
export type DamageType =
  | 'balistico' | 'corte' | 'impacto' | 'perfuracao'  // Físico
  | 'fogo' | 'frio' | 'eletricidade' | 'quimico'       // Elemental
  | 'mental' | 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo'; // Paranormal

/**
 * Tipo de resistência
 */
export type ResistanceType = 'fortitude' | 'reflexos' | 'vontade';

/**
 * Tipo de atributo
 */
export type AttributeType = 'strength' | 'agility' | 'vigor' | 'intellect' | 'presence';

/**
 * Mecânicas de efeito - todos os modificadores possíveis
 */
/** Modificadores em quantidade de d20, separados de bônus numéricos. */
export interface TestDiceModifiers {
  all?: number;
  attributes?: Partial<Record<AttributeType, number>>;
  skills?: Record<string, number>;
  attacks?: number;
  melee?: number;
  ranged?: number;
}

export interface EffectMechanics {
  testDice?: TestDiceModifiers;
  // === Combate - Ataque ===
  attackBonus?: number;           // Bônus em testes de ataque
  meleeAttackBonus?: number;      // Bônus apenas em corpo a corpo
  rangedAttackBonus?: number;     // Bônus apenas em distância

  // === Combate - Dano ===
  damageBonus?: number;           // Bônus em rolagens de dano
  meleeDamageBonus?: number;      // Bônus dano corpo a corpo
  rangedDamageBonus?: number;     // Bônus dano distância
  firearmDamageBonus?: number;    // Bônus dano armas de fogo (Balística Avançada)
  extraDamageDice?: string;       // Dados extras de dano (ex: "1d6")
  criticalDamageBonus?: number;   // Bônus dano crítico

  // === Combate - Crítico ===
  criticalMarginBonus?: number;   // Aumento na margem de ameaça
  criticalMultiplierBonus?: number; // Aumento no multiplicador crítico

  // === Combate - Defesa ===
  defenseBonus?: number;          // Bônus em Defesa
  defenseBonusMelee?: number;     // Bônus Defesa vs corpo a corpo
  defenseBonusRanged?: number;    // Bônus Defesa vs distância

  // === Resistências ===
  fortitudeBonus?: number;
  reflexosBonus?: number;
  vontadeBonus?: number;
  allResistancesBonus?: number;   // Bônus em todas as resistências
  paranormalResistanceTestBonus?: number; // Apenas testes contra efeitos paranormais (Mente Sã)
  hpCostPerPE?: number; // PV gastos por PE substituído em rituais (Poder do Flagelo)

  // === Redução de Dano ===
  damageReduction?: number;        // RD física geral
  damageReductionByType?: Partial<Record<DamageType, number>>; // RD por tipo
  paranormalDamageReduction?: number; // RD contra dano paranormal
  mentalDamageResistance?: number; // Resistência a dano mental

  // === Resistência a Dano (percentual) ===
  damageResistance?: Partial<Record<DamageType, number>>; // Ex: { mental: 5 } = resistência 5 mental

  // === Perícias ===
  skillBonus?: Partial<Record<string, number>>; // Bônus por perícia
  allSkillsBonus?: number;         // Bônus em todas as perícias
  attributeSkillsBonus?: Partial<Record<AttributeType, number>>; // Bônus em perícias de atributo

  // === Recursos ===
  hpBonus?: number;                // Bônus em PV máximo
  hpBonusPerNex?: number;          // Bônus PV por 5% NEX (Desgarrado: Calejado)
  peBonus?: number;                // Bônus em PE máximo
  peBonusPerNex?: number;          // Bônus PE por 5% NEX
  peBonusOddNex?: number;          // Bônus PE adicional a cada NEX ímpar (Universitário: Dedicação)
  peLimitBonus?: number;           // Aumento no limite de PE por turno (Universitário: Dedicação)
  peModifiers?: Array<{ value: number; targets: string[] }>; // Modificadores de custo de PE
  sanityBonus?: number;            // Bônus em Sanidade máxima
  sanityBonusPerNex?: number;      // Bônus SAN por 5% NEX (Vítima: Cicatrizes Psicológicas)
  tempHP?: number;                 // PV temporários

  // === Movimento ===
  movementBonus?: number;          // Bônus em deslocamento (metros)
  movementMultiplier?: number;     // Multiplicador de deslocamento

  // === Iniciativa ===
  initiativeBonus?: number;

  // === Ações ===
  extraAction?: 'movement' | 'standard' | 'free' | 'full'; // Ação extra

  // === Efeitos Especiais (não numéricos) ===
  specialEffects?: string[];       // Lista de efeitos especiais textuais
  conditionalNote?: string;        // Nota sobre condição de aplicação (ex: "Apenas armas longas")

  // === Proficiências ===
  grantsProficiency?: string[];    // Proficiências concedidas

  // =====================================================
  // EFEITOS DE ORIGEM (Fase de Correção)
  // =====================================================

  // === Bônus de Cura (Agente de Saúde - Técnica Medicinal) ===
  healingBonus?: 'intellect' | 'presence' | 'vigor' | number; // Atributo ou valor fixo adicionado à cura

  // === Bônus em Testes de Atributo (Acadêmico - Saber é Poder) ===
  attributeTestBonus?: {
    attribute: AttributeType;      // Atributo que recebe o bônus
    bonus: number;                 // Valor do bônus
  };

  // === Requer Arma Escolhida (Operário - Ferramenta de Trabalho) ===
  requiresChosenWeapon?: boolean;  // Se true, bônus só aplicam com arma vinculada

  // === Flags de Comportamento ===
  cannotAct?: boolean;             // Não pode agir
  cannotReact?: boolean;           // Não pode usar reações
  cannotMove?: boolean;            // Não pode se mover
  isHelpless?: boolean;            // Indefeso
  isUnconscious?: boolean;         // Inconsciente

  // === Flags de Crítico ===
  maximumDamageOnCrit?: boolean;   // Crítico causa dano máximo (Atirar para Matar)

  // =====================================================
  // COMBATE AVANÇADO (Fase 1 SUE)
  // =====================================================

  // === Multiplicador de Ataque Especial (Guerreiro - Potência Máxima) ===
  specialAttackMultiplier?: {
    value: number;                           // Multiplicador dos bônus (ex: 2 para dobrar)
    weaponRestriction?: 'melee' | 'ranged' | 'any'; // Restrição de tipo de arma
  };

  // === Ações Extras de Trilha (Operações Especiais, etc.) ===
  extraActionsTrack?: {
    type: 'attack' | 'movement' | 'standard' | 'standard-or-movement' | 'maneuver';
    trigger: 'on-attack' | 'on-block' | 'on-melee-hit' | 'on-ritual-cast' | 'first-round' | 'combat-start' | 'on-demand';
    peCost?: number;                         // Custo em PE
    actionType?: 'free' | 'reaction';        // Tipo de ação para ativar
    weaponRestriction?: 'melee' | 'ranged' | 'firearm' | 'any';
    maneuverOptions?: string[];              // Opções de manobra (derrubar, empurrar, etc.)
    replaceDamage?: boolean;                 // Se substitui o dano do ataque
    perRound?: boolean;                      // Se é 1x por rodada
    perScene?: boolean;                      // Se é 1x por cena
  };

  // === Dano Máximo em Crítico (Atirador de Elite - Atirar para Matar) ===
  maximumDamageOnCritical?: {
    weaponType: 'firearm' | 'melee' | 'any'; // Tipo de arma que aplica
  };

  // === Bônus de Bloqueio com Vigor (Tropa de Choque - Casca Grossa) ===
  blockVigorBonus?: boolean;                 // Soma Vigor na RD ao bloquear

  // === Ocultismo como Ataque (Lâmina Paranormal) ===
  occultismAsAttack?: boolean;               // Pode usar Ocultismo no lugar de Luta/Pontaria

  // === Provocar (Tropa de Choque - Cai Dentro) ===
  taunt?: {
    range: 'curto' | 'medio' | 'longo';      // Alcance da provocação
    resistanceTest: string;                  // Teste de resistência (vontade)
    dtAttribute: AttributeType;              // Atributo base da DT
    peCost: number;                          // Custo em PE
    actionType: 'reaction' | 'free' | 'standard'; // Tipo de ação
  };

  // === Controle de Estado do Alvo (Infiltrador - Assassinar) ===
  targetStateControl?: {
    options: string[];                       // Opções de estado (unconscious, dying)
    resistanceTest: string;                  // Teste de resistência (fortitude)
    dtAttribute: AttributeType;              // Atributo base da DT
  };

  // === Bônus quando Machucado (Tropa de Choque - Inquebrável) ===
  whenWounded?: {
    hpThreshold: number;                     // Limiar de PV (percentual, ex: 50)
    defenseBonus?: number;                   // Bônus em Defesa
    damageReduction?: number;                // RD adicional
  };

  // === Bônus quando Morrendo (Tropa de Choque - Inquebrável) ===
  whenDying?: {
    canAct: boolean;                         // Pode agir enquanto morrendo
    notHelpless: boolean;                    // Não fica indefeso
  };

  // =====================================================
  // EQUIPAMENTO E INVENTÁRIO
  // =====================================================

  // === Redução de Categoria de Equipamento ===
  categoryReduction?: {
    amount: number;                          // Quantidade da redução (-1, -2)
    targetType: 'specific-weapon' | 'any-weapon' | 'item' | 'general-equipment'; // Tipo de alvo
    requiresChoice?: boolean;                // Se requer escolha do jogador
    choiceDescription?: string;              // Descrição da escolha
    appliesToAllCarried?: boolean;           // Se aplica a todos itens carregados
  };

  // === Contra-Mágica ===
  counterSpell?: {
    costMatchesTarget: boolean;              // PE = custo do ritual alvo
    testSkill: string;                       // Perícia do teste (Ocultismo)
    testType: 'opposed' | 'fixed';           // Tipo de teste
  };

  // === Ataque Furtivo (Infiltrador) ===
  sneakAttack?: {
    baseDice: number;                        // Quantidade de dados base
    dieType: string;                         // Tipo de dado (d6)
    scaling?: Record<number, { dice: number; dieType: string }>; // Escala por NEX
    conditions: string[];                    // Condições requeridas (alvo desprevenido, etc)
    peCost: number;                          // Custo em PE
    usesPerRound: number;                    // Usos por rodada
    multiplier?: number;                     // Multiplicador (Assassinar)
  };

  // === Cura (Médico de Campo) ===
  healing?: {
    baseDice: number;                        // Quantidade de dados base
    dieType: string;                         // Tipo de dado (d10)
    scaling?: Record<number, { dice: number; dieType: string }>; // Escala por NEX
    peCost: number;                          // Custo base em PE
    extraDicePECost?: number;                // Custo por dado extra (+1 PE por dado)
    range: 'self' | 'touch' | 'short';       // Alcance
    actionType?: 'standard' | 'movement' | 'complete'; // Tipo de ação
  };

  // === Liderança (Comandante de Campo) ===
  leadership?: {
    range: 'curto' | 'medio' | 'longo' | 'alcance-voz'; // Alcance do efeito
    maxAllies: number | 'intellect' | 'presence';       // Máximo de aliados afetados
    peCost: number;                                      // Custo em PE
    actionType: 'free' | 'reaction' | 'standard';        // Tipo de ação
    usesPerRound?: number;                               // Usos por rodada
    usesPerScene?: number;                               // Usos por cena
    allyEffects: {
      rerollTest?: boolean;                              // Aliado pode rerolar um teste
      extraMovementAction?: boolean;                     // Ação de movimento extra
      extraAttack?: boolean;                             // Ataque adicional
      extraStandardAction?: boolean;                     // Ação padrão extra
      tempHP?: number;                                   // PV temporários
      bonusToNextTest?: number;                          // Bônus no próximo teste
    };
    scaling?: Record<number, {                           // Progressão por NEX
      maxAllies?: number | 'intellect' | 'presence';
      peCost?: number;
      allyEffects?: {
        rerollTest?: boolean;
        extraMovementAction?: boolean;
        extraAttack?: boolean;
        extraStandardAction?: boolean;
        tempHP?: number;
        bonusToNextTest?: number;
      };
    }>;
  };

  // === Buff para Aliados (Negociador - Discurso Motivador) ===
  allyBuff?: {
    range: 'curto' | 'medio' | 'longo' | 'alcance-voz'; // Alcance do efeito
    skillBonus: number;                                   // Bônus em testes de perícia
    peCost: number;                                       // Custo em PE
    actionType: 'free' | 'standard' | 'complete';         // Tipo de ação
    duration: 'scene' | 'combat' | 'turns';               // Duração
    turns?: number;                                        // Número de turnos (se duration = 'turns')
    includeSelf: boolean;                                  // Se afeta o próprio conjurador
    scaling?: Record<number, {                             // Progressão por NEX
      skillBonus?: number;
      peCost?: number;
    }>;
  };

  // === Efeito Social (Negociador - Eloquência) ===
  socialEffect?: {
    range: 'curto' | 'medio' | 'longo' | 'alcance-voz';  // Alcance do efeito
    targetAll: boolean;                                   // Se afeta todos no alcance
    skillOptions: string[];                               // Opções de perícia (diplomacia, enganacao, intimidacao)
    resistanceSkill: string;                              // Perícia de resistência (vontade)
    effect: string;                                       // Efeito aplicado (fascinado, etc)
    duration: 'concentration' | 'scene' | 'turns';        // Duração do efeito
    turns?: number;                                        // Número de turnos (se duration = 'turns')
    peCost: number;                                        // Custo em PE
    actionType: 'free' | 'standard' | 'complete';          // Tipo de ação
    immunityOnSuccess?: string;                            // Imunidade se alvo passar no teste
    resistanceBonusOnSuccess?: number;                     // Bônus na resistência após sucesso
  };

  // === Rede de Contatos (Negociador - Eu Conheço um Cara) ===
  contacts?: {
    usesPerMission: number;                              // Usos por missão (geralmente 1)
    availableEffects: string[];                          // Efeitos disponíveis (equipment-trade, information, rescue, problem-solving)
    gmDiscretion: boolean;                               // Se depende de decisão do mestre
    peCost: number;                                      // Custo em PE (geralmente 0)
    actionType: 'free' | 'standard' | 'varies';          // Tipo de ação
  };

  // === Cópia de Habilidade (Negociador - Truque de Mestre) ===
  copyAbility?: {
    source: 'ally' | 'enemy' | 'any';                    // Fonte da habilidade copiada
    seenInScene: boolean;                                // Se precisa ter visto a habilidade na cena
    ignorePrerequisites: boolean;                        // Se ignora pré-requisitos da habilidade
    payOriginalCosts: boolean;                           // Se paga os custos originais da habilidade
    peCost: number;                                      // Custo adicional em PE para usar
    actionType: 'free' | 'standard' | 'varies';          // Tipo de ação
    usesPerScene?: number;                               // Usos por cena (se limitado)
    excludedAbilities?: string[];                        // Habilidades que não podem ser copiadas
  };

  // =====================================================
  // TÉCNICO - Mecânicas de inventário e equipamento
  // =====================================================

  // === Capacidade de Carga (Inventário Otimizado) ===
  carryCapacity?: {
    addAttribute: AttributeType;                         // Atributo adicional para calcular carga
  };

  // === Redução de Espaço de Item (Inventário Otimizado) ===
  itemSpaceReduction?: number;                           // Redução de espaços ocupados por itens

  // === Reparar Equipamento (Remendo) ===
  repairEquipment?: {
    range: 'self' | 'touch' | 'short';                   // Alcance do reparo
    removeCondition: string;                             // Condição removida (quebrado)
    peCost: number;                                      // Custo em PE
    actionType: 'standard' | 'complete';                 // Tipo de ação
  };

  // === Criar Equipamento (Improvisar) ===
  createEquipment?: {
    type: 'general' | 'weapon' | 'armor' | 'any';        // Tipo de equipamento
    duration: 'scene' | 'combat' | 'permanent';          // Duração do item
    destroyedAfter: boolean;                             // Se é destruído após uso
    peCost: number;                                      // Custo em PE
    actionType: 'standard' | 'complete';                 // Tipo de ação
  };

  // === Retirar Item Retroativamente (Preparado para Tudo) ===
  retrieveItem?: {
    excludeWeapons: boolean;                             // Se exclui armas
    retroactive: boolean;                                // Se é retroativo
    peCostPerCategory: number;                           // Custo em PE por categoria
    actionType: 'movement' | 'standard';                 // Tipo de ação
  };

  // =====================================================
  // RITUAIS - Mecânicas específicas para poderes de classe
  // =====================================================

  // === Bônus de DT de Rituais ===
  ritualDTBonus?: number;          // Bônus na DT de todos os rituais
  ritualDTBonusByElement?: Partial<Record<string, number>>; // +DT por elemento

  // === Bônus de Dano/Cura de Rituais ===
  ritualDamageBonus?: number;      // Bônus fixo em dano/cura de rituais
  ritualDamageAttributeBonus?: AttributeType; // Soma atributo no dano/cura de rituais

  // === Modificadores de PE de Rituais ===
  ritualPEReduction?: number;      // Redução geral de PE em rituais
  ritualPEReductionByElement?: Partial<Record<string, number>>; // Redução por elemento
  ritualPEReductionByRange?: Partial<Record<string, number>>; // Redução por alcance (pessoal, etc)

  // === Modificadores de Ritual de Trilha ===
  ritualModifiers?: Array<{
    id: string;                    // ID do modificador
    name: string;                  // Nome para exibição
    type: 'range' | 'action' | 'area' | 'duration' | 'counter'; // Tipo de modificação
    effect: string;                // Descrição do efeito
    peCost: number;                // Custo adicional em PE (0 para custo variável)
    perRound?: boolean;            // Se aplica por rodada
    isActivatable?: boolean;       // Se requer ativação manual
    variableCost?: boolean;        // Se true, custo é igual ao ritual alvo (Anular Ritual)
    actionType?: 'reaction';       // Tipo de ação necessária
  }>;

  // =====================================================
  // FASE 3: SUPORTE (Médico de Campo, Resgate, etc.)
  // =====================================================

  // === Movimento Livre para Aliado (Resgate) ===
  freeMovementTo?: {
    condition?: 'ally-at-0-hp' | 'ally-wounded' | 'any-ally';  // Legado v1.0
    conditions?: string[];                                      // v1.3: múltiplas condições
    range?: 'touch' | 'short' | 'medium' | 'long';             // Alcance para ativar
    perRound: boolean;                                          // Se é 1x por rodada
  };

  // === Efeitos ao Curar (Médico de Campo) ===
  onHeal?: {
    selfDefenseBonus?: number;                                  // Bônus para o curador (v1.3)
    targetDefenseBonus?: number;                                // Bônus de Defesa para o alvo
    duration: 'next-attack' | 'end-of-round' | 'turns';         // Duração do bônus
    turns?: number;                                             // Número de turnos (se duration = 'turns')
  };

  // === Remoção de Condição (Equipe de Trauma) ===
  removeCondition?: {
    range: 'self' | 'touch' | 'short';                         // Alcance
    excludedConditions: string[];                              // Condições que NÃO podem ser removidas
    peCost: number;                                            // Custo em PE
    actionType: 'standard' | 'complete';                       // Tipo de ação
  };

  // === Ressurreição (Reanimação) ===
  resurrect?: {
    excludedDeathTypes: string[];                              // Tipos de morte excluídos (morte paranormal)
    sameSceneOnly: boolean;                                    // Apenas na mesma cena
    usesPerScene: number;                                      // Usos por cena
    peCost: number;                                            // Custo em PE
    actionType: 'complete' | 'full-round';                     // Tipo de ação
    hpRestored: 'roll' | 'half' | 'full' | 'one';              // PV restaurados
  };

  // =====================================================
  // FASE 4: INFILTRADOR AVANÇADO
  // =====================================================

  // === Remove Penalidade de Furtividade ao Mover (Sombra Fugaz) ===
  stealthMovementPenalty?: {
    removes: boolean;                                          // Remove completamente a penalidade
    reducesBy?: number;                                        // Ou reduz por um valor
  };

  // === Multiplicador de Ataque Furtivo (Assassinar) ===
  sneakAttackMultiplier?: number;                              // Multiplicador dos dados (2 = dobra)

  // === Ignora Penalidades de Furtividade (Gatuno, Sombra Fugaz) ===
  ignoreStealthPenalty?: {
    movementPenalty: boolean;                                  // Penalidade de movimento
    armorPenalty: boolean;                                     // Penalidade de armadura
    allPenalties: boolean;                                     // Todas as penalidades
  };

  // =====================================================
  // FASE 5: OCULTISTA AVANÇADO
  // =====================================================

  // === Rituais Bônus por Círculo (Saber Ampliado) ===
  bonusRituals?: {
    perCircle: number;                                         // Rituais extras por círculo
    ignoresLimit: boolean;                                     // Ignora limite normal de rituais
    circleRestriction?: number[];                              // Círculos específicos (vazio = todos)
  };

  // === Grimório (Graduado) ===
  grimoire?: {
    preparationAction?: 'full'; // Ação para consultar o grimório, não substitui a execução do ritual
    maxRituals: number | 'intellect';                          // Máximo de rituais no grimório
    allowedCircles: number[];                                  // Círculos permitidos
    bonusPerNewCircle: number;                                 // Rituais extras ao desbloquear círculo
    castingAction: 'standard' | 'complete' | 'extended';       // Tipo de ação para conjurar
    requiresWielding: boolean;                                 // Precisa empunhar o grimório
    inventorySlots: number;                                    // Espaços ocupados no inventário
  };

  // === Bônus de Poder de Ritual (Conduíte Aprimorado) ===
  ritualPowerBonus?: {
    addPELimit: boolean;                                       // Adiciona limite de PE ao poder
    affectsDT: boolean;                                        // Afeta DT do ritual
    affectsDamage: boolean;                                    // Afeta dano do ritual
  };

  // === Atributo Adicional ao Limite de PE (Expansão Paranormal) ===
  addAttributeToPELimit?: AttributeType;                       // Atributo adicional para limite de PE

  // === Restrição de Recuperação de PV (Flagelador) ===
  hpRecoveryRestriction?: 'none' | 'rest-only' | 'magic-only'; // Restrição de recuperação

  // === RD Paranormal com Teste (Resistência Paranormal) ===
  paranormalDamageTest?: {
    testSkill: string;                                         // Perícia do teste (Ocultismo, Vontade)
    onSuccess: 'negate' | 'half';                              // Efeito em sucesso
    onFailure: 'half' | 'full';                                // Efeito em falha
    dtType: 'fixed' | 'ritual-dt' | 'caster-presence' | 'existing-test'; // Usa o teste original do efeito
    requiresExistingHalfDamageSave?: boolean;
    fixedDT?: number;                                          // DT fixo (se dtType = 'fixed')
  };

  // =====================================================
  // CONDIÇÕES COM PARÂMETROS DINÂMICOS
  // =====================================================

  // === Dano ao Realizar Ação (Machucado) ===
  damageOnAction?: number;                                       // Dano sofrido ao realizar ação

  // === Vulnerabilidade a Dano (Fragilizado) ===
  damageVulnerability?: {
    type: string;                                                // Tipo de dano (fogo, corte, etc)
    multiplier: number;                                          // Multiplicador de dano (1.5 = +50%)
  };

  // === Efeitos de Veneno (Envenenado) ===
  poisonDamage?: string;                                         // Dado de dano do veneno (ex: "1d6")
  poisonDT?: number;                                             // DT do teste de Fortitude
}

/**
 * Condições de aplicação do efeito
 * Define QUANDO o efeito se aplica
 */
export interface EffectConditions {
  // === Condições de Ataque ===
  attackType?: AttackType;         // Tipo de ataque requerido
  targetConditions?: string[];     // Condições que o alvo deve ter
  weaponType?: string[];           // Tipos de arma requeridos
  weaponCategory?: 'simple' | 'tactical' | 'heavy' | 'improvised'; // Categoria de arma

  // === Condições do Personagem ===
  characterConditions?: string[];  // Condições que o personagem deve ter
  hpPercentBelow?: number;         // PV abaixo de X% (ex: 50 para <50%)
  hpPercentAbove?: number;         // PV acima de X%

  // === Condições de Equipamento ===
  requiresShield?: boolean;
  requiresArmor?: boolean;
  requiresNoArmor?: boolean;

  // === Condições de Contexto ===
  inCombat?: boolean;
  firstRoundOnly?: boolean;        // Apenas na primeira rodada

  // === Condições de Ativação Manual ===
  requiresActivation?: boolean;    // Precisa ser ativado manualmente
  costPE?: number;                 // Custo em PE para ativar
  costAction?: 'free' | 'movement' | 'standard' | 'full' | 'reaction'; // Custo de ação

  // === Condições de Atributo ===
  minAttribute?: Partial<Record<AttributeType, number>>; // Atributo mínimo
}

/**
 * Duração do efeito
 */
export interface EffectDuration {
  type: 'permanent' | 'scene' | 'combat' | 'turns' | 'rounds' | 'until_removed';
  value?: number;                  // Número de turnos/rodadas
  sustainCost?: number;            // Custo PE por turno para sustentar
}

/**
 * Efeito Unificado - Estrutura principal
 * Qualquer fonte de bônus/modificador implementa esta interface
 */
export interface UnifiedEffect {
  id: string;                      // ID único do efeito
  name: string;                    // Nome para exibição
  description?: string;            // Descrição do efeito
  source: EffectSource;            // Tipo de fonte
  sourceId: string;                // ID da fonte (ex: id da origem)
  sourceName: string;              // Nome da fonte para display

  mechanics: EffectMechanics;      // Efeitos mecânicos
  conditions?: EffectConditions;   // Condições de aplicação
  duration?: EffectDuration;       // Duração

  // Metadata
  isActive: boolean;               // Se está ativo agora
  isToggleable: boolean;           // Se pode ser ativado/desativado
  priority?: number;               // Prioridade para resolução de conflitos
}

/**
 * Contexto para cálculo de efeitos
 * Representa o estado atual do personagem e situação
 */
export interface EffectCalculationContext {
  // Atributos
  attributes: Record<AttributeType, number>;

  // Estado atual
  nex: number;
  hpCurrent: number;
  hpMax: number;
  peCurrent: number;
  peMax: number;

  // Situação de combate
  inCombat: boolean;
  isFirstRound: boolean;
  currentRound: number;

  // Equipamento
  equippedWeaponType?: string;
  equippedArmorType?: string;
  hasShield: boolean;

  // Condições ativas
  activeConditions: string[];

  // Efeitos condicionais ativados manualmente
  activatedEffects: string[];

  // Contexto de ataque (se aplicável)
  attackContext?: {
    type: AttackType;
    targetConditions: string[];
    weaponType?: string;
  };
}

/**
 * Resultado do cálculo de efeitos consolidados
 */
export interface ComputedEffects {
  testDice?: TestDiceModifiers;
  // === Combate ===
  attack: {
    general: number;
    melee: number;
    ranged: number;
    breakdown: Array<{ source: string; value: number; conditional?: string }>;
  };
  damage: {
    general: number;
    melee: number;
    ranged: number;
    firearm: number;              // Bônus específico para armas de fogo (Balística Avançada)
    extraDice: string[];
    breakdown: Array<{ source: string; value: number | string; conditional?: string; effectId?: string }>;
  };
  critical: {
    marginBonus: number;
    multiplierBonus: number;
    breakdown: Array<{ source: string; value: number; type: 'margin' | 'multiplier'; effectId?: string }>;
  };
  defense: {
    general: number;
    vsMelee: number;
    vsRanged: number;
    breakdown: Array<{ source: string; value: number; conditional?: string }>;
  };

  // === Resistências ===
  resistances: {
    fortitude: number;
    reflexos: number;
    vontade: number;
    breakdown: Array<{ source: string; value: number; resistance: ResistanceType }>;
  };

  // === Redução de Dano ===
  damageReduction: {
    physical: number;
    paranormal: number;
    byType: Partial<Record<DamageType, number>>;
    breakdown: Array<{ source: string; value: number; type?: DamageType }>;
  };

  // === Resistência a Dano ===
  damageResistance: Partial<Record<DamageType, number>>;

  // === Perícias ===
  skills: Record<string, { bonus: number; sources: string[] }>;

  // === Recursos ===
  resources: {
    hpBonus: number;
    peBonus: number;
    peLimitBonus: number;        // Bônus no limite de PE por turno (Universitário: Dedicação)
    sanityBonus: number;
    tempHP: number;
    breakdown: Array<{ source: string; value: number; resource: 'hp' | 'pe' | 'peLimit' | 'sanity' | 'tempHP' }>;
  };

  // === Movimento ===
  movement: {
    bonus: number;
    multiplier: number;
    breakdown: Array<{ source: string; value: number }>;
  };

  // === Iniciativa ===
  initiative: {
    bonus: number;
    breakdown: Array<{ source: string; value: number }>;
  };

  // === Efeitos Especiais ===
  specialEffects: Array<{ source: string; effect: string }>;

  // === Proficiências ===
  proficiencies: string[];

  // === Flags ===
  flags: {
    cannotAct: boolean;
    cannotReact: boolean;
    cannotMove: boolean;
    isHelpless: boolean;
    isUnconscious: boolean;
  };

  // === Efeitos Toggleáveis ===
  toggleableEffects: Array<{
    id: string;
    name: string;
    source: string;
    isActive: boolean;
    effects: string[];
    condition?: string;
    costPE?: number;
  }>;

  // =====================================================
  // COMBATE AVANÇADO (Fase 1 SUE)
  // =====================================================
  combatAdvanced: {
    // === Multiplicador de Ataque Especial (Guerreiro - Potência Máxima) ===
    specialAttackMultiplier: {
      value: number;                         // Multiplicador (1 = normal, 2 = dobrado)
      weaponRestriction: 'melee' | 'ranged' | 'any';
      sources: string[];
    };

    // === Ações Extras de Trilha ===
    extraActions: Array<{
      id: string;                            // ID único para rastrear uso
      name: string;                          // Nome para exibição
      type: 'attack' | 'movement' | 'standard' | 'standard-or-movement' | 'maneuver';
      trigger: string;                       // Quando pode ser ativada
      peCost: number;                        // Custo em PE
      actionType: 'free' | 'reaction';       // Tipo de ação para ativar
      weaponRestriction?: string;            // Restrição de arma
      maneuverOptions?: string[];            // Opções de manobra
      replaceDamage?: boolean;               // Se substitui dano
      perRound?: boolean;                    // 1x por rodada
      perScene?: boolean;                    // 1x por cena
      source: string;                        // Fonte da habilidade
    }>;

    // === Dano Máximo em Crítico ===
    maximumDamageOnCrit: {
      enabled: boolean;                      // Se está ativo
      weaponTypes: string[];                 // Tipos de arma que aplicam
      sources: string[];
    };

    // === Bônus de Bloqueio com Vigor ===
    blockVigorBonus: {
      enabled: boolean;
      sources: string[];
    };

    // === Ocultismo como Ataque ===
    occultismAsAttack: {
      enabled: boolean;
      sources: string[];
    };

    // === Provocar (Taunt) ===
    taunt: {
      available: boolean;
      abilities: Array<{
        id: string;
        name: string;
        range: 'curto' | 'medio' | 'longo';
        resistanceTest: string;
        dtAttribute: AttributeType;
        peCost: number;
        actionType: 'reaction' | 'free' | 'standard';
        source: string;
      }>;
    };

    // === Controle de Estado do Alvo ===
    targetStateControl: {
      available: boolean;
      options: string[];                     // Opções consolidadas
      abilities: Array<{
        id: string;
        name: string;
        options: string[];
        resistanceTest: string;
        dtAttribute: AttributeType;
        source: string;
      }>;
    };

    // === Bônus Condicionais por Estado ===
    conditionalBonuses: {
      whenWounded: {
        active: boolean;                     // Se a condição está ativa
        defenseBonus: number;
        damageReduction: number;
        sources: string[];
      };
      whenDying: {
        canAct: boolean;
        notHelpless: boolean;
        sources: string[];
      };
    };
  };

  // =====================================================
  // EQUIPAMENTO E INVENTÁRIO
  // =====================================================
  inventory: {
    // Reduções de categoria de equipamento (Aniquilador, Técnico)
    categoryReductions: Array<{
      amount: number;
      targetType: 'specific-weapon' | 'any-weapon' | 'item' | 'general-equipment';
      source: string;
      requiresChoice?: boolean;
      appliesToAllCarried?: boolean;
    }>;
    totalCategoryReduction: number;    // Soma de todas as reduções
  };

  // === Habilidades de Contra-Mágica ===
  counterSpellAbilities: Array<{
    source: string;
    costMatchesTarget: boolean;
    testSkill: string;
    testType: 'opposed' | 'fixed';
  }>;

  // === Ataque Furtivo ===
  sneakAttack: {
    available: boolean;                      // Se o personagem tem Ataque Furtivo
    baseDice: number;                        // Dados base para o NEX atual
    dieType: string;                         // Tipo de dado (d6)
    conditions: string[];                    // Condições requeridas
    peCost: number;                          // Custo em PE
    usesPerRound: number;                    // Usos por rodada
    multiplier: number;                      // Multiplicador (1 = normal, 2 = Assassinar)
    totalDice: number;                       // Dados totais com multiplicador
    sources: Array<{
      source: string;
      dice: number;
      dieType: string;
      multiplier?: number;
    }>;
    // === Fase 4: Bônus de Furtividade ===
    stealthBonuses: {
      removesMovementPenalty: boolean;       // Remove penalidade de movimento
      reducesMovementPenaltyBy: number;      // Reduz penalidade de movimento
      ignoresArmorPenalty: boolean;          // Ignora penalidade de armadura
      ignoresAllPenalties: boolean;          // Ignora todas as penalidades
      sources: string[];
    };
  };

  // === Cura (Médico de Campo + Origens) ===
  healing: {
    available: boolean;                      // Se o personagem tem habilidade de cura
    baseDice: number;                        // Dados base para o NEX atual
    dieType: string;                         // Tipo de dado (d10)
    peCost: number;                          // Custo base em PE
    extraDicePECost: number;                 // Custo por dado adicional
    range: 'self' | 'touch' | 'short';       // Alcance
    actionType: 'standard' | 'movement' | 'complete'; // Tipo de ação
    // Bônus de cura de origens (ex: Agente de Saúde - Técnica Medicinal)
    bonusFromOrigin: number;                 // Valor numérico a adicionar em TODAS as curas
    bonusFromOriginSource: string | null;    // Fonte do bônus (ex: "Origem: Agente de Saúde")
    sources: Array<{
      source: string;
      dice: number;
      dieType: string;
      peCost: number;
    }>;
  };

  // === Liderança (Comandante de Campo) ===
  leadership: {
    available: boolean;                      // Se o personagem tem habilidades de liderança
    abilities: Array<{
      id: string;                            // ID único da habilidade
      name: string;                          // Nome para exibição
      range: 'curto' | 'medio' | 'longo' | 'alcance-voz';
      maxAllies: number | 'intellect' | 'presence';
      peCost: number;
      actionType: 'free' | 'reaction' | 'standard';
      usesPerRound?: number;
      usesPerScene?: number;
      allyEffects: {
        rerollTest?: boolean;
        extraMovementAction?: boolean;
        extraAttack?: boolean;
        extraStandardAction?: boolean;
        tempHP?: number;
        bonusToNextTest?: number;
      };
      source: string;                        // Fonte da habilidade
    }>;
    // Resumo consolidado de todos os efeitos disponíveis
    availableEffects: {
      rerollTest: boolean;
      extraMovementAction: boolean;
      extraAttack: boolean;
      extraStandardAction: boolean;
      tempHP: number;
      bonusToNextTest: number;
    };
  };

  // === Buff para Aliados (Negociador - Discurso Motivador) ===
  allyBuff: {
    available: boolean;                                    // Se o personagem tem buff de aliados
    abilities: Array<{
      id: string;                                          // ID único da habilidade
      name: string;                                        // Nome para exibição
      range: 'curto' | 'medio' | 'longo' | 'alcance-voz';
      skillBonus: number;                                  // Bônus em testes de perícia
      peCost: number;                                      // Custo em PE
      actionType: 'free' | 'standard' | 'complete';        // Tipo de ação
      duration: 'scene' | 'combat' | 'turns';              // Duração
      turns?: number;                                      // Número de turnos
      includeSelf: boolean;                                // Se afeta o próprio
      source: string;                                      // Fonte da habilidade
    }>;
    // Maior bônus de perícia disponível (consolidado)
    maxSkillBonus: number;
    // Indica se o buff afeta o próprio personagem
    affectsSelf: boolean;
  };

  // === Efeito Social (Negociador - Eloquência) ===
  socialEffect: {
    available: boolean;                                    // Se o personagem tem efeitos sociais
    abilities: Array<{
      id: string;                                          // ID único da habilidade
      name: string;                                        // Nome para exibição
      range: 'curto' | 'medio' | 'longo' | 'alcance-voz';
      targetAll: boolean;                                  // Se afeta todos no alcance
      skillOptions: string[];                              // Opções de perícia
      resistanceSkill: string;                             // Perícia de resistência
      effect: string;                                      // Efeito aplicado
      duration: 'concentration' | 'scene' | 'turns';       // Duração do efeito
      turns?: number;                                      // Número de turnos
      peCost: number;                                      // Custo em PE
      actionType: 'free' | 'standard' | 'complete';        // Tipo de ação
      immunityOnSuccess?: string;                          // Imunidade se alvo passar
      resistanceBonusOnSuccess?: number;                   // Bônus na resistência após sucesso
      source: string;                                      // Fonte da habilidade
    }>;
    // Lista de efeitos disponíveis consolidados
    availableEffects: string[];
  };

  // === Rede de Contatos (Negociador - Eu Conheço um Cara) ===
  contacts: {
    available: boolean;                                    // Se o personagem tem rede de contatos
    abilities: Array<{
      id: string;                                          // ID único da habilidade
      name: string;                                        // Nome para exibição
      usesPerMission: number;                              // Usos por missão
      availableEffects: string[];                          // Efeitos disponíveis
      gmDiscretion: boolean;                               // Se depende de decisão do mestre
      peCost: number;                                      // Custo em PE
      actionType: 'free' | 'standard' | 'varies';          // Tipo de ação
      source: string;                                      // Fonte da habilidade
    }>;
    // Consolidação de todos os efeitos disponíveis
    allAvailableEffects: string[];
    // Total de usos por missão
    totalUsesPerMission: number;
  };

  // === Cópia de Habilidade (Negociador - Truque de Mestre) ===
  copyAbility: {
    available: boolean;                                    // Se o personagem tem habilidade de cópia
    abilities: Array<{
      id: string;                                          // ID único da habilidade
      name: string;                                        // Nome para exibição
      source: 'ally' | 'enemy' | 'any';                    // Fonte da habilidade copiada
      seenInScene: boolean;                                // Se precisa ter visto na cena
      ignorePrerequisites: boolean;                        // Se ignora pré-requisitos
      payOriginalCosts: boolean;                           // Se paga os custos originais
      peCost: number;                                      // Custo adicional em PE
      actionType: 'free' | 'standard' | 'varies';          // Tipo de ação
      usesPerScene?: number;                               // Usos por cena
      excludedAbilities?: string[];                        // Habilidades excluídas
      sourceName: string;                                  // Fonte da habilidade (para UI)
    }>;
    // Indica se pode copiar habilidades de inimigos também
    canCopyFromEnemy: boolean;
    // Indica se ignora pré-requisitos (consolidado)
    ignoresPrerequisites: boolean;
    // Custo mínimo em PE (menor custo dentre as habilidades)
    minPECost: number;
  };

  // =====================================================
  // TÉCNICO - Bônus consolidados de inventário/equipamento
  // =====================================================
  technician: {
    available: boolean;                                    // Se tem mecânicas de técnico

    // === Capacidade de Carga ===
    carryCapacity: {
      additionalAttributes: AttributeType[];               // Atributos adicionais para carga
      sources: Array<{ source: string; attribute: AttributeType }>;
    };

    // === Redução de Espaço ===
    itemSpaceReduction: {
      total: number;                                       // Total de redução de espaços
      sources: Array<{ source: string; amount: number }>;
    };

    // === Reparo de Equipamento ===
    repairAbilities: Array<{
      id: string;
      name: string;
      range: 'self' | 'touch' | 'short';
      removeCondition: string;
      peCost: number;
      actionType: 'standard' | 'complete';
      source: string;
    }>;

    // === Criação de Equipamento ===
    createEquipmentAbilities: Array<{
      id: string;
      name: string;
      type: 'general' | 'weapon' | 'armor' | 'any';
      duration: 'scene' | 'combat' | 'permanent';
      destroyedAfter: boolean;
      peCost: number;
      actionType: 'standard' | 'complete';
      source: string;
    }>;

    // === Retirar Item Retroativamente ===
    retrieveItemAbilities: Array<{
      id: string;
      name: string;
      excludeWeapons: boolean;
      retroactive: boolean;
      peCostPerCategory: number;
      actionType: 'movement' | 'standard';
      source: string;
    }>;
  };

  // =====================================================
  // FASE 3: SUPORTE (Médico de Campo, Resgate)
  // =====================================================
  support: {
    available: boolean;                                    // Se tem mecânicas de suporte

    // === Movimento Livre para Aliado (Resgate) ===
    freeMovement: {
      available: boolean;
      abilities: Array<{
        id: string;
        name: string;
        condition: 'ally-at-0-hp' | 'ally-wounded' | 'any-ally';
        perRound: boolean;
        source: string;
      }>;
    };

    // === Efeitos ao Curar ===
    onHealEffects: Array<{
      id: string;
      name: string;
      targetDefenseBonus: number;
      duration: 'next-attack' | 'end-of-round' | 'turns';
      turns?: number;
      source: string;
    }>;

    // === Remoção de Condição ===
    removeConditionAbilities: Array<{
      id: string;
      name: string;
      range: 'self' | 'touch' | 'short';
      excludedConditions: string[];
      peCost: number;
      actionType: 'standard' | 'complete';
      source: string;
    }>;

    // === Ressurreição ===
    resurrectAbilities: Array<{
      id: string;
      name: string;
      excludedDeathTypes: string[];
      sameSceneOnly: boolean;
      usesPerScene: number;
      peCost: number;
      actionType: 'complete' | 'full-round';
      hpRestored: 'roll' | 'half' | 'full' | 'one';
      source: string;
    }>;

    // Consolidados
    canRemoveConditions: boolean;
    canResurrect: boolean;
    hasFreeMovementToAlly: boolean;
    maxDefenseBonusOnHeal: number;
  };

  // =====================================================
  // FASE 5: OCULTISTA AVANÇADO
  // =====================================================
  occultist: {
    available: boolean;                                    // Se tem mecânicas de ocultista avançado
    paranormalResistanceTestBonus: number; // Condicional, nunca vira RD ou bônus geral
    hpCostPerPE: number | null;

    // === Rituais Bônus (Saber Ampliado) ===
    bonusRituals: {
      perCircle: number;                                   // Rituais extras por círculo
      ignoresLimit: boolean;                               // Ignora limite normal
      circleRestrictions: number[];                        // Círculos específicos (vazio = todos)
      sources: string[];
    };

    // === Grimório (Graduado) ===
    grimoire: {
      available: boolean;
      preparationAction?: 'full';
      maxRituals: number | 'intellect';
      allowedCircles: number[];
      bonusPerNewCircle: number;
      castingAction: 'standard' | 'complete' | 'extended';
      requiresWielding: boolean;
      inventorySlots: number;
      source: string;
    };

    // === Bônus de Poder de Ritual ===
    ritualPowerBonus: {
      addPELimit: boolean;
      affectsDT: boolean;
      affectsDamage: boolean;
      sources: string[];
    };

    // === Atributos Adicionais ao Limite de PE ===
    additionalPELimitAttributes: AttributeType[];

    // === Restrição de Recuperação de PV ===
    hpRecoveryRestriction: 'none' | 'rest-only' | 'magic-only';

    // === RD Paranormal com Teste ===
    paranormalDamageTest: {
      available: boolean;
      abilities: Array<{
        id: string;
        name: string;
        testSkill: string;
        onSuccess: 'negate' | 'half';
        onFailure: 'half' | 'full';
        dtType: 'fixed' | 'ritual-dt' | 'caster-presence' | 'existing-test';
        requiresExistingHalfDamageSave?: boolean;
        fixedDT?: number;
        source: string;
      }>;
    };
  };

  // =====================================================
  // RITUAIS - Bônus consolidados para rituais
  // =====================================================
  rituals: {
    // Bônus de DT
    dtBonus: number;
    dtBonusByElement: Record<string, number>;

    // Bônus de dano/cura
    damageBonus: number;
    damageAttributeBonus: AttributeType | null;

    // Reduções de PE
    peReduction: number;
    peReductionByElement: Record<string, number>;
    peReductionByRange: Record<string, number>;

    // Modificadores de trilha disponíveis
    availableModifiers: Array<{
      id: string;
      name: string;
      type: 'range' | 'action' | 'area' | 'duration' | 'counter';
      effect: string;
      peCost: number;
      perRound?: boolean;
      isActivatable?: boolean;
      variableCost?: boolean;
      actionType?: 'reaction';
      source: string;
    }>;

    // Breakdown para UI
    breakdown: Array<{ source: string; effect: string }>;
  };
}

/**
 * Verifica se as condições de um efeito são atendidas
 */
export function checkEffectConditions(
  effect: UnifiedEffect,
  context: EffectCalculationContext
): boolean {
  const conditions = effect.conditions;
  if (!conditions) return true;

  // Verifica tipo de ataque
  if (conditions.attackType && context.attackContext) {
    if (conditions.attackType !== 'any' && conditions.attackType !== context.attackContext.type) {
      return false;
    }
  }

  // Verifica condições do alvo
  if (conditions.targetConditions && conditions.targetConditions.length > 0 && context.attackContext) {
    const hasAnyCondition = conditions.targetConditions.some(
      c => context.attackContext!.targetConditions.includes(c)
    );
    if (!hasAnyCondition) return false;
  }

  // Verifica HP
  if (conditions.hpPercentBelow !== undefined) {
    const hpPercent = (context.hpCurrent / context.hpMax) * 100;
    if (hpPercent >= conditions.hpPercentBelow) return false;
  }
  if (conditions.hpPercentAbove !== undefined) {
    const hpPercent = (context.hpCurrent / context.hpMax) * 100;
    if (hpPercent <= conditions.hpPercentAbove) return false;
  }

  // Verifica condições do personagem
  if (conditions.characterConditions) {
    const hasAllConditions = conditions.characterConditions.every(
      c => context.activeConditions.includes(c)
    );
    if (!hasAllConditions) return false;
  }

  // Verifica escudo
  if (conditions.requiresShield && !context.hasShield) return false;

  // Verifica armadura
  if (conditions.requiresArmor && !context.equippedArmorType) return false;
  if (conditions.requiresNoArmor && context.equippedArmorType) return false;

  // Verifica combate
  if (conditions.inCombat !== undefined && conditions.inCombat !== context.inCombat) return false;

  // Verifica primeira rodada
  if (conditions.firstRoundOnly && !context.isFirstRound) return false;

  // Verifica ativação manual
  if (conditions.requiresActivation && !context.activatedEffects.includes(effect.id)) {
    return false;
  }

  // Verifica atributos mínimos
  if (conditions.minAttribute) {
    for (const [attr, minValue] of Object.entries(conditions.minAttribute)) {
      if (context.attributes[attr as AttributeType] < minValue!) return false;
    }
  }

  return true;
}

/**
 * Ordem fixa de aplicação de efeitos (SUE Hardening)
 * Garante processamento determinístico
 */
const EFFECT_SOURCE_PRIORITY: Record<EffectSource, number> = {
  skill_training: 1,
  origin: 2,
  class_ability: 3,
  class_power: 4,
  track: 5,
  general_power: 6,
  paranormal_power: 7,
  equipment: 8,
  ritual: 9,
  condition: 10,
};

/**
 * Ordena efeitos pela ordem fixa de aplicação (SUE Hardening)
 */
function orderEffectsByPriority(effects: UnifiedEffect[]): UnifiedEffect[] {
  return [...effects].sort((a, b) => {
    const priorityDiff = (EFFECT_SOURCE_PRIORITY[a.source] ?? 99) - (EFFECT_SOURCE_PRIORITY[b.source] ?? 99);
    if (priorityDiff !== 0) return priorityDiff;
    // Mesmo fonte: ordena por ID para determinismo
    return a.id.localeCompare(b.id);
  });
}

/**
 * Consolida uma lista de efeitos em um resultado computado
 * 
 * INTEGRAÇÃO SUE HARDENING:
 * - Aplica ordem fixa de 10 passos para processamento determinístico
 * - Usa regras de stacking explícitas para bônus numéricos
 * - Mantém breakdown completo para transparência
 */
export function consolidateEffects(
  effects: UnifiedEffect[],
  context: EffectCalculationContext
): ComputedEffects {
  // === SUE HARDENING: Ordena efeitos pela ordem fixa de aplicação ===
  // Filtra pelo contexto antes do acúmulo: um efeito inelegível não pode substituir outro.
  const eligible = effects.filter(effect => effect.isActive && checkEffectConditions(effect, context));
  const prepared = preprocessEffectsWithHardening(eligible);
  const orderedEffects = orderEffectsByPriority([
    ...prepared.effects,
    ...effects.filter(effect => effect.isToggleable && !eligible.includes(effect)),
  ]);
  
  const result: ComputedEffects = {
    attack: { general: 0, melee: 0, ranged: 0, breakdown: [] },
    damage: { general: 0, melee: 0, ranged: 0, firearm: 0, extraDice: [], breakdown: [] },
    critical: { marginBonus: 0, multiplierBonus: 0, breakdown: [] },
    defense: { general: 0, vsMelee: 0, vsRanged: 0, breakdown: [] },
    resistances: { fortitude: 0, reflexos: 0, vontade: 0, breakdown: [] },
    damageReduction: { physical: 0, paranormal: 0, byType: {}, breakdown: [] },
    damageResistance: {},
    skills: {},
    testDice: { all: 0, attacks: 0, melee: 0, ranged: 0, attributes: {}, skills: {} },
    resources: { hpBonus: 0, peBonus: 0, peLimitBonus: 0, sanityBonus: 0, tempHP: 0, breakdown: [] },
    movement: { bonus: 0, multiplier: 1, breakdown: [] },
    initiative: { bonus: 0, breakdown: [] },
    specialEffects: [],
    proficiencies: [],
    flags: {
      cannotAct: false,
      cannotReact: false,
      cannotMove: false,
      isHelpless: false,
      isUnconscious: false,
    },
    toggleableEffects: [],
    // === COMBATE AVANÇADO ===
    combatAdvanced: {
      specialAttackMultiplier: {
        value: 1,
        weaponRestriction: 'any',
        sources: [],
      },
      extraActions: [],
      maximumDamageOnCrit: {
        enabled: false,
        weaponTypes: [],
        sources: [],
      },
      blockVigorBonus: {
        enabled: false,
        sources: [],
      },
      occultismAsAttack: {
        enabled: false,
        sources: [],
      },
      taunt: {
        available: false,
        abilities: [],
      },
      targetStateControl: {
        available: false,
        options: [],
        abilities: [],
      },
      conditionalBonuses: {
        whenWounded: {
          active: false,
          defenseBonus: 0,
          damageReduction: 0,
          sources: [],
        },
        whenDying: {
          canAct: false,
          notHelpless: false,
          sources: [],
        },
      },
    },
    // === EQUIPAMENTO E INVENTÁRIO ===
    inventory: {
      categoryReductions: [],
      totalCategoryReduction: 0,
    },
    // === CONTRA-MÁGICA ===
    counterSpellAbilities: [],
    // === ATAQUE FURTIVO ===
    sneakAttack: {
      available: false,
      baseDice: 0,
      dieType: 'd6',
      conditions: [],
      peCost: 0,
      usesPerRound: 0,
      multiplier: 1,
      totalDice: 0,
      sources: [],
      stealthBonuses: {
        removesMovementPenalty: false,
        reducesMovementPenaltyBy: 0,
        ignoresArmorPenalty: false,
        ignoresAllPenalties: false,
        sources: [],
      },
    },
    // === CURA ===
    healing: {
      available: false,
      baseDice: 0,
      dieType: 'd10',
      peCost: 0,
      extraDicePECost: 0,
      range: 'touch',
      actionType: 'standard',
      bonusFromOrigin: 0,
      bonusFromOriginSource: null,
      sources: [],
    },
    // === LIDERANÇA ===
    leadership: {
      available: false,
      abilities: [],
      availableEffects: {
        rerollTest: false,
        extraMovementAction: false,
        extraAttack: false,
        extraStandardAction: false,
        tempHP: 0,
        bonusToNextTest: 0,
      },
    },
    // === BUFF DE ALIADOS (Negociador) ===
    allyBuff: {
      available: false,
      abilities: [],
      maxSkillBonus: 0,
      affectsSelf: false,
    },
    // === EFEITO SOCIAL (Negociador - Eloquência) ===
    socialEffect: {
      available: false,
      abilities: [],
      availableEffects: [],
    },
    // === REDE DE CONTATOS (Negociador - Eu Conheço um Cara) ===
    contacts: {
      available: false,
      abilities: [],
      allAvailableEffects: [],
      totalUsesPerMission: 0,
    },
    // === CÓPIA DE HABILIDADE (Negociador - Truque de Mestre) ===
    copyAbility: {
      available: false,
      abilities: [],
      canCopyFromEnemy: false,
      ignoresPrerequisites: false,
      minPECost: Infinity,
    },
    // === TÉCNICO ===
    technician: {
      available: false,
      carryCapacity: {
        additionalAttributes: [],
        sources: [],
      },
      itemSpaceReduction: {
        total: 0,
        sources: [],
      },
      repairAbilities: [],
      createEquipmentAbilities: [],
      retrieveItemAbilities: [],
    },
    // === SUPORTE (Fase 3) ===
    support: {
      available: false,
      freeMovement: {
        available: false,
        abilities: [],
      },
      onHealEffects: [],
      removeConditionAbilities: [],
      resurrectAbilities: [],
      canRemoveConditions: false,
      canResurrect: false,
      hasFreeMovementToAlly: false,
      maxDefenseBonusOnHeal: 0,
    },
    // === OCULTISTA AVANÇADO (Fase 5) ===
    occultist: {
      available: false,
      paranormalResistanceTestBonus: 0,
      hpCostPerPE: null,
      bonusRituals: {
        perCircle: 0,
        ignoresLimit: false,
        circleRestrictions: [],
        sources: [],
      },
      grimoire: {
        available: false,
        maxRituals: 0,
        allowedCircles: [],
        bonusPerNewCircle: 0,
        castingAction: 'complete',
        requiresWielding: true,
        inventorySlots: 1,
        source: '',
      },
      ritualPowerBonus: {
        addPELimit: false,
        affectsDT: false,
        affectsDamage: false,
        sources: [],
      },
      additionalPELimitAttributes: [],
      hpRecoveryRestriction: 'none',
      paranormalDamageTest: {
        available: false,
        abilities: [],
      },
    },
    // === RITUAIS ===
    rituals: {
      dtBonus: 0,
      dtBonusByElement: {},
      damageBonus: 0,
      damageAttributeBonus: null,
      peReduction: 0,
      peReductionByElement: {},
      peReductionByRange: {},
      availableModifiers: [],
      breakdown: [],
    },
  };

  // === SUE HARDENING: Itera sobre efeitos na ordem fixa ===
  for (const effect of orderedEffects) {
    // Registra efeitos toggleáveis
    if (effect.isToggleable) {
      result.toggleableEffects.push({
        id: effect.id,
        name: effect.name,
        source: effect.sourceName,
        isActive: effect.isActive,
        effects: effect.mechanics.specialEffects || [],
        condition: effect.conditions?.requiresActivation ? 'Ativação manual' : undefined,
        costPE: effect.conditions?.costPE,
      });
    }

    // O seletor precisa oferecer modificadores conhecidos antes de sua ativação.
    // Disponibilidade não aplica bônus nem debita PE; o modal cobra só os selecionados.
    const availabilityEffect = {
      ...effect,
      conditions: effect.conditions ? { ...effect.conditions, requiresActivation: false } : undefined,
    };
    if (effect.mechanics.ritualModifiers && checkEffectConditions(availabilityEffect, context)) {
      for (const mod of effect.mechanics.ritualModifiers) {
        if (!result.rituals.availableModifiers.some(existing => existing.id === mod.id)) {
          result.rituals.availableModifiers.push({ ...mod, source: effect.sourceName });
          result.rituals.breakdown.push({
            source: effect.sourceName,
            effect: `${mod.name}: ${mod.effect} (+${mod.peCost} PE)`,
          });
        }
      }
    }

    // Verifica condições
    if (!checkEffectConditions(effect, context) || !effect.isActive) {
      continue;
    }

    const m = effect.mechanics;
    const source = effect.sourceName;
    if (m.testDice) {
      const target = result.testDice!;
      for (const key of ['all', 'attacks', 'melee', 'ranged'] as const) {
        target[key] = (target[key] ?? 0) + (m.testDice[key] ?? 0);
      }
      for (const [attribute, value] of Object.entries(m.testDice.attributes ?? {})) {
        const key = attribute as AttributeType;
        target.attributes![key] = (target.attributes![key] ?? 0) + value;
      }
      for (const [skill, value] of Object.entries(m.testDice.skills ?? {})) {
        target.skills![skill] = (target.skills![skill] ?? 0) + value;
      }
    }

    // === Ataque ===
    if (m.attackBonus) {
      result.attack.general += m.attackBonus;
      result.attack.breakdown.push({ source, value: m.attackBonus });
    }
    if (m.meleeAttackBonus) {
      result.attack.melee += m.meleeAttackBonus;
      result.attack.breakdown.push({ source, value: m.meleeAttackBonus, conditional: 'corpo a corpo' });
    }
    if (m.rangedAttackBonus) {
      result.attack.ranged += m.rangedAttackBonus;
      result.attack.breakdown.push({ source, value: m.rangedAttackBonus, conditional: 'distância' });
    }

    // === Dano ===
    if (m.damageBonus) {
      result.damage.general += m.damageBonus;
      result.damage.breakdown.push({ source, value: m.damageBonus, ...(m.requiresChosenWeapon ? {effectId:effect.id} : {}) });
    }
    if (m.meleeDamageBonus) {
      result.damage.melee += m.meleeDamageBonus;
      result.damage.breakdown.push({ source, value: m.meleeDamageBonus, conditional: 'corpo a corpo' });
    }
    if (m.rangedDamageBonus) {
      result.damage.ranged += m.rangedDamageBonus;
      result.damage.breakdown.push({ source, value: m.rangedDamageBonus, conditional: 'distância', effectId: effect.id });
    }
    if (m.firearmDamageBonus) {
      result.damage.firearm += m.firearmDamageBonus;
      result.damage.breakdown.push({ source, value: m.firearmDamageBonus, conditional: 'armas de fogo' });
    }
    if (m.extraDamageDice) {
      result.damage.extraDice.push(m.extraDamageDice);
      result.damage.breakdown.push({ source, value: m.extraDamageDice, effectId: effect.id });
    }

    // === Crítico ===
    if (m.criticalMarginBonus) {
      result.critical.marginBonus += m.criticalMarginBonus;
      result.critical.breakdown.push({ source, value: m.criticalMarginBonus, type: 'margin', effectId: effect.id });
    }
    if (m.criticalMultiplierBonus) {
      result.critical.multiplierBonus += m.criticalMultiplierBonus;
      result.critical.breakdown.push({ source, value: m.criticalMultiplierBonus, type: 'multiplier', effectId: effect.id });
    }

    // === Defesa ===
    if (m.defenseBonus) {
      result.defense.general += m.defenseBonus;
      result.defense.breakdown.push({ source, value: m.defenseBonus });
    }
    if (m.defenseBonusMelee) {
      result.defense.vsMelee += m.defenseBonusMelee;
      result.defense.breakdown.push({ source, value: m.defenseBonusMelee, conditional: 'vs corpo a corpo' });
    }
    if (m.defenseBonusRanged) {
      result.defense.vsRanged += m.defenseBonusRanged;
      result.defense.breakdown.push({ source, value: m.defenseBonusRanged, conditional: 'vs distância' });
    }

    // === Resistências ===
    if (m.fortitudeBonus) {
      result.resistances.fortitude += m.fortitudeBonus;
      result.resistances.breakdown.push({ source, value: m.fortitudeBonus, resistance: 'fortitude' });
    }
    if (m.reflexosBonus) {
      result.resistances.reflexos += m.reflexosBonus;
      result.resistances.breakdown.push({ source, value: m.reflexosBonus, resistance: 'reflexos' });
    }
    if (m.vontadeBonus) {
      result.resistances.vontade += m.vontadeBonus;
      result.resistances.breakdown.push({ source, value: m.vontadeBonus, resistance: 'vontade' });
    }
    if (m.allResistancesBonus) {
      result.resistances.fortitude += m.allResistancesBonus;
      result.resistances.reflexos += m.allResistancesBonus;
      result.resistances.vontade += m.allResistancesBonus;
      result.resistances.breakdown.push({ source, value: m.allResistancesBonus, resistance: 'fortitude' });
      result.resistances.breakdown.push({ source, value: m.allResistancesBonus, resistance: 'reflexos' });
      result.resistances.breakdown.push({ source, value: m.allResistancesBonus, resistance: 'vontade' });
    }

    // === Redução de Dano ===
    if (m.damageReduction) {
      result.damageReduction.physical += m.damageReduction;
      result.damageReduction.breakdown.push({ source, value: m.damageReduction });
    }
    if (m.paranormalDamageReduction) {
      result.damageReduction.paranormal += m.paranormalDamageReduction;
      result.damageReduction.breakdown.push({ source, value: m.paranormalDamageReduction, type: 'mental' });
    }
    if (m.damageReductionByType) {
      for (const [type, value] of Object.entries(m.damageReductionByType)) {
        const t = type as DamageType;
        result.damageReduction.byType[t] = (result.damageReduction.byType[t] || 0) + value!;
        result.damageReduction.breakdown.push({ source, value: value!, type: t });
      }
    }

    // === Resistência a Dano ===
    if (m.damageResistance) {
      for (const [type, value] of Object.entries(m.damageResistance)) {
        const t = type as DamageType;
        result.damageResistance[t] = Math.max(result.damageResistance[t] || 0, value!);
      }
    }

    // === Perícias ===
    if (m.skillBonus) {
      for (const [skill, bonus] of Object.entries(m.skillBonus)) {
        if (!result.skills[skill]) {
          result.skills[skill] = { bonus: 0, sources: [] };
        }
        result.skills[skill].bonus += bonus!;
        result.skills[skill].sources.push(source);
      }
    }
    if (m.allSkillsBonus) {
      // Aplicado globalmente - cada componente deve usar
      result.skills['_all'] = {
        bonus: (result.skills['_all']?.bonus || 0) + m.allSkillsBonus,
        sources: [...(result.skills['_all']?.sources || []), source]
      };
    }

    // === Recursos ===
    if (m.hpBonus) {
      result.resources.hpBonus += m.hpBonus;
      result.resources.breakdown.push({ source, value: m.hpBonus, resource: 'hp' });
    }
    if (m.hpBonusPerNex) {
      const bonus = m.hpBonusPerNex * getNexLevel(context.nex);
      result.resources.hpBonus += bonus;
      result.resources.breakdown.push({ source, value: bonus, resource: 'hp' });
    }
    if (m.peBonus) {
      result.resources.peBonus += m.peBonus;
      result.resources.breakdown.push({ source, value: m.peBonus, resource: 'pe' });
    }
    if (m.peBonusPerNex) {
      const bonus = m.peBonusPerNex * getNexLevel(context.nex);
      result.resources.peBonus += bonus;
      result.resources.breakdown.push({ source, value: bonus, resource: 'pe' });
    }
    
    // === Bônus PE em NEX ímpar (Universitário: Dedicação) ===
    if (m.peBonusOddNex) {
      // NEX ímpares: 15%, 25%, 35%, 45%, 55%, 65%, 75%, 85%, 95%
      const oddNexCount = Math.floor(context.nex / 10);
      const bonus = m.peBonusOddNex * oddNexCount;
      result.resources.peBonus += bonus;
      result.resources.breakdown.push({ source, value: bonus, resource: 'pe' });
    }
    
    // === Limite de PE por turno (Universitário: Dedicação) ===
    if (m.peLimitBonus) {
      result.resources.peLimitBonus = (result.resources.peLimitBonus || 0) + m.peLimitBonus;
      result.resources.breakdown.push({ source, value: m.peLimitBonus, resource: 'peLimit' });
    }
    
    if (m.sanityBonus) {
      result.resources.sanityBonus += m.sanityBonus;
      result.resources.breakdown.push({ source, value: m.sanityBonus, resource: 'sanity' });
    }
    
    // === Bônus SAN por NEX (Vítima: Cicatrizes Psicológicas) ===
    if (m.sanityBonusPerNex) {
      const bonus = m.sanityBonusPerNex * getNexLevel(context.nex);
      result.resources.sanityBonus += bonus;
      result.resources.breakdown.push({ source, value: bonus, resource: 'sanity' });
    }
    
    if (m.tempHP) {
      result.resources.tempHP = Math.max(result.resources.tempHP, m.tempHP);
      result.resources.breakdown.push({ source, value: m.tempHP, resource: 'tempHP' });
    }

    // === Movimento ===
    if (m.movementBonus) {
      result.movement.bonus += m.movementBonus;
      result.movement.breakdown.push({ source, value: m.movementBonus });
    }
    if (m.movementMultiplier) {
      result.movement.multiplier *= m.movementMultiplier;
    }

    // === Iniciativa ===
    if (m.initiativeBonus) {
      result.initiative.bonus += m.initiativeBonus;
      result.initiative.breakdown.push({ source, value: m.initiativeBonus });
    }

    // === Efeitos Especiais ===
    if (m.specialEffects) {
      for (const eff of m.specialEffects) {
        result.specialEffects.push({ source, effect: eff });
      }
    }

    // === Proficiências ===
    if (m.grantsProficiency) {
      for (const prof of m.grantsProficiency) {
        if (!result.proficiencies.includes(prof)) {
          result.proficiencies.push(prof);
        }
      }
    }

    // === Flags ===
    if (m.cannotAct) result.flags.cannotAct = true;
    if (m.cannotReact) result.flags.cannotReact = true;
    if (m.cannotMove) result.flags.cannotMove = true;
    if (m.isHelpless) result.flags.isHelpless = true;
    if (m.isUnconscious) result.flags.isUnconscious = true;

    // =====================================================
    // COMBATE AVANÇADO (Fase 1 SUE)
    // =====================================================

    // === Multiplicador de Ataque Especial (Guerreiro - Potência Máxima) ===
    if (m.specialAttackMultiplier) {
      // Maior multiplicador ganha
      if (m.specialAttackMultiplier.value > result.combatAdvanced.specialAttackMultiplier.value) {
        result.combatAdvanced.specialAttackMultiplier.value = m.specialAttackMultiplier.value;
        result.combatAdvanced.specialAttackMultiplier.weaponRestriction =
          m.specialAttackMultiplier.weaponRestriction ?? 'any';
      }
      result.combatAdvanced.specialAttackMultiplier.sources.push(source);
    }

    // === Ações Extras de Trilha ===
    if (m.extraActionsTrack) {
      result.combatAdvanced.extraActions.push({
        id: effect.id,
        name: effect.name,
        type: m.extraActionsTrack.type,
        trigger: m.extraActionsTrack.trigger,
        peCost: m.extraActionsTrack.peCost ?? 0,
        actionType: m.extraActionsTrack.actionType ?? 'free',
        weaponRestriction: m.extraActionsTrack.weaponRestriction,
        maneuverOptions: m.extraActionsTrack.maneuverOptions,
        replaceDamage: m.extraActionsTrack.replaceDamage,
        perRound: m.extraActionsTrack.perRound,
        perScene: m.extraActionsTrack.perScene,
        source,
      });
    }

    // === Dano Máximo em Crítico (Atirador de Elite) ===
    if (m.maximumDamageOnCritical) {
      result.combatAdvanced.maximumDamageOnCrit.enabled = true;
      if (!result.combatAdvanced.maximumDamageOnCrit.weaponTypes.includes(m.maximumDamageOnCritical.weaponType)) {
        result.combatAdvanced.maximumDamageOnCrit.weaponTypes.push(m.maximumDamageOnCritical.weaponType);
      }
      result.combatAdvanced.maximumDamageOnCrit.sources.push(source);
    }

    // === Bônus de Bloqueio com Vigor ===
    if (m.blockVigorBonus) {
      result.combatAdvanced.blockVigorBonus.enabled = true;
      result.combatAdvanced.blockVigorBonus.sources.push(source);
    }

    // === Ocultismo como Ataque ===
    if (m.occultismAsAttack) {
      result.combatAdvanced.occultismAsAttack.enabled = true;
      result.combatAdvanced.occultismAsAttack.sources.push(source);
    }

    // === Provocar (Taunt) ===
    if (m.taunt) {
      result.combatAdvanced.taunt.available = true;
      result.combatAdvanced.taunt.abilities.push({
        id: effect.id,
        name: effect.name,
        range: m.taunt.range,
        resistanceTest: m.taunt.resistanceTest,
        dtAttribute: m.taunt.dtAttribute,
        peCost: m.taunt.peCost,
        actionType: m.taunt.actionType,
        source,
      });
    }

    // === Controle de Estado do Alvo ===
    if (m.targetStateControl) {
      result.combatAdvanced.targetStateControl.available = true;

      // Adiciona opções à lista consolidada
      for (const opt of m.targetStateControl.options) {
        if (!result.combatAdvanced.targetStateControl.options.includes(opt)) {
          result.combatAdvanced.targetStateControl.options.push(opt);
        }
      }

      result.combatAdvanced.targetStateControl.abilities.push({
        id: effect.id,
        name: effect.name,
        options: m.targetStateControl.options,
        resistanceTest: m.targetStateControl.resistanceTest,
        dtAttribute: m.targetStateControl.dtAttribute,
        source,
      });
    }

    // === Bônus quando Machucado ===
    if (m.whenWounded) {
      const hpPercent = (context.hpCurrent / context.hpMax) * 100;
      // Machucado inclui exatamente metade dos PV (Livro Base v1.3, p. 311).
      const isWounded = hpPercent <= m.whenWounded.hpThreshold;

      if (isWounded) {
        result.combatAdvanced.conditionalBonuses.whenWounded.active = true;
        result.combatAdvanced.conditionalBonuses.whenWounded.defenseBonus += m.whenWounded.defenseBonus ?? 0;
        result.combatAdvanced.conditionalBonuses.whenWounded.damageReduction += m.whenWounded.damageReduction ?? 0;

        // Aplica bônus de defesa automaticamente
        if (m.whenWounded.defenseBonus) {
          result.defense.general += m.whenWounded.defenseBonus;
          result.defense.breakdown.push({ source, value: m.whenWounded.defenseBonus, conditional: 'quando machucado' });
        }

        // Aplica RD automaticamente
        if (m.whenWounded.damageReduction) {
          result.damageReduction.physical += m.whenWounded.damageReduction;
          result.damageReduction.breakdown.push({ source, value: m.whenWounded.damageReduction });
        }
      }

      result.combatAdvanced.conditionalBonuses.whenWounded.sources.push(source);
    }

    // === Bônus quando Morrendo ===
    if (m.whenDying) {
      if (m.whenDying.canAct) {
        result.combatAdvanced.conditionalBonuses.whenDying.canAct = true;
      }
      if (m.whenDying.notHelpless) {
        result.combatAdvanced.conditionalBonuses.whenDying.notHelpless = true;
      }
      result.combatAdvanced.conditionalBonuses.whenDying.sources.push(source);
    }

    // =====================================================
    // EQUIPAMENTO E INVENTÁRIO
    // =====================================================

    // === Redução de Categoria ===
    if (m.categoryReduction) {
      result.inventory.categoryReductions.push({
        amount: m.categoryReduction.amount,
        targetType: m.categoryReduction.targetType,
        source,
        requiresChoice: m.categoryReduction.requiresChoice,
        appliesToAllCarried: m.categoryReduction.appliesToAllCarried,
      });
      result.inventory.totalCategoryReduction += m.categoryReduction.amount;
    }

    // === Contra-Mágica ===
    if (m.counterSpell) {
      result.counterSpellAbilities.push({
        source,
        costMatchesTarget: m.counterSpell.costMatchesTarget,
        testSkill: m.counterSpell.testSkill,
        testType: m.counterSpell.testType,
      });
    }

    // === Ataque Furtivo ===
    if (m.sneakAttack) {
      result.sneakAttack.available = true;

      // Calcula dados baseado no NEX do contexto
      let dice = m.sneakAttack.baseDice;
      const dieType = m.sneakAttack.dieType;

      // Aplica escalonamento por NEX se disponível
      if (m.sneakAttack.scaling) {
        const nexThresholds = Object.keys(m.sneakAttack.scaling)
          .map(Number)
          .sort((a, b) => b - a); // Ordem decrescente

        for (const threshold of nexThresholds) {
          if (context.nex >= threshold) {
            const scaling = m.sneakAttack.scaling[threshold];
            dice = scaling.dice;
            break;
          }
        }
      }

      // Aplica multiplicador (Assassinar)
      const multiplier = m.sneakAttack.multiplier ?? 1;
      if (multiplier > result.sneakAttack.multiplier) {
        result.sneakAttack.multiplier = multiplier;
      }

      // Atualiza dados base (maior valor ganha)
      if (dice > result.sneakAttack.baseDice) {
        result.sneakAttack.baseDice = dice;
        result.sneakAttack.dieType = dieType;
      }

      // Merge condições
      if (m.sneakAttack.conditions) {
        for (const cond of m.sneakAttack.conditions) {
          if (!result.sneakAttack.conditions.includes(cond)) {
            result.sneakAttack.conditions.push(cond);
          }
        }
      }

      // Custo e usos (primeiro a definir)
      if (result.sneakAttack.peCost === 0) {
        result.sneakAttack.peCost = m.sneakAttack.peCost;
      }
      if (result.sneakAttack.usesPerRound === 0) {
        result.sneakAttack.usesPerRound = m.sneakAttack.usesPerRound;
      }

      // Registra fonte
      result.sneakAttack.sources.push({
        source,
        dice,
        dieType,
        multiplier: m.sneakAttack.multiplier,
      });

      // Calcula total com multiplicador
      result.sneakAttack.totalDice = result.sneakAttack.baseDice * result.sneakAttack.multiplier;
    }

    // === Cura (Médico de Campo) ===
    if (m.healing) {
      result.healing.available = true;

      // Calcula dados baseado no NEX do contexto
      let dice = m.healing.baseDice;
      const dieType = m.healing.dieType;

      // Aplica escalonamento por NEX se disponível
      if (m.healing.scaling) {
        const nexThresholds = Object.keys(m.healing.scaling)
          .map(Number)
          .sort((a, b) => b - a); // Ordem decrescente

        for (const threshold of nexThresholds) {
          if (context.nex >= threshold) {
            const scaling = m.healing.scaling[threshold];
            dice = scaling.dice;
            break;
          }
        }
      }

      // Atualiza dados base (maior valor ganha)
      if (dice > result.healing.baseDice) {
        result.healing.baseDice = dice;
        result.healing.dieType = dieType;
      }

      // Custo em PE (primeiro a definir)
      if (result.healing.peCost === 0) {
        result.healing.peCost = m.healing.peCost;
      }

      // Custo por dado extra
      if (m.healing.extraDicePECost && result.healing.extraDicePECost === 0) {
        result.healing.extraDicePECost = m.healing.extraDicePECost;
      }

      // Range e action type (primeiro a definir)
      if (m.healing.range) {
        result.healing.range = m.healing.range;
      }
      if (m.healing.actionType) {
        result.healing.actionType = m.healing.actionType;
      }

      // Registra fonte
      result.healing.sources.push({
        source,
        dice,
        dieType,
        peCost: m.healing.peCost,
      });
    }

    // === Bônus de Cura de Origens (Agente de Saúde - Técnica Medicinal) ===
    // Processa healingBonus que pode ser um atributo ('intellect') ou valor fixo
    if (m.healingBonus) {
      let bonusValue = 0;
      
      if (typeof m.healingBonus === 'number') {
        bonusValue = m.healingBonus;
      } else if (m.healingBonus === 'intellect') {
        bonusValue = context.attributes.intellect;
      } else if (m.healingBonus === 'presence') {
        bonusValue = context.attributes.presence;
      } else if (m.healingBonus === 'vigor') {
        bonusValue = context.attributes.vigor;
      }
      
      // Adiciona ao bônus de cura (maior bônus vence para evitar stacking)
      if (bonusValue > result.healing.bonusFromOrigin) {
        result.healing.bonusFromOrigin = bonusValue;
        result.healing.bonusFromOriginSource = source;
      }
    }

    // === Liderança (Comandante de Campo) ===
    if (m.leadership) {
      result.leadership.available = true;

      // Calcula maxAllies e allyEffects baseado no NEX se houver scaling
      let maxAllies = m.leadership.maxAllies;
      let allyEffects = { ...m.leadership.allyEffects };
      let peCost = m.leadership.peCost;

      if (m.leadership.scaling) {
        const nexThresholds = Object.keys(m.leadership.scaling)
          .map(Number)
          .sort((a, b) => b - a); // Ordem decrescente

        for (const threshold of nexThresholds) {
          if (context.nex >= threshold) {
            const scaling = m.leadership.scaling[threshold];
            if (scaling.maxAllies !== undefined) maxAllies = scaling.maxAllies;
            if (scaling.peCost !== undefined) peCost = scaling.peCost;
            if (scaling.allyEffects) {
              allyEffects = { ...allyEffects, ...scaling.allyEffects };
            }
            break;
          }
        }
      }

      // Adiciona habilidade à lista
      result.leadership.abilities.push({
        id: effect.id,
        name: effect.name,
        range: m.leadership.range,
        maxAllies,
        peCost,
        actionType: m.leadership.actionType,
        usesPerRound: m.leadership.usesPerRound,
        usesPerScene: m.leadership.usesPerScene,
        allyEffects,
        source,
      });

      // Consolida efeitos disponíveis
      if (allyEffects.rerollTest) {
        result.leadership.availableEffects.rerollTest = true;
      }
      if (allyEffects.extraMovementAction) {
        result.leadership.availableEffects.extraMovementAction = true;
      }
      if (allyEffects.extraAttack) {
        result.leadership.availableEffects.extraAttack = true;
      }
      if (allyEffects.extraStandardAction) {
        result.leadership.availableEffects.extraStandardAction = true;
      }
      if (allyEffects.tempHP) {
        result.leadership.availableEffects.tempHP = Math.max(
          result.leadership.availableEffects.tempHP,
          allyEffects.tempHP
        );
      }
      if (allyEffects.bonusToNextTest) {
        result.leadership.availableEffects.bonusToNextTest = Math.max(
          result.leadership.availableEffects.bonusToNextTest,
          allyEffects.bonusToNextTest
        );
      }
    }

    // === Buff para Aliados (Negociador - Discurso Motivador) ===
    if (m.allyBuff) {
      result.allyBuff.available = true;

      // Calcula bônus de perícia baseado no NEX se houver scaling
      let skillBonus = m.allyBuff.skillBonus;
      let peCost = m.allyBuff.peCost;

      if (m.allyBuff.scaling) {
        const nexThresholds = Object.keys(m.allyBuff.scaling)
          .map(Number)
          .sort((a, b) => b - a); // Ordem decrescente

        for (const threshold of nexThresholds) {
          if (context.nex >= threshold) {
            const scaling = m.allyBuff.scaling[threshold];
            if (scaling.skillBonus !== undefined) skillBonus = scaling.skillBonus;
            if (scaling.peCost !== undefined) peCost = scaling.peCost;
            break;
          }
        }
      }

      // Adiciona habilidade à lista
      result.allyBuff.abilities.push({
        id: effect.id,
        name: effect.name,
        range: m.allyBuff.range,
        skillBonus,
        peCost,
        actionType: m.allyBuff.actionType,
        duration: m.allyBuff.duration,
        turns: m.allyBuff.turns,
        includeSelf: m.allyBuff.includeSelf,
        source,
      });

      // Atualiza máximo bônus de perícia
      if (skillBonus > result.allyBuff.maxSkillBonus) {
        result.allyBuff.maxSkillBonus = skillBonus;
      }

      // Atualiza se afeta o próprio
      if (m.allyBuff.includeSelf) {
        result.allyBuff.affectsSelf = true;
      }
    }

    // === Efeito Social (Negociador - Eloquência) ===
    if (m.socialEffect) {
      result.socialEffect.available = true;

      // Adiciona habilidade à lista
      result.socialEffect.abilities.push({
        id: effect.id,
        name: effect.name,
        range: m.socialEffect.range,
        targetAll: m.socialEffect.targetAll,
        skillOptions: m.socialEffect.skillOptions,
        resistanceSkill: m.socialEffect.resistanceSkill,
        effect: m.socialEffect.effect,
        duration: m.socialEffect.duration,
        turns: m.socialEffect.turns,
        peCost: m.socialEffect.peCost,
        actionType: m.socialEffect.actionType,
        immunityOnSuccess: m.socialEffect.immunityOnSuccess,
        resistanceBonusOnSuccess: m.socialEffect.resistanceBonusOnSuccess,
        source,
      });

      // Adiciona efeito aos disponíveis se não existir
      if (!result.socialEffect.availableEffects.includes(m.socialEffect.effect)) {
        result.socialEffect.availableEffects.push(m.socialEffect.effect);
      }
    }

    // === Rede de Contatos (Negociador - Eu Conheço um Cara) ===
    if (m.contacts) {
      result.contacts.available = true;

      // Adiciona habilidade à lista
      result.contacts.abilities.push({
        id: effect.id,
        name: effect.name,
        usesPerMission: m.contacts.usesPerMission,
        availableEffects: m.contacts.availableEffects,
        gmDiscretion: m.contacts.gmDiscretion,
        peCost: m.contacts.peCost,
        actionType: m.contacts.actionType,
        source,
      });

      // Adiciona efeitos aos disponíveis
      for (const eff of m.contacts.availableEffects) {
        if (!result.contacts.allAvailableEffects.includes(eff)) {
          result.contacts.allAvailableEffects.push(eff);
        }
      }

      // Soma usos por missão
      result.contacts.totalUsesPerMission += m.contacts.usesPerMission;
    }

    // === Cópia de Habilidade (Negociador - Truque de Mestre) ===
    if (m.copyAbility) {
      result.copyAbility.available = true;

      // Adiciona habilidade à lista
      result.copyAbility.abilities.push({
        id: effect.id,
        name: effect.name,
        source: m.copyAbility.source,
        seenInScene: m.copyAbility.seenInScene,
        ignorePrerequisites: m.copyAbility.ignorePrerequisites,
        payOriginalCosts: m.copyAbility.payOriginalCosts,
        peCost: m.copyAbility.peCost,
        actionType: m.copyAbility.actionType,
        usesPerScene: m.copyAbility.usesPerScene,
        excludedAbilities: m.copyAbility.excludedAbilities,
        sourceName: source,
      });

      // Atualiza flags consolidadas
      if (m.copyAbility.source === 'enemy' || m.copyAbility.source === 'any') {
        result.copyAbility.canCopyFromEnemy = true;
      }

      if (m.copyAbility.ignorePrerequisites) {
        result.copyAbility.ignoresPrerequisites = true;
      }

      // Atualiza custo mínimo em PE
      if (m.copyAbility.peCost < result.copyAbility.minPECost) {
        result.copyAbility.minPECost = m.copyAbility.peCost;
      }
    }

    // =====================================================
    // TÉCNICO - Processa mecânicas de inventário/equipamento
    // =====================================================

    // === Capacidade de Carga (Inventário Otimizado) ===
    if (m.carryCapacity) {
      result.technician.available = true;

      // Adiciona atributo à lista se não existir
      if (!result.technician.carryCapacity.additionalAttributes.includes(m.carryCapacity.addAttribute)) {
        result.technician.carryCapacity.additionalAttributes.push(m.carryCapacity.addAttribute);
      }

      result.technician.carryCapacity.sources.push({
        source,
        attribute: m.carryCapacity.addAttribute,
      });
    }

    // === Redução de Espaço de Item (Inventário Otimizado) ===
    if (m.itemSpaceReduction) {
      result.technician.available = true;

      result.technician.itemSpaceReduction.total += m.itemSpaceReduction;
      result.technician.itemSpaceReduction.sources.push({
        source,
        amount: m.itemSpaceReduction,
      });
    }

    // === Reparar Equipamento (Remendo) ===
    if (m.repairEquipment) {
      result.technician.available = true;

      result.technician.repairAbilities.push({
        id: effect.id,
        name: effect.name,
        range: m.repairEquipment.range,
        removeCondition: m.repairEquipment.removeCondition,
        peCost: m.repairEquipment.peCost,
        actionType: m.repairEquipment.actionType,
        source,
      });
    }

    // === Criar Equipamento (Improvisar) ===
    if (m.createEquipment) {
      result.technician.available = true;

      result.technician.createEquipmentAbilities.push({
        id: effect.id,
        name: effect.name,
        type: m.createEquipment.type,
        duration: m.createEquipment.duration,
        destroyedAfter: m.createEquipment.destroyedAfter,
        peCost: m.createEquipment.peCost,
        actionType: m.createEquipment.actionType,
        source,
      });
    }

    // === Retirar Item Retroativamente (Preparado para Tudo) ===
    if (m.retrieveItem) {
      result.technician.available = true;

      result.technician.retrieveItemAbilities.push({
        id: effect.id,
        name: effect.name,
        excludeWeapons: m.retrieveItem.excludeWeapons,
        retroactive: m.retrieveItem.retroactive,
        peCostPerCategory: m.retrieveItem.peCostPerCategory,
        actionType: m.retrieveItem.actionType,
        source,
      });
    }

    // =====================================================
    // RITUAIS - Processa mecânicas específicas de rituais
    // =====================================================

    // Bônus de DT geral
    if (m.ritualDTBonus) {
      result.rituals.dtBonus += m.ritualDTBonus;
      result.rituals.breakdown.push({ source, effect: `+${m.ritualDTBonus} DT em rituais` });
    }

    // Bônus de DT por elemento
    if (m.ritualDTBonusByElement) {
      for (const [element, bonus] of Object.entries(m.ritualDTBonusByElement)) {
        result.rituals.dtBonusByElement[element] =
          (result.rituals.dtBonusByElement[element] || 0) + bonus!;
        result.rituals.breakdown.push({ source, effect: `+${bonus} DT rituais de ${element}` });
      }
    }

    // Bônus de dano/cura fixo
    if (m.ritualDamageBonus) {
      result.rituals.damageBonus += m.ritualDamageBonus;
      result.rituals.breakdown.push({ source, effect: `+${m.ritualDamageBonus} dano/cura rituais` });
    }

    // Bônus de dano/cura baseado em atributo (último ganha)
    if (m.ritualDamageAttributeBonus) {
      result.rituals.damageAttributeBonus = m.ritualDamageAttributeBonus;
      result.rituals.breakdown.push({
        source,
        effect: `+${m.ritualDamageAttributeBonus.toUpperCase()} em dano/cura de rituais`
      });
    }

    // Redução de PE geral
    if (m.ritualPEReduction) {
      result.rituals.peReduction += m.ritualPEReduction;
      result.rituals.breakdown.push({ source, effect: `-${m.ritualPEReduction} PE em rituais` });
    }

    // Redução de PE por elemento
    if (m.ritualPEReductionByElement) {
      for (const [element, reduction] of Object.entries(m.ritualPEReductionByElement)) {
        result.rituals.peReductionByElement[element] =
          (result.rituals.peReductionByElement[element] || 0) + reduction!;
        result.rituals.breakdown.push({ source, effect: `-${reduction} PE rituais de ${element}` });
      }
    }

    // Redução de PE por alcance
    if (m.ritualPEReductionByRange) {
      for (const [range, reduction] of Object.entries(m.ritualPEReductionByRange)) {
        result.rituals.peReductionByRange[range] =
          (result.rituals.peReductionByRange[range] || 0) + reduction!;
        result.rituals.breakdown.push({ source, effect: `-${reduction} PE rituais de alcance ${range}` });
      }
    }

    // =====================================================
    // FASE 3: SUPORTE - Mecânicas de Médico de Campo e Resgate
    // =====================================================

    // === Movimento Livre para Aliado (Resgate) ===
    if (m.freeMovementTo) {
      result.support.available = true;
      result.support.freeMovement.available = true;
      result.support.hasFreeMovementToAlly = true;

      result.support.freeMovement.abilities.push({
        id: effect.id,
        name: effect.name,
        condition: m.freeMovementTo.condition,
        perRound: m.freeMovementTo.perRound,
        source,
      });
    }

    // === Efeitos ao Curar ===
    if (m.onHeal) {
      result.support.available = true;

      const defenseBonus = m.onHeal.targetDefenseBonus ?? 0;

      result.support.onHealEffects.push({
        id: effect.id,
        name: effect.name,
        targetDefenseBonus: defenseBonus,
        duration: m.onHeal.duration,
        turns: m.onHeal.turns,
        source,
      });

      // Atualiza máximo bônus de defesa ao curar
      if (defenseBonus > result.support.maxDefenseBonusOnHeal) {
        result.support.maxDefenseBonusOnHeal = defenseBonus;
      }
    }

    // === Remoção de Condição (Equipe de Trauma) ===
    if (m.removeCondition) {
      result.support.available = true;
      result.support.canRemoveConditions = true;

      result.support.removeConditionAbilities.push({
        id: effect.id,
        name: effect.name,
        range: m.removeCondition.range,
        excludedConditions: m.removeCondition.excludedConditions,
        peCost: m.removeCondition.peCost,
        actionType: m.removeCondition.actionType,
        source,
      });
    }

    // === Ressurreição (Reanimação) ===
    if (m.resurrect) {
      result.support.available = true;
      result.support.canResurrect = true;

      result.support.resurrectAbilities.push({
        id: effect.id,
        name: effect.name,
        excludedDeathTypes: m.resurrect.excludedDeathTypes,
        sameSceneOnly: m.resurrect.sameSceneOnly,
        usesPerScene: m.resurrect.usesPerScene,
        peCost: m.resurrect.peCost,
        actionType: m.resurrect.actionType,
        hpRestored: m.resurrect.hpRestored,
        source,
      });
    }

    // =====================================================
    // FASE 4: INFILTRADOR AVANÇADO - Bônus de Furtividade
    // =====================================================

    // === Remove/Reduz Penalidade de Furtividade ao Mover ===
    if (m.stealthMovementPenalty) {
      if (m.stealthMovementPenalty.removes) {
        result.sneakAttack.stealthBonuses.removesMovementPenalty = true;
      }
      if (m.stealthMovementPenalty.reducesBy) {
        result.sneakAttack.stealthBonuses.reducesMovementPenaltyBy = Math.max(
          result.sneakAttack.stealthBonuses.reducesMovementPenaltyBy,
          m.stealthMovementPenalty.reducesBy
        );
      }
      result.sneakAttack.stealthBonuses.sources.push(source);
    }

    // === Multiplicador de Ataque Furtivo (Assassinar) ===
    if (m.sneakAttackMultiplier) {
      // Maior multiplicador ganha
      if (m.sneakAttackMultiplier > result.sneakAttack.multiplier) {
        result.sneakAttack.multiplier = m.sneakAttackMultiplier;
      }
      // Recalcula total de dados
      result.sneakAttack.totalDice = result.sneakAttack.baseDice * result.sneakAttack.multiplier;
    }

    // === Ignora Penalidades de Furtividade ===
    if (m.ignoreStealthPenalty) {
      if (m.ignoreStealthPenalty.movementPenalty) {
        result.sneakAttack.stealthBonuses.removesMovementPenalty = true;
      }
      if (m.ignoreStealthPenalty.armorPenalty) {
        result.sneakAttack.stealthBonuses.ignoresArmorPenalty = true;
      }
      if (m.ignoreStealthPenalty.allPenalties) {
        result.sneakAttack.stealthBonuses.ignoresAllPenalties = true;
        result.sneakAttack.stealthBonuses.removesMovementPenalty = true;
        result.sneakAttack.stealthBonuses.ignoresArmorPenalty = true;
      }
      result.sneakAttack.stealthBonuses.sources.push(source);
    }

    // =====================================================
    // FASE 5: OCULTISTA AVANÇADO - Mecânicas Paranormais
    // =====================================================

    // === Rituais Bônus (Saber Ampliado) ===
    if (m.bonusRituals) {
      result.occultist.available = true;

      // Soma rituais por círculo
      result.occultist.bonusRituals.perCircle += m.bonusRituals.perCircle;

      // Ignora limite se qualquer fonte ignorar
      if (m.bonusRituals.ignoresLimit) {
        result.occultist.bonusRituals.ignoresLimit = true;
      }

      // Merge restrições de círculo
      if (m.bonusRituals.circleRestriction) {
        for (const circle of m.bonusRituals.circleRestriction) {
          if (!result.occultist.bonusRituals.circleRestrictions.includes(circle)) {
            result.occultist.bonusRituals.circleRestrictions.push(circle);
          }
        }
      }

      result.occultist.bonusRituals.sources.push(source);
    }

    // === Grimório (Graduado) ===
    if (m.paranormalResistanceTestBonus) {
      result.occultist.available = true;
      result.occultist.paranormalResistanceTestBonus += m.paranormalResistanceTestBonus;
    }
    if (m.hpCostPerPE) {
      result.occultist.available = true;
      result.occultist.hpCostPerPE = m.hpCostPerPE;
    }
    if (m.grimoire) {
      result.occultist.available = true;
      result.occultist.grimoire.available = true;
      result.occultist.grimoire.maxRituals = m.grimoire.maxRituals;
      result.occultist.grimoire.allowedCircles = m.grimoire.allowedCircles;
      result.occultist.grimoire.bonusPerNewCircle = m.grimoire.bonusPerNewCircle;
      result.occultist.grimoire.castingAction = m.grimoire.castingAction;
      result.occultist.grimoire.preparationAction = m.grimoire.preparationAction;
      result.occultist.grimoire.requiresWielding = m.grimoire.requiresWielding;
      result.occultist.grimoire.inventorySlots = m.grimoire.inventorySlots;
      result.occultist.grimoire.source = source;
    }

    // === Bônus de Poder de Ritual ===
    if (m.ritualPowerBonus) {
      result.occultist.available = true;

      if (m.ritualPowerBonus.addPELimit) {
        result.occultist.ritualPowerBonus.addPELimit = true;
      }
      if (m.ritualPowerBonus.affectsDT) {
        result.occultist.ritualPowerBonus.affectsDT = true;
      }
      if (m.ritualPowerBonus.affectsDamage) {
        result.occultist.ritualPowerBonus.affectsDamage = true;
      }

      result.occultist.ritualPowerBonus.sources.push(source);
    }

    // === Atributo Adicional ao Limite de PE ===
    if (m.addAttributeToPELimit) {
      result.occultist.available = true;

      if (!result.occultist.additionalPELimitAttributes.includes(m.addAttributeToPELimit)) {
        result.occultist.additionalPELimitAttributes.push(m.addAttributeToPELimit);
      }
    }

    // === Restrição de Recuperação de PV ===
    if (m.hpRecoveryRestriction && m.hpRecoveryRestriction !== 'none') {
      result.occultist.available = true;

      // Restrição mais severa ganha (magic-only > rest-only > none)
      const severityOrder = { 'none': 0, 'rest-only': 1, 'magic-only': 2 };
      const currentSeverity = severityOrder[result.occultist.hpRecoveryRestriction];
      const newSeverity = severityOrder[m.hpRecoveryRestriction];

      if (newSeverity > currentSeverity) {
        result.occultist.hpRecoveryRestriction = m.hpRecoveryRestriction;
      }
    }

    // === RD Paranormal com Teste ===
    if (m.paranormalDamageTest) {
      result.occultist.available = true;
      result.occultist.paranormalDamageTest.available = true;

      result.occultist.paranormalDamageTest.abilities.push({
        id: effect.id,
        name: effect.name,
        testSkill: m.paranormalDamageTest.testSkill,
        onSuccess: m.paranormalDamageTest.onSuccess,
        onFailure: m.paranormalDamageTest.onFailure,
        dtType: m.paranormalDamageTest.dtType,
        requiresExistingHalfDamageSave: m.paranormalDamageTest.requiresExistingHalfDamageSave,
        fixedDT: m.paranormalDamageTest.fixedDT,
        source,
      });
    }
  }

  return result;
}

/**
 * Cria um contexto de cálculo padrão a partir de dados básicos
 */
export function createDefaultContext(params: {
  attributes: Record<AttributeType, number>;
  nex: number;
  hpCurrent: number;
  hpMax: number;
  peCurrent: number;
  peMax: number;
  activeConditions?: string[];
  activatedEffects?: string[];
  inCombat?: boolean;
  equippedWeaponType?: string;
  equippedArmorType?: string;
  hasShield?: boolean;
}): EffectCalculationContext {
  return {
    attributes: params.attributes,
    nex: params.nex,
    hpCurrent: params.hpCurrent,
    hpMax: params.hpMax,
    peCurrent: params.peCurrent,
    peMax: params.peMax,
    inCombat: params.inCombat ?? false,
    isFirstRound: false,
    currentRound: 0,
    equippedWeaponType: params.equippedWeaponType,
    equippedArmorType: params.equippedArmorType,
    hasShield: params.hasShield ?? false,
    activeConditions: params.activeConditions ?? [],
    activatedEffects: params.activatedEffects ?? [],
  };
}
