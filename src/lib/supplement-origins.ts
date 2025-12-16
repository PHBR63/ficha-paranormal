/**
 * Ordem Paranormal RPG - Origens Extras (Suplementos, Expansões e Comunidade)
 * 
 * Origens adicionais além das 26 do livro base
 * Textos fiéis aos documentos oficiais
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
  source?: string; // Fonte da origem (Expansão, Comunidade, etc.)
}

// ==================== ORIGENS EXTRAS ====================

export const SUPPLEMENT_ORIGINS: SupplementOrigin[] = [
  // ==================== NOVAS ORIGENS (EXPANSÕES OFICIAIS) ====================
  
  {
    id: 'amigo-dos-animais',
    name: 'Amigo dos Animais',
    description: 'Você desenvolveu uma conexão muito forte com outros seres: os animais. Seja por nunca ter se dado muito bem com humanos ou por preferir a companhia de um melhor amigo de quatro patas, você leva sua vida ao lado de um bichano e até mesmo aprende com a natureza perceptiva deles.',
    skills: ['adestramento', 'percepcao'],
    powers: ['Companheiro Animal'],
    powerDescription: 'Você consegue entender as intenções e sentimentos de qualquer animal com facilidade, podendo usar Adestramento para mudar atitude de animais ou ter pressentimentos de como eles estão se sentindo. Além disso, você possui um melhor amigo, um animal que cresceu com você e pelo qual tem profundo apego. Ele conta como um aliado que fornece +2 em uma perícia a sua escolha. Quando você alcança NEX 35%, ele também passa a ser um aliado de um tipo a sua escolha. Por fim, quando você alcança NEX 70%, ele fornece o bônus básico de um aliado de outro tipo. Perder seu parceiro pode ser muito doloroso. Se ele morrer, você perde 10 pontos de Sanidade permanentemente, além de ficar perturbado até o fim da cena.',
    source: 'Arsenal Paranormal',
  },
  {
    id: 'astronauta',
    name: 'Astronauta',
    description: 'Outrora limitada a membros de algumas agências espaciais estatais, a profissão de explorador espacial se tornou mais acessível conforme mais países, e até mesmo empresas privadas, se envolveram com viagens na fronteira final. Como um astronauta, você se acostumou à pressão de ser responsável pela vida de seus colegas e por experimentos de milhões de reais. E foi na escuridão do espaço que você descobriu que não estamos sozinhos.',
    skills: ['ciencias', 'fortitude'],
    powers: ['Acostumado ao Extremo'],
    powerDescription: 'Você recebe resistência a dano mental igual a 1 + seu Intelecto. A cada vez que você usa essa RD, ela é reduzida em 1 até o fim da cena.',
    source: 'Expansão Oficial',
  },
  {
    id: 'chef-do-outro-lado',
    name: 'Chef do Outro Lado',
    description: 'Você nunca foi muito bom na culinária convencional. Depois de sobreviver ao paranormal, entretanto, descobriu um talento que é considerado um grande tabu até mesmo pelos cultistas mais experientes: cozinhar e ingerir entidades do Outro Lado. Acreditando estar realizando algum tipo de arte gastronômica esotérica, ou simplesmente por se render a impulsos incontroláveis, você elabora pratos nunca vistos antes misturando ingredientes comuns da Realidade com aquilo que não deveria existir. Você é a prova viva do ditado popular: "tem gosto pra tudo".',
    skills: ['ocultismo', 'profissao'],
    powers: ['Fome do Outro Lado'],
    powerDescription: 'Você pode usar partes de criaturas do Outro Lado como ingredientes culinários. No início de cada missão você pode solicitar essas partes como itens de Categoria I que ocupam 0,5 espaço, e pode obtê-las de criaturas derrotadas (cada criatura Pequena ou maior fornece 1 parte "útil"). Você pode gastar uma ação de interlúdio e 1 parte para preparar um prato especial; faça um teste de Profissão (cozinheiro) com DT 20 + 1d6 (o mestre oculta o resultado do teste até alguém comer o prato). Se você passar no teste, o prato fornece RD 10 contra o tipo de dano do elemento da criatura cuja parte foi usada. Caso contrário, o prato causa vulnerabilidade a esse tipo de dano. Os efeitos duram até o fim da próxima cena.',
    source: 'Ateliê Secreto',
  },

  // ==================== ORIGENS DA COMUNIDADE ====================

  {
    id: 'colegial',
    name: 'Colegial',
    description: 'Você era um aluno do colegial e tinha uma rotina baseada nos estudos, nas amizades e nos dramas típicos de alguém da sua idade. Até que um encontro com o paranormal mudou sua vida. Tendo se unido à Ordem com uma mentalidade juvenil e pouca experiência de vida, você descobriu que sua verdadeira força está nos amigos que fizer pelo caminho.',
    skills: ['atualidades', 'tecnologia'],
    powers: ['Poder da Amizade'],
    powerDescription: 'Escolha um personagem para ser seu amigo. Sempre que subir de patente, você pode escolher um amigo adicional. Se estiver em alcance médio de um de seus amigos e vocês puderem, pelo menos, trocar olhares, você recebe +2 em todos os testes de perícia (não cumulativo). Entretanto, se um de seus amigos morrer, seu total de PE é reduzido em –1 para cada 5% de NEX até o fim da missão. Se perder um de seus amigos, você pode escolher outro no início da próxima missão.',
    source: 'Comunidade',
  },
  {
    id: 'cosplayer',
    name: 'Cosplayer',
    description: 'Você é apaixonado pela arte do cosplay e dedicou sua vida a criar a melhor fantasia possível. Constantemente questionado por pessoas que confundem seus gostos e preferências artísticas com acusações ignorantes, você se acostumou a seguir em frente. Confrontado com o paranormal, você colocou sua arte, e sua resiliência, a serviço da Ordem.',
    skills: ['artes', 'vontade'],
    powers: ['Não é Fantasia, é Cosplay!'],
    powerDescription: 'Você pode fazer testes de disfarce usando Artes em vez de Enganação. Além disso, ao fazer um teste de perícia, se estiver usando um cosplay que tem relação com ele, você recebe +2. Por exemplo, se estiver vestido de James Bones, o gato agente secreto do famoso videogame arcade dos anos 90, você recebe +2 em testes para ser furtivo, se equilibrar e outras coisas em que um gato seria considerado eficiente.',
    source: 'Toca dos Monstros',
  },
  {
    id: 'diplomata',
    name: 'Diplomata',
    description: 'Você atuava em uma área onde as habilidades sociais e políticas eram ferramentas indispensáveis. Talvez fosse representante comercial de uma empresa, membro de um partido político ou embaixador do governo. Em algum momento, entretanto, você teve uma experiência paranormal que revelou entidades com as quais não é possível negociar. Agora, você usa os contatos que adquiriu para combater o Outro Lado.',
    skills: ['atualidades', 'diplomacia'],
    powers: ['Conexões'],
    powerDescription: 'Você recebe +5 em Diplomacia. Além disso, se puder contatar um NPC capaz de lhe auxiliar, você pode gastar 10 minutos e 2 PE para substituir um teste de uma perícia relacionada ao conhecimento desse NPC, feito até o fim da cena, por um teste de Diplomacia.',
    source: 'Comunidade',
  },
  {
    id: 'explorador',
    name: 'Explorador',
    description: 'Você é uma pessoa que se interessa muito por história ou geografia, frequentemente embarcando em trilhas e explorações para enriquecer seus estudos. Suas aventuras tornaram seu corpo mais resistente e capaz de se manter firme mesmo nas situações mais adversas. No entanto, um encontro trágico com o paranormal marcou sua jornada.',
    skills: ['fortitude', 'sobrevivencia'],
    powers: ['Manual do Sobrevivente'],
    powerDescription: 'Ao fazer um teste para resistir a armadilhas, clima, doenças, fome, sede, fumaça, sono, sufocamento ou veneno, incluindo de fontes paranormais, você pode gastar 2 PE para receber +5 nesse teste. Além disso, em cenas de interlúdio, você considera condições de sono precárias como normais.',
    source: 'Arquivo do Medo',
  },
  {
    id: 'experimento',
    name: 'Experimento',
    description: 'Você foi uma cobaia em um experimento físico. Pode ter sido um voluntário em um procedimento experimental legítimo, ou submetido a experimentos científicos ou paranormais contra sua vontade. Qualquer que seja a natureza desse evento, causou alterações permanentes em seu corpo... que concedem capacidades extraordinárias, mas trazem um estigma que provoca reações negativas em outras pessoas.',
    skills: ['atletismo', 'fortitude'],
    powers: ['Mutação'],
    powerDescription: 'Você recebe resistência a dano 2 e +2 em uma perícia à sua escolha que seja originalmente baseada em Força, Agilidade ou Vigor. Entretanto, sofre –2 em Diplomacia e Enganação.',
    source: 'Comunidade',
  },
  {
    id: 'fanatico-por-criaturas',
    name: 'Fanático por Criaturas',
    description: 'Você sempre foi obcecado pelo sobrenatural. Desde que pode se lembrar, a ideia de encontrar uma criatura o fascina tanto quanto o assusta. Essa faísca fez você se tornar um "caçador de monstros", dedicando-se a localizar as feras citadas em documentários sensacionalistas. Para você, todo rumor e crendice pode esconder um fundo de verdade. Talvez uma de suas pesquisas tenha o levado diretamente a uma criatura paranormal, ou talvez elas tenham encontrado você primeiro. Afinal, você nunca esteve se escondendo.',
    skills: ['investigacao', 'ocultismo'],
    powers: ['Conhecimento Oculto'],
    powerDescription: 'Você pode fazer testes de Ocultismo para identificar criatura a partir de informações como uma imagem, rastros, indícios de sua presença ou outras pistas que o mestre considere suficientes. Se passar, você descobre as características da criatura (conforme descrito na perícia), mas não sua identidade ou tipo específico. Além disso, quando passa em um teste de Ocultismo para identificar criatura, você recebe também +2 em todos os testes contra a criatura até o fim da missão.',
    source: 'Grimório Paranormal',
  },
  {
    id: 'fotografo',
    name: 'Fotógrafo',
    description: 'Você é um artista visual que usa câmeras para capturar momentos e transmitir histórias através de imagens estáticas. Costumeiramente movido pela paixão de observar o mundo ao seu redor, buscando ângulos únicos e perspectivas singulares para documentar a vida e a sociedade, você não fazia ideia de que encontraria elementos paranormais através de sua lente.',
    skills: ['artes', 'percepcao'],
    powers: ['Através da Lente'],
    powerDescription: 'Quando faz um teste de Investigação ou de Percepção para adquirir pistas olhando através de uma câmera ou analisando fotos, você pode gastar 2 PE para receber +5 nesse teste (um personagem que se move olhando através de uma lente anda à metade de seu deslocamento).',
    source: 'Comunidade',
  },
  {
    id: 'inventor-paranormal',
    name: 'Inventor Paranormal',
    description: 'A curiosidade e a criatividade fizeram de você uma pessoa que busca constantemente desafiar limites e criar soluções inovadoras, sendo mais de uma vez intitulado como um "cientista louco". Você teve contato com o paranormal por meio de seus experimentos ou foi procurado pela Ordem porque suas pesquisas chamaram atenção demais. De qualquer forma, o Outro Lado inspira você a utilizar o desconhecido em suas invenções.',
    skills: ['profissao', 'vontade'],
    powers: ['Invenção Paranormal'],
    powerDescription: 'Escolha um ritual de 1º círculo. Você possui um invento paranormal, um item de Categoria I que ocupa 1 espaço e que permite que você execute o efeito do ritual escolhido. Para ativar o invento, você gasta uma ação padrão (ou a ação necessária para lançar o ritual, o que for maior) e faz um teste de Profissão (inventor) com DT 15 +5 para cada ativação na mesma missão. Se passar, o item faz o equivalente a conjurar o ritual em sua forma básica sem pagar seu custo em PE. Se falhar, o invento enguiça e só pode ser consertado com uma ação de interlúdio. Você pode trocar o ritual contido em seu invento no início de cada missão.',
    source: 'C.R.I.S.',
  },
  {
    id: 'jovem-mistico',
    name: 'Jovem Místico',
    description: 'Você possui uma profunda conexão com sua espiritualidade, suas crenças ou o próprio universo. Essa conexão faz com que você veja o mundo e viva sua vida de forma diferente e peculiar, características que o tornaram mais suscetível a um encontro com o paranormal.',
    skills: ['ocultismo', 'religiao'],
    powers: ['A Culpa é das Estrelas'],
    powerDescription: 'Escolha um número da sorte entre 1 e 6. No início de cada cena, você pode gastar 1 PE e rolar 1d6. Se o resultado for seu número da sorte, você recebe +2 em testes de perícia até o fim da cena. Caso contrário, na próxima vez que usar esta habilidade, escolha mais um número como número da sorte. Quando rolar um de seus números da sorte, a quantidade de números volta a 1.',
    source: 'A Passagem',
  },
  {
    id: 'legista-turno-noite',
    name: 'Legista do Turno da Noite',
    description: 'Em um trabalho como o seu, é de se esperar que você já tenha visto muita coisa. No entanto, quando o sol se põe, seus colegas vão embora e a luz artificial deixa cantos sombrios do necrotério, talvez você veja mais do que gostaria. Os sons que poderiam ter sido fruto de sua imaginação se revelaram mais do que um truque da sua própria mente, fazendo você descobrir que nem sempre a morte é o fim de tudo.',
    skills: ['ciencias', 'medicina'],
    powers: ['Luto Habitual'],
    powerDescription: 'Você sofre apenas a metade do dano mental por presença uma cena que, a critério do mestre, esteja relacionada à sua rotina de legista (como presenciar uma morte, ver um cadáver ou encontrar órgãos humanos). Além disso, quando faz um teste de Medicina para primeiros socorros ou necropsia, você pode gastar 2 PE para receber +5 nesse teste.',
    source: 'Arquivos Confidenciais',
  },
  {
    id: 'motorista',
    name: 'Motorista',
    description: 'Você é caminhoneiro, motorista de aplicativo, motoboy, piloto de corrida, motorista de ambulância ou qualquer outro tipo de condutor profissional. Você levava a vida transportando cargas ou passageiros, até o dia em que suas viagens cruzaram o caminho do Outro Lado.',
    skills: ['pilotagem', 'reflexos'],
    powers: ['Mãos no Volante'],
    powerDescription: 'Você não sofre penalidades em testes de ataque por estar em um veículo em movimento e, sempre que estiver pilotando e tiver que fazer um teste de Pilotagem ou resistência, pode gastar 2 PE para receber +5 nesse teste.',
    source: 'Comunidade',
  },
  {
    id: 'nerd-entusiasta',
    name: 'Nerd Entusiasta',
    description: 'Você dedicou muito do seu tempo aprendendo sobre videogames, RPGs de mesa, ficção científica ou qualquer outro assunto considerado "nerd". Sua obsessão em pesquisar a fundo seus assuntos de interesse e sua capacidade em lidar com os mais variados temas chamou a atenção de organizações paranormais.',
    skills: ['ciencias', 'tecnologia'],
    powers: ['O Inteligentão'],
    powerDescription: 'Você pode gastar uma ação de interlúdio para se dedicar às suas pesquisas. Se fizer isso, recebe um bônus de +1d10 em um teste baseado em Intelecto ou Presença realizado até o fim da missão. Você pode acumular um número máximo de dados de bônus por pesquisa igual ao seu Intelecto, mas só pode usar um desses dados por teste. Dados não usados ao final da missão são perdidos.',
    source: 'Remate Paranormal',
  },
  {
    id: 'psicologo',
    name: 'Psicólogo',
    description: 'Você se especializou no estudo e tratamento das questões mentais do ser humano. Em sua prática profissional, você teve contato com o paranormal e descobriu que algumas aflições mentais possuem origens sombrias e perigosas. Agora, você emprega seus conhecimentos para enfrentar o Outro Lado.',
    skills: ['intuicao', 'profissao'],
    powers: ['Terapia'],
    powerDescription: 'Você pode usar Profissão (psicólogo) como Diplomacia. Além disso, uma vez por rodada, quando você ou um aliado em alcance curto falha em um teste de resistência contra um efeito que causa dano mental, você pode gastar 2 PE para fazer um teste de Profissão (psicólogo) e usar o resultado desse teste no lugar do teste de resistência falho.',
    source: 'Missões Ordem',
  },
  {
    id: 'profetizado',
    name: 'Profetizado',
    description: 'Como qualquer pessoa, você vai morrer. Entretanto, diferente delas, você sabe como isso vai acontecer. De algum jeito, seja por pesadelos, pensamentos intrusivos ou até visões inesperadas, você tem uma premonição clara — ou misteriosa e enigmática — de como serão seus últimos momentos de vida. O mestre pode determinar essa "cena de morte" em segredo e revelar apenas os detalhes que você já pressentiu ou ambos podem determinar as condições para esse inevitável falecimento. A cena pode ser bem detalhada ou conter apenas alguns sinais. Por exemplo: "você se vê pendurado em um gancho de carne, sangrando até desfalecer, no subsolo de um açougue" ou "a única coisa de que se lembra é da visão de um gancho". Será que você é capaz de mudar seu próprio destino?',
    skills: ['vontade'], // + uma à escolha relacionada à premonição
    powers: ['Luta ou Fuga'],
    powerDescription: 'Conhecer os sinais de sua morte te deixa mais confiante, principalmente quando eles não estão presentes. Você recebe +2 em Vontade. Quando surge uma referência a sua premonição (um objeto semelhante a um gancho, por exemplo, para alguém cuja morte está ligada a morrer em um gancho de carne), uma onda de adrenalina toma seu corpo e seus instintos de luta ou fuga se intensificam. Além do bônus em Vontade, você recebe +2 PE temporários que duram até o fim da cena.',
    source: 'Comunidade',
  },
  {
    id: 'reporter-investigativo',
    name: 'Repórter Investigativo',
    description: 'Você está sempre em busca de histórias significativas, investigando eventos, entrevistando fontes e analisando dados para descobrir a verdade por trás dos acontecimentos. Profissionais do seu ramo costumam ser curiosos, persistentes e, em muitos casos, éticos em sua busca pela verdade. Por outro lado, essa profissão leva pessoas ao encontro do indescritível, e com você não foi diferente.',
    skills: ['atualidades', 'investigacao'],
    powers: ['Encontrar a Verdade'],
    powerDescription: 'Você pode usar Investigação no lugar de Diplomacia ao fazer testes para persuadir e mudar atitude e, quando faz um teste de Investigação para interrogar, pode gastar 2 PE para receber +5 nesse teste.',
    source: 'Comunidade',
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

/**
 * Retorna origens por fonte
 */
export function getOriginsBySource(source: string): SupplementOrigin[] {
  return SUPPLEMENT_ORIGINS.filter(origin => origin.source === source);
}
