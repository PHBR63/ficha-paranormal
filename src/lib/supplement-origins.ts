/**
 * Ordem Paranormal RPG - Suplemento Sobrevivendo ao Horror
 * Novas Origens do Suplemento
 * 
 * 22 novas origens para personagens
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

// ==================== NOVAS ORIGENS DO SUPLEMENTO ====================

export const SUPPLEMENT_ORIGINS: SupplementOrigin[] = [
  {
    id: 'astro-mirim',
    name: 'Astro Mirim',
    description: 'Você foi uma criança famosa - ator mirim, cantor infantil ou participante de reality show. A fama veio cedo, mas trouxe seus próprios traumas.',
    skills: ['artes', 'enganacao'],
    powers: ['Rosto Conhecido'],
    powerDescription: 'Você é reconhecido com facilidade. Recebe +2 em Diplomacia com fãs, mas -2 em Furtividade em locais públicos.',
  },
  {
    id: 'baba',
    name: 'Babá',
    description: 'Você cuida de crianças profissionalmente. Desenvolveu paciência, atenção e a habilidade de lidar com situações inesperadas.',
    skills: ['intuicao', 'medicina'],
    powers: ['Instinto Protetor'],
    powerDescription: 'Quando um aliado com menos PV que você é atacado em alcance curto, você pode usar sua reação para se mover até ele e receber o ataque em seu lugar.',
  },
  {
    id: 'bibliotecario',
    name: 'Bibliotecário',
    description: 'Você trabalha cercado por livros e conhecimento. Sabe onde encontrar informações e tem um amor profundo pela leitura.',
    skills: ['investigacao', 'ocultismo'],
    powers: ['Rato de Biblioteca'],
    powerDescription: 'Você recebe +5 em testes de Investigação quando pesquisa em bibliotecas, arquivos ou bancos de dados. Pode fazer pesquisas em metade do tempo.',
  },
  {
    id: 'bombeiro',
    name: 'Bombeiro',
    description: 'Você salva vidas profissionalmente. Está acostumado a situações de perigo extremo e a manter a calma sob pressão.',
    skills: ['atletismo', 'fortitude'],
    powers: ['Resistente ao Fogo'],
    powerDescription: 'Você recebe resistência a fogo 5 e +2 em testes de Fortitude para resistir a calor, fumaça e asfixia.',
  },
  {
    id: 'caminhoneiro',
    name: 'Caminhoneiro',
    description: 'Você passa a vida na estrada. Conhece rotas, pontos de parada e tem contatos em todo o país.',
    skills: ['pilotagem', 'sobrevivencia'],
    powers: ['Conhecimento das Estradas'],
    powerDescription: 'Você conhece rotas alternativas e atalhos. Reduz o tempo de viagem em 25% e recebe +5 em testes de Pilotagem para veículos terrestres.',
  },
  {
    id: 'catador',
    name: 'Catador',
    description: 'Você sobrevive coletando materiais recicláveis e objetos descartados. Sabe encontrar valor onde outros veem lixo.',
    skills: ['percepcao', 'sobrevivencia'],
    powers: ['Um Tesouro no Lixo'],
    powerDescription: 'Uma vez por sessão, você pode encontrar um item útil (categoria I ou menor) em qualquer área urbana, gastando 10 minutos procurando.',
  },
  {
    id: 'coveiro',
    name: 'Coveiro',
    description: 'Você trabalha em cemitérios, lidando com a morte diariamente. A proximidade constante com os mortos deixou marcas.',
    skills: ['fortitude', 'ocultismo'],
    powers: ['Familiaridade com a Morte'],
    powerDescription: 'Você recebe +5 em testes de SAN contra efeitos relacionados a morte, cadáveres e mortos-vivos. Também recebe +2 em Ocultismo para identificar mortos-vivos.',
  },
  {
    id: 'cozinheiro',
    name: 'Cozinheiro',
    description: 'Você é um chef habilidoso, capaz de transformar ingredientes simples em refeições memoráveis.',
    skills: ['fortitude', 'profissao'],
    powers: ['Refeição Reconfortante'],
    powerDescription: 'Durante um descanso, você pode cozinhar para até 6 pessoas. Cada uma recupera +2d6 PV e +1d6 PE extras, além de receber +1 em testes de SAN até o próximo descanso.',
  },
  {
    id: 'defensor-publico',
    name: 'Defensor Público',
    description: 'Você defende aqueles que não podem pagar por um advogado. Conhece a lei e sabe como usá-la.',
    skills: ['diplomacia', 'investigacao'],
    powers: ['Conhecimento Legal'],
    powerDescription: 'Você recebe +5 em testes para lidar com autoridades e procedimentos legais. Pode impedir que aliados sejam presos ou detidos ilegalmente.',
  },
  {
    id: 'engenheiro-transito',
    name: 'Engenheiro de Trânsito',
    description: 'Você planeja e gerencia o fluxo de veículos nas cidades. Conhece cada rua, semáforo e rota alternativa.',
    skills: ['profissao', 'tecnologia'],
    powers: ['Mapa Mental'],
    powerDescription: 'Você nunca se perde em áreas urbanas. Recebe +5 em testes para encontrar rotas, fugir de perseguições ou localizar endereços em cidades.',
  },
  {
    id: 'exorcista',
    name: 'Exorcista',
    description: 'Você foi treinado para expulsar entidades malignas. Sua fé (ou técnica) é sua arma contra o paranormal.',
    skills: ['religiao', 'vontade'],
    powers: ['Ritual de Expulsão'],
    powerDescription: 'Você pode gastar 2 PE e uma ação completa para forçar uma criatura do Outro Lado a fazer um teste de Vontade (DT 10 + PRE + NEX/5). Se falhar, a criatura é expulsa por 1 cena.',
  },
  {
    id: 'garcom',
    name: 'Garçom',
    description: 'Você serve mesas profissionalmente. Desenvolveu memória excelente, equilíbrio e a habilidade de ler pessoas.',
    skills: ['intuicao', 'percepcao'],
    powers: ['Memória para Rostos'],
    powerDescription: 'Você nunca esquece um rosto ou nome. Recebe +2 em Intuição para identificar pessoas e detectar disfarces.',
  },
  {
    id: 'guia-turistico',
    name: 'Guia Turístico',
    description: 'Você leva visitantes para conhecer lugares interessantes. Conhece história local, lendas e os melhores (e piores) cantos da região.',
    skills: ['diplomacia', 'atualidades'],
    powers: ['Conhecimento Local'],
    powerDescription: 'Em qualquer cidade que já visitou, você conhece pontos importantes, contatos úteis e lendas locais. Recebe +5 em testes de Atualidades sobre a região.',
  },
  {
    id: 'influenciador-digital',
    name: 'Influenciador Digital',
    description: 'Você vive de sua presença online. Tem seguidores, patrocinadores e sabe como manipular a opinião pública.',
    skills: ['enganacao', 'tecnologia'],
    powers: ['Viralizar'],
    powerDescription: 'Uma vez por sessão, você pode postar algo online que viraliza. Isso pode atrair atenção (positiva ou negativa), criar distração ou espalhar informação rapidamente.',
  },
  {
    id: 'jornalista',
    name: 'Jornalista',
    description: 'Você investiga e reporta notícias. Sabe fazer as perguntas certas e tem contatos em diversos lugares.',
    skills: ['investigacao', 'intuicao'],
    powers: ['Fontes Confidenciais'],
    powerDescription: 'Uma vez por missão, você pode contatar uma fonte que fornece informação privilegiada sobre o caso. O Mestre deve fornecer uma pista relevante.',
  },
  {
    id: 'motorista-aplicativo',
    name: 'Motorista de Aplicativo',
    description: 'Você dirige para plataformas digitais. Conhece a cidade como poucos e já viu de tudo em suas corridas.',
    skills: ['pilotagem', 'percepcao'],
    powers: ['Conhecimento das Ruas'],
    powerDescription: 'Você recebe +5 em Pilotagem em áreas urbanas e sempre sabe o caminho mais rápido. Também tem +2 em Percepção enquanto dirige.',
  },
  {
    id: 'musico-rua',
    name: 'Músico de Rua',
    description: 'Você vive de sua arte nas ruas. Conhece os becos, as pessoas e sabe como chamar atenção (ou evitá-la).',
    skills: ['artes', 'furtividade'],
    powers: ['Cativar Plateia'],
    powerDescription: 'Você pode fazer uma performance que distrai todos em alcance médio. Alvos devem fazer teste de Vontade (DT 10 + PRE) ou ficam fascinados por 1 rodada.',
  },
  {
    id: 'personal-trainer',
    name: 'Personal Trainer',
    description: 'Você treina pessoas para melhorar sua forma física. Conhece o corpo humano e seus limites.',
    skills: ['atletismo', 'medicina'],
    powers: ['Motivador'],
    powerDescription: 'Durante um descanso, você pode treinar aliados. Até 3 aliados recebem +2 em testes de Atletismo e Fortitude até o próximo descanso.',
  },
  {
    id: 'pescador',
    name: 'Pescador',
    description: 'Você vive da pesca, seja no mar, rios ou lagos. Conhece as águas, o clima e tem paciência infinita.',
    skills: ['sobrevivencia', 'pilotagem'],
    powers: ['Conhecedor das Águas'],
    powerDescription: 'Você recebe +5 em Sobrevivência perto de corpos d\'água e +5 em Pilotagem de embarcações. Também pode prever mudanças climáticas com 1d6 horas de antecedência.',
  },
  {
    id: 'psicologo',
    name: 'Psicólogo',
    description: 'Você estuda e trata a mente humana. Entende traumas, fobias e sabe como ajudar pessoas a superar seus demônios internos.',
    skills: ['intuicao', 'vontade'],
    powers: ['Terapia de Campo'],
    powerDescription: 'Durante um descanso, você pode fazer uma sessão de terapia com um aliado. Ele recupera 1d6 SAN e recebe +2 em testes de Vontade até o próximo descanso.',
  },
  {
    id: 'tatuador',
    name: 'Tatuador',
    description: 'Você marca a pele de pessoas com arte permanente. Tem mão firme, olho para detalhes e conhece símbolos de diversas culturas.',
    skills: ['artes', 'ocultismo'],
    powers: ['Tatuagem Protetora'],
    powerDescription: 'Você pode criar tatuagens místicas. Com 1 hora de trabalho e um teste de Artes (DT 20), você cria uma tatuagem que concede +2 em um tipo de teste de resistência (escolhido na criação) por uma semana.',
  },
  {
    id: 'youtuber',
    name: 'Youtuber',
    description: 'Você cria conteúdo para a internet. Pode ser sobre qualquer tema - games, vlogs, investigações paranormais...',
    skills: ['enganacao', 'tecnologia'],
    powers: ['Tudo Gravado'],
    powerDescription: 'Você sempre carrega equipamento de gravação. Pode documentar eventos para análise posterior, recebendo +2 em Investigação ao revisar gravações. Também tem uma audiência online que pode fornecer informações.',
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
