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

// NOTA: Trilhas do suplemento também seguem os níveis corretos: 10%, 40%, 65%, 99%
// AGUARDANDO TEXTOS OFICIAIS - Estrutura corrigida
export const SUPPLEMENT_TRACKS: ClassTrack[] = [
  // === TRILHAS DO SOBREVIVENTE ===
  {
    id: 'andarilho',
    name: 'Andarilho',
    classId: 'Sobrevivente',
    description: 'Você vive na estrada, nunca ficando muito tempo em um lugar.',
    abilities: [
      { id: 'andarilho-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Andarilho.', minNex: 10, isInitial: true },
      { id: 'andarilho-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Andarilho.', minNex: 40 },
      { id: 'andarilho-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Andarilho.', minNex: 65 },
      { id: 'andarilho-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Andarilho.', minNex: 99 },
    ],
  },
  {
    id: 'marcado',
    name: 'Marcado',
    classId: 'Sobrevivente',
    description: 'O paranormal deixou marcas em você - físicas e mentais.',
    abilities: [
      { id: 'marcado-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Marcado.', minNex: 10, isInitial: true },
      { id: 'marcado-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Marcado.', minNex: 40 },
      { id: 'marcado-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Marcado.', minNex: 65 },
      { id: 'marcado-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Marcado.', minNex: 99 },
    ],
  },
  {
    id: 'sortudo',
    name: 'Sortudo',
    classId: 'Sobrevivente',
    description: 'Você tem uma sorte absurda. As coisas simplesmente dão certo para você.',
    abilities: [
      { id: 'sortudo-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Sortudo.', minNex: 10, isInitial: true },
      { id: 'sortudo-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Sortudo.', minNex: 40 },
      { id: 'sortudo-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Sortudo.', minNex: 65 },
      { id: 'sortudo-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Sortudo.', minNex: 99 },
    ],
  },

  // === NOVAS TRILHAS DO COMBATENTE (Suplemento) ===
  {
    id: 'cacador-monstros',
    name: 'Caçador de Monstros',
    classId: 'Combatente',
    description: 'Você se especializou em caçar e eliminar criaturas do Outro Lado.',
    abilities: [
      { id: 'cacador-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Caçador de Monstros.', minNex: 10, isInitial: true },
      { id: 'cacador-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Caçador de Monstros.', minNex: 40 },
      { id: 'cacador-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Caçador de Monstros.', minNex: 65 },
      { id: 'cacador-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Caçador de Monstros.', minNex: 99 },
    ],
  },
  {
    id: 'protetor',
    name: 'Protetor',
    classId: 'Combatente',
    description: 'Você se dedica a proteger os outros, mesmo que isso signifique se sacrificar.',
    abilities: [
      { id: 'protetor-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Protetor.', minNex: 10, isInitial: true },
      { id: 'protetor-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Protetor.', minNex: 40 },
      { id: 'protetor-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Protetor.', minNex: 65 },
      { id: 'protetor-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Protetor.', minNex: 99 },
    ],
  },

  // === NOVAS TRILHAS DO ESPECIALISTA (Suplemento) ===
  {
    id: 'analista-cena',
    name: 'Analista de Cena',
    classId: 'Especialista',
    description: 'Você é especialista em analisar cenas de crime e reconstruir eventos.',
    abilities: [
      { id: 'analista-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Analista de Cena.', minNex: 10, isInitial: true },
      { id: 'analista-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Analista de Cena.', minNex: 40 },
      { id: 'analista-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Analista de Cena.', minNex: 65 },
      { id: 'analista-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Analista de Cena.', minNex: 99 },
    ],
  },
  {
    id: 'perito-criminal',
    name: 'Perito Criminal',
    classId: 'Especialista',
    description: 'Você é um especialista forense, capaz de analisar evidências com precisão científica.',
    abilities: [
      { id: 'perito-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Perito Criminal.', minNex: 10, isInitial: true },
      { id: 'perito-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Perito Criminal.', minNex: 40 },
      { id: 'perito-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Perito Criminal.', minNex: 65 },
      { id: 'perito-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Perito Criminal.', minNex: 99 },
    ],
  },

  // === NOVAS TRILHAS DO OCULTISTA (Suplemento) ===
  {
    id: 'ritualista-campo',
    name: 'Ritualista de Campo',
    classId: 'Ocultista',
    description: 'Você adapta rituais para uso prático em campo, tornando-os mais rápidos e eficientes.',
    abilities: [
      { id: 'ritualista-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Ritualista de Campo.', minNex: 10, isInitial: true },
      { id: 'ritualista-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Ritualista de Campo.', minNex: 40 },
      { id: 'ritualista-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Ritualista de Campo.', minNex: 65 },
      { id: 'ritualista-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Ritualista de Campo.', minNex: 99 },
    ],
  },
  {
    id: 'canalista',
    name: 'Canalista',
    classId: 'Ocultista',
    description: 'Você se conecta diretamente com entidades do Outro Lado, canalizando seu poder.',
    abilities: [
      { id: 'canalista-10', name: 'Habilidade NEX 10%', description: '[AGUARDANDO TEXTO OFICIAL] - Habilidade inicial da trilha Canalista.', minNex: 10, isInitial: true },
      { id: 'canalista-40', name: 'Habilidade NEX 40%', description: '[AGUARDANDO TEXTO OFICIAL] - Segunda habilidade da trilha Canalista.', minNex: 40 },
      { id: 'canalista-65', name: 'Habilidade NEX 65%', description: '[AGUARDANDO TEXTO OFICIAL] - Terceira habilidade da trilha Canalista.', minNex: 65 },
      { id: 'canalista-99', name: 'Habilidade NEX 99%', description: '[AGUARDANDO TEXTO OFICIAL] - Quarta habilidade da trilha Canalista.', minNex: 99 },
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
