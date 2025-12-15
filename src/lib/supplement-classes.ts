/**
 * Ordem Paranormal RPG - Suplemento Sobrevivendo ao Horror
 * Nova Classe: Sobrevivente
 * Novas Trilhas para todas as classes
 */

import { ClassAbility } from './class-abilities';
import { ClassTrack, TrackAbility } from './character-data';

// ==================== NOVA CLASSE: SOBREVIVENTE ====================

export const SOBREVIVENTE_CLASS = {
  id: 'Sobrevivente',
  name: 'Sobrevivente',
  description: 'Você não foi treinado pela Ordem. Sobreviveu ao paranormal na base da sorte, instinto e pura força de vontade. O que você não tem em técnica, compensa em determinação.',
  pvBase: 18,      // PV inicial = 18 + VIG
  pvPerNex: 3,     // +3 PV por NEX
  peBase: 3,       // PE inicial = 3 + PRE
  pePerNex: 3,     // +3 PE por NEX
  sanBase: 15,     // SAN inicial = 15
  sanPerNex: 4,    // +4 SAN por NEX
  freeSkillsBase: 4,  // INT + 4 perícias livres
  proficiencies: ['Armas simples', 'Armas improvisadas'],
  skillRules: {
    mandatory: ['sobrevivencia'],
    choices: [
      { id: 'survival', options: ['fortitude', 'reflexos'], pick: 1, label: 'Fortitude ou Reflexos' },
      { id: 'awareness', options: ['percepcao', 'intuicao'], pick: 1, label: 'Percepção ou Intuição' },
    ],
    freeFormula: 'INT + 4',
  },
  initialAbilities: ['Vontade de Viver', 'Improviso'],
  features: [
    'Resistente a condições adversas',
    'Proficiência com armas improvisadas',
    'Adaptabilidade em situações extremas',
  ],
  tracks: ['Andarilho', 'Marcado', 'Sortudo'],
};

// ==================== HABILIDADES DO SOBREVIVENTE ====================

export const SOBREVIVENTE_ABILITIES: ClassAbility[] = [
  // NEX 5% - Inicial
  { 
    id: 'vontade-viver', 
    name: 'Vontade de Viver', 
    description: 'Quando você seria reduzido a 0 PV, pode gastar 2 PE para ficar com 1 PV em vez disso. Usável uma vez por cena.', 
    minNex: 5, 
    classId: 'Sobrevivente', 
    isCore: true 
  },
  { 
    id: 'improviso', 
    name: 'Improviso', 
    description: 'Você pode usar qualquer objeto como arma improvisada sem penalidade. Armas improvisadas causam 1d6 de dano em suas mãos.', 
    minNex: 5, 
    classId: 'Sobrevivente', 
    isCore: true 
  },
  
  // NEX 10%
  { id: 'acostumado-pior', name: 'Acostumado ao Pior', description: 'Você recebe +2 em testes de Fortitude e resistência a frio e calor 5.', minNex: 10, classId: 'Sobrevivente' },
  { id: 'sempre-alerta', name: 'Sempre Alerta', description: 'Você não pode ser surpreendido e recebe +2 em Iniciativa.', minNex: 10, classId: 'Sobrevivente' },
  { id: 'autodidata', name: 'Autodidata', description: 'Você pode fazer testes de qualquer perícia mesmo sem treinamento, com penalidade de -2.', minNex: 10, classId: 'Sobrevivente' },
  { id: 'cicatrizes', name: 'Cicatrizes', description: 'Suas cicatrizes contam sua história. Você recebe +5 PV máximo permanente.', minNex: 10, classId: 'Sobrevivente' },
  
  // NEX 15%
  { id: 'resistencia-natural', name: 'Resistência Natural', description: 'Você recebe resistência a dano 2 (todos os tipos exceto mental).', minNex: 15, classId: 'Sobrevivente' },
  { id: 'sexto-sentido-sobrevivente', name: 'Sexto Sentido', description: 'Você sente perigo. Recebe +5 em Percepção para detectar armadilhas e emboscadas.', minNex: 15, classId: 'Sobrevivente' },
  
  // NEX 20%
  { id: 'ataque-desesperado', name: 'Ataque Desesperado', description: 'Quando está com menos da metade do PV, seus ataques causam +1d6 de dano.', minNex: 20, classId: 'Sobrevivente', isCore: true },
  { id: 'primeiros-socorros-improvisados', name: 'Primeiros Socorros Improvisados', description: 'Você pode usar qualquer material para tratar ferimentos. Não precisa de kit médico para usar Medicina.', minNex: 20, classId: 'Sobrevivente' },
  { id: 'experiencia-campo', name: 'Experiência de Campo', description: 'Você recebe +2 em Sobrevivência e pode fazer testes de Sobrevivência em ambientes urbanos.', minNex: 20, classId: 'Sobrevivente' },
  
  // NEX 25%
  { id: 'tolerancia-dor-sobrevivente', name: 'Tolerância à Dor', description: 'Você ignora os primeiros 5 pontos de dano de cada ataque.', minNex: 25, classId: 'Sobrevivente' },
  { id: 'escapar-morte', name: 'Escapar da Morte', description: 'Quando falha em um teste de resistência que causaria dano, pode gastar 3 PE para passar em vez disso.', minNex: 25, classId: 'Sobrevivente' },
  
  // NEX 30%
  { id: 'durabilidade', name: 'Durabilidade', description: 'Sua resistência a dano aumenta para 5.', minNex: 30, classId: 'Sobrevivente' },
  { id: 'segundo-folego', name: 'Segundo Fôlego', description: 'Uma vez por cena, você pode gastar uma ação de movimento para recuperar 2d8 PV.', minNex: 30, classId: 'Sobrevivente' },
  
  // NEX 35%
  { id: 'mestre-improviso', name: 'Mestre do Improviso', description: 'Suas armas improvisadas causam 2d6 de dano e têm crítico 19.', minNex: 35, classId: 'Sobrevivente' },
  { id: 'instinto-perigo', name: 'Instinto de Perigo', description: 'Você recebe +5 em Defesa contra ataques de oportunidade e armadilhas.', minNex: 35, classId: 'Sobrevivente' },
  
  // NEX 40%
  { id: 'sobrevivencia-extrema', name: 'Sobrevivência Extrema', description: 'Você não sofre penalidades por fome, sede, falta de sono ou condições climáticas.', minNex: 40, classId: 'Sobrevivente' },
  
  // NEX 45%
  { id: 'vontade-ferro', name: 'Vontade de Ferro', description: 'Você é imune a efeitos de medo e recebe +5 em testes de Vontade.', minNex: 45, classId: 'Sobrevivente' },
  
  // NEX 50%
  { id: 'ainda-de-pe', name: 'Ainda de Pé', description: 'Quando usa Vontade de Viver, você também recupera 2d8 PV.', minNex: 50, classId: 'Sobrevivente', isCore: true },
  { id: 'veterano-horror', name: 'Veterano do Horror', description: 'Você recebe +10 SAN máxima e +5 em todos os testes de SAN.', minNex: 50, classId: 'Sobrevivente' },
  { id: 'arma-mortal', name: 'Arma Mortal', description: 'Qualquer objeto em suas mãos é uma arma mortal. Armas improvisadas causam 3d6 de dano.', minNex: 50, classId: 'Sobrevivente' },
  
  // NEX 55%+
  { id: 'recuperacao-acelerada', name: 'Recuperação Acelerada', description: 'Você recupera 1 PV por rodada fora de combate.', minNex: 55, classId: 'Sobrevivente' },
  { id: 'nao-hoje', name: 'Não Hoje', description: 'Quando seria morto, você pode gastar 10 PE para sobreviver com 1 PV. Usável uma vez por dia.', minNex: 60, classId: 'Sobrevivente' },
  { id: 'imparavel', name: 'Imparável', description: 'Você pode continuar agindo normalmente mesmo com 0 PV ou menos, até chegar a -VIG × 5 PV.', minNex: 65, classId: 'Sobrevivente' },
  
  // NEX 75%
  { id: 'lenda-sobrevivencia', name: 'Lenda da Sobrevivência', description: 'Você é virtualmente impossível de matar. Sua resistência a dano aumenta para 10 e você recupera 2 PV por rodada mesmo em combate.', minNex: 75, classId: 'Sobrevivente', isCore: true },
  
  // NEX 99%
  { id: 'imortal', name: 'Imortal', description: 'Você já deveria ter morrido dezenas de vezes. Uma vez por sessão, quando seria morto, você automaticamente sobrevive com metade do seu PV máximo.', minNex: 99, classId: 'Sobrevivente', isCore: true },
];

// ==================== NOVAS TRILHAS DO SUPLEMENTO ====================

export const SUPPLEMENT_TRACKS: ClassTrack[] = [
  // === TRILHAS DO SOBREVIVENTE ===
  {
    id: 'andarilho',
    name: 'Andarilho',
    classId: 'Sobrevivente',
    description: 'Você vive na estrada, nunca ficando muito tempo em um lugar. Aprendeu a sobreviver com pouco e a encontrar recursos onde outros não veem.',
    abilities: [
      { id: 'viajante', name: 'Viajante', description: 'Você recebe +5 em Sobrevivência e pode encontrar comida, água e abrigo em qualquer ambiente com um teste de Sobrevivência.', minNex: 5, isInitial: true },
      { id: 'mochileiro', name: 'Mochileiro', description: 'Você pode carregar o dobro de itens sem penalidade e sempre encontra o que precisa na sua mochila (itens de categoria 0).', minNex: 25 },
      { id: 'conhecedor-trilhas', name: 'Conhecedor de Trilhas', description: 'Você nunca se perde e pode guiar grupos em segurança. Reduz encontros aleatórios pela metade.', minNex: 50 },
      { id: 'nomade', name: 'Nômade', description: 'Você pode descansar em qualquer lugar como se fosse um local seguro. Recupera PV, PE e SAN normalmente mesmo em ambientes hostis.', minNex: 75 },
      { id: 'mestre-estrada', name: 'Mestre da Estrada', description: 'Você sabe exatamente onde precisa estar. Uma vez por dia, pode "coincidir" de estar em um local conveniente para a trama.', minNex: 99 },
    ],
  },
  {
    id: 'marcado',
    name: 'Marcado',
    classId: 'Sobrevivente',
    description: 'O paranormal deixou marcas em você - físicas e mentais. Mas essas cicatrizes também lhe deram poder.',
    abilities: [
      { id: 'cicatriz-paranormal', name: 'Cicatriz Paranormal', description: 'Você tem uma marca do Outro Lado. Pode sentir presenças paranormais em alcance curto.', minNex: 5, isInitial: true },
      { id: 'dor-familiar', name: 'Dor Familiar', description: 'Você está acostumado com a dor. Ignora os efeitos da condição Debilitado.', minNex: 25 },
      { id: 'afinidade-sombria', name: 'Afinidade Sombria', description: 'Criaturas do Outro Lado hesitam em atacá-lo. Elas sofrem -2 em ataques contra você.', minNex: 50 },
      { id: 'marca-protecao', name: 'Marca de Proteção', description: 'Sua marca o protege. Você recebe resistência a dano paranormal 10.', minNex: 75 },
      { id: 'um-deles', name: 'Um Deles', description: 'Você é parcialmente uma criatura do Outro Lado. Pode se comunicar com entidades e não é atacado automaticamente por elas.', minNex: 99 },
    ],
  },
  {
    id: 'sortudo',
    name: 'Sortudo',
    classId: 'Sobrevivente',
    description: 'Você tem uma sorte absurda. As coisas simplesmente dão certo para você, mesmo quando não deveriam.',
    abilities: [
      { id: 'golpe-sorte', name: 'Golpe de Sorte', description: 'Uma vez por cena, você pode rolar novamente qualquer teste que tenha falhado.', minNex: 5, isInitial: true },
      { id: 'desviar-azar', name: 'Desviar o Azar', description: 'Uma vez por cena, quando você seria atingido por um ataque, pode forçar o atacante a rolar novamente.', minNex: 25 },
      { id: 'sempre-preparado', name: 'Sempre Preparado', description: 'Você "por acaso" tem o item certo. Uma vez por cena, pode declarar que tem um item de categoria I ou menor.', minNex: 50 },
      { id: 'milagre', name: 'Milagre', description: 'Uma vez por sessão, algo "milagroso" acontece para salvá-lo. O Mestre deve criar uma coincidência favorável.', minNex: 75 },
      { id: 'favorito-destino', name: 'Favorito do Destino', description: 'O universo conspira a seu favor. Você pode rolar 3d20 e escolher o melhor resultado em qualquer teste.', minNex: 99 },
    ],
  },

  // === NOVAS TRILHAS DO COMBATENTE ===
  {
    id: 'cacador-monstros',
    name: 'Caçador de Monstros',
    classId: 'Combatente',
    description: 'Você se especializou em caçar e eliminar criaturas do Outro Lado.',
    abilities: [
      { id: 'marca-presa', name: 'Marcar Presa', description: 'Como ação de movimento, você pode marcar uma criatura. Recebe +2 em ataques e +1d6 de dano contra ela até o fim da cena.', minNex: 5, isInitial: true },
      { id: 'conhecer-inimigo', name: 'Conhecer o Inimigo', description: 'Você recebe +5 em testes de Ocultismo para identificar criaturas paranormais e suas fraquezas.', minNex: 25 },
      { id: 'armas-profanas', name: 'Armas Profanas', description: 'Seus ataques ignoram resistência a dano de criaturas do Outro Lado.', minNex: 50 },
      { id: 'cacador-veterano', name: 'Caçador Veterano', description: 'Você causa dano dobrado contra criaturas do Outro Lado com sua presa marcada.', minNex: 75 },
      { id: 'flagelo-outro-lado', name: 'Flagelo do Outro Lado', description: 'Criaturas do Outro Lado sentem sua presença e temem você. Sofrem -4 em ataques contra você e -2 em testes de resistência contra seus ataques.', minNex: 99 },
    ],
  },
  {
    id: 'protetor',
    name: 'Protetor',
    classId: 'Combatente',
    description: 'Você se dedica a proteger os outros, mesmo que isso signifique se sacrificar.',
    abilities: [
      { id: 'escudo-humano', name: 'Escudo Humano', description: 'Você pode usar sua reação para receber um ataque direcionado a um aliado adjacente.', minNex: 5, isInitial: true },
      { id: 'presenca-protetora', name: 'Presença Protetora', description: 'Aliados adjacentes recebem +2 em Defesa.', minNex: 25 },
      { id: 'sacrificio', name: 'Sacrifício', description: 'Quando um aliado seria reduzido a 0 PV, você pode gastar PV igual ao dano para impedir.', minNex: 50 },
      { id: 'guardiao', name: 'Guardião', description: 'Você pode fazer ataques de oportunidade contra qualquer inimigo que ataque um aliado adjacente.', minNex: 75 },
      { id: 'bastiao', name: 'Bastião', description: 'Aliados em alcance curto são considerados adjacentes para suas habilidades de proteção. Todos recebem +4 em Defesa.', minNex: 99 },
    ],
  },

  // === NOVAS TRILHAS DO ESPECIALISTA ===
  {
    id: 'analista-cena',
    name: 'Analista de Cena',
    classId: 'Especialista',
    description: 'Você é especialista em analisar cenas de crime e reconstruir eventos.',
    abilities: [
      { id: 'olho-detalhe', name: 'Olho para Detalhes', description: 'Você recebe +5 em Investigação e Percepção para analisar cenas e encontrar pistas.', minNex: 5, isInitial: true },
      { id: 'reconstruir-eventos', name: 'Reconstruir Eventos', description: 'Ao analisar uma cena, você pode "ver" os eventos que ocorreram nas últimas 24 horas.', minNex: 25 },
      { id: 'nada-escapa', name: 'Nada Escapa', description: 'Você automaticamente encontra todas as pistas físicas em uma cena, sem precisar de teste.', minNex: 50 },
      { id: 'perfil-criminoso', name: 'Perfil do Criminoso', description: 'Ao analisar pistas, você pode determinar características do culpado (idade aproximada, altura, hábitos, etc).', minNex: 75 },
      { id: 'visao-retrospectiva', name: 'Visão Retrospectiva', description: 'Uma vez por missão, você pode ter uma visão completa dos eventos que ocorreram em um local.', minNex: 99 },
    ],
  },
  {
    id: 'perito-criminal',
    name: 'Perito Criminal',
    classId: 'Especialista',
    description: 'Você é um especialista forense, capaz de analisar evidências com precisão científica.',
    abilities: [
      { id: 'analise-forense', name: 'Análise Forense', description: 'Você pode analisar substâncias, materiais e amostras biológicas com +5 em Ciências.', minNex: 5, isInitial: true },
      { id: 'balistica', name: 'Balística', description: 'Você pode determinar o tipo de arma, distância do disparo e trajetória de projéteis.', minNex: 25 },
      { id: 'toxicologia', name: 'Toxicologia', description: 'Você pode identificar venenos, drogas e substâncias químicas, e determinar doses e efeitos.', minNex: 50 },
      { id: 'dna-tracking', name: 'Rastreamento de DNA', description: 'Com uma amostra biológica, você pode rastrear a pessoa em bancos de dados da Ordem.', minNex: 75 },
      { id: 'ciencia-impossivel', name: 'Ciência do Impossível', description: 'Você pode analisar até mesmo fenômenos paranormais com métodos científicos, ganhando +10 em Ocultismo para entender eventos.', minNex: 99 },
    ],
  },

  // === NOVAS TRILHAS DO OCULTISTA ===
  {
    id: 'ritualista-campo',
    name: 'Ritualista de Campo',
    classId: 'Ocultista',
    description: 'Você adapta rituais para uso prático em campo, tornando-os mais rápidos e eficientes.',
    abilities: [
      { id: 'ritual-rapido', name: 'Ritual Rápido', description: 'Rituais com execução "Padrão" podem ser lançados como ação de movimento, gastando +1 PE.', minNex: 5, isInitial: true },
      { id: 'componentes-improvisados', name: 'Componentes Improvisados', description: 'Você pode substituir componentes de rituais por itens comuns disponíveis.', minNex: 25 },
      { id: 'eficiencia', name: 'Eficiência', description: 'O custo em PE dos seus rituais é reduzido em 1 (mínimo 1).', minNex: 50 },
      { id: 'ritual-instantaneo', name: 'Ritual Instantâneo', description: 'Uma vez por cena, você pode lançar um ritual como ação livre.', minNex: 75 },
      { id: 'mestre-campo', name: 'Mestre de Campo', description: 'Você pode lançar rituais de 1º e 2º círculo sem gastar PE, uma vez cada por cena.', minNex: 99 },
    ],
  },
  {
    id: 'canalista',
    name: 'Canalista',
    classId: 'Ocultista',
    description: 'Você se conecta diretamente com entidades do Outro Lado, canalizando seu poder.',
    abilities: [
      { id: 'contato', name: 'Contato', description: 'Você pode se comunicar com entidades do Outro Lado. Recebe +5 em testes para negociar ou obter informações.', minNex: 5, isInitial: true },
      { id: 'emprestar-poder', name: 'Emprestar Poder', description: 'Uma vez por cena, você pode pedir poder emprestado a uma entidade, recuperando 1d6 PE.', minNex: 25 },
      { id: 'protetor-espiritual', name: 'Protetor Espiritual', description: 'Uma entidade o protege. Você recebe +2 em Defesa e +2 em testes de resistência.', minNex: 50 },
      { id: 'possessao-voluntaria', name: 'Possessão Voluntária', description: 'Você pode permitir que uma entidade o possua por uma cena, recebendo +5 em todos os testes mas perdendo 1d6 SAN.', minNex: 75 },
      { id: 'avatar-entidade', name: 'Avatar da Entidade', description: 'Uma vez por dia, você pode se fundir completamente com uma entidade, recebendo +10 em todos os testes e poderes especiais por 1 minuto.', minNex: 99 },
    ],
  },
];

/**
 * Retorna as trilhas do suplemento para uma classe específica
 */
export function getSupplementTracksByClass(classId: string): ClassTrack[] {
  return SUPPLEMENT_TRACKS.filter(track => track.classId === classId);
}

/**
 * Retorna uma trilha do suplemento pelo ID
 */
export function getSupplementTrackById(id: string): ClassTrack | undefined {
  return SUPPLEMENT_TRACKS.find(track => track.id === id);
}
