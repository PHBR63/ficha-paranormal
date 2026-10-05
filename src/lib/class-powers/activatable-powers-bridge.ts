/**
 * Bridge entre o sistema de poderes de classe e o sistema de ativação
 * 
 * Conecta os poderes de Especialista e Combatente com o
 * PowerActivationPanel usado no DiceRollModal.
 * 
 * @module activatable-powers-bridge
 */

import type { ActivatablePower } from '@/components/dice/PowerActivationPanel';
import { ESPECIALISTA_POWERS } from './especialista-powers';
import { COMBATENTE_POWERS } from './combatente-powers';
import { getPeritoExtraDice, getEcleticoLevel } from '@/components/dice/PowerActivationPanel';
import { resolveScalingValue } from './power-effects-engine';

// ========================================
// TIPOS
// ========================================

interface CharacterPowerContext {
  powers: Array<{ id?: string; name: string }> | string[];
  abilities: string[];
  nex: number;
  peCurrent: number;
  intellect: number;
  // Perícias treinadas do personagem (para verificar Perito)
  trainedSkills?: string[];
  // Perícias escolhidas para Perito
  peritoSkills?: string[];
  // Classe do personagem
  characterClass?: string;
  // Trilha do personagem (para poderes de trilha ativáveis)
  classTrack?: string;
  // Origem do personagem (para poderes de origem ativáveis como "Saber é Poder")
  origin?: string;
  // Atributo sendo testado (para filtrar poderes aplicáveis por atributo)
  testedAttribute?: 'strength' | 'agility' | 'vigor' | 'intellect' | 'presence';
}

// ========================================
// MAPEAMENTO DE PODERES LEGADOS
// ========================================

/**
 * Mapeia nomes de poderes/habilidades para IDs unificados
 */
const LEGACY_ABILITY_TO_POWER_ID: Record<string, string> = {
  // Especialista
  'conhecimento aplicado': 'conhecimento-aplicado',
  'mãos rápidas': 'maos-rapidas',
  'maos rapidas': 'maos-rapidas',
  'nerd': 'nerd',
  'eclético': 'ecletico',
  'ecletico': 'ecletico',
  'perito': 'perito',
  'ninja urbano': 'ninja-urbano',
  'balística avançada': 'balistica-avancada',
  'balistica avancada': 'balistica-avancada',
  // Combatente
  'ataque especial': 'ataque-especial',
  'incansável': 'incansavel',
  'incansavel': 'incansavel',
  'sentido tático': 'sentido-tatico',
  'sentido tatico': 'sentido-tatico',
  'avanço tático': 'avanco-tatico',
  'avanco tatico': 'avanco-tatico',
  'ímpeto': 'impeto',
  'impeto': 'impeto',
  'tiro de cobertura': 'tiro-de-cobertura',
  'pancada revigorante': 'pancada-revigorante',
  'ataque de oportunidade': 'ataque-de-oportunidade',
  // Novos poderes de Combatente (Fase 5B)
  'combate defensivo': 'combate-defensivo',
  'combater com duas armas': 'combater-duas-armas',
  'golpe pesado': 'golpe-pesado',
  'golpe demolidor': 'golpe-demolidor',
  'segurar o gatilho': 'segurar-gatilho',
  'segurar gatilho': 'segurar-gatilho',
  'artista marcial': 'artista-marcial',
  'reflexos defensivos': 'reflexos-defensivos',
};

/**
 * Normaliza string para comparação
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica se o personagem possui um poder/habilidade
 */
export function hasPowerOrAbility(
  powers: Array<{ id?: string; name: string }> | string[],
  abilities: string[],
  targetId: string,
  targetName?: string
): boolean {
  // Verifica nas habilidades (formato legado)
  const hasAbility = abilities.some(ability => {
    const normalizedAbility = normalizeString(ability);
    const mappedId = LEGACY_ABILITY_TO_POWER_ID[normalizedAbility];
    return mappedId === targetId || normalizedAbility === normalizeString(targetName || targetId);
  });
  
  if (hasAbility) return true;
  
  // Verifica nos poderes
  return powers.some(power => {
    if (typeof power === 'string') {
      const normalizedPower = normalizeString(power);
      const mappedId = LEGACY_ABILITY_TO_POWER_ID[normalizedPower];
      return mappedId === targetId || normalizedPower === normalizeString(targetName || targetId);
    }
    return power.id === targetId || 
           normalizeString(power.name) === normalizeString(targetName || targetId);
  });
}

// ========================================
// HELPERS DO COMBATENTE
// ========================================

/**
 * Calcula o tier de Ataque Especial baseado no NEX
 * Retorna o custo MÁXIMO de PE, bônus total e incrementos disponíveis
 * 
 * Nota: O custo real é dinâmico (2 PE para 1º incremento, +1 PE por adicional).
 * Use calculateDynamicPECost() de special-attack-utils.ts para custo real.
 */
export function getAtaqueEspecialTier(nex: number): { maxCost: number; maxBonus: number; increments: number } {
  if (nex >= 85) return { maxCost: 5, maxBonus: 20, increments: 4 };
  if (nex >= 55) return { maxCost: 4, maxBonus: 15, increments: 3 };
  if (nex >= 25) return { maxCost: 3, maxBonus: 10, increments: 2 };
  return { maxCost: 2, maxBonus: 5, increments: 1 };
}

// ========================================
// FUNÇÕES PRINCIPAIS
// ========================================

/**
 * Retorna os poderes ativáveis disponíveis para o personagem
 * baseado em seus poderes/habilidades e classe
 */
export function getActivatablePowersForCharacter(
  context: CharacterPowerContext
): ActivatablePower[] {
  const { powers, abilities, nex, peritoSkills, characterClass, classTrack, origin, testedAttribute } = context;
  const activatable: ActivatablePower[] = [];
  
  // ==================== ORIGENS ====================
  
  // Saber é Poder (Acadêmico) - só aparece em testes de Intelecto
  const normalizedOrigin = origin?.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim() || '';
  const isAcademico = normalizedOrigin === 'academico' || normalizedOrigin === 'acadêmico';
  const isIntellectTest = testedAttribute === 'intellect';
  
  if (isAcademico && isIntellectTest) {
    activatable.push({
      id: 'saber-e-poder',
      name: 'Saber é Poder',
      description: 'Quando faz um teste usando Intelecto, você pode gastar 2 PE para receber +5 nesse teste.',
      peCost: 2,
      effect: '+5 no teste',
      icon: 'book', // Usa 'book' que mapeia para BookOpen no painel
      effectType: 'skill_bonus',
      skillBonus: 5,
    });
  }
  
  // Desbravador (Trabalhador Rural) - só aparece em Adestramento/Sobrevivência
  const isTrabalhadorRural = normalizedOrigin === 'trabalhador rural' || 
                             normalizedOrigin.includes('trabalhador');
  const isDesbravadorApplicable = !testedAttribute || 
    ['adestramento', 'sobrevivencia'].some(skill => {
      // Verifica se estamos em contexto de teste de perícia aplicável
      // O atributo testado não é suficiente, precisamos verificar a perícia atual
      return true; // Deixa aparecer e filtra no PowerActivationPanel via applicableSkills
    });
  
  if (isTrabalhadorRural && isDesbravadorApplicable) {
    activatable.push({
      id: 'desbravador',
      name: 'Desbravador',
      description: 'Quando faz um teste de Adestramento ou Sobrevivência, você pode gastar 2 PE para receber +5 nesse teste. Você ignora penalidade de terreno difícil.',
      peCost: 2,
      effect: '+5 no teste',
      icon: 'trees',
      effectType: 'skill_bonus',
      skillBonus: 5,
      applicableSkills: ['adestramento', 'sobrevivencia'],
    });
  }
  
  // 110% (Atleta) - só aparece em testes de FOR ou AGI (exceto Luta/Pontaria)
  const isAtleta = normalizedOrigin === 'atleta';
  const isStrengthOrAgilityTest = testedAttribute === 'strength' || testedAttribute === 'agility';
  
  if (isAtleta && isStrengthOrAgilityTest) {
    activatable.push({
      id: '110-porcento',
      name: '110%',
      description: 'Quando faz um teste de perícia usando Força ou Agilidade (exceto Luta e Pontaria) você pode gastar 2 PE para receber +5 nesse teste.',
      peCost: 2,
      effect: '+5 no teste',
      icon: 'dumbbell',
      effectType: 'skill_bonus',
      skillBonus: 5,
      excludedSkills: ['luta', 'pontaria'],
    });
  }
  
  // Processo Otimizado (Executivo) - aparece em qualquer teste (contexto de teste estendido)
  const isExecutivo = normalizedOrigin === 'executivo';
  
  if (isExecutivo) {
    activatable.push({
      id: 'processo-otimizado',
      name: 'Processo Otimizado',
      description: 'Sempre que faz um teste de perícia durante um teste estendido, ou uma ação para revisar documentos, pode pagar 2 PE para receber +5 nesse teste.',
      peCost: 2,
      effect: '+5 (teste estendido)',
      icon: 'file-text',
      effectType: 'skill_bonus',
      skillBonus: 5,
      specialNote: 'Apenas em testes estendidos ou revisão de documentos',
    });
  }
  
  // Motor de Busca (T.I.) - substitui qualquer teste por Tecnologia
  const isTI = normalizedOrigin === 'ti' || normalizedOrigin === 't.i.';
  
  if (isTI) {
    activatable.push({
      id: 'motor-de-busca',
      name: 'Motor de Busca',
      description: 'Com acesso à internet, você pode gastar 2 PE para substituir um teste de perícia qualquer por um teste de Tecnologia.',
      peCost: 2,
      effect: 'Usar Tecnologia',
      icon: 'search',
      effectType: 'skill_swap',
      swapToSkill: 'tecnologia',
      specialNote: 'Requer acesso à internet (a critério do mestre)',
    });
  }
  
  // Acalentar (Religioso) - +10 em teste de atributo de aliado adjacente
  const isReligioso = normalizedOrigin === 'religioso';
  
  if (isReligioso) {
    activatable.push({
      id: 'acalentar-aliado',
      name: 'Acalentar (Aliado)',
      description: 'Uma vez por cena, um aliado adjacente recebe +10 em um teste de atributo.',
      peCost: 0,
      effect: '+10 para aliado',
      icon: 'heart-handshake',
      effectType: 'ally_bonus',
      allyBonus: 10,
      usageLimit: 'scene',
      specialNote: 'O bônus é aplicado ao aliado, não a você',
    });
  }
  
  // Impostor (Trambiqueiro) - substitui qualquer teste por Enganação
  const isTrambiqueiro = normalizedOrigin === 'trambiqueiro';
  
  if (isTrambiqueiro) {
    activatable.push({
      id: 'impostor',
      name: 'Impostor',
      description: 'Uma vez por cena, você pode gastar 2 PE para substituir um teste de perícia qualquer por um teste de Enganação.',
      peCost: 2,
      effect: 'Usar Enganação',
      icon: 'mask',
      effectType: 'skill_swap',
      swapToSkill: 'enganacao',
      usageLimit: 'scene',
    });
  }
  
  // ==================== NOVAS ORIGENS ATIVÁVEIS (Fase 3) ====================
  
  // Faro para Pistas (Investigador) - +5 em Investigação/Percepção para procurar pistas
  const isInvestigador = normalizedOrigin === 'investigador';
  
  if (isInvestigador) {
    activatable.push({
      id: 'faro-para-pistas',
      name: 'Faro para Pistas',
      description: 'Quando faz um teste de Investigação ou Percepção para procurar pistas, você pode gastar 1 PE para receber +5 nesse teste.',
      peCost: 1,
      effect: '+5 no teste',
      icon: 'magnifying-glass',
      effectType: 'skill_bonus',
      skillBonus: 5,
      applicableSkills: ['investigacao', 'percepcao'],
      specialNote: 'Apenas para procurar pistas (a critério do mestre)',
    });
  }
  
  // Magnum Opus (Artista) - +5 em Artes/Atuação quando reconhecido
  const isArtista = normalizedOrigin === 'artista';
  
  if (isArtista) {
    activatable.push({
      id: 'magnum-opus',
      name: 'Magnum Opus',
      description: 'Uma vez por missão, quando faz um teste de Artes ou Atuação para alguém que reconhece seu trabalho, pode usar Presença×2 e +5.',
      peCost: 0,
      effect: 'PRE×2 +5',
      icon: 'star',
      effectType: 'skill_bonus',
      skillBonus: 5,
      applicableSkills: ['artes', 'atuacao'],
      usageLimit: 'scene', // Tratamos missão como cena para simplificar rastreamento
      specialNote: '1x/missão. PRE×2 no atributo. Alvo deve reconhecer seu trabalho.',
    });
  }
  
  // Ingrediente Secreto (Chef) - efeito narrativo de interlúdio
  const isChef = normalizedOrigin === 'chef';
  
  if (isChef) {
    activatable.push({
      id: 'ingrediente-secreto',
      name: 'Ingrediente Secreto',
      description: 'Durante um interlúdio, você pode preparar até 2 pratos com efeitos especiais para aliados.',
      peCost: 0,
      effect: '2 pratos especiais',
      icon: 'chef-hat',
      effectType: 'skill_bonus',
      skillBonus: 0,
      applicableSkills: ['profissao'],
      usageLimit: 'scene', // Interlúdio = entre cenas
      specialNote: 'Narrativo. Preparar pratos conforme regras de interlúdio.',
    });
  }
  
  // Posição de Combate (Mercenário) - ação de movimento extra no 1º turno
  const isMercenario = normalizedOrigin === 'mercenario' || normalizedOrigin === 'mercenário';
  
  if (isMercenario) {
    activatable.push({
      id: 'posicao-de-combate',
      name: 'Posição de Combate',
      description: 'No primeiro turno de uma cena de combate, você pode gastar 2 PE para receber uma ação de movimento adicional.',
      peCost: 2,
      effect: '+1 ação movimento',
      icon: 'footprints',
      effectType: 'movement_bonus',
      usageLimit: 'scene',
      specialNote: 'Apenas no 1º turno de combate',
    });
  }
  
  // Espírito Cívico (Servidor Público) - +2 ao ajudar
  const isServidorPublico = normalizedOrigin === 'servidor publico' || 
                            normalizedOrigin === 'servidor público' ||
                            normalizedOrigin.includes('servidor');
  
  if (isServidorPublico) {
    activatable.push({
      id: 'espirito-civico',
      name: 'Espírito Cívico',
      description: 'Quando usa a ação ajudar para auxiliar um teste de um aliado, você pode gastar 1 PE para conceder +2 adicional ao bônus.',
      peCost: 1,
      effect: '+2 extra ao ajudar',
      icon: 'helping-hand',
      effectType: 'ally_bonus',
      allyBonus: 2,
      specialNote: 'Aplicado ao bônus de ajudar (+4 em vez de +2)',
    });
  }
  
  // Patrulha (Policial) - já é passivo (+2 Defesa em lugares e condições) no SUE
  // Mas podemos adicionar um lembrete/toggle para o bônus de Iniciativa
  const isPolicial = normalizedOrigin === 'policial';
  
  if (isPolicial) {
    activatable.push({
      id: 'patrulha-iniciativa',
      name: 'Patrulha (Iniciativa)',
      description: 'Você pode usar Percepção em vez de Agilidade para testes de Iniciativa.',
      peCost: 0,
      effect: 'Usar Percepção',
      icon: 'siren',
      effectType: 'attribute_swap',
      newAttribute: 'presence', // Percepção usa Presença
      applicableSkills: ['iniciativa'],
      specialNote: 'Passivo: +2 Defesa em lugares e condições familiares (automático no SUE)',
    });
  }
  
  // O Crime Compensa (Criminoso) - efeito narrativo de fim de missão
  const isCriminoso = normalizedOrigin === 'criminoso';
  
  if (isCriminoso) {
    activatable.push({
      id: 'o-crime-compensa',
      name: 'O Crime Compensa',
      description: 'No fim de cada missão, você pode fazer um teste de Crime (DT 20). Se passar, recebe um item adicional de até categoria II.',
      peCost: 0,
      effect: 'Item extra',
      icon: 'banknote',
      effectType: 'skill_bonus',
      skillBonus: 0,
      applicableSkills: ['crime'],
      usageLimit: 'scene', // Fim de missão = entre cenas
      specialNote: 'Narrativo. Teste de Crime DT 20 no fim da missão.',
    });
  }
  
  // Traços do Outro Lado (Cultista Arrependido) - poder paranormal grátis na criação
  // Este é um poder de criação, não de ativação, mas podemos mostrar um lembrete
  const isCultistaArrependido = normalizedOrigin === 'cultista arrependido' || 
                                 normalizedOrigin.includes('cultista');
  
  if (isCultistaArrependido) {
    activatable.push({
      id: 'tracos-do-outro-lado',
      name: 'Traços do Outro Lado',
      description: 'Você recebe um poder paranormal de 1º círculo gratuitamente. Seu limite de PE por turno aumenta em +1.',
      peCost: 0,
      effect: 'Poder grátis',
      icon: 'eye',
      effectType: 'passive_reminder',
      specialNote: 'Passivo: +1 limite PE/turno. Poder paranormal 1º círculo grátis na criação.',
    });
  }
  
  // Vislumbres do Passado (Amnésico) - 1x/cena, teste INT DT 10
  const isAmnesico = normalizedOrigin === 'amnesico' || normalizedOrigin === 'amnésico';
  
  if (isAmnesico && isIntellectTest) {
    activatable.push({
      id: 'vislumbres-do-passado',
      name: 'Vislumbres do Passado',
      description: 'Uma vez por cena, teste Intelecto (DT 10). Sucesso: pista do mestre sobre a cena + 1d4 PE temporário.',
      peCost: 0,
      effect: 'Pista + 1d4 PE temp',
      icon: 'brain',
      effectType: 'knowledge_check',
      usageLimit: 'scene',
      specialNote: 'Falha por 5+: Tormenta ataca com medo. O mestre dá a pista.',
    });
  }
  
  // Cicatrizes (Vítima) - usar Vontade no lugar do atributo normal
  const isVitima = normalizedOrigin === 'vitima' || normalizedOrigin === 'vítima';
  
  if (isVitima) {
    activatable.push({
      id: 'cicatrizes-vontade',
      name: 'Cicatrizes (Vontade)',
      description: 'Você pode substituir um teste de atributo por um teste de Vontade. Limite: 1x/cena.',
      peCost: 0,
      effect: 'Usar Vontade',
      icon: 'heart',
      effectType: 'skill_swap',
      swapToSkill: 'vontade',
      usageLimit: 'scene',
      specialNote: 'Funciona para qualquer teste de atributo puro (não perícia)',
    });
  }
  
  // ==================== ESPECIALISTA ====================
  
  // Conhecimento Aplicado
  if (hasPowerOrAbility(powers, abilities, 'conhecimento-aplicado', 'Conhecimento Aplicado')) {
    activatable.push({
      id: 'conhecimento-aplicado',
      name: 'Conhecimento Aplicado',
      description: 'Muda o atributo-base da perícia para Intelecto.',
      peCost: 2,
      effect: 'Usar INT no teste',
      icon: 'brain',
      effectType: 'attribute_swap',
      newAttribute: 'intellect',
      excludedSkills: ['luta', 'pontaria'],
    });
  }
  
  // Mãos Rápidas
  if (hasPowerOrAbility(powers, abilities, 'maos-rapidas', 'Mãos Rápidas')) {
    activatable.push({
      id: 'maos-rapidas',
      name: 'Mãos Rápidas',
      description: 'Faz o teste de Crime como ação livre.',
      peCost: 1,
      effect: 'Ação livre',
      icon: 'hand',
      effectType: 'free_action',
      applicableSkills: ['crime'],
    });
  }
  
  // Nerd
  if (hasPowerOrAbility(powers, abilities, 'nerd', 'Nerd')) {
    activatable.push({
      id: 'nerd',
      name: 'Nerd',
      description: 'Teste de Atualidades (DT 20). Sucesso: pista extra, fraqueza ou informação útil.',
      peCost: 2,
      effect: 'Info extra (1x/cena)',
      icon: 'book',
      effectType: 'knowledge_check',
      applicableSkills: ['atualidades'],
    });
  }
  
  // Eclético (habilidade core do Especialista em NEX 5%)
  // Com Engenhosidade, oferece múltiplos níveis para escolha
  if (hasPowerOrAbility(powers, abilities, 'ecletico', 'Eclético')) {
    const hasEngenhosidade = hasPowerOrAbility(powers, abilities, 'engenhosidade', 'Engenhosidade');
    
    // Nível Treinado (sempre disponível)
    activatable.push({
      id: 'ecletico-treinado',
      name: hasEngenhosidade ? 'Eclético (Treinado)' : 'Eclético',
      description: 'Recebe os benefícios de ser treinado (+5) na perícia.',
      peCost: 2,
      effect: '+5 (treinado)',
      icon: 'zap',
      effectType: 'skill_trained',
      skillBonus: 5,
      excludedSkills: ['luta', 'pontaria'],
    });
    
    // Nível Veterano (requer Engenhosidade + NEX 40%)
    if (hasEngenhosidade && nex >= 40) {
      activatable.push({
        id: 'ecletico-veterano',
        name: 'Eclético (Veterano)',
        description: 'Recebe os benefícios de ser veterano (+10) na perícia.',
        peCost: 4, // 2 base + 2 adicional
        effect: '+10 (veterano)',
        icon: 'zap',
        effectType: 'skill_trained',
        skillBonus: 10,
        excludedSkills: ['luta', 'pontaria'],
      });
    }
    
    // Nível Expert (requer Engenhosidade + NEX 75%)
    if (hasEngenhosidade && nex >= 75) {
      activatable.push({
        id: 'ecletico-expert',
        name: 'Eclético (Expert)',
        description: 'Recebe os benefícios de ser expert (+15) na perícia.',
        peCost: 6, // 2 base + 4 adicional
        effect: '+15 (expert)',
        icon: 'zap',
        effectType: 'skill_trained',
        skillBonus: 15,
        excludedSkills: ['luta', 'pontaria'],
      });
    }
  }
  
  // Perito (habilidade core do Especialista em NEX 5%)
  if (hasPowerOrAbility(powers, abilities, 'perito', 'Perito')) {
    /**
     * Regra oficial (Livro Base v1.3 p.49):
     * - Você pode gastar 2 PE para +1d6.
     * - Conforme o NEX, você pode gastar +1 PE para aumentar o dado (até o limite liberado).
     * 
     * IMPORTANTE: exibimos TODAS as opções disponíveis (2–5 PE) e o usuário escolhe qual ativar ANTES da rolagem.
     */
    const peritoOptions: Array<{ id: string; dice: string; cost: number }> = [
      { id: 'perito-d6', dice: '1d6', cost: 2 },
    ];
    if (nex >= 25) peritoOptions.push({ id: 'perito-d8', dice: '1d8', cost: 3 });
    if (nex >= 55) peritoOptions.push({ id: 'perito-d10', dice: '1d10', cost: 4 });
    if (nex >= 85) peritoOptions.push({ id: 'perito-d12', dice: '1d12', cost: 5 });

    for (const opt of peritoOptions) {
      activatable.push({
        id: opt.id,
        name: `Perito (${opt.dice})`,
        description: `Soma ${opt.dice} ao resultado do teste nas perícias escolhidas.`,
        peCost: opt.cost,
        effect: `+${opt.dice}`,
        icon: 'sparkles',
        effectType: 'extra_dice',
        extraDice: opt.dice,
        applicableSkills: peritoSkills && peritoSkills.length > 0 ? peritoSkills : undefined,
        excludedSkills: ['luta', 'pontaria'],
      });
    }
  }
  
  // ==================== COMBATENTE ====================
  
  // Ataque Especial (habilidade core do Combatente)
  if (hasPowerOrAbility(powers, abilities, 'ataque-especial', 'Ataque Especial') ||
      characterClass === 'Combatente') {
    const tier = getAtaqueEspecialTier(nex);
    
    activatable.push({
      id: 'ataque-especial',
      name: 'Ataque Especial',
      description: `Gaste 2-${tier.maxCost} PE para até +${tier.maxBonus} em ataque E/OU dano (divida entre ambos).`,
      peCost: 2, // Custo mínimo (1 incremento = 2 PE)
      effect: `+5 a +${tier.maxBonus} ataque/dano`,
      icon: 'sword',
      effectType: 'combat_bonus',
      applicableSkills: ['luta', 'pontaria'],
    });
  }
  
  // Incansável (duas opções: Força ou Agilidade)
  // Ação de investigação adicional usando For ou Agi, sem bônus numérico (p. 25).
  if (hasPowerOrAbility(powers, abilities, 'incansavel', 'Incansável')) {
    // Opção 1: Usar Força
    activatable.push({
      id: 'incansavel-forca',
      name: 'Incansável (Força)',
      description: 'Investigação adicional usando Força como atributo-base. 1x/cena.',
      peCost: 2,
      effect: 'Investigação extra, usar FOR',
      icon: 'search',
      effectType: 'attribute_swap',
      newAttribute: 'strength',
      skillBonus: 0,
      applicableSkills: ['atletismo', 'acrobacia', 'furtividade', 'percepcao', 'sobrevivencia'],
    });
    
    // Opção 2: Usar Agilidade
    activatable.push({
      id: 'incansavel-agilidade',
      name: 'Incansável (Agilidade)',
      description: 'Investigação adicional usando Agilidade como atributo-base. 1x/cena.',
      peCost: 2,
      effect: 'Investigação extra, usar AGI',
      icon: 'search',
      effectType: 'attribute_swap',
      newAttribute: 'agility',
      skillBonus: 0,
      applicableSkills: ['atletismo', 'acrobacia', 'furtividade', 'percepcao', 'sobrevivencia'],
    });
  }
  
  // Presteza Atlética (duas opções: Força ou Agilidade)
  // Permite usar For ou Agi ao facilitar investigação; aliado ganha +1d20
  if (hasPowerOrAbility(powers, abilities, 'presteza-atletica', 'Presteza Atlética')) {
    // Opção 1: Usar Força
    activatable.push({
      id: 'presteza-atletica-forca',
      name: 'Presteza Atlética (Força)',
      description: 'Usa Força ao facilitar investigação. Se passar, aliado ganha +1d20.',
      peCost: 1,
      effect: 'FOR + aliado +1d20',
      icon: 'search',
      effectType: 'attribute_swap',
      newAttribute: 'strength',
      applicableSkills: ['atletismo', 'acrobacia', 'furtividade', 'percepcao', 'sobrevivencia', 'investigacao'],
    });
    
    // Opção 2: Usar Agilidade
    activatable.push({
      id: 'presteza-atletica-agilidade',
      name: 'Presteza Atlética (Agilidade)',
      description: 'Usa Agilidade ao facilitar investigação. Se passar, aliado ganha +1d20.',
      peCost: 1,
      effect: 'AGI + aliado +1d20',
      icon: 'search',
      effectType: 'attribute_swap',
      newAttribute: 'agility',
      applicableSkills: ['atletismo', 'acrobacia', 'furtividade', 'percepcao', 'sobrevivencia', 'investigacao'],
    });
  }
  
  // Sentido Tático
  if (hasPowerOrAbility(powers, abilities, 'sentido-tatico', 'Sentido Tático')) {
    activatable.push({
      id: 'sentido-tatico',
      name: 'Sentido Tático',
      description: 'Analisa o ambiente. +INT em Defesa e resistências até fim da cena.',
      peCost: 2,
      effect: '+INT Defesa/Resist',
      icon: 'eye',
      effectType: 'defense_bonus',
      applicableSkills: ['percepcao', 'tatica'],
    });
  }
  
  // Avanço Tático
  if (hasPowerOrAbility(powers, abilities, 'avanco-tatico', 'Avanço Tático')) {
    activatable.push({
      id: 'avanco-tatico',
      name: 'Avanço Tático',
      description: 'Ignora a penalidade de -5 na Defesa ao fazer investida.',
      peCost: 1,
      effect: 'Investida segura',
      icon: 'move',
      effectType: 'defense_bonus',
    });
  }
  
  // Ímpeto
  if (hasPowerOrAbility(powers, abilities, 'impeto', 'Ímpeto')) {
    activatable.push({
      id: 'impeto',
      name: 'Ímpeto',
      description: 'Aumenta seu deslocamento em +3m por uma rodada.',
      peCost: 1,
      effect: '+3m movimento',
      icon: 'zap',
      effectType: 'movement_bonus',
    });
  }
  
  // Tiro de Cobertura
  if (hasPowerOrAbility(powers, abilities, 'tiro-de-cobertura', 'Tiro de Cobertura')) {
    activatable.push({
      id: 'tiro-de-cobertura',
      name: 'Tiro de Cobertura',
      description: 'Força alvo a se proteger. Teste de Pontaria vs Vontade. Efeito de medo.',
      peCost: 1,
      effect: 'Supressão',
      icon: 'target',
      effectType: 'control',
      applicableSkills: ['pontaria'],
    });
  }
  
  // Pancada Revigorante
  if (hasPowerOrAbility(powers, abilities, 'pancada-revigorante', 'Pancada Revigorante')) {
    activatable.push({
      id: 'pancada-revigorante',
      name: 'Pancada Revigorante',
      description: 'Ao acertar corpo a corpo, recebe PV temporários = metade do dano.',
      peCost: 1,
      effect: 'PV temporário',
      icon: 'heart',
      effectType: 'healing',
      applicableSkills: ['luta'],
    });
  }
  
  // Ataque de Oportunidade
  if (hasPowerOrAbility(powers, abilities, 'ataque-de-oportunidade', 'Ataque de Oportunidade')) {
    activatable.push({
      id: 'ataque-de-oportunidade',
      name: 'Ataque de Oportunidade',
      description: 'Ataque corpo a corpo quando inimigo sai de adjacência.',
      peCost: 1,
      effect: 'Reação',
      icon: 'sword',
      effectType: 'reaction',
      applicableSkills: ['luta'],
    });
  }
  
  // Combate Defensivo
  if (hasPowerOrAbility(powers, abilities, 'combate-defensivo', 'Combate Defensivo')) {
    activatable.push({
      id: 'combate-defensivo',
      name: 'Combate Defensivo',
      description: 'Sofre -1d20 em ataques, mas recebe +5 em Defesa até seu próximo turno.',
      peCost: 0,
      effect: '-2 ataque / +5 Defesa',
      icon: 'shield',
      effectType: 'defense_tradeoff',
      applicableSkills: ['luta', 'pontaria'],
    });
  }
  
  // Combater com Duas Armas
  if (hasPowerOrAbility(powers, abilities, 'combater-duas-armas', 'Combater com Duas Armas')) {
    activatable.push({
      id: 'combater-duas-armas',
      name: 'Combater com Duas Armas',
      description: 'Dois ataques (um com cada arma), -1d20 em todos os ataques até próximo turno.',
      peCost: 0,
      effect: '2 ataques (-1d20 cada)',
      icon: 'swords',
      effectType: 'extra_attack',
      applicableSkills: ['luta', 'pontaria'],
    });
  }
  
  // Golpe Pesado (passivo, mas importante destacar)
  if (hasPowerOrAbility(powers, abilities, 'golpe-pesado', 'Golpe Pesado')) {
    activatable.push({
      id: 'golpe-pesado',
      name: 'Golpe Pesado',
      description: 'Dano de arma corpo a corpo aumenta em +1 dado do mesmo tipo.',
      peCost: 0,
      effect: '+1 dado de dano',
      icon: 'anvil',
      effectType: 'damage_bonus',
      applicableSkills: ['luta'],
    });
  }
  
  // Golpe Demolidor
  if (hasPowerOrAbility(powers, abilities, 'golpe-demolidor', 'Golpe Demolidor')) {
    activatable.push({
      id: 'golpe-demolidor',
      name: 'Golpe Demolidor',
      description: 'Acrescenta dois dados do tipo da arma ao quebrar ou atacar um objeto.',
      peCost: 1,
      effect: '+2 dados da arma (objetos)',
      icon: 'hammer',
      effectType: 'damage_bonus',
      applicableSkills: ['luta'],
    });
  }
  
  // Segurar o Gatilho
  if (hasPowerOrAbility(powers, abilities, 'segurar-gatilho', 'Segurar o Gatilho')) {
    activatable.push({
      id: 'segurar-gatilho',
      name: 'Segurar o Gatilho',
      description: 'Ao acertar, pode pagar 2 PE para atacar novamente. Pode repetir se acertar.',
      peCost: 2,
      effect: 'Ataque extra (2 PE)',
      icon: 'crosshair',
      effectType: 'triggered_attack',
      applicableSkills: ['pontaria'],
    });
  }
  
  // Artista Marcial (informativo para dano desarmado)
  if (hasPowerOrAbility(powers, abilities, 'artista-marcial', 'Artista Marcial')) {
    let damageDice = '1d6';
    if (nex >= 70) damageDice = '1d10';
    else if (nex >= 35) damageDice = '1d8';
    
    activatable.push({
      id: 'artista-marcial',
      name: 'Artista Marcial',
      description: `Ataques desarmados causam ${damageDice} de dano e são Ágeis.`,
      peCost: 0,
      effect: `${damageDice} (Ágil)`,
      icon: 'hand-metal',
      effectType: 'damage_bonus',
      applicableSkills: ['luta'],
    });
  }
  
  // Reflexos Defensivos (passivo, mas útil lembrar)
  if (hasPowerOrAbility(powers, abilities, 'reflexos-defensivos', 'Reflexos Defensivos')) {
    activatable.push({
      id: 'reflexos-defensivos',
      name: 'Reflexos Defensivos',
      description: '+2 permanente em Defesa e testes de resistência.',
      peCost: 0,
      effect: '+2 Def/Resist',
      icon: 'shield-check',
      effectType: 'passive_reminder',
    });
  }
  
  // ==================== TRILHAS - OPERAÇÕES ESPECIAIS ====================
  
  // Ataque Extra (Operações Especiais - NEX 40%)
  const isOperacoesEspeciais = classTrack?.toLowerCase().includes('operações especiais') || 
                               classTrack?.toLowerCase().includes('operacoes especiais') ||
                               classTrack?.toLowerCase().includes('operacoes-especiais');
  
  if (isOperacoesEspeciais && nex >= 40) {
    activatable.push({
      id: 'ataque-extra',
      name: 'Ataque Extra',
      description: 'Uma vez por rodada, quando faz um ataque, você pode gastar 2 PE para fazer um ataque adicional.',
      peCost: 2,
      effect: '+1 ataque (1x/rodada)',
      icon: 'swords',
      effectType: 'triggered_attack',
      applicableSkills: ['luta', 'pontaria'],
    });
  }
  
  return activatable;
}

/**
 * Calcula os efeitos mecânicos de ativar um poder
 */
export function calculatePowerActivationEffects(
  powerId: string,
  nex: number,
  intellect: number
): {
  skillBonusChange: number;
  attributeSwap?: 'intellect' | 'agility' | 'strength' | 'presence' | 'vigor';
  extraDice?: string;
  isActionFree?: boolean;
  specialNote?: string;
  attackBonus?: number;
  attackDicePenalty?: number;
  damageBonus?: number;
  defenseBonus?: number;
  movementBonus?: number;
  swapToSkill?: string; // Para Motor de Busca (tecnologia), Impostor (enganacao), Cicatrizes (vontade)
  allyBonus?: number;   // Para Acalentar (+10) e Espírito Cívico (+2)
} {
  switch (powerId) {
    case 'conhecimento-aplicado':
      return {
        skillBonusChange: 0,
        attributeSwap: 'intellect',
        specialNote: 'Atributo trocado para Intelecto',
      };
      
    case 'maos-rapidas':
      return {
        skillBonusChange: 0,
        isActionFree: true,
        specialNote: 'Este teste é uma ação livre',
      };
      
    case 'nerd':
      return {
        skillBonusChange: 0,
        specialNote: 'DT 20 para obter informação extra',
      };
      
    case 'ecletico':
    case 'ecletico-treinado':
      return {
        skillBonusChange: 5,
        specialNote: 'Benefícios de treinado (+5)',
      };
      
    case 'ecletico-veterano':
      return {
        skillBonusChange: 10,
        specialNote: 'Benefícios de veterano (+10)',
      };
      
    case 'ecletico-expert':
      return {
        skillBonusChange: 15,
        specialNote: 'Benefícios de expert (+15)',
      };
      
    // Perito (Especialista) - opções por dado/custo
    // Regra: o jogador escolhe a opção (2–5 PE) ANTES da rolagem.
    case 'perito': // legado (fallback)
    case 'perito-d6':
      return { skillBonusChange: 0, extraDice: '1d6', specialNote: 'Dados extras: 1d6' };
    case 'perito-d8':
      return { skillBonusChange: 0, extraDice: '1d8', specialNote: 'Dados extras: 1d8' };
    case 'perito-d10':
      return { skillBonusChange: 0, extraDice: '1d10', specialNote: 'Dados extras: 1d10' };
    case 'perito-d12':
      return { skillBonusChange: 0, extraDice: '1d12', specialNote: 'Dados extras: 1d12' };
    
    // Combatente
    case 'ataque-especial': {
      const tier = getAtaqueEspecialTier(nex);
      return {
        skillBonusChange: 0,
        attackBonus: tier.maxBonus,
        damageBonus: tier.maxBonus,
        specialNote: `+${tier.maxBonus} para dividir entre ataque e dano (custo dinâmico 2-${tier.maxCost} PE)`,
      };
    }
    
    case 'incansavel':
    case 'incansavel-forca':
      return {
        skillBonusChange: 0,
        attributeSwap: 'strength',
        specialNote: 'Investigação adicional usando Força como atributo-base. 1x/cena.',
      };
      
    case 'incansavel-agilidade':
      return {
        skillBonusChange: 0,
        attributeSwap: 'agility',
        specialNote: 'Investigação adicional usando Agilidade como atributo-base. 1x/cena.',
      };
    
    case 'presteza-atletica-forca':
      return {
        skillBonusChange: 0,
        attributeSwap: 'strength',
        specialNote: 'Usa Força. Se passar, próximo aliado ganha +1d20.',
      };
    
    case 'presteza-atletica-agilidade':
      return {
        skillBonusChange: 0,
        attributeSwap: 'agility',
        specialNote: 'Usa Agilidade. Se passar, próximo aliado ganha +1d20.',
      };
    
    case 'sentido-tatico':
      return {
        skillBonusChange: 0,
        defenseBonus: intellect,
        specialNote: `+${intellect} em Defesa e resistências (Int) até fim da cena`,
      };
    
    case 'avanco-tatico':
      return {
        skillBonusChange: 0,
        defenseBonus: 5, // Anula a penalidade de -5
        specialNote: 'Ignora penalidade de investida',
      };
    
    case 'impeto':
      return {
        skillBonusChange: 0,
        movementBonus: 3,
        specialNote: '+3m de deslocamento por 1 rodada',
      };
    
    case 'tiro-de-cobertura':
      return {
        skillBonusChange: 0,
        specialNote: 'Pontaria vs Vontade do alvo',
      };
    
    case 'pancada-revigorante':
      return {
        skillBonusChange: 0,
        specialNote: 'PV temporários = metade do dano causado',
      };
    
    case 'ataque-de-oportunidade':
      return {
        skillBonusChange: 0,
        specialNote: 'Reação quando inimigo sai de adjacência',
      };
    
    case 'combate-defensivo':
      return {
        skillBonusChange: 0,
        attackDicePenalty: 1,
        defenseBonus: 5,
        specialNote: '-1d20 em ataques, +5 em Defesa até próximo turno',
      };
    
    case 'combater-duas-armas':
      return {
        skillBonusChange: 0,
        attackDicePenalty: 1,
        specialNote: 'Dois ataques com -1d20 cada (arma leve)',
      };
    
    case 'golpe-pesado':
      return {
        skillBonusChange: 0,
        specialNote: '+1 dado de dano (corpo a corpo)',
      };
    
    case 'golpe-demolidor':
      return {
        skillBonusChange: 0,
        extraDice: '2W',
        specialNote: 'Dois dados extras do tipo da arma, somente contra objetos/manobra quebrar',
      };
    
    case 'segurar-gatilho':
      return {
        skillBonusChange: 0,
        specialNote: 'Ataque extra ao acertar (2 PE cada)',
      };
    
    case 'artista-marcial': {
      let dice = '1d6';
      if (nex >= 70) dice = '1d10';
      else if (nex >= 35) dice = '1d8';
      return {
        skillBonusChange: 0,
        specialNote: `Desarmado: ${dice} dano (Ágil)`,
      };
    }
    
    case 'reflexos-defensivos':
      return {
        skillBonusChange: 0,
        defenseBonus: 2,
        specialNote: '+2 Defesa e resistências (passivo)',
      };
    
    // ==================== ORIGENS ====================
    
    case 'saber-e-poder':
      // Acadêmico: +5 em testes de Intelecto por 2 PE
      return {
        skillBonusChange: 5,
        specialNote: '+5 no teste de Intelecto (Saber é Poder)',
      };
    
    case 'desbravador':
      // Trabalhador Rural: +5 em Adestramento ou Sobrevivência
      return {
        skillBonusChange: 5,
        specialNote: '+5 em Adestramento ou Sobrevivência',
      };
    
    case '110-porcento':
      // Atleta: +5 em FOR/AGI (exceto Luta/Pontaria)
      return {
        skillBonusChange: 5,
        specialNote: '+5 no teste (FOR ou AGI, exceto Luta/Pontaria)',
      };
    
    case 'faro-para-pistas':
      // Investigador: +5 em Investigação/Percepção
      return {
        skillBonusChange: 5,
        specialNote: '+5 em Investigação/Percepção para procurar pistas',
      };
    
    case 'processo-otimizado':
      // Executivo: +5 em teste estendido
      return {
        skillBonusChange: 5,
        specialNote: '+5 em teste estendido ou revisão de documentos',
      };
    
    case 'motor-de-busca':
      // T.I.: Substitui perícia por Tecnologia
      return {
        skillBonusChange: 0,
        swapToSkill: 'tecnologia',
        specialNote: 'Substitui perícia por Tecnologia (requer internet)',
      };
    
    case 'impostor':
      // Trambiqueiro: Substitui perícia por Enganação
      return {
        skillBonusChange: 0,
        swapToSkill: 'enganacao',
        specialNote: 'Substitui perícia por Enganação (1x/cena)',
      };
    
    case 'magnum-opus':
      // Artista: PRE×2 no atributo + 5
      return {
        skillBonusChange: 5,
        specialNote: 'PRE×2 no atributo + 5 (1x/missão, alvo reconhece trabalho)',
      };
    
    case 'acalentar-aliado':
      // Religioso: +10 para aliado adjacente
      return {
        skillBonusChange: 0,
        allyBonus: 10,
        specialNote: '+10 em teste de atributo para aliado adjacente (1x/cena)',
      };
    
    case 'espirito-civico':
      // Servidor Público: +2 ao ajudar (total +4)
      return {
        skillBonusChange: 0,
        allyBonus: 2,
        specialNote: 'Ajudar dá +4 em vez de +2',
      };
    
    case 'posicao-de-combate':
      // Mercenário: +1 ação de movimento no 1º turno
      return {
        skillBonusChange: 0,
        movementBonus: 1,
        specialNote: '+1 ação de movimento (1º turno de combate)',
      };
    
    case 'patrulha-iniciativa':
      // Policial: Usa Percepção em vez de Agilidade para Iniciativa
      return {
        skillBonusChange: 0,
        attributeSwap: 'presence', // Percepção usa Presença
        specialNote: 'Usa Percepção em vez de Agilidade para Iniciativa',
      };
    
    case 'o-crime-compensa':
      // Criminoso: Efeito narrativo de fim de missão
      return {
        skillBonusChange: 0,
        specialNote: 'Teste de Crime DT 20 para item extra de categoria II',
      };
    
    case 'tracos-do-outro-lado':
      // Cultista Arrependido: Lembrete passivo
      return {
        skillBonusChange: 0,
        specialNote: 'Passivo: +1 limite PE/turno. Poder paranormal 1º círculo grátis.',
      };
    
    case 'vislumbres-do-passado':
      // Amnésico: Teste INT DT 10 para pista + 1d4 PE temp
      return {
        skillBonusChange: 0,
        specialNote: 'Teste INT DT 10: pista do mestre + 1d4 PE temporário',
      };
    
    case 'cicatrizes-vontade':
      // Vítima: Substitui teste de atributo por Vontade
      return {
        skillBonusChange: 0,
        swapToSkill: 'vontade',
        specialNote: 'Substitui teste de atributo por Vontade (1x/cena)',
      };
    
    case 'ingrediente-secreto':
      // Chef: Efeito narrativo de interlúdio
      return {
        skillBonusChange: 0,
        specialNote: 'Narrativo: 2 pratos especiais durante interlúdio',
      };
      
    default:
      return { skillBonusChange: 0 };
  }
}

/**
 * Verifica pré-requisitos para usar um poder ativável
 */
export function checkActivatablePowerPrerequisites(
  powerId: string,
  context: CharacterPowerContext
): { canUse: boolean; reason?: string } {
  // Primeiro tenta achar em Especialista
  let power = ESPECIALISTA_POWERS.find(p => p.id === powerId);
  
  // Se não achou, tenta em Combatente
  if (!power) {
    power = COMBATENTE_POWERS.find(p => p.id === powerId);
  }
  
  if (!power) {
    return { canUse: false, reason: 'Poder não encontrado' };
  }
  
  // Verifica PE - resolve o custo corretamente
  const activation = power.effects?.base?.activation;
  if (activation?.cost !== undefined) {
    const rawCost = activation.cost;
    const peCost: number = typeof rawCost === 'number' 
      ? rawCost 
      : resolveScalingValue(rawCost, context.nex);
    
    if (context.peCurrent < peCost) {
      return { canUse: false, reason: 'PE insuficiente' };
    }
  }
  
  // Verifica atributos
  if (power.prerequisites?.attributes) {
    const reqIntellect = power.prerequisites.attributes.intellect;
    if (typeof reqIntellect === 'number' && context.intellect < reqIntellect) {
      return { 
        canUse: false, 
        reason: `Requer Intelecto ${reqIntellect}` 
      };
    }
  }
  
  return { canUse: true };
}
