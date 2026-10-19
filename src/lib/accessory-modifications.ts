import { SKILLS } from './character-data';

// Tipos de modificação para acessórios
export type AccessoryModification = 'aprimorado' | 'aprimorado_adicional' | 'discreto' | 'funcao_adicional' | 'instrumental';

// Dados de cada modificação
export interface AccessoryModificationData {
  id: AccessoryModification;
  name: string;
  description: string;
  effect: string;
  spaceModifier?: number;
}

// Tabela 3.9: Modificações para Acessórios
export const ACCESSORY_MODIFICATIONS: AccessoryModificationData[] = [
  {
    id: 'aprimorado',
    name: 'Aprimorado',
    description: 'Aumenta o bônus da função principal para +5. Não acumula com outra aplicação na mesma função.',
    effect: 'Aumenta um dos bônus em perícia para +5.',
  },
  {
    id: 'aprimorado_adicional',
    name: 'Aprimorado — função adicional',
    description: 'Exceção do Livro Base: aumenta o bônus da Função Adicional para +5; exige essa função instalada ou selecionada.',
    effect: 'Aumenta o bônus da função adicional para +5.',
  },
  {
    id: 'discreto',
    name: 'Discreto',
    description: 'O item é miniaturizado ou disfarçado como outro item inócuo (como um relógio). Reduz o número de espaços ocupados em 1, fornece +5 em testes de Crime para ser ocultado e permite que você faça esse teste mesmo que não seja treinado na perícia.',
    effect: '+5 em testes de ocultar e reduz o espaço em -1.',
    spaceModifier: -1,
  },
  {
    id: 'funcao_adicional',
    name: 'Função Adicional',
    description: 'O acessório fornece +2 em uma perícia adicional à sua escolha, sujeita à aprovação do mestre.',
    effect: 'Concede +2 a uma perícia adicional.',
  },
  {
    id: 'instrumental',
    name: 'Instrumental',
    description: 'O acessório pode ser usado como um kit de perícia específico (escolhido ao aplicar esta modificação).',
    effect: 'O acessório funciona como um kit de perícia.',
  },
];

export interface AccessoryConfiguration {
  primarySkill?: string;
  additionalSkill?: string;
  kitSkill?: string;
}

const bonusSkills = new Set(SKILLS.filter(s => !['luta', 'pontaria'].includes(s.id)).map(s => s.id));
/** Perícias com kit próprio no catálogo atual; compartilhadas com a seleção do item. */
export const KIT_SKILL_IDS = ['crime', 'enganacao', 'medicina', 'tecnologia'] as const;
const kitSkills = new Set<string>(KIT_SKILL_IDS);

/** Valida escolhas e a exceção de Aprimorado antes de gravar; retorna um aviso claro. */
export function validateAccessoryModifications(
  modifications: readonly AccessoryModification[], configuration: AccessoryConfiguration, catalogId?: string,
): string | null {
  if (modifications.some(id => !ACCESSORY_MODIFICATIONS.some(mod => mod.id === id))) return 'Modificação de acessório desconhecida.';
  if (modifications.includes('aprimorado_adicional') && !modifications.includes('funcao_adicional')) return 'Aprimorado da função adicional exige Função Adicional.';
  if (catalogId === 'kit_pericia' && modifications.includes('aprimorado')) return 'Um kit não concede bônus principal para Aprimorado. Use Função Adicional e aprimore essa função.';
  if (modifications.includes('aprimorado') && !bonusSkills.has(configuration.primarySkill ?? '')) return 'Aprimorado exige escolher a perícia principal beneficiada.';
  if (['utensilio', 'vestimenta'].includes(catalogId ?? '') && !bonusSkills.has(configuration.primarySkill ?? '')) return 'Escolha a perícia principal, exceto Luta e Pontaria.';
  if (modifications.includes('funcao_adicional') && !bonusSkills.has(configuration.additionalSkill ?? '')) return 'Escolha a perícia de Função Adicional, exceto Luta e Pontaria.';
  if (modifications.includes('funcao_adicional') && configuration.additionalSkill === configuration.primarySkill) return 'Função Adicional deve beneficiar outra perícia.';
  if (modifications.includes('instrumental') && !kitSkills.has(configuration.kitSkill ?? '')) return 'Escolha o kit de perícia para Instrumental.';
  return null;
}

/** Retorna os bônus previstos de cada função, sem conceder aprovação nem ativar o item. */
export function calculateAccessorySkillBonuses(modifications: readonly AccessoryModification[], configuration: AccessoryConfiguration): Record<string, number> {
  const bonuses: Record<string, number> = {};
  if (configuration.primarySkill && bonusSkills.has(configuration.primarySkill)) bonuses[configuration.primarySkill] = modifications.includes('aprimorado') ? 5 : 2;
  if (modifications.includes('funcao_adicional') && configuration.additionalSkill && bonusSkills.has(configuration.additionalSkill)) bonuses[configuration.additionalSkill] = modifications.includes('aprimorado_adicional') ? 5 : 2;
  return bonuses;
}
