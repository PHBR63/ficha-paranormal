/**
 * Ordem Paranormal RPG - Suplemento Sobrevivendo ao Horror
 * Novas Origens do Suplemento + Expansões
 * 
 * Origens adicionais para personagens
 */

export interface SupplementOrigin {
  id: string;
  name: string;
  description: string;
  skills: string[];
  powers: string[];
  powerDescription: string;
  isAmnesic?: boolean;
  sanityModifier?: number;
}

// ==================== NOVAS ORIGENS (EXPANSÕES / PÁGINAS EXTRAS) ====================

export const SUPPLEMENT_ORIGINS: SupplementOrigin[] = [
  {
    id: 'amigo-dos-animais',
    name: 'Amigo dos Animais',
    description: 'Você tem uma conexão especial com animais e possui um companheiro leal.',
    skills: ['adestramento', 'percepcao'],
    powers: ['Companheiro Animal'],
    powerDescription: 'Você possui um animal treinado como aliado.',
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    description: 'Você foi treinado para explorar o espaço e sobreviver em condições extremas.',
    skills: ['ciencias', 'fortitude'],
    powers: ['Acostumado ao Extremo'],
    powerDescription: 'Resistência a condições extremas.',
  },
  {
    id: 'chef-do-outro-lado',
    name: 'Chef do Outro Lado',
    description: 'Você é um cozinheiro que descobriu como usar ingredientes paranormais em suas receitas.',
    skills: ['ocultismo', 'profissao'],
    powers: ['Fome do Outro Lado'],
    powerDescription: 'Alimentações causam efeitos paranormais positivos.',
  },
  {
    id: 'colegial',
    name: 'Colegial',
    description: 'Você é um estudante que foi envolvido no paranormal antes de terminar os estudos.',
    skills: ['atualidades', 'tecnologia'],
    powers: ['Poder da Amizade'],
    powerDescription: 'Interação social mais eficaz com aliados próximos.',
  },
  {
    id: 'cosplayer',
    name: 'Cosplayer',
    description: 'Você é especialista em criar e vestir fantasias elaboradas de personagens.',
    skills: ['artes', 'vontade'],
    powers: ['Não é fantasia, é cosplay!'],
    powerDescription: '+5 ao interpretar papéis ou disfarces.',
  },
  {
    id: 'diplomata',
    name: 'Diplomata',
    description: 'Você trabalha com relações internacionais e tem contatos em diversos lugares.',
    skills: ['atualidades', 'diplomacia'],
    powers: ['Conexões'],
    powerDescription: 'Você conhece alguém relevante em quase qualquer lugar.',
  },
  {
    id: 'explorador',
    name: 'Explorador',
    description: 'Você é um aventureiro que desbrava locais remotos e perigosos.',
    skills: ['fortitude', 'sobrevivencia'],
    powers: ['Manual do Sobrevivente'],
    powerDescription: 'Vantagens maiores no uso de kits de sobrevivência.',
  },
  {
    id: 'experimento',
    name: 'Experimento',
    description: 'Você foi submetido a experimentos que alteraram seu corpo de formas estranhas.',
    skills: ['atletismo', 'fortitude'],
    powers: ['Mutação'],
    powerDescription: 'Ganha característica física especial.',
  },
  {
    id: 'fanatico-por-criaturas',
    name: 'Fanático por Criaturas',
    description: 'Você é obcecado por criaturas paranormais e coleciona informações sobre elas.',
    skills: ['investigacao', 'ocultismo'],
    powers: ['Conhecimento Oculto'],
    powerDescription: '+5 em Ocultismo para identificar criaturas; +2 contra essa criatura até o fim da missão.',
  },
  {
    id: 'fotografo',
    name: 'Fotógrafo',
    description: 'Você captura momentos através das lentes e tem um olho treinado para detalhes.',
    skills: ['artes', 'percepcao'],
    powers: ['Através da Lente'],
    powerDescription: 'Pode gastar 2 PE para +5 em testes envolvendo análise visual e pistas por câmera.',
  },
  {
    id: 'inventor-paranormal',
    name: 'Inventor Paranormal',
    description: 'Você combina engenharia com conhecimento oculto para criar dispositivos únicos.',
    skills: ['profissao', 'vontade'],
    powers: ['Invenção Paranormal'],
    powerDescription: 'Cria um item paranormal que permite ativar ritual de 1º círculo.',
  },
  {
    id: 'jovem-mistico',
    name: 'Jovem Místico',
    description: 'Você sempre teve afinidade com forças místicas e acredita em destino e sorte.',
    skills: ['ocultismo', 'religiao'],
    powers: ['A Culpa é das Estrelas'],
    powerDescription: 'Rola seus "números da sorte" por cena, podendo gerar bônus poderosos.',
  },
  {
    id: 'legista-turno-noite',
    name: 'Legista do Turno da Noite',
    description: 'Você trabalha examinando corpos durante a noite e já viu coisas inexplicáveis.',
    skills: ['ciencias', 'medicina'],
    powers: ['Luto Habitual'],
    powerDescription: 'Pode gastar 2 PE para +5 ao investigar cadáveres ou necropsias.',
  },
  {
    id: 'mateiro',
    name: 'Mateiro',
    description: 'Você conhece a floresta e o interior como a palma da mão.',
    skills: ['percepcao', 'sobrevivencia'],
    powers: ['Mapa Celeste'],
    powerDescription: 'Pode gastar 2 PE para repetir testes de Sobrevivência e escolher o melhor.',
  },
  {
    id: 'mergulhador',
    name: 'Mergulhador',
    description: 'Você é especialista em ambientes aquáticos e exploração subaquática.',
    skills: ['atletismo', 'fortitude'],
    powers: ['Fôlego de Nadador'],
    powerDescription: '+3 PV e pode prender respiração por rodadas = 2× Vigor.',
  },
  {
    id: 'motorista',
    name: 'Motorista',
    description: 'Você é um piloto habilidoso, capaz de conduzir qualquer veículo.',
    skills: ['pilotagem', 'reflexos'],
    powers: ['Mãos no Volante'],
    powerDescription: '+5 ao pilotar se gastar 2 PE.',
  },
  {
    id: 'nerd-entusiasta',
    name: 'Nerd Entusiasta',
    description: 'Você é apaixonado por ciência, tecnologia e cultura geek.',
    skills: ['ciencias', 'tecnologia'],
    powers: ['O Inteligentão'],
    powerDescription: 'Pode usar ação inteira para ganhar 1d10 bônus acumulável (Int mod vezes).',
  },
  {
    id: 'profetizado',
    name: 'Profetizado',
    description: 'Você foi marcado por uma profecia e carrega um destino especial.',
    skills: ['vontade'], // + uma à escolha
    powers: ['Luta ou Fuga'],
    powerDescription: 'Ganha +2 Vontade e +2 PE temporários ao escapar da morte.',
  },
  {
    id: 'psicologo',
    name: 'Psicólogo',
    description: 'Você estuda a mente humana e ajuda pessoas a lidar com traumas.',
    skills: ['intuicao', 'profissao'],
    powers: ['Terapia'],
    powerDescription: 'Pode usar Profissão em vez de Diplomacia; 1x por cena pode fazer aliado repetir teste social.',
  },
];

/**
 * Retorna todas as origens do suplemento
 */
export function getAllSupplementOrigins(): SupplementOrigin[] {
  return SUPPLEMENT_ORIGINS;
}

/**
 * Retorna uma origem pelo ID
 */
export function getSupplementOriginById(id: string): SupplementOrigin | undefined {
  return SUPPLEMENT_ORIGINS.find(origin => origin.id === id);
}